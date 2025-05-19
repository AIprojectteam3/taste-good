// 데이터 배열
const bookmarkData = [
    { title: '더미 게시글', image_path: '0014.jpg' },
    { title: '더미 게시글', image_path: '0015.jpg' },
    { title: '더미 게시글', image_path: '0016.png' },
    { title: '더미 게시글', image_path: '0017.jpg' },
    { title: '더미 게시글', image_path: '0018.jpg' },
    { title: '더미 게시글', image_path: '0019.jpg' },
    { title: '더미 게시글', image_path: '0020.jpg' },
    { title: '더미 게시글', image_path: '0021.jpg' },
    { title: '더미 게시글', image_path: '0022.jpg' },
    { title: '더미 게시글', image_path: '0023.png' },
    { title: '더미 게시글', image_path: '0024.jpg' },
    { title: '더미 게시글', image_path: '0025.jpg' },
]

function updateTabContentAndContainerHeight(tabContentSelector) {
    if (isMobile()) return;
    
    const content = document.querySelector(tabContentSelector);
    if (!content) return;
    
    // 탭이 숨겨져 있으면 계산 정확도 높이기 위해 임시로 표시
    const wasHidden = content.classList.contains('hidden');
    if (wasHidden) {
        content.classList.remove('hidden');
        content.style.visibility = 'hidden'; // 시각적으로만 숨김
        content.style.position = 'absolute'; // 레이아웃에 영향 없게
    }
    
    const computedStyle = window.getComputedStyle(content);
    const container = document.querySelector('.container');
    const cards = content.querySelectorAll('.card');
    
    if (cards.length === 0) {
        if (wasHidden) {
            content.classList.add('hidden');
            content.style.visibility = '';
            content.style.position = '';
        }
        return;
    }

    // 이미지 로드 확인
    let loadedImages = 0;
    const totalImages = content.querySelectorAll('img').length;
    
    // 모든 그리드 계산 지연
    setTimeout(() => {
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

        // 최소 1열 보장
        columns = Math.max(1, columns);
        
        // 2. 행 개수 계산
        const numRows = Math.ceil(cards.length / columns);
        const cardHeight = cards[0].offsetHeight;
        const contentGap = parseInt(computedStyle.gap);
        const totalHeight = (numRows * cardHeight) + ((numRows - 1) * contentGap) + 40;
        
        content.style.gridAutoRows = `${cardHeight}px`; // 행 높이 명시적 설정
        content.style.height = `${totalHeight}px`;
        
        if (container) {
            container.style.height = `${totalHeight}px`;
        }

      // 원래 상태로 복원
        if (wasHidden) {
            content.classList.add('hidden');
            content.style.visibility = '';
            content.style.position = '';
        }
    }, 200); // 지연 시간 증가
}

const mypost = document.getElementById('my-posts');
const bookmark = document.getElementById('favorites');

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

// 특정 컨테이너에 카드 렌더링
function renderCardsTo(containerSelector, dataArray) {
    const container = document.querySelector(containerSelector);
    container.innerHTML = '';
    
    // 카드 추가
    dataArray.forEach(item => {
        container.appendChild(createCard(item));
    });
    
    // 이미지 로드 감지 후 높이 재계산
    const images = container.querySelectorAll('img');
    let loadedCount = 0;
    
    // 이미지가 없는 경우 바로 높이 계산
    if (images.length === 0) {
        updateTabContentAndContainerHeight(containerSelector);
        return;
    }
    
    // 각 이미지 로드 이벤트
    images.forEach(img => {
        if (img.complete) {
            loadedCount++;
            if (loadedCount === images.length) {
                updateTabContentAndContainerHeight(containerSelector);
            }
        } else {
            img.onload = () => {
                loadedCount++;
                if (loadedCount === images.length) {
                    updateTabContentAndContainerHeight(containerSelector);
                }
            };
        
            img.onerror = () => {
            loadedCount++;
                if (loadedCount === images.length) {
                    updateTabContentAndContainerHeight(containerSelector);
                }
            };
        }
    });
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

let prevIsMobile = window.matchMedia("(max-width: 768px)").matches;

window.addEventListener('resize', () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    // PC→모바일 또는 모바일→PC로 변경될 때만 새로고침
    if (isMobile !== prevIsMobile) {
        window.location.reload();
        prevIsMobile = isMobile;
    }
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
document.addEventListener("DOMContentLoaded", async () => {
    // 기존 mypostData 사용 대신 fetch로 데이터 받아오기
    const response = await fetch('/api/my-posts');
    const mypostData = await response.json();

    renderCardsTo('.tab-content#my-posts', mypostData);
    renderCardsTo('.tab-content#favorites', bookmarkData); // 즐겨찾기는 별도 처리
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
    
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                
                // 모든 탭 콘텐츠 숨기기
                tabContents.forEach((content) => {
                    content.classList.add("hidden");
                    content.style.gridAutoRows = 'min-content'; // 초기 행 높이 리셋
                });
                
                // 선택된 탭 표시
                const target = document.getElementById(tab.dataset.tab);
                target.classList.remove("hidden");
                
                // 레이아웃 리플로우 후 높이 계산
                requestAnimationFrame(() => {
                    updateTabContentAndContainerHeight(`#${target.id}`);
                });
            });
      });
});