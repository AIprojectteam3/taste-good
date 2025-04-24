// 데이터 배열
const cardData = [
    {
        id: 0,
        title: '먹방 유튜버가 알려주는 음식 꿀조합',
        thumbnail_path: '0001.jpg',
        content: '먹방 유튜버가 알려주는 음식 꿀조합, 먹방 유튜버가 알려주는 음식 꿀조합, 먹방 유튜버가 알려주는 음식 꿀조합'
    },
    {
        id: 1,
        title: '연예인 꿀조합 서브웨이 레시피',
        thumbnail_path: '0002.jpg',
        content: '연예인 꿀조합 서브웨이 레시피, 연예인 꿀조합 서브웨이 레시피, 연예인 꿀조합 서브웨이 레시피'
    },
    {
        id: 2,
        title: '검증된 서브웨이 꿀팁',
        thumbnail_path: '0003.jpg',
        content: '검증된 서브웨이 꿀팁, 검증된 서브웨이 꿀팁, 검증된 서브웨이 꿀팁'
    },
    {
        id: 3,
        title: '매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합',
        thumbnail_path: '0004.jpg',
        content: '매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합, 매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합, 매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합'
    },
    {
        id: 4,
        title: '편의점 음식 꿀조합 레시피',
        thumbnail_path: '0005.png',
        content: '편의점 음식 꿀조합 레시피, 편의점 음식 꿀조합 레시피, 편의점 음식 꿀조합 레시피'
    },
    {
        id: 5,
        title: '추천 조합 한번에 주문하기',
        thumbnail_path: '0006.jpg',
        content: '추천 조합 한번에 주문하기, 추천 조합 한번에 주문하기, 추천 조합 한번에 주문하기'
    },
    {
        id: 6,
        title: '2인 배달음식 꿀조합',
        thumbnail_path: '0007.jpg',
        content: '2인 배달음식 꿀조합, 2인 배달음식 꿀조합, 2인 배달음식 꿀조합'
    },
    {
        id: 7,
        title: '카페별 음료 꿀조합',
        thumbnail_path: '0008.png',
        content: '카페별 음료 꿀조합, 카페별 음료 꿀조합, 카페별 음료 꿀조합'
    },
    {
        id: 8,
        title: '서브웨이 꿀조합 Top 7',
        thumbnail_path: '0009.webp',
        content: '서브웨이 꿀조합 Top 7, 서브웨이 꿀조합 Top 7, 서브웨이 꿀조합 Top 7'
    },
    {
        id: 9,
        title: '더미 게시글',
        thumbnail_path: '0010.jpg',
        content: ''
    },
    {
        id: 10,
        title: '더미 게시글',
        thumbnail_path: '0011.jpg',
        content: ''
    },
    {
        id: 11,
        title: '더미 게시글',
        thumbnail_path: '0012.png',
        content: ''
    },
    {
        id: 12,
        title: '더미 게시글',
        thumbnail_path: '0013.jpg',
        content: ''
    },
    {
        id: 13,
        title: '더미 게시글',
        thumbnail_path: '0014.jpg',
        content: ''
    },
    {
        id: 14,
        title: '더미 게시글',
        thumbnail_path: '0015.jpg',
        content: ''
    },
    {
        id: 15,
        title: '더미 게시글',
        thumbnail_path: '0016.png',
        content: ''
    },
    {
        id: 16,
        title: '더미 게시글',
        thumbnail_path: '0017.jpg',
        content: ''
    },
    {
        id: 17,
        title: '더미 게시글',
        thumbnail_path: '0018.jpg',
        content: ''
    },
    {
        id: 18,
        title: '더미 게시글',
        thumbnail_path: '0019.jpg',
        content: ''
    },
    {
        id: 19,
        title: '더미 게시글',
        thumbnail_path: '0020.jpg',
        content: ''
    },
    {
        id: 20,
        title: '더미 게시글',
        thumbnail_path: '0021.jpg',
        content: ''
    },
    {
        id: 21,
        title: '더미 게시글',
        thumbnail_path: '0022.jpg',
        content: ''
    },
    {
        id: 22,
        title: '더미 게시글',
        thumbnail_path: '0023.png',
        content: ''
    },
    {
        id: 23,
        title: '더미 게시글',
        thumbnail_path: '0024.jpg',
        content: ''
    },
    {
        id: 24,
        title: '더미 게시글',
        thumbnail_path: '0025.jpg',
        content: ''
    }
];

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

    const cards = document.querySelectorAll('.card');

    const modalImg = document.querySelector('.modal-img > img');
    const modalTitle = document.querySelector('.post-title');
    const modalContent = document.querySelector('.post-content');

    cards.forEach((card, index) => {
        card.addEventListener('click', function() {
            modalImg.src = "post_Tempdata/image/" + cardData[index].thumbnail_path;
            modalTitle.textContent = cardData[index].title;
            modalContent.textContent = cardData[index].content;
            // 모달 열기
            document.getElementById('index-modal').style.display = 'flex';
        });
    });
        
    // 모달 닫기
    document.getElementById('modal-close').addEventListener('click', function() {
        document.getElementById('index-modal').style.display = 'none';
    });

    // 모달 바깥 클릭 시 닫기
    document.getElementById('index-modal').addEventListener('click', function(e) {
        if (e.target === this) {
        this.style.display = 'none';
        }
    });
});
