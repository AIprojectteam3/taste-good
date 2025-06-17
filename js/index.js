function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
}

let userLikedPosts = [];
let currentSearchTerm = null;

// =======================================================================================================
// 게시물(카드) 생성 함수
// =======================================================================================================
function createCard(item, isPlaceholder = false, currentUserId = null) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-post-id', item.id);

    // 슬라이더 컨테이너 생성
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    if (!isPlaceholder) {
        let images = [];
        if (Array.isArray(item.images) && item.images.length > 0) {
            item.images.forEach(img => {
                images.push(img);
            });
        }

        if (!isMobile()) {
            // PC 환경
            const img = document.createElement('img');
            img.src = item.thumbnail_path;
            img.alt = item.title;
            sliderContainer.appendChild(img);
        } else {
            // 모바일 환경
            images.forEach((imgPath, index) => {
                const slide = document.createElement('img');
                slide.className = `slide ${index === 0 ? 'active' : ''}`;
                slide.src = imgPath;
                slide.alt = item.title;
                sliderContainer.appendChild(slide);
            });

            // 네비게이션 버튼 추가
            const prevBtn = document.createElement('button');
            prevBtn.className = 'slide-nav prev';
            prevBtn.innerHTML = '‹';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'slide-nav next';
            nextBtn.innerHTML = '›';

            sliderContainer.appendChild(prevBtn);
            sliderContainer.appendChild(nextBtn);

            // 슬라이드 이동 함수
            let currentSlide = 0;
            function showSlide(idx) {
                if (idx < 0 || idx >= images.length) return;
                currentSlide = idx;

                const slideEls = sliderContainer.querySelectorAll('.slide');
                slideEls.forEach((el, i) => {
                    el.classList.toggle('active', i === currentSlide);
                    el.style.opacity = i === currentSlide ? '1' : '0';
                });

                prevBtn.disabled = currentSlide === 0;
                nextBtn.disabled = currentSlide === images.length - 1;
                prevBtn.classList.toggle('disabled', currentSlide === 0);
                nextBtn.classList.toggle('disabled', currentSlide === images.length - 1);
            }

            showSlide(0);

            prevBtn.addEventListener('click', e => {
                e.stopPropagation();
                showSlide(currentSlide - 1);
            });

            nextBtn.addEventListener('click', e => {
                e.stopPropagation();
                showSlide(currentSlide + 1);
            });

            let touchStartX = null;
            let touchEndX = null;

            sliderContainer.addEventListener('touchstart', e => {
                if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
            });

            sliderContainer.addEventListener('touchend', e => {
                if (touchStartX === null) return;
                touchEndX = e.changedTouches[0].clientX;

                if (touchStartX - touchEndX > 40 && currentSlide < images.length - 1) {
                    showSlide(currentSlide + 1);
                } else if (touchEndX - touchStartX > 40 && currentSlide > 0) {
                    showSlide(currentSlide - 1);
                }

                touchStartX = null;
                touchEndX = null;
            });
        }
    }

    card.appendChild(sliderContainer);

    // 작성자 정보 추가
    const postUserDiv = document.createElement('div');
    postUserDiv.className = 'post-user';

    const profileImg = document.createElement('img');
    if (!isPlaceholder) {
        profileImg.src = item.author_profile_path || 'image/profile-icon.png';
        profileImg.alt = (item.author_username || '사용자') + ' 프로필';
    } else {
        profileImg.src = 'image/profile-icon.png';
        profileImg.alt = '사용자 프로필';
    }
    profileImg.className = 'user-profile-img';

    const nicknameSpan = document.createElement('span');
    nicknameSpan.className = 'user-nickname';
    if (!isPlaceholder) {
        nicknameSpan.textContent = item.author_username;
    } else {
        nicknameSpan.textContent = '사용자';
    }

    postUserDiv.appendChild(profileImg);
    postUserDiv.appendChild(nicknameSpan);

    // 모바일에서만 게시물이 로그인된 유저일 경우 수정/삭제 버튼 추가
    if (isMobile() && !isPlaceholder && currentUserId && currentUserId === item.user_id) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'post-action-buttons';

        const editBtn = document.createElement('button');
        editBtn.className = 'post-edit-btn';
        editBtn.textContent = '수정';
        editBtn.setAttribute('data-post-id', item.id);
        editBtn.setAttribute('data-author-id', item.user_id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'post-delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.setAttribute('data-post-id', item.id);
        deleteBtn.setAttribute('data-author-id', item.user_id);

        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);
        postUserDiv.appendChild(buttonContainer);
    }

    card.appendChild(postUserDiv);

    // 오버레이
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    // 중앙 타이틀+콘텐츠
    const centerBox = document.createElement('div');
    centerBox.className = 'card-center-box';

    const title = document.createElement('div');
    title.className = 'card-center-title';
    title.textContent = isPlaceholder ? '타이틀' : item.title;

    const cutStringNum = 80;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-center-content';

    if (!isMobile()) {
        contentDiv.textContent = isPlaceholder ? '임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠' : 
            item.content.length > cutStringNum ? item.content.substring(0, cutStringNum) + '...' : item.content;
    } else {
        contentDiv.textContent = isPlaceholder ? '임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠' : item.content;
    }

    centerBox.appendChild(title);
    centerBox.appendChild(contentDiv);

    // 모바일에서만 더보기 버튼 추가
    if (isMobile()) {
        const readmoreBtn = document.createElement('button');
        readmoreBtn.className = 'read-more-btn';
        readmoreBtn.textContent = '더보기';
        readmoreBtn.style.display = 'none';
        centerBox.appendChild(readmoreBtn);
    }

    overlay.appendChild(centerBox);
    card.appendChild(overlay);

    const commentInput = document.createElement('div');
    commentInput.className = 'commentInputM';

    // 좋아요 상태 확인
    const isLiked = !isPlaceholder && userLikedPosts.includes(item.id);
    const heartIcon = isLiked ? 'image/heart-red.png' : 'image/heart-icon.png';
    const likedClass = isLiked ? 'liked' : '';

    overlay.appendChild(commentInput);

    commentInput.innerHTML = `
        <div class="iconDiv">
            <button class="heartBtn ${likedClass}" data-post-id="${item.id}">
                <img src="${heartIcon}" alt="좋아요" />
            </button>
            <span class="like-count">${item.likes || 0}</span>
            <img src="image/SpeechBubble-icon.png" alt="댓글" class="commentBtn" data-post-id="${item.id}" />
        </div>
        <input type="text" class="comInput" name = "comInput" data-post-id="${item.id}" placeholder="댓글을 입력하세요...">
    `;

    return card;
}

