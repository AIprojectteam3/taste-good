// 데이터 배열
const mypostData = [
    { title: '더미 게시글', image_path: '0001.jpg' },
    { title: '더미 게시글', image_path: '0002.jpg' },
    { title: '더미 게시글', image_path: '0003.jpg' },
    { title: '더미 게시글', image_path: '0004.jpg' },
    { title: '더미 게시글', image_path: '0005.png' },
    { title: '더미 게시글', image_path: '0006.jpg' },
    { title: '더미 게시글', image_path: '0007.jpg' },
    { title: '더미 게시글', image_path: '0008.png' },
    { title: '더미 게시글', image_path: '0009.webp' },
    { title: '더미 게시글', image_path: '0010.jpg' },
    { title: '더미 게시글', image_path: '0011.jpg' },
    { title: '더미 게시글', image_path: '0012.png' },
    { title: '더미 게시글', image_path: '0013.jpg' },
    // ... 추가 데이터
];

const bookmarkData = [
    { title: '더미 게시글', image_path: '0014.jpg' },
    { title: '더미 게시글', image_path: '0015.jpg' },
    { title: '더미 게시글', image_path: '0016.png' },
    { title: '더미 게시글', image_path: '0017.jpg' },
    { title: '더미 게시글', image_path: '0018.jpg' },
    { title: '더미 게시글', image_path: '0019.jpg' },
    { title: '더미 게시글', image_path: '0020.jpg' },
    { title: '더미 게시글', image_path: '0021.jpg' },
    { title: '더미 게시글', image_path: '0022.jpg' },
    { title: '더미 게시글', image_path: '0023.png' },
    { title: '더미 게시글', image_path: '0024.jpg' },
    { title: '더미 게시글', image_path: '0025.jpg' },
]

async function loadProfileData() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            console.error("프로필 정보 로드 실패 (서버 응답):", response.status);
            return;
        }

        const userData = await response.json();
        const profileDiv = document.querySelector('.myprofile');
        if (!profileDiv) {
            console.error('.myprofile 요소를 찾을 수 없습니다.');
            return;
        }

        if (!userData) {
            console.log("사용자 정보를 불러올 수 없습니다. (로그인되지 않았거나 사용자 없음)");
            return;
        }

        // HTML 요소에 DB 데이터 채우기
        const usernameEl = profileDiv.querySelector('.username_span');
        const levelEl = profileDiv.querySelector('.level_value');
        const postEl = profileDiv.querySelector('.post_span');
        const followerEl = profileDiv.querySelector('.Follower_span');
        const pointEl = profileDiv.querySelector('.point_span');
        const userdesEl = profileDiv.querySelector('.profile_des');
        const profileImageEl = document.querySelector('.myprofile-image > img'); // 프로필 이미지 요소 추가

        if (usernameEl && userData.username) usernameEl.textContent = userData.username;
        if (levelEl && userData.level !== undefined) levelEl.textContent = userData.level;
        if (postEl && userData.post_count !== undefined) postEl.textContent = userData.post_count;
        if (followerEl && userData.follower_count !== undefined) followerEl.textContent = userData.follower_count;
        if (pointEl && userData.point !== undefined) pointEl.textContent = userData.point;

        // 프로필 이미지 업데이트
        if (profileImageEl) {
            if (userData.profile_image_path && userData.profile_image_path.trim() !== '') {
                profileImageEl.src = userData.profile_image_path;
            } else {
                profileImageEl.src = 'image/profile-icon.png'; // 기본 프로필 이미지
            }
            profileImageEl.alt = userData.username + '의 프로필 이미지';
        }

        // 프로필 설명 처리
        if (userdesEl) {
            if (userData && userData.profile_intro && userData.profile_intro.trim() !== "") {
                userdesEl.textContent = userData.profile_intro;
            } else {
                userdesEl.textContent = "프로필 설명이 없습니다. 여기에 자신을 소개해보세요!";
            }
        }

        // 프로필 수정 모달의 입력 필드들 초기화
        const profileNicknameInput = document.querySelector('.username_input');
        const profileDescriptionInput = document.querySelector('.shortInfo');
        const profileImagePreview = document.querySelector('.profile-image-preview');

        if (profileNicknameInput && userData.username !== undefined) {
            profileNicknameInput.value = userData.username;
        }

        if (profileDescriptionInput) {
            if (userData && userData.profile_intro && userData.profile_intro.trim() !== "") {
                profileDescriptionInput.value = userData.profile_intro;
            } else {
                profileDescriptionInput.value = "프로필 설명이 없습니다. 여기에 자신을 소개해보세요!";
            }
        }

        // 프로필 수정 모달의 이미지 미리보기 초기화
        if (profileImagePreview) {
            if (userData.profile_image_path && userData.profile_image_path.trim() !== '') {
                profileImagePreview.src = userData.profile_image_path;
            } else {
                profileImagePreview.src = 'image/profile-icon.png'; // 기본 프로필 이미지
            }
        }

    } catch (error) {
        console.error("프로필 정보를 불러오는 중 예외 발생:", error);
        const profileDiv = document.querySelector('.myprofile');
        if (profileDiv) {
            const usernameEl = profileDiv.querySelector('.username_span');
            if (usernameEl) usernameEl.textContent = "정보 로드 실패";
        }
    }
}

