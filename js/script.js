// 게시물(카드) 생성 함수
function createCard(item, isPlaceholder = false) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-post-id', item.id);

    // 슬라이더 컨테이너 생성
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    if (!isPlaceholder) {
        // 데이터에서 이미지 배열 가져오기 (썸네일을 첫 번째로)
        let images = [item.thumbnail_path];
        if (Array.isArray(item.images) && item.images.length > 0) {
            images = [item.thumbnail_path, ...item.images.filter(img => img !== item.thumbnail_path)];
        }

        // PC 환경: 썸네일만 표시
        if (!isMobile()) {
            const img = document.createElement('img');
            img.src = `post_Tempdata/image/${item.thumbnail_path}`;
            img.alt = item.title;
            sliderContainer.appendChild(img);
        } else {
            images.forEach((imgPath, index) => {
                const slide = document.createElement('img');
                slide.className = `slide ${index === 0 ? 'active' : ''}`;
                slide.src = `post_Tempdata/image/${imgPath}`;
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
            function showSlide(idx) {
                // 처음과 끝에서 더 이상 이동하지 않게
                if (idx < 0 || idx >= images.length) return;
                currentSlide = idx;
                const slideEls = sliderContainer.querySelectorAll('.slide');
                slideEls.forEach((el, i) => {
                    el.classList.toggle('active', i === currentSlide);
                    el.style.opacity = i === currentSlide ? '1' : '0';
                });
                // 버튼 활성/비활성 처리
                prevBtn.disabled = currentSlide === 0;
                nextBtn.disabled = currentSlide === images.length - 1;
                prevBtn.classList.toggle('disabled', currentSlide === 0);
                nextBtn.classList.toggle('disabled', currentSlide === images.length - 1);
            }

            // 초기 버튼 상태 설정
            showSlide(0);

            // 버튼 클릭 이벤트
            prevBtn.addEventListener('click', e => {
                e.stopPropagation();
                showSlide(currentSlide - 1);
            });
            nextBtn.addEventListener('click', e => {
                e.stopPropagation();
                showSlide(currentSlide + 1);
            });

            // 터치 슬라이드 이벤트
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

    // 작성자 정보(프로필+닉네임) 추가 (화면에 보이지 않게)
    const postUserDiv = document.createElement('div');
    postUserDiv.className = 'post-user';

    // 프로필 이미지
    const profileImg = document.createElement('img');
    profileImg.src = postUserData[0].profile_path;
    profileImg.alt = postUserData[0].user + ' 프로필';
    profileImg.className = 'user-profile-img';

    // 닉네임
    const nicknameSpan = document.createElement('span');
    nicknameSpan.className = 'user-nickname';
    nicknameSpan.textContent = postUserData[0].user;

    // ... 메뉴 버튼
    const menuBtn = document.createElement('a');
    menuBtn.className = 'post-menu-btn';
    menuBtn.type = 'a';
    menuBtn.innerText = '⋯';

    postUserDiv.appendChild(profileImg);
    postUserDiv.appendChild(nicknameSpan);
    postUserDiv.appendChild(menuBtn);

    // 카드에 추가 (위치: 카드 최상단 또는 원하는 위치)
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
        contentDiv.textContent = isPlaceholder
        ? '임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠'
        : item.content.length > cutStringNum
        ? item.content.substring(0, cutStringNum) + '...'
        : item.content;
    } else {
        contentDiv.textContent = isPlaceholder
        ? '임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠'
        : item.content
    }

    const readmoreBtn = document.createElement('button');
    readmoreBtn.className = 'read-more-btn';
    readmoreBtn.textContent = '더보기';
    readmoreBtn.style.display = 'none'; // 기본적으로 숨김

    centerBox.appendChild(title);
    centerBox.appendChild(contentDiv);
    overlay.appendChild(centerBox);
    centerBox.appendChild(readmoreBtn);
    card.appendChild(overlay);

    const commentInput = document.createElement('div');
    commentInput.className = 'commentInputM';
    overlay.appendChild(commentInput);
    commentInput.innerHTML = `
        <div class = "iconDiv">
            <img src = "../image/heart-icon.png" alt = "좋아요">
            <img src = "../image/SpeechBubble-icon.png" alt = "댓글" class = "comment-icon" data-post-id = "${item.id}">
        </div>
        <input class = "comInput" type = "text" placeholder = "댓글 입력">
        <input class = "comSubmit" type = "submit" value = "쓰기">
    `

    // 하단 아이콘 버튼
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    // 좋아요
    const likeBtn = document.createElement('img');
    likeBtn.src = '../image/heart-icon2.png'; // 예시 경로
    likeBtn.alt = '좋아요';
    likeBtn.className = 'action-icon';

    // 댓글
    const commentBtn = document.createElement('img');
    commentBtn.src = '../image/SpeechBubble-icon2.png'; // 예시 경로
    commentBtn.alt = '댓글';
    commentBtn.className = 'action-icon';

    // 북마크
    const bookmarkBtn = document.createElement('img');
    bookmarkBtn.src = '../image/bookmark-icon2.png'; // 예시 경로
    bookmarkBtn.alt = '북마크';
    bookmarkBtn.className = 'action-icon';

    actionsDiv.appendChild(likeBtn);
    actionsDiv.appendChild(commentBtn);
    actionsDiv.appendChild(bookmarkBtn);

    overlay.appendChild(actionsDiv);
    card.appendChild(overlay);

    // 좋아요, 댓글, 북마크 버튼 생성 후
    [likeBtn, commentBtn, bookmarkBtn].forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!isMobile()) e.stopPropagation();
            // 아이콘별 추가 동작은 여기서 구현
        });
    });

    // PC 환경에서만 마우스오버 효과
    if (!isMobile()) {
        card.addEventListener('mouseenter', () => {
            overlay.classList.add('active');
        });
        card.addEventListener('mouseleave', () => {
            overlay.classList.remove('active');
        });
    }

    return card;
}