// =======================================================================================================
// 게시물 수정 함수
// =======================================================================================================
async function editPost(postId) {
    try {
        // 게시물 정보 가져오기
        const response = await fetch(`/api/post/${postId}`);
        if (!response.ok) {
            throw new Error('게시물 정보를 가져올 수 없습니다.');
        }
        
        const post = await response.json();
        
        // 수정 폼 표시 (간단한 prompt 사용, 추후 모달로 개선 가능)
        const newTitle = prompt('제목을 수정하세요:', post.title);
        if (newTitle === null) return; // 취소
        
        const newContent = prompt('내용을 수정하세요:', post.content);
        if (newContent === null) return; // 취소
        
        if (!newTitle.trim() || !newContent.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        // 수정 요청
        const updateResponse = await fetch(`/api/post/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTitle.trim(),
                content: newContent.trim(),
                existingImages: post.images || []
            })
        });

        const result = await updateResponse.json();
        
        if (result.success) {
            alert('게시물이 수정되었습니다.');
            // 페이지 새로고침하여 변경사항 반영
            location.reload();
        } else {
            alert(result.message || '게시물 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('게시물 수정 중 오류:', error);
        alert('게시물 수정 중 오류가 발생했습니다.');
    }
}

// =======================================================================================================
// 게시물 삭제 함수
// =======================================================================================================
async function deletePost(postId) {
    try {
        const response = await fetch(`/api/post/${postId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('게시물이 성공적으로 삭제되었습니다.');
            // 페이지 새로고침하여 삭제된 게시물 제거
            window.location.reload();
        } else {
            alert(result.message || '게시물 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('게시물 삭제 중 오류:', error);
        alert('게시물 삭제 중 오류가 발생했습니다.');
    }
}

// =======================================================================================================
// 권한 확인 함수
// =======================================================================================================
async function checkPostPermission(authorId, action) {
    try {
        // 현재 로그인한 사용자 정보 가져오기
        const userResponse = await fetch('/api/user');
        const currentUser = await userResponse.json();
        
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return false;
        }

        // 작성자 본인인지 확인
        if (currentUser.id !== authorId) {
            alert(`본인이 작성한 게시물만 ${action}할 수 있습니다.`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('권한 확인 중 오류:', error);
        alert('권한 확인 중 오류가 발생했습니다.');
        return false;
    }
}

function setupMobileCardSliderAndReadMore() {
    if (!isMobile()) {
        document.querySelectorAll('.card .read-more-btn').forEach(btn => {
            btn.style.display = 'none';
            const contentDiv = btn.closest('.card-center-box')?.querySelector('.card-center-content');
            if (contentDiv) {
                contentDiv.classList.remove('expanded');
            }
        });
        return;
    }

    const cardContainer = document.querySelector('.content');
    if (!cardContainer) return;

    // 이벤트 위임으로 버튼 처리
    cardContainer.addEventListener('click', function(event) {
        // 더보기 버튼 처리
        if (event.target.classList.contains('read-more-btn')) {
            const btn = event.target;
            const contentDiv = btn.closest('.card-center-box')?.querySelector('.card-center-content');
            if (contentDiv) {
                contentDiv.classList.toggle('expanded');
                btn.textContent = contentDiv.classList.contains('expanded') ? '닫기' : '더보기';
                if (!contentDiv.classList.contains('expanded')) {
                    contentDiv.scrollTop = 0;
                }
            }
        }

        // 수정 버튼 처리
        document.querySelectorAll('.post-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.getAttribute('data-post-id');
                const authorId = btn.getAttribute('data-author-id');
                
                // 게시물 수정 페이지로 이동 (모바일)
                window.location.href = `createPost_mobile.html?edit=${postId}`;
            });
        });

        document.querySelectorAll('.post-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.getAttribute('data-post-id');
                
                if (confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
                    deletePost(postId);
                }
            });
        });

        // 슬라이드 네비게이션 처리
        if (event.target.classList.contains('slide-nav')) {
            event.stopPropagation();
            const navBtn = event.target;
            const slider = navBtn.closest('.slider-container');
            if (!slider) return;

            const slides = Array.from(slider.querySelectorAll('.slide'));
            if (slides.length <= 1) return;

            let activeIndex = slides.findIndex(slide => slide.classList.contains('active'));

            slides[activeIndex].classList.remove('active');

            if (navBtn.classList.contains('prev')) {
                activeIndex = (activeIndex - 1 + slides.length) % slides.length;
            } else if (navBtn.classList.contains('next')) {
                activeIndex = (activeIndex + 1) % slides.length;
            }

            slides[activeIndex].classList.add('active');

            const prevButton = slider.querySelector('.slide-nav.prev');
            const nextButton = slider.querySelector('.slide-nav.next');
            if (prevButton && nextButton) {
                prevButton.disabled = activeIndex === 0;
                nextButton.disabled = activeIndex === slides.length - 1;
                prevButton.classList.toggle('disabled', activeIndex === 0);
                nextButton.classList.toggle('disabled', activeIndex === slides.length - 1);
            }
        }
    });

    // 더보기 버튼 표시 여부 결정 (DOM이 완전히 렌더링된 후)
    setTimeout(() => {
        document.querySelectorAll('.card').forEach(function(cardElement) {
            const content = cardElement.querySelector('.card-center-content');
            const btn = cardElement.querySelector('.read-more-btn');

            if (content && btn) {
                if (content.scrollHeight > content.clientHeight) {
                    btn.style.display = 'block';
                    btn.textContent = '더보기';
                } else {
                    btn.style.display = 'none';
                }
                content.classList.remove('expanded');
            }
        });
    }, 100);
}