function updateTabContentAndContainerHeight(tabContentSelector) {
    if (isMobile()) return;
    
    const content = document.querySelector(tabContentSelector);
    if (!content) return;
    
    // 탭이 숨겨져 있으면 계산 정확도 높이기 위해 임시로 표시
    const wasHidden = content.classList.contains('hidden');
    if (wasHidden) {
        content.classList.remove('hidden');
        content.style.visibility = 'hidden'; // 시각적으로만 숨김
        content.style.position = 'absolute'; // 레이아웃에 영향 없게
    }
    
    const computedStyle = window.getComputedStyle(content);
    const container = document.querySelector('.container');
    const cards = content.querySelectorAll('.card');
    
    if (cards.length === 0) {
        if (wasHidden) {
            content.classList.add('hidden');
            content.style.visibility = '';
            content.style.position = '';
        }
        return;
    }

    // 이미지 로드 확인
    let loadedImages = 0;
    const totalImages = content.querySelectorAll('img').length;
    
    // 모든 그리드 계산 지연
    setTimeout(() => {
        // 1. 실제 열 개수 계산 (첫 행에 있는 카드 개수)
        let firstRowTop = cards[0].offsetTop;
        let columns = 0;
    
        for (let card of cards) {
            if (card.offsetTop === firstRowTop) {
                columns++;
            } else {
                break;
            }
        }

        // 최소 1열 보장
        columns = Math.max(1, columns);
        
        // 2. 행 개수 계산
        const numRows = Math.ceil(cards.length / columns);
        const cardHeight = cards[0].offsetHeight;
        const contentGap = parseInt(computedStyle.gap);
        const totalHeight = (numRows * cardHeight) + ((numRows - 1) * contentGap) + 40;
        
        content.style.gridAutoRows = `${cardHeight}px`; // 행 높이 명시적 설정
        content.style.height = `${totalHeight}px`;
        
        if (container) {
            container.style.height = `${totalHeight}px`;
        }

      // 원래 상태로 복원
        if (wasHidden) {
            content.classList.add('hidden');
            content.style.visibility = '';
            content.style.position = '';
        }
    }, 200); // 지연 시간 증가
}

const mypost = document.getElementById('my-posts');
const bookmark = document.getElementById('favorites');

// 카드 생성 함수
function createCard(item, isPlaceholder = false) {
    const card = document.createElement('div');
    card.className = 'card';

    if (isPlaceholder) {
        // 이미지 대신 "Post" 텍스트 스타일링
        const imgDiv = document.createElement('div');
        imgDiv.style.width = '100%';
        imgDiv.style.height = '100%';
        imgDiv.style.display = 'flex';
        imgDiv.style.alignItems = 'center';
        imgDiv.style.justifyContent = 'center';
        imgDiv.style.background = '#eee';
        imgDiv.style.fontSize = '2.5rem';
        imgDiv.style.fontWeight = 'bold';
        imgDiv.textContent = 'Post';
        card.appendChild(imgDiv);

        // 타이틀
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = '임시';
        title.style.cssText = `
            position: absolute;
            bottom: -30px;
            left: 0;
            right: 0;
            padding: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            opacity: 0;
            transition: all 0.3s ease;
        `;
        card.appendChild(title);

        // 마우스 이벤트
        card.addEventListener('mouseenter', () => {
            title.style.opacity = '1';
            title.style.bottom = '0';
        });
        card.addEventListener('mouseleave', () => {
            title.style.opacity = '0';
            title.style.bottom = '-30px';
        });

        return card;
    }

    // 이미지
    const img = document.createElement('img');
    img.src = "post_Tempdata/image/" + item.image_path;
    img.alt = item.title;

    // 타이틀
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.title;
    title.style.cssText = `
        position: absolute;
        bottom: -30px;
        left: 0;
        right: 0;
        padding: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        opacity: 0;
        transition: all 0.3s ease;
    `;

    // 마우스 이벤트
    card.addEventListener('mouseenter', () => {
        title.style.opacity = '1';
        title.style.bottom = '0';
    });
    card.addEventListener('mouseleave', () => {
        title.style.opacity = '0';
        title.style.bottom = '-30px';
    });

    card.appendChild(img);
    card.appendChild(title);
    return card;
}

