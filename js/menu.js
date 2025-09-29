// ==============================================================================================
// 가져온 유저 정보 토대로 프로필 정보 입력 함수
// ==============================================================================================
async function fetchUserProfile() {
    // 1. localStorage에서 토큰을 가져옵니다.
    const token = localStorage.getItem('token');

    // 2. 토큰이 없으면 로그인 상태가 아니므로, 로그인 페이지로 보냅니다.
    if (!token) {
        console.error('인증 토큰이 없습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/intro.html'; // 로그인 페이지 경로
        return; // 함수 실행 중단
    }

    try {
        // 3. fetch 요청의 headers에 'Authorization'을 추가하여 토큰을 보냅니다.
        const response = await fetchWithToken('/api/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 4. 응답 상태를 확인합니다.
        if (!response.ok) {
            // 401(미인증) 또는 403(권한 없음) 오류 시, 토큰이 유효하지 않으므로 로그아웃 처리합니다.
            if (response.status === 401 || response.status === 403) {
                console.error('인증에 실패했습니다. 토큰이 만료되었거나 유효하지 않습니다.');
                localStorage.removeItem('token'); // 잘못된 토큰 삭제
                window.location.href = '/intro.html'; // 로그인 페이지로 리디렉션
                return;
            }
            
            // 그 외 서버 오류 처리
            let errorMsg = `사용자 정보 요청 실패: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (jsonError) {
                errorMsg = `${errorMsg} (서버 응답 파싱 불가)`;
            }
            console.error(errorMsg);
            return;
        }

        // 5. 성공적으로 사용자 정보를 받으면 UI를 업데이트합니다.
        const userData = await response.json();

        if (!userData) {
            console.error("서버로부터 사용자 정보를 받지 못했습니다. 페이지를 새로고침하거나 다시 로그인해주세요.");
            return;
        }
        
        updateProfileUI(userData);

    } catch (error) {
        console.error('사용자 정보 가져오기 중 네트워크 또는 기타 예외가 발생했습니다:', error);
    }
}

function updateProfileUI(user) {
    const nicknameElement = document.querySelector('.profile .nickname');
    const emailElement = document.querySelector('.nickname-container .email-text');
    const levelElement = document.querySelector('.profile .level .level-value');
    const levelIconElement = document.querySelector('.level-icon-container .level_icon');
    const postCountElement = document.querySelector('.profile .profile-stats .post .post-count');
    const followerCountElement = document.querySelector('.profile .profile-stats .follower .follower-count');
    const pointCountElement = document.querySelector('.profile .profile-stats .point .point-count');
    const profileImageElement = document.querySelector('.profile-header > .image > img');

    if (nicknameElement) {
        nicknameElement.textContent = user.username;
    } else {
        // console.warn("프로필 닉네임 요소를 찾을 수 없습니다. (선택자: .profile .nickname)");
    }

    if (emailElement) {
        emailElement.textContent = user.email || '이메일 없음';
    } else {
        // console.warn("이메일 표시 요소를 찾을 수 없습니다. (선택자: .nickname-container .email-text)");
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
        pointCountElement.textContent = user.point ? user.point.toString() : '0';
    } else {
        // console.warn("프로필 포인트 요소를 찾을 수 없습니다. (선택자: .profile .profile-stats .point .point-count)");
    }

    if (profileImageElement) {
        if (user.profile_image_path && user.profile_image_path.trim() !== '') {
            profileImageElement.src = user.profile_image_path;
        } else {
            profileImageElement.src = 'image/profile-icon.png';
        }
        profileImageElement.alt = user.username + '의 프로필 이미지';
    } else {
        // console.warn("프로필 이미지 요소를 찾을 수 없습니다. (선택자: .profile-header > .image > img)");
    }

    if (levelIconElement) {
        if (user.level_icon_url && user.level_icon_url.trim() !== '') {
            levelIconElement.src = user.level_icon_url;
        } else {
            levelIconElement.src = 'image/dropper-icon.png'; // 기본 아이콘
        }
        levelIconElement.alt = `레벨 ${user.level || 1} 아이콘`;
    } else {
        console.warn("레벨 아이콘 요소를 찾을 수 없습니다. (선택자: .level-icon .level_icon)");
    }

    updateExperienceBar(user);
}

// ==============================================================================================
// 실시간 검색어 순위
// ==============================================================================================
let rankingUpdateInterval;
let currentRankings = [];

async function loadSearchRankings() {
    try {
        const response = await fetchWithToken('/api/search/ranking?period=7');
        const data = await response.json();
        
        if (data.success) {
            currentRankings = data.rankings;
            displaySearchRankings(data.rankings);
        }
    } catch (error) {
        console.error('인기 검색어 순위 로드 중 오류:', error);
    }
}

function displaySearchRankings(rankings) {
    const chartSection = document.querySelector('.chart ol');
    if (!chartSection) return;
    
    chartSection.innerHTML = '';

    const previousRankings = [...currentRankings];
    
    rankings.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `rank-item rank-${item.rank_change}`;
        
        const previousItem = previousRankings.find(prev => prev.search_term === item.search_term);
        
        if (!previousItem) {
            li.classList.add('rank-new-animation');
            li.classList.add('new-entry');
        } else if (previousItem.rank > item.rank) {
            li.classList.add('rank-up-animation');
        } else if (previousItem.rank < item.rank) {
            li.classList.add('rank-down-animation');
        }

        let iconHtml = '';
        const now = new Date();

        const isChangeExpired = item.change_expires_at && new Date(item.change_expires_at) <= now;
        
        if (isChangeExpired || item.rank_change === 'same') {
            iconHtml = '<img src="image/no-change-icon.png" alt="변동없음" title="변동없음">';
        } else {
            switch (item.rank_change) {
                case 'new':
                    iconHtml = '<span class="new-badge" title="신규 진입">NEW</span>';
                    li.classList.add('new-entry');
                    break;
                case 'up':
                    iconHtml = '<img src="image/rank-up-icon.png" alt="상승" title="순위 상승">';
                    break;
                case 'down':
                    iconHtml = '<img src="image/rank-down-icon.png" alt="하락" title="순위 하락">';
                    break;
                default:
                    iconHtml = '<img src="image/no-change-icon.png" alt="변동없음" title="변동없음">';
            }
        }
        
        li.innerHTML = `
            <span class="rank-number">${item.rank}.</span>
            <span class="search-term" data-search-term="${item.search_term}")">${item.search_term}</span>
            <div class="rank-info">
                ${iconHtml}
                <span class="search-count">${item.search_count}회</span>
            </div>
        `;

        const searchTermElement = li.querySelector('.search-term');
        searchTermElement.addEventListener('click', function() {
            handleRankingClick(item.search_term);
        });

        li.addEventListener('animationend', function() {
            li.classList.remove('rank-up-animation', 'rank-down-animation', 'rank-new-animation');
        });
        
        if (item.change_expires_at && !isChangeExpired) {
            const timeUntilExpiry = new Date(item.change_expires_at) - now;
            if (timeUntilExpiry > 0) {
                setTimeout(() => {
                    const rankInfo = li.querySelector('.rank-info');
                    if (rankInfo) {
                        const searchCount = li.querySelector('.search-count')?.textContent || '0회';
                        rankInfo.innerHTML = `
                            <img src="image/no-change-icon.png" alt="변동없음" title="변동없음">
                            <span class="search-count">${searchCount}</span>
                        `;
                        li.className = 'rank-item rank-same';
                        li.classList.remove('new-entry');
                    }
                }, timeUntilExpiry);
            }
        }
        
        chartSection.appendChild(li);
    });
}

function handleRankingClick(searchTerm) {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('index.html') || currentPage === '/') {
        // index.html에서는 직접 검색 실행
        if (typeof performAdvancedSearch === 'function') {
            const filters = {
                query: searchTerm,
                searchType: 'all',
                sortBy: 'date',
                dateFrom: '',
                dateTo: '',
                minViews: '',
                maxViews: '',
                page: 1,
                limit: 10
            };
            performAdvancedSearch(filters);
        }
    } else {
        const encodedSearchTerm = encodeURIComponent(searchTerm);
        window.location.href = `/index.html?search=${encodedSearchTerm}`;
    }
}

// 실시간 업데이트 시작
function startRankingUpdates() {
    // console.log('실시간 순위 업데이트 시작 (5초 간격)');
    loadSearchRankings();
    
    rankingUpdateInterval = setInterval(async () => {
        try {
            const response = await fetchWithToken('/api/search/ranking/live');
            const data = await response.json();
            
            if (data.success && data.live_rankings.length > 0) {
                const hasChanges = checkRankingChanges(data.live_rankings);
                
                if (hasChanges) {
                    // console.log('순위 변경 감지 - 아이콘 포함 업데이트 실행');
                    displaySearchRankings(data.live_rankings);
                    currentRankings = data.live_rankings;
                } else {
                    // console.log('순위 변경 없음');
                }
            }
        } catch (error) {
            console.error('실시간 순위 업데이트 중 오류:', error);
        }
    }, 5000);
}

function triggerRankAnimation(element, animationType) {
    element.classList.remove('rank-up-animation', 'rank-down-animation', 'rank-new-animation');
    
    element.offsetHeight;
    
    element.classList.add(animationType);
}

// 실시간 업데이트 시 애니메이션 적용
function updateRankingWithAnimation(newRankings) {
    const chartSection = document.querySelector('.chart ol');
    if (!chartSection) return;

    const existingItems = chartSection.querySelectorAll('.rank-item');
    
    newRankings.forEach((newItem, index) => {
        const existingItem = Array.from(existingItems).find(item => 
            item.querySelector('.search-term').textContent === newItem.search_term
        );
        
        if (existingItem) {
            const currentRank = parseInt(existingItem.querySelector('.rank-number').textContent);
            
            if (currentRank > newItem.rank) {
                triggerRankAnimation(existingItem, 'rank-up-animation');
            } else if (currentRank < newItem.rank) {
                triggerRankAnimation(existingItem, 'rank-down-animation');
            }
        }
    });
    
    setTimeout(() => {
        displaySearchRankings(newRankings);
    }, 100);
}

// 순위 변경사항 확인
function checkRankingChanges(liveRankings) {
    if (currentRankings.length === 0) return true;
    
    for (let i = 0; i < Math.min(5, liveRankings.length); i++) {
        const currentTerm = currentRankings[i]?.search_term;
        const currentCount = currentRankings[i]?.search_count;
        const liveTerm = liveRankings[i]?.search_term;
        const liveCount = liveRankings[i]?.search_count;
        
        if (currentTerm !== liveTerm || currentCount !== liveCount) {
            return true;
        }
    }
    
    return false;
}

// 실시간 업데이트 중지
function stopRankingUpdates() {
    if (rankingUpdateInterval) {
        clearInterval(rankingUpdateInterval);
        rankingUpdateInterval = null;
    }
}

function updateExperienceBar(user) {
    const expProgressElement = document.querySelector('.exp-progress');
    const currentExpElement = document.querySelector('.current-exp');
    const requiredExpElement = document.querySelector('.required-exp');

    if (!expProgressElement || !currentExpElement || !requiredExpElement) {
        console.warn('경험치 바 요소를 찾을 수 없습니다.');
        return;
    }

    const currentExp = user.experience || 0;
    const currentLevel = user.level || 1;
    const requiredExp = user.required_exp || 100;

    // 현재 레벨에서의 경험치 진행률 계산
    const expProgress = Math.min((currentExp / requiredExp) * 100, 100);

    // 경험치 바 애니메이션
    const oldWidth = expProgressElement.style.width;
    expProgressElement.style.setProperty('--old-width', oldWidth);
    expProgressElement.style.setProperty('--new-width', `${expProgress}%`);
    expProgressElement.classList.add('exp-gain-animation');

    setTimeout(() => {
        expProgressElement.style.width = `${expProgress}%`;
        expProgressElement.classList.remove('exp-gain-animation');
    }, 100);

    // 텍스트 업데이트
    currentExpElement.textContent = currentExp.toLocaleString();
    requiredExpElement.textContent = requiredExp.toLocaleString();

    // 레벨업 체크 및 애니메이션
    if (currentExp >= requiredExp) {
        const levelElement = document.querySelector('.level-value');
        if (levelElement) {
            levelElement.classList.add('level-up-animation');
            setTimeout(() => {
                levelElement.classList.remove('level-up-animation');
            }, 1000);
        }
    }
}

// 경험치 획득 애니메이션 함수
function animateExpGain(gainedExp) {
    const expText = document.querySelector('.exp-text');
    if (!expText) return;

    const gainIndicator = document.createElement('div');
    gainIndicator.textContent = `+${gainedExp} EXP`;
    gainIndicator.style.cssText = `
        position: absolute;
        color: #4CAF50;
        font-weight: bold;
        font-size: 0.8rem;
        animation: expGainFloat 2s ease-out forwards;
        pointer-events: none;
        z-index: 1000;
    `;

    // 애니메이션 CSS 추가
    if (!document.querySelector('#exp-gain-animation-style')) {
        const style = document.createElement('style');
        style.id = 'exp-gain-animation-style';
        style.textContent = `
            @keyframes expGainFloat {
                0% {
                    transform: translateY(0);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-30px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    expText.style.position = 'relative';
    expText.appendChild(gainIndicator);

    setTimeout(() => {
        if (gainIndicator.parentNode) {
            gainIndicator.parentNode.removeChild(gainIndicator);
        }
    }, 2000);
}

// 페이지 가시성 변경 시 업데이트 제어
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopRankingUpdates();
    } else {
        startRankingUpdates();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchUserProfile();

    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuItems = document.querySelectorAll('.mobile-menu-list a');

    hamburgerMenu.addEventListener('click', function() {
        toggleMobileMenu();
    });

    // 메뉴 토글 함수
    function toggleMobileMenu() {
        mobileMenu.classList.toggle('active');
        
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

    // 인기 검색어 순위 시작
    startRankingUpdates();
    
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', function() {
        stopRankingUpdates();
    });
});