async function renderCards() {
    const cardContainer = document.querySelector('.content');
    
    try {
        const response = await fetch('/api/posts');
        const data = await response.json();
        
        if (data.posts && Array.isArray(data.posts)) {
            cardContainer.innerHTML = '';
            
            if (data.posts.length > 0) {
                data.posts.forEach(item => {
                    // currentUserId 매개변수 추가
                    const cardElement = createCard(item, false, data.currentUserId);
                    if (cardElement) {
                        cardContainer.appendChild(cardElement);
                    }
                });
            } else {
                cardContainer.innerHTML = '<div class="no-posts">게시물이 없습니다.</div>';
            }
        } else {
            cardContainer.innerHTML = '<div class="no-posts">게시물이 없습니다.</div>';
        }
        
        adjustGridRows();
        setupMobileCardSliderAndReadMore();
    } catch (error) {
        console.error('게시물 데이터를 가져오는 중 오류 발생:', error);
        cardContainer.innerHTML = '<div class="error-message">게시물을 불러오는 데 실패했습니다.</div>';
    }
}

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

        const container = document.querySelector('.container');
        if (container) {
            container.style.height = `${grid.scrollHeight}px`;
        }
    });
}

// =======================================================================================================
// 전역 함수들 (HTML onclick에서 사용)
// =======================================================================================================
function openAdvancedSearchModal() {
    const modal = document.getElementById('advancedSearchModal');
    if (modal) {
        modal.classList.add('show');
        
        // 모달 배경 클릭 시 닫기 (한 번만 추가되도록)
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeAdvancedSearchModal();
            }
        };
        
        // 현재 검색어가 있다면 입력창에 설정
        const currentQuery = document.getElementById('searchInput')?.value || '';
        const advancedSearchQuery = document.getElementById('advancedSearchQuery');
        if (advancedSearchQuery && currentQuery) {
            advancedSearchQuery.value = currentQuery;
        }
    }
}

