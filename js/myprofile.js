// 사용자 게시물 로드 함수
async function fetchUserPosts() {
    try {
        const response = await fetch('/api/user/posts');
        // 401 오류 시 로그인 페이지로 리다이렉트
        if (response.status === 401) {
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/intro.html';
            return [];
        }

        if (!response.ok) {
            console.error("사용자 게시물 로드 실패:", response.status);
            return [];
        }

        const posts = await response.json();
        return posts || [];
    } catch (error) {
        console.error("사용자 게시물을 불러오는 중 오류:", error);
        return [];
    }
}

// 사용자 좋아요한 게시물 로드 함수
async function fetchUserBookmarks() {
    try {
        const response = await fetch('/api/user/liked-posts');
        
        // 401 오류 시 로그인 페이지로 리다이렉트
        if (response.status === 401) {
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/intro.html';
            return [];
        }

        if (!response.ok) {
            console.error("사용자 좋아요 게시물 로드 실패:", response.status);
            return [];
        }

        const likedPosts = await response.json();
        return likedPosts || [];
    } catch (error) {
        console.error("사용자 좋아요 게시물을 불러오는 중 오류:", error);
        return [];
    }
}

function validateUsername(username) {
    if (!username || username.trim().length < 2) {
        return { valid: false, message: '닉네임은 최소 2자 이상이어야 합니다.' };
    }
    if (username.trim().length > 8) {
        return { valid: false, message: '닉네임은 최대 8자까지 입력 가능합니다.' };
    }
    return { valid: true, message: '' };
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/;
    return passwordRegex.test(password);
}

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

        // 기존 프로필 정보 로드 코드
        const usernameEl = profileDiv.querySelector('.username_span');
        const levelEl = profileDiv.querySelector('.level_value');
        const postEl = profileDiv.querySelector('.post_span');
        const followerEl = profileDiv.querySelector('.Follower_span');
        const pointEl = profileDiv.querySelector('.point_span');
        const userdesEl = profileDiv.querySelector('.profile_des');
        const profileImageEl = document.querySelector('.myprofile-image > img');
        const emailEl = document.querySelector('.emailSpan');
        
        // 레벨 아이콘 요소 추가
        const levelIconEl = document.querySelector('.level-icon2');

        if (usernameEl && userData.username) usernameEl.textContent = userData.username;
        if (levelEl && userData.level !== undefined) levelEl.textContent = userData.level;
        if (postEl && userData.post_count !== undefined) postEl.textContent = userData.post_count;
        if (followerEl && userData.follower_count !== undefined) followerEl.textContent = userData.follower_count;
        if (pointEl && userData.point !== undefined) pointEl.textContent = userData.point;
        if (emailEl && userData.email !== undefined) emailEl.textContent = userData.email;

        // 프로필 이미지 업데이트
        if (profileImageEl) {
            if (userData.profile_image_path && userData.profile_image_path.trim() !== '') {
                profileImageEl.src = userData.profile_image_path;
            } else {
                profileImageEl.src = 'image/profile-icon.png';
            }
            profileImageEl.alt = userData.username + '의 프로필 이미지';
        }

        // 레벨 아이콘 업데이트 추가
        if (levelIconEl) {
            if (userData.level_icon_url && userData.level_icon_url.trim() !== '') {
                levelIconEl.src = userData.level_icon_url;
            } else {
                levelIconEl.src = 'image/dropper-icon.png'; // 기본 아이콘
            }
            levelIconEl.alt = `레벨 ${userData.level || 1} 아이콘`;
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
        const passwordInput = document.querySelector('.password_input');
        const passwordConfirmInput = document.querySelector('.password_confirm_input');
        const addressInput = document.querySelector('.address_input');
        const detailAddressInput = document.querySelector('.detail_address_input');

        if (profileNicknameInput && userData.username !== undefined) {
            profileNicknameInput.value = userData.username;
        }
        if (profileDescriptionInput) {
            if (userData && userData.profile_intro && userData.profile_intro.trim() !== "") {
                profileDescriptionInput.value = userData.profile_intro;
            } else {
                profileDescriptionInput.value = "";
            }
        }
        
        // 주소 정보 설정 (수정된 부분)
        if (addressInput) {
            if (userData.address && userData.address.trim() !== '') {
                addressInput.value = userData.address;
                // console.log('주소 설정됨:', userData.address); // 디버깅용
            } else {
                addressInput.value = '';
                console.log('주소 정보 없음'); // 디버깅용
            }
        }
        
        if (detailAddressInput) {
            if (userData.detail_address && userData.detail_address.trim() !== '') {
                detailAddressInput.value = userData.detail_address;
                // console.log('상세주소 설정됨:', userData.detail_address); // 디버깅용
            } else {
                detailAddressInput.value = '';
                console.log('상세주소 정보 없음'); // 디버깅용
            }
        }

        // 프로필 수정 모달의 이미지 미리보기 초기화
        if (profileImagePreview) {
            if (userData.profile_image_path && userData.profile_image_path.trim() !== '') {
                profileImagePreview.src = userData.profile_image_path;
            } else {
                profileImagePreview.src = 'image/profile-icon.png';
            }
        }

        // 소셜 로그인 사용자 비밀번호 필드 처리
        if (userData.sns_id && userData.sns_id.trim() !== '') {
            if (passwordInput) {
                passwordInput.disabled = true;
                passwordInput.placeholder = "소셜 로그인은 비밀번호를 변경할 수 없습니다";
                passwordInput.style.backgroundColor = '#f5f5f5';
                passwordInput.style.color = '#666';
            }
            if (passwordConfirmInput) {
                passwordConfirmInput.disabled = true;
                passwordConfirmInput.placeholder = "소셜 로그인은 비밀번호를 변경할 수 없습니다";
                passwordConfirmInput.style.backgroundColor = '#f5f5f5';
                passwordConfirmInput.style.color = '#666';
            }
        } else {
            if (passwordInput) {
                passwordInput.disabled = false;
                passwordInput.placeholder = "새 비밀번호 (변경시에만 입력)";
                passwordInput.style.backgroundColor = '';
                passwordInput.style.color = '';
            }
            if (passwordConfirmInput) {
                passwordConfirmInput.disabled = false;
                passwordConfirmInput.placeholder = "비밀번호 확인";
                passwordConfirmInput.style.backgroundColor = '';
                passwordConfirmInput.style.color = '';
            }
        }

        // 알레르기 정보 로드
        await loadUserAllergens(false);

    } catch (error) {
        console.error("프로필 정보를 불러오는 중 예외 발생:", error);
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
        content.style.visibility = 'hidden';
        content.style.position = 'absolute';
    }

    const cards = content.querySelectorAll('.card');
    if (cards.length === 0) {
        if (wasHidden) {
            content.classList.add('hidden');
            content.style.visibility = '';
            content.style.position = '';
        }
        return;
    }

    // 강제 높이 계산 제거하고 자동 높이로 설정
    setTimeout(() => {
        content.style.gridAutoRows = 'auto'; // 자동 높이
        content.style.height = 'auto'; // 컨테이너 높이도 자동

        const container = document.querySelector('.container');
        if (container) {
            container.style.height = 'auto';
        }

        // 원래 상태로 복원
        if (wasHidden) {
            content.classList.add('hidden');
            content.style.visibility = '';
            content.style.position = '';
        }
    }, 200);
}

