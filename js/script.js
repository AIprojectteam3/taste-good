// 데이터 배열
const cardData = [
    { title: '먹방 유튜버가 알려주는 음식 꿀조합', image_path: '0001.jpg', content: '먹방 유튜버가 알려주는 음식 꿀조합, 먹방 유튜버가 알려주는 음식 꿀조합, 먹방 유튜버가 알려주는 음식 꿀조합' },
    { title: '연예인 꿀조합 서브웨이 레시피', image_path: '0002.jpg', content: '연예인 꿀조합 서브웨이 레시피, 연예인 꿀조합 서브웨이 레시피, 연예인 꿀조합 서브웨이 레시피' },
    { title: '검증된 서브웨이 꿀팁', image_path: '0003.jpg', content: '검증된 서브웨이 꿀팁, 검증된 서브웨이 꿀팁, 검증된 서브웨이 꿀팁' },
    { title: '매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합', image_path: '0004.jpg', content: '매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합, 매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합, 매드포갈릭 매니아들만 알고 있었던 나만의 꿀조합' },
    { title: '편의점 음식 꿀조합 레시피', image_path: '0005.png', content: '편의점 음식 꿀조합 레시피, 편의점 음식 꿀조합 레시피, 편의점 음식 꿀조합 레시피' },
    { title: '추천 조합 한번에 주문하기', image_path: '0006.jpg', content: '추천 조합 한번에 주문하기, 추천 조합 한번에 주문하기, 추천 조합 한번에 주문하기' },
    { title: '2인 배달음식 꿀조합', image_path: '0007.jpg', content: '2인 배달음식 꿀조합, 2인 배달음식 꿀조합, 2인 배달음식 꿀조합' },
    { title: '카페별 음료 꿀조합', image_path: '0008.png', content: '카페별 음료 꿀조합, 카페별 음료 꿀조합, 카페별 음료 꿀조합' },
    { title: '서브웨이 꿀조합 Top 7', image_path: '0009.webp', content: '서브웨이 꿀조합 Top 7, 서브웨이 꿀조합 Top 7, 서브웨이 꿀조합 Top 7' },
    { title: '더미 게시글', image_path: '0010.jpg', content: '' },
    { title: '더미 게시글', image_path: '0011.jpg', content: '' },
    { title: '더미 게시글', image_path: '0012.png', content: '' },
    { title: '더미 게시글', image_path: '0013.jpg', content: '' },
    { title: '더미 게시글', image_path: '0014.jpg', content: '' },
    { title: '더미 게시글', image_path: '0015.jpg', content: '' },
    { title: '더미 게시글', image_path: '0016.png', content: '' },
    { title: '더미 게시글', image_path: '0017.jpg', content: '' },
    { title: '더미 게시글', image_path: '0018.jpg', content: '' },
    { title: '더미 게시글', image_path: '0019.jpg', content: '' },
    { title: '더미 게시글', image_path: '0020.jpg', content: '' },
    { title: '더미 게시글', image_path: '0021.jpg', content: '' },
    { title: '더미 게시글', image_path: '0022.jpg', content: '' },
    { title: '더미 게시글', image_path: '0023.png', content: '' },
    { title: '더미 게시글', image_path: '0024.jpg', content: '' },
    { title: '더미 게시글', image_path: '0025.jpg', content: '' },
    // ... 추가 데이터
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

// 카드 생성 함수
function createCard(item, isPlaceholder = false) {
    const card = document.createElement('div');
    card.className = 'card';

    if (isPlaceholder) {
        // 이미지 대신 "Post" 텍스트 스타일링
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

        // 타이틀
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
    // 이미지
    const img = document.createElement('img');
    img.src = "post_Tempdata/image/" + item.image_path;
    img.alt = item.title;

    // 타이틀
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = item.title;
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

  if (window.matchMedia("(max-width: 768px)").matches) {
      const container = document.querySelector('.content');
      const cards = Array.from(container.querySelectorAll('.card'));
      let currentSlide = 0;
      let isAnimating = false;
      let touchStartY = 0;
  
      // 카드 높이 계산
      const getCardHeight = () => cards[0]?.offsetHeight || window.innerHeight;
  
      // 터치 시작 이벤트
      container.addEventListener('touchstart', (e) => {
          touchStartY = e.touches[0].clientY;
      });
  
      // 터치 종료 이벤트
      container.addEventListener('touchend', (e) => {
          if (isAnimating || cards.length === 0) return;
          const touchEndY = e.changedTouches[0].clientY;
          const deltaY = touchStartY - touchEndY;
          const direction = deltaY > 0 ? 1 : -1;
          const newIndex = Math.min(
              Math.max(currentSlide + direction, 0),
              cards.length - 1
          );
          if (newIndex !== currentSlide) {
              currentSlide = newIndex;
              isAnimating = true;
              // 기존 scrollTo 대신 scrollIntoView 사용
              cards[currentSlide].scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
              });
              setTimeout(() => {
                  isAnimating = false;
              }, 500); // 애니메이션 시간에 맞게 조정
          }
      });
  
      // 물리적 스크롤 방지
      container.addEventListener('scroll', () => {
          if (!isAnimating) {
              container.scrollTo({
                  top: currentSlide * getCardHeight(),
                  behavior: 'auto'
              });
          }
      });
  }

  const cards = document.querySelectorAll('.card');

    const modalImg = document.querySelector('.modal-img > img');
    const modalTitle = document.querySelector('.post-title');
    const modalContent = document.querySelector('.post-content');

    cards.forEach((card, index) => {
        card.addEventListener('click', function() {
            modalImg.src = "post_Tempdata/image/" + cardData[index].image_path;
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