let currentPage = 0;
const itemsPerPage = 30;
const sentinelag = 5;
let isLoading = false;
let sentinel = null;

// 카드 렌더링 함수 (start~end 구간만)
function renderCards(start, end) {
    const fragment = document.createDocumentFragment();
    const dataChunk = cardData.slice(start, end);

    dataChunk.forEach(item => {
        const card = createCard(item);
        fragment.appendChild(card);
    });

    const contentEl = document.querySelector('.content');
    contentEl.appendChild(fragment);
    adjustGridRows();
}

function loadMoreData() {
    if (isLoading || currentPage * itemsPerPage >= cardData.length) {
        if (sentinel) observer.unobserve(sentinel); // 데이터 끝나면 관찰 중지
        return;
    }
    isLoading = true;

    setTimeout(() => {
        const start = currentPage * itemsPerPage;
        const end = start + itemsPerPage;

        // 데이터가 남아있을 때만 생성
        if (start >= cardData.length) {
            if (sentinel) observer.unobserve(sentinel);
            isLoading = false;
            return;
        }

        renderCards(start, end);
        placeSentinelAboveLastNCards(sentinelag);
        currentPage++;
        isLoading = false;

        if (isMobile()) {
            setTimeout(() => {
                window.scrollBy(0, -25650); // 50px 위로 이동
            }, 100);
        }

        // 마지막 데이터까지 생성했으면 관찰 중지
        if (currentPage * itemsPerPage >= cardData.length && sentinel) {
            observer.unobserve(sentinel);
        }
    }, 300);
}

const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadMoreData();
            }
        });
    }, { 
    threshold: 0.1
});

function placeSentinelAboveLastNCards(n = 2) {
    const content = document.querySelector('.content');
    const cards = content.querySelectorAll('.card:not(.hidden)');
    if (cards.length < n) {
        content.appendChild(sentinel);
    } else {
        content.insertBefore(sentinel, cards[cards.length - n]);
    }
}

// 그리드 레이아웃 동기화
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

function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
}

function handleSwipe() {
    const slides = document.querySelectorAll('.slide');
    const currentSlide = document.querySelector('.slide.active');
    let currentIndex = Array.from(slides).indexOf(currentSlide);

    if (touchStartX - touchEndX > 50) {
        // 왼쪽으로 스와이프
        currentIndex = (currentIndex + 1) % slides.length;
    } else if (touchEndX - touchStartX > 50) {
        // 오른쪽으로 스와이프
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    }

    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentIndex].classList.add('active');
}

document.addEventListener("DOMContentLoaded", () => {
    
    sentinel = document.createElement('div');
    sentinel.id = 'sentinel';
    
    renderCards(0, itemsPerPage);
    placeSentinelAboveLastNCards(sentinelag);
    
    observer.observe(sentinel);
    currentPage = 1;

    adjustGridRows();

    window.addEventListener('resize', () => {
        adjustGridRows();
    });

    let lastIsMobile = isMobile();

    window.addEventListener('resize', function() {
        const nowIsMobile = isMobile();
            if (lastIsMobile !== nowIsMobile) {
                location.reload();
            }
        lastIsMobile = nowIsMobile;
    });

    // 모바일 환경
    document.querySelectorAll('.card-center-content').forEach(function(content) {
        const btn = content.parentNode.querySelector('.read-more-btn');
        if (content.scrollHeight > content.clientHeight) {
            btn.style.display = 'block';
            btn.textContent = '더보기';
            btn.addEventListener('click', function() {
                content.classList.toggle('expanded');
                if (content.classList.contains('expanded')) {
                    btn.textContent = '닫기';
                } else {
                    btn.textContent = '더보기';
                }
            });
        }
    });
});