function closeAdvancedSearchModal() {
    const modal = document.getElementById('advancedSearchModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function resetAdvancedSearchForm() {
    document.getElementById('advancedSearchQuery').value = '';
    document.getElementById('advancedSearchType').value = 'all';
    document.getElementById('advancedSortBy').value = 'date';
    document.getElementById('advancedDateFrom').value = '';
    document.getElementById('advancedDateTo').value = '';
    document.getElementById('advancedMinViews').value = '';
    document.getElementById('advancedMaxViews').value = '';
    console.log('폼 초기화');
}

function executeAdvancedSearch() {
    console.log('고급 검색 실행');
    const filters = {
        query: document.getElementById('advancedSearchQuery').value.trim(),
        searchType: document.getElementById('advancedSearchType').value,
        sortBy: document.getElementById('advancedSortBy').value,
        dateFrom: document.getElementById('advancedDateFrom').value,
        dateTo: document.getElementById('advancedDateTo').value,
        minViews: document.getElementById('advancedMinViews').value,
        maxViews: document.getElementById('advancedMaxViews').value,
        page: 1,
        limit: 10
    };
    
    if (!filters.query) {
        alert('검색어를 입력해주세요.');
        return;
    }
    
    performAdvancedSearch(filters);
    closeAdvancedSearchModal();
}

function goToPage(page) {
    const filters = {
        ...currentSearchFilters,
        page: page
    };
    performAdvancedSearch(filters);
}

function searchPopularTerm(term) {
    const filters = {
        ...currentSearchFilters,
        query: term,
        page: 1
    };
    performAdvancedSearch(filters);
}

async function backToAllPosts() {
    // 검색 필터 초기화
    currentSearchFilters = {
        query: '',
        searchType: 'all',
        sortBy: 'date',
        dateFrom: '',
        dateTo: '',
        minViews: '',
        maxViews: '',
        page: 1,
        limit: 10
    };
    
    await renderCards(); // 기존 renderCards 함수 호출하여 전체 게시물 다시 로드
}

// 헬퍼 함수들
function getSearchTypeText(searchType) {
    const types = {
        'all': '전체',
        'title': '제목',
        'content': '내용',
        'author': '작성자',
        'titleAndContent': '제목+내용'
    };
    return types[searchType] || '전체';
}

function getSortByText(sortBy) {
    const sorts = {
        'date': '최신순',
        'views': '조회수순',
        'likes': '좋아요순',
        'comments': '댓글순',
        'title': '제목순',
        'author': '작성자순'
    };
    return sorts[sortBy] || '최신순';
}

// URL 파라미터에서 게시물 ID 추출
function getPostIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('postId');
}

// 특정 게시물을 찾아서 해당 위치로 스크롤
async function scrollToSpecificPost(postId) {
    if (!postId) return;
    
    // 잠시 대기 후 카드를 찾음 (렌더링 완료 대기)
    setTimeout(() => {
        const targetCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (targetCard) {
            // 해당 카드로 스크롤
            targetCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end' 
            });
            
            // 모바일에서 카드 하이라이트 효과 (선택사항)
            if (isMobile()) {
                targetCard.style.border = '3px solid #FF6B6B';
                setTimeout(() => {
                    targetCard.style.border = '';
                }, 3000);
            }
        }
    }, 50);
}