// 빈 상태를 표시하는 함수
function renderEmptyState(containerSelector, message) {
    const container = document.querySelector(containerSelector);
    container.innerHTML = '';
    container.classList.add('empty-state-container');

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = message;
    container.appendChild(emptyDiv);
}

const mypost = document.getElementById('my-posts');
const bookmark = document.getElementById('favorites');

// 카드 생성 함수
function createCard(post, isPlaceholder = false) {
    const card = document.createElement('div');
    card.className = 'card';

    if (isPlaceholder) {
        // 기존 플레이스홀더 로직 유지
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
        return card;
    }

    // 실제 게시물 데이터 처리
    // data-post-id 속성 추가
    card.setAttribute('data-post-id', post.id);

    const img = document.createElement('img');
    // 게시물에 이미지가 있는 경우 첫 번째 이미지 사용, 없으면 기본 이미지
    if (post.images && post.images.length > 0) {
        img.src = post.images[0]; // 첫 번째 이미지 사용
    } else if (post.thumbnail_path) {
        img.src = post.thumbnail_path; // 썸네일 경로 사용
    } else {
        // 이미지가 없는 경우 기본 이미지 또는 텍스트 표시
        img.src = 'image/default-post.png'; // 기본 게시물 이미지
        img.alt = '이미지 없음';
    }

    img.alt = post.title;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';

    // 타이틀
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = post.title;
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

    // 게시물 클릭 시 메인페이지로 이동하도록 수정
    card.addEventListener('click', (event) => {
        event.preventDefault(); // 기본 동작 방지
        
        if (isMobile()) {
            // 모바일에서는 메인페이지로 이동하면서 게시물 ID 전달
            window.location.href = `/index.html?postId=${post.id}`;
        } else {
            // PC에서는 기존 모달 로직 유지
            if (typeof displayPostModal === 'function') {
                displayPostModal(post.id);
            } else {
                console.error('displayPostModal 함수가 정의되지 않았습니다.');
            }
        }
    });

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

        // 자동 높이로 설정
        grid.style.gridAutoRows = 'auto';
        
        // 개별 카드 높이 강제 설정 제거
        cards.forEach(card => {
            card.style.height = 'auto';
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
    const addressInput = document.querySelector('.address_input');
    const detailAddressInput = document.querySelector('.detail_address_input');

    // 닉네임 유효성 검사 추가
    if (usernameInput && usernameInput.value.trim()) {
        const usernameValidation = validateUsername(usernameInput.value);
        if (!usernameValidation.valid) {
            alert(usernameValidation.message);
            return;
        }
        formData.append('username', usernameInput.value.trim());
    }

    // 비밀번호 입력이 비활성화되어 있으면 비밀번호 관련 처리 건너뛰기
    if (passwordInput && !passwordInput.disabled && passwordInput.value.trim()) {
        const password = passwordInput.value.trim();
        const passwordConfirm = passwordConfirmInput.value.trim();
        
        if (!validatePassword(password)) {
            alert('비밀번호는 8-20자리여야하며, 영문자와 숫자가 모두 포함되어야 합니다.');
            return;
        }
        if (password !== passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        formData.append('password', password);
        formData.append('passwordConfirm', passwordConfirm);
    }

    if (profileDescInput && profileDescInput.value.trim()) {
        formData.append('profileDescription', profileDescInput.value.trim());
    }

    if (profileImageInput && profileImageInput.files[0]) {
        formData.append('profileImage', profileImageInput.files[0]);
    }

    // 주소 정보 추가
    if (addressInput && addressInput.value.trim()) {
        formData.append('address', addressInput.value.trim());
    }
    if (detailAddressInput && detailAddressInput.value.trim()) {
        formData.append('detailAddress', detailAddressInput.value.trim());
    }

    // 알레르기 정보 추가
    const checkedAllergens = [];
    const allergenCheckboxes = document.querySelectorAll('input[name="allergens"]:checked');
    allergenCheckboxes.forEach(checkbox => {
        checkedAllergens.push(checkbox.value);
    });
    formData.append('allergens', checkedAllergens.join(','));

    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            alert('프로필이 성공적으로 수정되었습니다.');
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
                modal.style.display = 'none';
            }
            window.location.reload();
        } else {
            alert(result.message || '프로필 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('프로필 수정 중 오류:', error);
        alert('프로필 수정 중 오류가 발생했습니다.');
    }
}

// 다음 주소 API 초기화
function initDaumPostcode() {
    const addressSearchBtn = document.querySelector('.address-search-btn');
    if (addressSearchBtn) {
        addressSearchBtn.addEventListener('click', function() {
            new daum.Postcode({
                oncomplete: function(data) {
                    const addressInput = document.querySelector('.address_input');
                    const detailAddressInput = document.querySelector('.detail_address_input');
                    
                    // 주소 정보를 해당 필드에 넣기
                    addressInput.value = data.address;
                    detailAddressInput.focus(); // 상세주소 입력란으로 포커스 이동
                }
            }).open();
        });
    }
}

// 알레르기 옵션 로드
async function loadAllergenOptions() {
    try {
        const response = await fetch('/api/options/allergens');
        if (!response.ok) {
            console.error('알레르기 옵션 로드 실패:', response.status);
            return;
        }

        const allergens = await response.json();
        const container = document.getElementById('allergenCheckboxes');
        if (container) {
            container.innerHTML = '';
            allergens.forEach(allergen => {
                const item = document.createElement('div');
                item.className = 'allergen-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `allergen_${allergen.AllergenID}`;
                checkbox.value = allergen.AllergenID;
                checkbox.name = 'allergens';
                
                const label = document.createElement('label');
                label.htmlFor = `allergen_${allergen.AllergenID}`;
                label.textContent = allergen.AllergenKor;
                
                item.appendChild(checkbox);
                item.appendChild(label);
                container.appendChild(item);
            });
            
            // console.log('알레르기 옵션 로드 완료');
            // 페이지 로드 시에는 로그 표시 안함
            await loadUserAllergens(false);
        }
    } catch (error) {
        console.error('알레르기 옵션 로드 중 오류:', error);
    }
}

async function refreshAllergenInfo() {
    // console.log('알레르기 정보 새로고침 시작');
    // 기존 체크 상태 초기화
    const checkboxes = document.querySelectorAll('input[name="allergens"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // 모달에서 호출할 때는 로그 표시 (true 전달)
    await loadUserAllergens(true);
}

// 사용자 알레르기 정보 로드
async function loadUserAllergens(showLogs = false) {
    try {
        const response = await fetch('/api/user/allergens');
        if (!response.ok) {
            console.error('사용자 알레르기 정보 로드 실패:', response.status);
            return;
        }

        const userAllergens = await response.json();
        const allergenIds = userAllergens.map(item => item.allergen_id);
        
        // showLogs가 true일 때만 로그 표시
        if (showLogs) {
            // console.log('사용자 알레르기 정보:', allergenIds);
        }

        // 체크박스 상태 업데이트
        allergenIds.forEach(id => {
            const checkbox = document.getElementById(`allergen_${id}`);
            if (checkbox) {
                checkbox.checked = true;
                // 모달에서만 개별 체크박스 로그 표시
                if (showLogs) {
                    // console.log(`알레르기 ${id} 체크됨`);
                }
            } else {
                if (showLogs) {
                    console.warn(`알레르기 체크박스를 찾을 수 없음: allergen_${id}`);
                }
            }
        });
    } catch (error) {
        console.error('사용자 알레르기 정보 로드 중 오류:', error);
    }
}

function handleLogout(event) {
    event.preventDefault();
    
    const userConfirmed = confirm('정말 로그아웃 하시겠습니까?');
    if (userConfirmed) {
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('로그아웃되었습니다.');
                window.location.href = '/intro.html';
            } else {
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        })
        .catch(error => {
            console.error('로그아웃 중 오류:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        });
    }
}

// 초기 렌더링 및 이벤트 등록
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        
        if (!data.loggedIn) {
            // AIMenu.js와 동일한 방식 사용
            alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/intro.html';
            return;
        }
    } catch (error) {
        console.error('세션 확인 중 오류:', error);
        alert('서버와 통신할 수 없습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/intro.html';
        return;
    }

    await loadProfileData();
    await loadAllergenOptions();
    initDaumPostcode();

    // 사용자 게시물 로드 (첫 번째 탭이므로 바로 로드)
    const userPosts = await fetchUserPosts();
    if (userPosts.length === 0) {
        renderEmptyState('.tab-content#my-posts', '작성한 게시물이 없습니다.');
    } else {
        renderCardsTo('.tab-content#my-posts', userPosts);
    }

    adjustGridRows();

    window.addEventListener('resize', () => {
        adjustGridRows();
    });

    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", async () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            tabContents.forEach((content) => {
                content.classList.add("hidden");
                content.classList.remove('empty-state-container');
                content.innerHTML = '';
            });

            const target = document.getElementById(tab.dataset.tab);
            target.classList.remove("hidden");

            if (tab.dataset.tab === 'my-posts') {
                const userPosts = await fetchUserPosts();
                if (userPosts.length === 0) {
                    renderEmptyState('.tab-content#my-posts', '작성한 게시물이 없습니다.');
                } else {
                    renderCardsTo('.tab-content#my-posts', userPosts);
                }
            } else if (tab.dataset.tab === 'favorites') {
                const userBookmarks = await fetchUserBookmarks();
                if (userBookmarks.length === 0) {
                    renderEmptyState('.tab-content#favorites', '북마크한 게시물이 없습니다.');
                } else {
                    renderCardsTo('.tab-content#favorites', userBookmarks);
                }
            }

            requestAnimationFrame(() => {
                updateTabContentAndContainerHeight(`#${target.id}`);
            });
        });
    });

    const editBtn = document.querySelector('.profileEditBtn');
    const editBtnM = document.querySelector('.edit_icon');
    const closeBtn = document.querySelector('.close-btn');
    const modal = document.getElementById('profileEditModal');

    if (editBtn && modal) {
        editBtn.addEventListener('click', async () => {
            modal.style.display = 'flex';
            await refreshAllergenInfo(); // 모달 열 때마다 알레르기 정보 새로고침
        });
    }

    if (editBtnM && modal) {
        editBtnM.addEventListener('click', async () => {
            modal.style.display = 'flex';
            await refreshAllergenInfo(); // 모달 열 때마다 알레르기 정보 새로고침
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

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
                };
                reader.readAsDataURL(file);
            } else if (file) {
                // 이미지 파일이 아닌 경우 사용자에게 알림 (선택 사항)
                alert('이미지 파일만 업로드할 수 있습니다.');
                // 파일 입력 초기화
                this.value = null;
            }
        });
    }

    const profileForm = document.querySelector('.profile-edit-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // 게시물 모달 관련
    const postmodal = document.getElementById('index-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    if (closeModalBtn && postmodal) {
        closeModalBtn.addEventListener('click', () => {
            postmodal.style.display = 'none';
        });
    }

    // 모달 외부 클릭 시 닫기
    if (postmodal) {
        postmodal.addEventListener('click', (event) => {
            if (event.target === postmodal) {
                postmodal.style.display = 'none';
            }
        });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && postmodal.style.display === 'flex') {
            postmodal.style.display = 'none';
        }
    });
});