// 데이터 배열
function updateContentAndContainerHeight() {

    if (isMobile()) return;

    const content = document.querySelector('.content');
    const computedStyle = window.getComputedStyle(content);
    const container = document.querySelector('.container');
    const cards = content.querySelectorAll('.card');
    if (cards.length === 0) return;

    content.offsetHeight;

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

    // 2. 행 개수 계산
    const numRows = Math.ceil(cards.length / columns);

    setTimeout(() => {
        const cardHeight = cards[0].offsetHeight;
        const contentGap = parseInt(computedStyle.gap);
        const totalHeight = (numRows * cardHeight) + ((numRows - 1) * contentGap) + 40;
        
        content.style.height = totalHeight + 'px';
        if (container) {
            container.style.height = totalHeight + 'px';
        }
    }, 100);
}

// 게시물(카드) 생성 함수
function createCard(item, isPlaceholder = false) {
    const card = document.createElement('div');
    card.className = 'card';

    // 이미지 또는 임시 배경
    if (isPlaceholder) {
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
    } else {
        const img = document.createElement('img');
        img.src = "post_Tempdata/image/" + item.thumbnail_path;
        img.alt = item.title;
        card.appendChild(img);
    }

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

    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-center-content';
    contentDiv.textContent = isPlaceholder
        ? '임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠'
        : item.content;

    centerBox.appendChild(title);
    centerBox.appendChild(contentDiv);
    overlay.appendChild(centerBox);

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

function renderCards(startIndex = 0, count = 100) {
    const content = document.querySelector('.content');
    const endIndex = startIndex + count;
    for (let i = startIndex; i < endIndex; i++) {
        if (i < cardData.length) {
            const card = createCard(cardData[i]);
            content.appendChild(card);
        } else {
            // 데이터가 없을 때 임시 카드 생성
            const card = createCard({}, true);
            content.appendChild(card);
        }
    }
    updateContentAndContainerHeight();
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

// 페이지 사이즈 변경될 때 마다 새로고침
window.addEventListener('resize', () => {
    window.location.reload();
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

// 초기 렌더링 및 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
    renderCards();
    adjustGridRows();

    window.addEventListener('resize', () => {
        adjustGridRows();
    });
});
