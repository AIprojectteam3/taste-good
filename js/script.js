function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
}

// =======================================================================================================
// 게시물(카드) 생성 함수
// =======================================================================================================
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

        if (!isMobile()) {      // PC 환경
            const img = document.createElement('img');
            img.src = item.thumbnail_path;
            img.alt = item.title;
            sliderContainer.appendChild(img);
        } else {                // 모바일 환경
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
    if (isMobile()) { // 모바일 환경에서만 "더보기" 버튼을 DOM에 추가
        centerBox.appendChild(readmoreBtn);
    }
    overlay.appendChild(centerBox);
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

function setupMobileCardSliderAndReadMore() {
    if (!isMobile()) {
        // PC 환경에서는 "더보기" 버튼 숨김 및 expanded 클래스 제거
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

    // "더보기" 버튼 로직 (이벤트 위임 사용)
    cardContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('read-more-btn')) {
            const btn = event.target;
            const contentDiv = btn.closest('.card-center-box')?.querySelector('.card-center-content');
            if (contentDiv) {
                contentDiv.classList.toggle('expanded');
                btn.textContent = contentDiv.classList.contains('expanded') ? '닫기' : '더보기';
                if (!contentDiv.classList.contains('expanded')) {
                    contentDiv.scrollTop = 0;
                    // contentDiv.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        }

        // 모바일 카드 슬라이더 네비게이션 버튼 로직 (이벤트 위임 사용)
        if (event.target.classList.contains('slide-nav')) {
            event.stopPropagation(); // 카드 클릭 이벤트(모달 열기 등) 방지
            const navBtn = event.target;
            const slider = navBtn.closest('.slider-container');
            if (!slider) return;

            const slides = Array.from(slider.querySelectorAll('.slide'));
            if (slides.length <= 1) return;

            let activeIndex = slides.findIndex(slide => slide.classList.contains('active'));

            slides[activeIndex].classList.remove('active'); // 현재 활성 슬라이드 숨김

            if (navBtn.classList.contains('prev')) {
                activeIndex = (activeIndex - 1 + slides.length) % slides.length;
            } else if (navBtn.classList.contains('next')) {
                activeIndex = (activeIndex + 1) % slides.length;
            }

            slides[activeIndex].classList.add('active'); // 새 슬라이드 표시

            // 네비게이션 버튼 활성/비활성 업데이트
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

    // 각 카드에 대해 초기 "더보기" 버튼 표시 여부 설정
    document.querySelectorAll('.card').forEach(function(cardElement) {
        const content = cardElement.querySelector('.card-center-content');
        const btn = cardElement.querySelector('.read-more-btn');

        if (content && btn) {
            // index.css 에 모바일용 .card-center-content { max-height: 6.9em; overflow: hidden; } 등이 있어야 합니다.
            // 이 값은 line-height * 줄 수로 계산됩니다.
            // scrollHeight > clientHeight 비교는 CSS의 max-height로 인해 내용이 잘렸는지 확인합니다.
            if (content.scrollHeight > content.clientHeight) {
                btn.style.display = 'block';
                btn.textContent = '더보기';
            } else {
                btn.style.display = 'none';
            }
             // 초기 상태는 항상 '더보기' (펼쳐지지 않음)
            content.classList.remove('expanded');
        }
    });
}

// =======================================================================================================
// 카드 렌더링 함수
// =======================================================================================================
async function renderCards() {
    const cardContainer = document.querySelector('.content');
    cardContainer.innerHTML = ''; // 기존 카드 비우기

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const cardElement = createCard(post); // createCard가 card 요소를 반환하도록 수정 필요
                if (cardElement) {
                    cardContainer.appendChild(cardElement);
                }
            });
        } else {
            cardContainer.innerHTML = '<p>게시물이 없습니다.</p>';
        }
        adjustGridRows(); // 카드가 추가된 후 그리드 레이아웃 조정
    } catch (error) {
        console.error('게시물 데이터를 가져오는 중 오류 발생:', error);
        cardContainer.innerHTML = '<p>게시물을 불러오는 데 실패했습니다.</p>';
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
    renderCards();

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