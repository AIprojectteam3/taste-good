// ==============================================================================================
// 가져온 유저 정보 토대로 프로필 정보 입력 함수
// ==============================================================================================
async function fetchUserProfile() {
    try {
        const response = await fetch('/api/user');

        if (!response.ok) {
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

        const userData = await response.json();

        if (!userData) {
            console.error("서버로부터 사용자 정보를 받지 못했습니다 (userData is null). 페이지를 새로고침하거나 다시 로그인해주세요.");
            return;
        }
        
        updateProfileUI(userData);

    } catch (error) {
        console.error('사용자 정보 가져오기 중 네트워크/예외 발생:', error);
    }
}

function updateProfileUI(user) {
    const nicknameElement = document.querySelector('.profile .nickname');
    const levelElement = document.querySelector('.profile .level .level-value');
    const postCountElement = document.querySelector('.profile .profile-stats .post .post-count');
    const followerCountElement = document.querySelector('.profile .profile-stats .follower .follower-count');
    const pointCountElement = document.querySelector('.profile .profile-stats .point .point-count');
    const profileImageElement = document.querySelector('.profile-header > .image > img');

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

    if (followerCountElement) {
        followerCountElement.textContent = '0';
    }
}

// ==============================================================================================
// 실시간 검색어 순위
// ==============================================================================================
let rankingUpdateInterval;
let currentRankings = [];

async function loadSearchRankings() {
    try {
        const response = await fetch('/api/search/ranking?period=7');
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
            const response = await fetch('/api/search/ranking/live');
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