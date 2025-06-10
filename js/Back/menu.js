// ==============================================================================================
// 가져온 유저 정보 토대로 프로필 정보 입력 함수
// ==============================================================================================
async function fetchUserProfile() {
    try {
        const response = await fetch('/api/user'); // 서버의 /api/user 엔드포인트 호출

        if (!response.ok) {
            // 서버에서 500 에러, 401 에러 등이 발생한 경우
            let errorMsg = `사용자 정보 요청 실패: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg; // 서버에서 보낸 message가 있으면 사용
            } catch (jsonError) {
                errorMsg = `${errorMsg} (서버 응답 파싱 불가)`;
            }
            console.error(errorMsg);
            // 🚨 중요: 이 페이지는 로그인된 사용자만 접근한다고 가정하므로,
            // 여기서 UI를 '방문자' 상태로 바꾸는 대신,
            // 에러가 발생했음을 알리거나, 최악의 경우 페이지를 사용하지 못하게 할 수 있습니다.
            // 또는 이전 상태를 유지하도록 아무것도 하지 않을 수 있습니다.
            // 여기서는 단순히 콘솔에 에러를 기록하고 넘어갑니다.
            // 만약 서버가 null을 반환할 가능성이 있다면 (비정상적 로그아웃 등)
            // updateProfileUI(null)을 호출하면 TypeError가 발생할 수 있습니다.
            return; // 사용자 정보 로드 실패 시 더 이상 진행하지 않음
        }

        const userData = await response.json();

        // 🚨 중요: 서버가 비로그인 시 null을 반환한다면, 여기서 userData가 null일 수 있습니다.
        // 이 경우 아래 updateProfileUI(userData)에서 userData.username 접근 시 TypeError 발생합니다.
        // 따라서 서버는 /api/user 요청 시 반드시 유효한 사용자 객체를 반환하거나,
        // 이 페이지 접근 자체를 막아야 합니다.
        if (!userData) {
            console.error("서버로부터 사용자 정보를 받지 못했습니다 (userData is null). 페이지를 새로고침하거나 다시 로그인해주세요.");
            // 필요하다면 여기서 로그인 페이지로 강제 이동 등의 처리를 할 수 있습니다.
            // window.location.href = '/intro.html';
            return;
        }
        
        updateProfileUI(userData);

    } catch (error) {
        // 네트워크 연결 오류 또는 예상치 못한 예외
        console.error('사용자 정보 가져오기 중 네트워크/예외 발생:', error);
        // 여기서도 에러 처리 방식을 결정해야 합니다.
    }
}

function updateProfileUI(user) {
    const nicknameElement = document.querySelector('.profile .nickname');
    const levelElement = document.querySelector('.profile .level .level-value');
    const postCountElement = document.querySelector('.profile .profile-stats .post .post-count');
    const followerCountElement = document.querySelector('.profile .profile-stats .follower .follower-count');
    const pointCountElement = document.querySelector('.profile .profile-stats .point .point-count');
    const profileImageElement = document.querySelector('.profile-header > .image > img'); // 프로필 이미지 요소 추가

    // 사용자 정보가 항상 있다고 가정하고 UI 업데이트
    if (nicknameElement) {
        nicknameElement.textContent = user.username;
    } else {
        // console.warn("프로필 닉네임 요소를 찾을 수 없습니다. (선택자: .profile .nickname)");
    }

    if (levelElement) {
        levelElement.textContent = user.level ? user.level.toString() : '1';
    } else {
        // console.warn("프로필 레벨 요소를 찾을 수 없습니다. (선택자: .profile .level .level-value)");
    }

    if (postCountElement) {
        postCountElement.textContent = user.post_count !== undefined ? user.post_count.toString() : '0';
    } else {
        // console.warn("프로필 게시글 수 요소를 찾을 수 없습니다. (선택자: .profile .profile-stats .post .post-count)");
    }

    if (pointCountElement) {
        pointCountElement.textContent = user.points ? user.points.toString() : '0';
    } else {
        // console.warn("프로필 포인트 요소를 찾을 수 없습니다. (선택자: .profile .profile-stats .point .point-count)");
    }

    // 프로필 이미지 업데이트
    if (profileImageElement) {
        if (user.profile_image_path && user.profile_image_path.trim() !== '') {
            profileImageElement.src = user.profile_image_path;
        } else {
            profileImageElement.src = 'image/profile-icon.png'; // 기본 프로필 이미지
        }
        profileImageElement.alt = user.username + '의 프로필 이미지';
    } else {
        // console.warn("프로필 이미지 요소를 찾을 수 없습니다. (선택자: .profile-header > .image > img)");
    }

    // 팔로워 수는 항상 '0'으로 고정
    if (followerCountElement) {
        followerCountElement.textContent = '0';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUserProfile();

    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuItems = document.querySelectorAll('.mobile-menu-list a');

    // 햄버거 메뉴 클릭 이벤트
    hamburgerMenu.addEventListener('click', function() {
        toggleMobileMenu();
    });

    // 메뉴 토글 함수
    function toggleMobileMenu() {
        mobileMenu.classList.toggle('active');
        
        // 메뉴가 열릴 때 body 스크롤 방지
        if (mobileMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }

    // 메뉴 아이템 클릭 시 메뉴 닫기
    menuItems.forEach(function(item) {
        item.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // 메뉴 배경 클릭 시 메뉴 닫기
    mobileMenu.addEventListener('click', function(e) {
        if (e.target === mobileMenu) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // ESC 키로 메뉴 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});