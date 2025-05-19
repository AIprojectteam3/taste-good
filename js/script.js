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

    fetchUserProfile();
});

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
    // 🚨 중요: 이 함수는 user 객체가 항상 유효하다고 가정합니다. (null이 아니라고 가정)
    // 만약 user가 null이 될 수 있다면, user.username 접근 전에 null 체크가 필요합니다.
    // 이전 요청에서는 이 부분을 제거해달라고 하셨으므로, user가 null이 아니라는 전제로 작성합니다.

    const nicknameElement = document.querySelector('.profile .nickname');
    const levelElement = document.querySelector('.profile .level .level-value');
    const postCountElement = document.querySelector('.profile .profile-stats .post .post-count');
    const followerCountElement = document.querySelector('.profile .profile-stats .follower .follower-count'); // 항상 '0'
    const pointCountElement = document.querySelector('.profile .profile-stats .point .point-count');

    // 사용자 정보가 항상 있다고 가정하고 UI 업데이트
    if (nicknameElement) {
        nicknameElement.textContent = user.username; // user가 null이면 여기서 TypeError 발생
    } else {
        console.warn("프로필 닉네임 요소를 찾을 수 없습니다. (선택자: .profile .nickname)");
    }

    if (levelElement) {
        levelElement.textContent = user.level ? user.level.toString() : '1'; // 기본값 '1'
    } else {
        console.warn("프로필 레벨 요소를 찾을 수 없습니다. (선택자: .profile .level .level-value)");
    }

    if (postCountElement) {
        postCountElement.textContent = user.post_count !== undefined ? user.post_count.toString() : '0'; // 기본값 '0'
    } else {
        console.warn("프로필 게시글 수 요소를 찾을 수 없습니다. (선택자: .profile .profile-stats .post .post-count)");
    }

    if (pointCountElement) {
        pointCountElement.textContent = user.points ? user.points.toString() : '0'; // 기본값 '0'
    } else {
        console.warn("프로필 포인트 요소를 찾을 수 없습니다. (선택자: .profile .profile-stats .point .point-count)");
    }

    // 팔로워 수는 항상 '0'으로 고정
    if (followerCountElement) {
        followerCountElement.textContent = '0';
    } else {
        // console.warn("프로필 팔로워 수 요소를 찾을 수 없습니다. (선택자: .profile .profile-stats .follower .follower-count)");
    }
}