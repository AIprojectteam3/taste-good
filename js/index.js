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

    const menuBtn = document.createElement('a');
    menuBtn.className = 'post-menu-btn';
    menuBtn.type = 'a';
    menuBtn.innerText = '⋯';

    postUserDiv.appendChild(profileImg);
    postUserDiv.appendChild(nicknameSpan);
    postUserDiv.appendChild(menuBtn);

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
    overlay.appendChild(commentInput);

    commentInput.innerHTML = `
        <div class = "iconDiv">
            <img src = "../image/heart-icon.png" alt = "좋아요">
            <img src = "../image/SpeechBubble-icon.png" alt = "댓글" class = "comment-icon" data-post-id = "${item.id}">
        </div>
        <input class = "comInput" name = "commentM" type = "text" placeholder = "댓글 입력" data-post-id = "${item.id}">
        <input class = "comSubmit" type = "submit" value = "등록">
    `;

    return card;
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

    // 이벤트 위임으로 더보기 버튼 처리
    cardContainer.addEventListener('click', function(event) {
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
    cardContainer.innerHTML = '';

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const cardElement = createCard(post);
                if (cardElement) {
                    cardContainer.appendChild(cardElement);
                }
            });
        } else {
            cardContainer.innerHTML = '<p>게시물이 없습니다.</p>';
        }
        
        adjustGridRows();
        setupMobileCardSliderAndReadMore(); // 카드 렌더링 후 호출
    } catch (error) {
        console.error('게시물 데이터를 가져오는 중 오류 발생:', error);
        cardContainer.innerHTML = '<p>게시물을 불러오는 데 실패했습니다.</p>';
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

document.addEventListener("DOMContentLoaded", () => {
    renderCards();

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
});