// 특정 게시물 하이라이트 함수
function highlightPost(postId) {
    const targetCard = document.querySelector(`[data-post-id="${postId}"]`);
    if (targetCard && isMobile()) {
        // 카드 확장 (더보기 버튼 자동 클릭)
        const readMoreBtn = targetCard.querySelector('.read-more-btn');
        if (readMoreBtn && readMoreBtn.style.display !== 'none') {
            readMoreBtn.click();
        }
        
        // 시각적 강조
        targetCard.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.5)';
        setTimeout(() => {
            targetCard.style.boxShadow = '';
        }, 3000);
    }
}

// 페이지 로드 시 좋아요 상태 가져오기
async function loadUserLikedPosts() {
    try {
        const response = await fetch('/api/posts/likes');
        if (response.ok) {
            const data = await response.json();
            userLikedPosts = data.likedPosts || [];
            // console.log('좋아요 상태 로드됨:', userLikedPosts);
        }
    } catch (error) {
        console.error('좋아요 상태 로드 중 오류:', error);
        userLikedPosts = [];
    }
}

// 게시물 로드 함수
async function loadPosts() {
    currentSearchTerm = null;
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const contentDiv = document.querySelector('.content');
        
        if (!contentDiv) {
            console.error('.content 요소를 찾을 수 없습니다.');
            return;
        }

        // 기존 카드들 제거 (센티넬 제외)
        const existingCards = contentDiv.querySelectorAll('.card');
        existingCards.forEach(card => card.remove());

        if (data.posts && data.posts.length > 0) {
            // 각 게시물에 대해 카드 생성
            data.posts.forEach(post => {
                const card = createCard(post, false, data.currentUserId);
                contentDiv.appendChild(card);
            });
        } else {
            // 게시물이 없는 경우
            const noPostsDiv = document.createElement('div');
            noPostsDiv.className = 'no-posts';
            noPostsDiv.innerHTML = '<p>게시물이 없습니다.</p>';
            contentDiv.appendChild(noPostsDiv);
        }

    } catch (error) {
        console.error('게시물 로드 중 오류:', error);
        const contentDiv = document.querySelector('.content');
        if (contentDiv) {
            contentDiv.innerHTML = '<div class="error-message">게시물을 불러오는 중 오류가 발생했습니다.</div>';
        }
    }
}