// 특정 컨테이너에 카드 렌더링
function renderCardsTo(containerSelector, dataArray) {
    const container = document.querySelector(containerSelector);
    container.innerHTML = '';
    
    // 카드 추가
    dataArray.forEach(item => {
        container.appendChild(createCard(item));
    });
    
    // 이미지 로드 감지 후 높이 재계산
    const images = container.querySelectorAll('img');
    let loadedCount = 0;
    
    // 이미지가 없는 경우 바로 높이 계산
    if (images.length === 0) {
        updateTabContentAndContainerHeight(containerSelector);
        return;
    }
    
    // 각 이미지 로드 이벤트
    images.forEach(img => {
        if (img.complete) {
            loadedCount++;
            if (loadedCount === images.length) {
                updateTabContentAndContainerHeight(containerSelector);
            }
        } else {
            img.onload = () => {
                loadedCount++;
                if (loadedCount === images.length) {
                    updateTabContentAndContainerHeight(containerSelector);
                }
            };
        
            img.onerror = () => {
            loadedCount++;
                if (loadedCount === images.length) {
                    updateTabContentAndContainerHeight(containerSelector);
                }
            };
        }
    });
}

// 그리드 행 높이 조정 함수
function adjustGridRows() {
    if (isMobile()) return;

    requestAnimationFrame(() => {
        const grid = document.querySelector('.content');
        const cards = grid.querySelectorAll('.card:not(.hidden)');
        if (cards.length === 0) return;

        const cardWidth = cards[0].offsetWidth;
        grid.style.gridAutoRows = `${cardWidth}px`;
        cards.forEach(card => {
            card.style.height = `${cardWidth}px`;
        });
    });
}

function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
}

let prevIsMobile = window.matchMedia("(max-width: 768px)").matches;

window.addEventListener('resize', () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    // PC→모바일 또는 모바일→PC로 변경될 때만 새로고침
    if (isMobile !== prevIsMobile) {
        window.location.reload();
        prevIsMobile = isMobile;
    }
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.card').forEach(card => {
    observer.observe(card);
});

// 프로필 수정 처리 함수
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const formData = new FormData();
    const usernameInput = document.querySelector('.username_input');
    const profileDescInput = document.querySelector('.shortInfo');
    const passwordInput = document.querySelector('.password_input');
    const passwordConfirmInput = document.querySelector('.password_confirm_input');
    const profileImageInput = document.getElementById('profileImageUpload');

    // 폼 데이터 수집
    if (usernameInput && usernameInput.value.trim()) {
        formData.append('username', usernameInput.value.trim());
    }
    
    if (profileDescInput && profileDescInput.value.trim()) {
        formData.append('profileDescription', profileDescInput.value.trim());
    }
    
    if (passwordInput && passwordInput.value) {
        if (passwordInput.value !== passwordConfirmInput.value) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        formData.append('password', passwordInput.value);
        formData.append('passwordConfirm', passwordConfirmInput.value);
    }
    
    if (profileImageInput && profileImageInput.files[0]) {
        formData.append('profileImage', profileImageInput.files[0]);
    }

    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            alert('프로필이 성공적으로 수정되었습니다.');
            // 모달 닫기
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                modal.style.display = 'none';
            }
            // 페이지 새로고침하여 변경사항 반영
            window.location.reload();
        } else {
            alert(result.message || '프로필 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('프로필 수정 중 오류:', error);
        alert('프로필 수정 중 오류가 발생했습니다.');
    }
}

// 초기 렌더링 및 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
    loadProfileData();
    
    renderCardsTo('.tab-content#my-posts', mypostData);
    renderCardsTo('.tab-content#favorites', bookmarkData);
    adjustGridRows();

    window.addEventListener('resize', () => {
        adjustGridRows();
    });

    if (window.matchMedia("(max-width: 768px)").matches) {
        const container = document.querySelector('.content');
    }
    
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            
            // 모든 탭 콘텐츠 숨기기
            tabContents.forEach((content) => {
                content.classList.add("hidden");
                content.style.gridAutoRows = 'min-content'; // 초기 행 높이 리셋
            });
            
            // 선택된 탭 표시
            const target = document.getElementById(tab.dataset.tab);
            target.classList.remove("hidden");
            
            // 레이아웃 리플로우 후 높이 계산
            requestAnimationFrame(() => {
                updateTabContentAndContainerHeight(`#${target.id}`);
            });
        });
    });

    const editBtn = document.querySelector('.profileEditBtn');
    const closeBtn = document.querySelector('.close-btn');
    const modal = document.querySelector('.modal-overlay');
    const profileImageWrapper = document.querySelector('.profile-image-wrapper');
    const profileImagePreview = document.querySelector('.profile-image-preview');
    const profileImageUploadInput = document.getElementById('profileImageUpload');

    if (profileImageWrapper && profileImagePreview && profileImageUploadInput) {
        // 프로필 이미지 영역(래퍼) 클릭 시 파일 입력창 트리거
        profileImageWrapper.addEventListener('click', () => {
            profileImageUploadInput.click();
        });

        // 파일 선택 시 이미지 미리보기 업데이트
        profileImageUploadInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) { // 이미지 파일인지 확인
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImagePreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            } else if (file) {
                // 이미지 파일이 아닌 경우 사용자에게 알림 (선택 사항)
                alert('이미지 파일만 업로드할 수 있습니다.');
                // 파일 입력 초기화
                this.value = null;
            }
        });
    }

    if (editBtn && modal) {
        editBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 모달 외부 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    const profileForm = document.querySelector('.profile-edit-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
});