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

// 사용자 북마크 게시물 로드 함수 (추후에 사용 및 수정 필요)
async function fetchUserBookmarks() {
    try {
        const response = await fetch('/api/user/bookmarks');
        
        // 401 오류 시 로그인 페이지로 리다이렉트
        if (response.status === 401) {
            alert('세션이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/intro.html';
            return [];
        }
        
        if (!response.ok) {
            console.error("사용자 북마크 로드 실패:", response.status);
            return [];
        }
        
        const bookmarks = await response.json();
        return bookmarks || [];
    } catch (error) {
        console.error("사용자 북마크를 불러오는 중 오류:", error);
        return [];
    }
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
        const passwordInput = document.querySelector('.password_input');
        const passwordConfirmInput = document.querySelector('.password_confirm_input');
        const passwordContainer = passwordInput?.closest('div');
        const passwordConfirmContainer = passwordConfirmInput?.closest('div');

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

        if (userData.sns_id && userData.sns_id.trim() !== '') {
            // 소셜 로그인 사용자인 경우
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
            // 일반 로그인 사용자인 경우
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

    // 게시물 클릭 시 모달 호출로 변경
    card.addEventListener('click', (event) => {
        event.preventDefault(); // 기본 동작 방지
        
        // 함수가 정의되어 있는지 확인
        if (typeof displayPostModal === 'function') {
            displayPostModal(post.id);
        } else {
            console.error('displayPostModal 함수가 정의되지 않았습니다.');
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

    // 비밀번호 입력이 비활성화되어 있으면 비밀번호 관련 처리 건너뛰기
    if (passwordInput && !passwordInput.disabled && passwordInput.value) {
        if (passwordInput.value !== passwordConfirmInput.value) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        formData.append('password', passwordInput.value);
        formData.append('passwordConfirm', passwordConfirmInput.value);
    }

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
document.addEventListener("DOMContentLoaded", async () => {
    await loadProfileData();

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
                // 빈 상태 관련 클래스와 스타일 제거
                content.classList.remove('empty-state-container');
                content.innerHTML = ''; // 기존 내용 초기화
            });

            const target = document.getElementById(tab.dataset.tab);
            target.classList.remove("hidden");

            // 탭 변경 시 해당 데이터 로드
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
    const closeBtn = document.querySelector('.close-btn');
    const modal = document.getElementById('profileEditModal');
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