// 좋아요 버튼 클릭 처리 함수
async function handleLikeClick(postId, heartBtn) {
    try {
        const response = await fetch(`/api/post/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            const heartImg = heartBtn.querySelector('img');
            const likeCountElement = heartBtn.parentNode.querySelector('.like-count');
            
            // 애니메이션 클래스 추가
            heartBtn.classList.add('animating');
            
            // 애니메이션 완료 후 상태 업데이트
            setTimeout(() => {
                if (result.liked) {
                    heartImg.src = 'image/heart-red.png';
                    heartBtn.classList.add('liked');
                    if (!userLikedPosts.includes(postId)) {
                        userLikedPosts.push(postId);
                    }
                } else {
                    heartImg.src = 'image/heart-icon.png';
                    heartBtn.classList.remove('liked');
                    userLikedPosts = userLikedPosts.filter(id => id !== postId);
                }
                
                // 좋아요 수 업데이트
                if (likeCountElement) {
                    likeCountElement.textContent = result.likes || 0;
                }
                
                heartBtn.classList.remove('animating');
            }, 300);

        } else {
            alert(result.message || '좋아요 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('좋아요 처리 중 오류:', error);
        alert('좋아요 처리 중 오류가 발생했습니다.');
    }
}

// 검색 결과 클릭 시 로그 전송 함수
async function logSearchClick(searchTerm, clickedPostId) {
    if (!searchTerm || !clickedPostId) return;

    try {
        await fetch('/api/search/click_log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ searchTerm, clickedPostId }),
        });
    } catch (error) {
        console.error('검색 클릭 로그 전송 실패:', error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadUserLikedPosts();
    await renderCards();
    await loadPosts();

    // URL에 postId 파라미터가 있으면 해당 게시물로 스크롤
    const postId = getPostIdFromURL();
    if (postId) {
        scrollToSpecificPost(postId);
        
        // URL에서 파라미터 제거 (선택사항)
        const url = new URL(window.location);
        url.searchParams.delete('postId');
        window.history.replaceState({}, document.title, url.pathname);
    }

    let lastIsMobile = isMobile();

    window.addEventListener('resize', function() {
        const nowIsMobile = isMobile();
        if (lastIsMobile !== nowIsMobile) {
            location.reload();
        }
        lastIsMobile = nowIsMobile;
    });

    window.addEventListener('resize', () => {
        adjustGridRows();
    });

    // 플로팅 검색 기능
    const floatingSearchBtn = document.getElementById('floatingSearchBtn');
    const searchInputContainer = document.getElementById('searchInputContainer');
    const searchInput = document.getElementById('searchInput');
    const searchSubmitBtn = document.getElementById('searchSubmitBtn');
    let isSearchExpanded = false;

    // 플로팅 검색 버튼 클릭 이벤트
    floatingSearchBtn.addEventListener('click', function() {
        toggleSearchInput();
    });

    // 검색 토글 함수
    function toggleSearchInput() {
        isSearchExpanded = !isSearchExpanded;
        
        if (isSearchExpanded) {
            // 검색창 열기
            searchInputContainer.classList.add('expanded');
            floatingSearchBtn.classList.add('active');
            
            // 검색 입력 필드에 포커스
            setTimeout(() => {
                searchInput.focus();
            }, 200);
            
            // 아이콘을 X로 변경
            floatingSearchBtn.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            // 검색창 닫기
            closeSearchInput();
        }
    }

    // 검색창 닫기 함수
    function closeSearchInput() {
        searchInputContainer.classList.remove('expanded');
        floatingSearchBtn.classList.remove('active');
        floatingSearchBtn.innerHTML = '<i class="fas fa-search"></i>';
        searchInput.value = '';
        isSearchExpanded = false;
    }

    // 검색 제출 버튼 클릭 이벤트
    if (searchSubmitBtn) {
        searchSubmitBtn.addEventListener('click', function() {
            performSearch();
        });
    }

    // Enter 키로 검색
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // 고급 검색 관련 변수
    let currentSearchFilters = {
        query: '',
        searchType: 'all',
        sortBy: 'date',
        dateFrom: '',
        dateTo: '',
        minViews: '',
        maxViews: '',
        page: 1,
        limit: 10
    };

    // 검색 실행 함수 (고급 검색 지원)
    async function performAdvancedSearch(filters = currentSearchFilters) {
        try {
            const searchParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
                    searchParams.append(key, filters[key]);
                }
            });

            const response = await fetch(`/api/posts/search?${searchParams.toString()}`);
            const data = await response.json();

            if (data.success) {
                displaySearchResults(data.posts, data.searchInfo, data.pagination, data.currentUserId);
                logSearch(filters.query, filters.searchType, data.posts.length);
                currentSearchFilters = { ...filters };

                currentSearchTerm = filters.query;
            } else {
                alert(data.error || '검색 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('검색 중 오류:', error);
            alert('검색 중 오류가 발생했습니다.');
        }
    }

    // 간단 검색 실행 함수 (플로팅 버튼용)
    async function performSearch() {
        const query = searchInput.value.trim();
        if (query) {
            const filters = {
                ...currentSearchFilters,
                query: query,
                page: 1
            };
            
            await performAdvancedSearch(filters);
            closeSearchInput();
        }
    }

    // 검색 결과 표시 함수
    function displaySearchResults(posts, searchInfo, pagination, currentUserId = null) {
        const cardContainer = document.querySelector('.content');
        cardContainer.innerHTML = '';
        const searchHeader = createSearchResultsHeader(searchInfo, pagination);
        cardContainer.appendChild(searchHeader);
        
        if (posts && posts.length > 0) {
            // 검색된 게시물들로 카드 생성 - currentUserId 매개변수 추가
            posts.forEach(post => {
                const cardElement = createCard(post, false, currentUserId);
                if (cardElement) {
                    cardElement.addEventListener('click', () => {
                        const postId = cardElement.getAttribute('data-post-id');
                        logSearchClick(currentSearchTerm, postId);
                        // 기존의 모달 열기 로직은 그대로 유지됩니다.
                    });
                    cardContainer.appendChild(cardElement);
                }
            });
            
            // 페이지네이션 생성
            if (pagination.totalPages > 1) {
                const paginationElement = createPagination(pagination);
                cardContainer.appendChild(paginationElement);
            }
        }
        
        // 그리드 조정 및 모바일 기능 재설정
        adjustGridRows();
        setupMobileCardSliderAndReadMore();
    }

    // 검색 결과 헤더 생성
    function createSearchResultsHeader(searchInfo, pagination) {
        const header = document.createElement('div');
        header.className = 'search-results-header';
        
        const searchTypeText = getSearchTypeText(searchInfo.searchType);
        const sortByText = getSortByText(searchInfo.sortBy);
        
        header.innerHTML = `
            <div class="search-info">
                <h3>"${searchInfo.query}" 검색 결과</h3>
                <div class="search-details">
                    <span class="search-type">검색 범위: ${searchTypeText}</span>
                    <span class="sort-type">정렬: ${sortByText}</span>
                    <span class="result-count">총 ${pagination.totalCount}개 (${pagination.currentPage}/${pagination.totalPages} 페이지)</span>
                </div>
                <div class="search-actions">
                    <button class="advanced-search-btn" onclick="openAdvancedSearchModal()">고급 검색</button>
                    <button class="back-to-all-btn" onclick="backToAllPosts()">전체 게시물 보기</button>
                </div>
            </div>
        `;
        
        return header;
    }

    // 페이지네이션 생성
    function createPagination(pagination) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        let paginationHTML = '<div class="pagination">';
        
        // 이전 페이지 버튼
        if (pagination.hasPrev) {
            paginationHTML += `<button class="page-btn" onclick="goToPage(${pagination.currentPage - 1})">‹ 이전</button>`;
        }
        
        // 페이지 번호들
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.currentPage ? 'active' : '';
            paginationHTML += `<button class="page-btn ${activeClass}" onclick="goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
            paginationHTML += `<button class="page-btn" onclick="goToPage(${pagination.totalPages})">${pagination.totalPages}</button>`;
        }
        
        // 다음 페이지 버튼
        if (pagination.hasNext) {
            paginationHTML += `<button class="page-btn" onclick="goToPage(${pagination.currentPage + 1})">다음 ›</button>`;
        }
        
        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
        
        return paginationContainer;
    }

    // 모달 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('advancedSearchModal');
        const modalContent = document.querySelector('.advanced-search-content');
        
        if (modal && modal.style.display === 'flex' && 
            !modalContent.contains(e.target) && 
            e.target !== modal) {
            closeAdvancedSearchModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('advancedSearchModal');
            if (modal && modal.style.display === 'flex') {
                closeAdvancedSearchModal();
            }
        }
    });

    // 검색어 로깅
    async function logSearch(searchTerm, searchType, resultCount) {
        try {
            await fetch('/api/search/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    searchTerm: searchTerm,
                    searchType: searchType,
                    resultCount: resultCount
                })
            });
        } catch (error) {
            console.error('검색 로그 저장 중 오류:', error);
        }
    }

    // 인기 검색어 가져오기
    async function loadPopularSearches() {
        try {
            const response = await fetch('/api/search/ranking/live');
            const data = await response.json();
            
            if (data.success) {
                displayPopularSearches(data.popularSearches);
            }
        } catch (error) {
            console.error('인기 검색어 로드 중 오류:', error);
        }
    }

    // 인기 검색어 표시
    function displayPopularSearches(searches) {
        const container = document.getElementById('popularSearches');
        if (container && searches.length > 0) {
            container.innerHTML = searches.map(search => 
                `<span class="popular-search-item" onclick="searchPopularTerm('${search.search_term}')">${search.search_term}</span>`
            ).join('');
        }
    }

    // 페이지 로드 시 인기 검색어 로드
    loadPopularSearches();

    document.addEventListener('click', function(e) {
        // 모바일환경: heartBtn 클릭
        if (e.target.matches('.heartBtn') || e.target.closest('.heartBtn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const heartBtn = e.target.matches('.heartBtn') ? e.target : e.target.closest('.heartBtn');
            const postId = parseInt(heartBtn.getAttribute('data-post-id'));
            
            if (postId && !isNaN(postId)) {
                handleLikeClick(postId, heartBtn);
            }
        }
        
        // PC환경: heartBtn > img 클릭
        else if (e.target.matches('.heartBtn img')) {
            e.preventDefault();
            e.stopPropagation();
            
            const heartBtn = e.target.closest('.heartBtn');
            const postId = parseInt(heartBtn.getAttribute('data-post-id'));
            
            if (postId && !isNaN(postId)) {
                handleLikeClick(postId, heartBtn);
            }
        }
    });

    // 전역 스코프에 함수들 노출 (HTML onclick에서 사용하기 위해)
    window.performAdvancedSearch = performAdvancedSearch;
    window.currentSearchFilters = currentSearchFilters;
});