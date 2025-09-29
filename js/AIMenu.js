document.addEventListener('DOMContentLoaded', async () => { 
    // auth.js에 추가한 로그인 확인 함수를 호출합니다.
    const userData = await verifyLoginStatus();

    // userData가 null이 아니면 로그인된 상태입니다.
    if (userData) {
        console.log(`${userData.username}님, 환영합니다!`);
    }
    // userData가 null이면, verifyLoginStatus 함수가 이미 로그인 페이지로 보냈으므로
    // 여기서는 아무것도 할 필요가 없습니다.
    
    if (document.querySelector('.recommender-container')) { 
        initializeRecommender(); 
        setupModal(); 
    } 
});

// 추천 시스템 초기화
async function initializeRecommender() {
    const getBtn = document.getElementById('get-recommendation-btn');
    const resultsContainer = document.getElementById('recommendation-results');

    // 사용자 알레르기 정보 로드
    await loadUserAllergenInfo();

    // 모든 옵션 로드
    Promise.all([
        populateCheckboxes('/api/options/categories', 'categories-container', 'Category', 'Category', 'category'),
        populateCheckboxes('/api/options/needs', 'needs-container', 'NeedID', 'NeedKor', 'need'),
        populateCheckboxes('/api/options/goals', 'goals-container', 'GoalID', 'GoalKor', 'goal'),
        populateCheckboxes('/api/options/season', 'season-container', 'SeasonID', 'SeasonKor', 'season'),
        populateCheckboxes('/api/options/weathers', 'weathers-container', 'WeatherID', 'WeatherKor', 'weather'),
        populateCheckboxes('/api/options/times', 'times-container', 'TimeID', 'TimeKor', 'time')
    ]).then(() => {
        setupSliders();
        
        // 모바일 콜랩시블 기능 초기화
        initializeMobileCollapsible();
        
        // 화면 크기 변경 이벤트 리스너 추가
        window.addEventListener('resize', handleResize);
        
        // 선택 상태 업데이트 이벤트 리스너 추가
        setupSelectionStatusListeners();
        
        getBtn.addEventListener('click', getRecommendation);
    }).catch(error => {
        console.error("체크박스 생성 중 오류 발생:", error);
        resultsContainer.innerHTML = '<div class="error-message"><h3>오류 발생</h3><p>데이터 로드에 실패했습니다.</p></div>';
    });
}

async function loadUserAllergenInfo() {
    try {
        const response = await fetch('/api/user/allergens');
        const allergens = await response.json();
        const infoDiv = document.getElementById('user-allergen-info');
        const displayDiv = document.getElementById('user-allergen-display');
        
        if (allergens.length > 0) {
            if (infoDiv && displayDiv) {
                infoDiv.style.display = 'block';
                displayDiv.innerHTML = allergens.map(allergen => 
                    `<span class="allergen-tag">${allergen.AllergenKor}</span>`
                ).join('');
            }
        } else {
            console.log('[사용자 알레르기 정보]:', '등록된 알레르기 없음');
        }
    } catch (error) {
        console.error('사용자 알레르기 정보 로드 중 오류:', error);
    }
}

// 체크박스 생성 함수
async function populateCheckboxes(apiUrl, containerId, valueKey, textKey, name) {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const container = document.getElementById(containerId);

        // "상관없음" 옵션을 포함한 HTML 생성
        let htmlString = `
            <div class="checkbox-item">
                <input type="checkbox" id="${name}-all" name="${name}" value="all" checked>
                <label for="${name}-all">상관없음</label>
            </div>
        `;

        data.forEach(item => {
            const value = item[valueKey];
            const text = item[textKey];
            htmlString += `
                <div class="checkbox-item">
                    <input type="checkbox" id="${name}-${value}" name="${name}" value="${value}">
                    <label for="${name}-${value}">${text}</label>
                </div>
            `;
        });

        container.innerHTML = htmlString;

        // 체크박스 핸들러 설정
        setupAllCheckboxHandler(containerId, name);
        setupButtonAnimations(containerId);

    } catch (error) {
        console.error(`${apiUrl} 데이터 로드 실패:`, error);
        document.getElementById(containerId).innerHTML = '<p>데이터 로드에 실패했습니다.</p>';
    }
}

// 버튼 클릭 애니메이션 설정
function setupButtonAnimations(containerId) {
    const container = document.getElementById(containerId);
    const labels = container.querySelectorAll('label');
    
    labels.forEach(label => {
        label.addEventListener('click', function(e) {
            // 클릭 애니메이션 효과
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// "상관없음" 체크박스 핸들러
function setupAllCheckboxHandler(containerId, name) {
    const container = document.getElementById(containerId);
    const allCheckbox = container.querySelector(`input[value="all"]`);
    const otherCheckboxes = container.querySelectorAll(`input[name="${name}"]:not([value="all"])`);

    // 단일 선택 제한이 필요한 카테고리들
    const singleSelectCategories = ['season', 'weather', 'time'];
    const isSingleSelect = singleSelectCategories.includes(name);

    // 개선된 부드러운 스크롤 함수
    function smoothScrollToNextCheckboxGroup(currentContainerId) {
        const containerOrder = [
            'categories-container', 'needs-container', 'goals-container', 
            'season-container', 'weathers-container', 'times-container'
        ];
        
        const currentIndex = containerOrder.indexOf(currentContainerId);
        let targetElement = null;
        
        if (currentIndex >= 0 && currentIndex < containerOrder.length - 1) {
            const nextContainerId = containerOrder[currentIndex + 1];
            targetElement = document.getElementById(nextContainerId);
        } else if (currentIndex === containerOrder.length - 1) {
            // 마지막 그룹인 경우 추천 버튼으로 스크롤
            targetElement = document.getElementById('get-recommendation-btn');
        }
        
        if (targetElement) {
            // 커스텀 부드러운 스크롤 적용
            customSmoothScroll(targetElement, 800); // 800ms 동안 스크롤
        }
    }

    // "상관없음" 체크박스 클릭 시
    allCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // "상관없음"이 체크되면 다른 모든 체크박스 해제
            otherCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // 부드러운 스크롤 (지연 시간 증가)
            setTimeout(() => {
                smoothScrollToNextCheckboxGroup(containerId);
            }, 500); // 300ms → 500ms로 증가
        }
    });

    // 다른 체크박스들 클릭 시
    otherCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // 다른 체크박스가 체크되면 "상관없음" 해제
                allCheckbox.checked = false;
                
                // 단일 선택 제한이 있는 경우 다른 체크박스들 해제
                if (isSingleSelect) {
                    otherCheckboxes.forEach(otherCheckbox => {
                        if (otherCheckbox !== this) {
                            otherCheckbox.checked = false;
                        }
                    });
                }
                
                // 부드러운 스크롤 (지연 시간 증가)
                setTimeout(() => {
                    smoothScrollToNextCheckboxGroup(containerId);
                }, 500); // 300ms → 500ms로 증가
            }
        });
    });
}

function customSmoothScroll(targetElement, duration = 800) {
    // 화면 중앙에 오도록 계산
    const targetPosition = targetElement.offsetTop - (window.innerHeight / 2) + (targetElement.offsetHeight / 2);
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = easeOutCubic(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }

    // easeOutCubic 이징 함수 (더 일정한 속도)
    function easeOutCubic(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    }

    requestAnimationFrame(animation);
}

// 선택된 값들 가져오기 함수
function getSelectedValues(name) {
    const checkedBoxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkedBoxes).map(cb => cb.value);
}

// 슬라이더 설정
function setupSliders() {
    const kcalSlider = document.getElementById('kcal-slider');
    const priceSlider = document.getElementById('price-slider');
    const peopleSlider = document.getElementById('people-slider');
    const menuCountSlider = document.getElementById('menu-count-slider');
    const kcalValue = document.getElementById('kcal-value');
    const priceValue = document.getElementById('price-value');
    const peopleValue = document.getElementById('people-value');
    const menuCountValue = document.getElementById('menu-count-value');

    // 칼로리 슬라이더
    kcalSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value >= 2000) {
            kcalValue.textContent = '상관없음';
        } else {
            kcalValue.textContent = `${value}kcal 이하`;
        }
    });

    // 가격 슬라이더
    priceSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value >= 50000) {
            priceValue.textContent = '상관없음';
        } else {
            priceValue.textContent = `${value.toLocaleString()}원 이하`;
        }
    });

    // 인원 수 슬라이더
    peopleSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value === 1) {
            peopleValue.textContent = '1명';
        } else {
            peopleValue.textContent = `${value}명`;
        }
    });

    // 추천 메뉴 수 슬라이더
    menuCountSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        menuCountValue.textContent = `${value}개`;
    });

    // 초기값 설정
    kcalSlider.dispatchEvent(new Event('input'));
    priceSlider.dispatchEvent(new Event('input'));
    peopleSlider.dispatchEvent(new Event('input'));
    menuCountSlider.dispatchEvent(new Event('input'));
}

// 추천 요청 함수 (GPT 응답 모달 + 메뉴 카드만 표시)
function getRecommendation() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsContainer = document.getElementById('recommendation-results');

    // 선택된 값들 수집
    const selectedCategories = getSelectedValues('category');
    const selectedNeeds = getSelectedValues('need');
    const selectedGoals = getSelectedValues('goal');
    const selectedSeason = getSelectedValues('season');
    const selectedWeathers = getSelectedValues('weather');
    const selectedTimes = getSelectedValues('time');
    const maxKcal = document.getElementById('kcal-slider').value;
    const maxPrice = document.getElementById('price-slider').value;
    const peopleCount = document.getElementById('people-slider').value;
    const menuCount = document.getElementById('menu-count-slider').value;

    // console.log('[AI 메뉴 추천 요청] 선택값:', {
    //     category: selectedCategories,
    //     need: selectedNeeds,
    //     goal: selectedGoals,
    //     season: selectedSeason,
    //     weather: selectedWeathers,
    //     time: selectedTimes,
    //     maxKcal,
    //     maxPrice,
    //     peopleCount,
    //     menuCount
    // });

    // API 요청 파라미터 구성
    const params = new URLSearchParams();
    
    // 카테고리는 단일 선택으로 제한 (DB 필터링 효율성을 위해)
    if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
        params.append('category', selectedCategories[0]); // 첫 번째 선택만 사용
    }
    
    if (selectedNeeds.length > 0 && !selectedNeeds.includes('all')) {
        params.append('need', selectedNeeds.join(','));
    }
    if (selectedGoals.length > 0 && !selectedGoals.includes('all')) {
        params.append('goal', selectedGoals.join(','));
    }
    if (selectedSeason.length > 0 && !selectedSeason.includes('all')) {
        params.append('season', selectedSeason.join(','));
    }
    if (selectedWeathers.length > 0 && !selectedWeathers.includes('all')) {
        params.append('weather', selectedWeathers.join(','));
    }
    if (selectedTimes.length > 0 && !selectedTimes.includes('all')) {
        params.append('time', selectedTimes.join(','));
    }
    
    if (maxKcal < 2000) params.append('max_kcal', maxKcal);
    if (maxPrice < 50000) params.append('max_price', maxPrice);
    params.append('people_count', peopleCount);
    params.append('menu_count', menuCount);

    // 로딩 표시
    loadingSpinner.style.display = 'block';
    resultsContainer.innerHTML = '';

    // 결과 영역으로 스크롤
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // 스마트 필터링된 추천 API 호출
    fetch(`/api/recommend-filtered?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            loadingSpinner.style.display = 'none';
            displayMenuCardsOnly(data);
        })
        .catch(error => {
            loadingSpinner.style.display = 'none';
            console.error('추천 요청 중 오류:', error);
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <h3>⚠️ 오류 발생</h3>
                    <p>추천을 가져오는 중 오류가 발생했습니다.</p>
                </div>
            `;
        });
}

// 메뉴 카드만 표시하는 함수 (GPT 응답은 모달로)
function displayMenuCardsOnly(data) {
    const resultsContainer = document.getElementById('recommendation-results');
    
    if (data.error && !data.gpt) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>⚠️ 오류 발생</h3>
                <p>${data.error}</p>
            </div>
        `;
        return;
    }
    
    // 메뉴 카드만 표시
    if (data.menus && data.menus.length > 0) {
        let menuCardsHTML = `
            <div class="menu-cards-section">
                <h3>🍽️ 추천 메뉴</h3>
                <div class="menu-cards-container">
        `;
        
        data.menus.forEach(menu => {
            const imageHTML = menu.imagePath 
                ? `<img src="${menu.imagePath}" alt="${menu.MenuKor}" class="menu-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                : '';
            
            const placeholderHTML = menu.imagePath 
                ? `<div class="menu-card-placeholder" style="display: none;">🍽️</div>`
                : `<div class="menu-card-placeholder">🍽️</div>`;
            
            menuCardsHTML += `
                <div class="menu-card" onclick="showMenuDetail(${menu.MenuID})">
                    ${imageHTML}
                    ${placeholderHTML}
                    <div class="menu-card-content">
                        <h4>${menu.MenuKor}</h4>
                        <p class="menu-category">${menu.Category}</p>
                        <p class="menu-kcal">🔥 ${menu.kcal}kcal</p>
                        <p class="menu-price">💰 ${menu.Price.toLocaleString()}원</p>
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = menuCardsHTML;
        
        // GPT 응답 저장 (모달용)
        window.lastGPTData = {
            gpt: data.gpt,
            menuSpecificResponses: data.menuSpecificResponses,
            fallbackLevel: data.fallbackLevel,
            totalFiltered: data.totalFiltered
        };

        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
            setupHorizontalWheelScroll();
            setupTouchSwipe();
        }, 300);
        
    } else {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>😅 추천 메뉴가 없습니다</h3>
                <p>조건을 조정해서 다시 시도해보세요.</p>
            </div>
        `;
    }
}

function smoothScrollToBottom(duration = 800) {
    const startPosition = window.pageYOffset;
    const targetPosition = document.body.scrollHeight - window.innerHeight;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = easeOutCubic(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }

    // easeOutCubic 이징 함수 (부드러운 감속)
    function easeOutCubic(t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    }

    requestAnimationFrame(animation);
}

// 고급 부드러운 스크롤 (관성 효과 포함)
let advancedScrollData = {
    target: null,
    velocity: 0,
    targetPosition: 0,
    currentPosition: 0,
    isScrolling: false,
    friction: 0.88, // 마찰력 (0.8~0.9 권장)
    sensitivity: 2.0 // 민감도
};

function handleAdvancedHorizontalScroll(event) {
    if (event.deltaY !== 0) {
        event.preventDefault();
        
        const container = event.currentTarget;
        const scrollAmount = event.deltaY * advancedScrollData.sensitivity;
        
        // 속도에 스크롤 양 추가 (관성 효과)
        advancedScrollData.velocity += scrollAmount;
        
        // 스크롤 애니메이션 시작
        if (!advancedScrollData.isScrolling) {
            advancedScrollData.target = container;
            advancedScrollData.currentPosition = container.scrollLeft;
            advancedScrollData.isScrolling = true;
            advancedSmoothScrollStep();
        }
    }
}

function advancedSmoothScrollStep() {
    if (!advancedScrollData.target || !advancedScrollData.isScrolling) {
        return;
    }
    
    const container = advancedScrollData.target;
    
    // 마찰력 적용
    advancedScrollData.velocity *= advancedScrollData.friction;
    
    // 속도가 충분히 작아지면 정지
    if (Math.abs(advancedScrollData.velocity) < 0.1) {
        advancedScrollData.isScrolling = false;
        advancedScrollData.velocity = 0;
        return;
    }
    
    // 현재 위치 업데이트
    advancedScrollData.currentPosition += advancedScrollData.velocity;
    
    // 경계 확인
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    advancedScrollData.currentPosition = Math.max(0, 
        Math.min(maxScrollLeft, advancedScrollData.currentPosition)
    );
    
    // 실제 스크롤 적용
    container.scrollLeft = advancedScrollData.currentPosition;
    
    // 다음 프레임 계속
    requestAnimationFrame(advancedSmoothScrollStep);
}

// 지도 관련 변수들 (한 번만 초기화되도록 수정)
let mapInitialized = false;
let kakaoMap = null;
let userMarker = null;
let restaurantMarkers = [];
let restaurantOverlays = [];

// 메뉴 상세 정보 표시 함수 (안전한 요소 접근)
function showMenuDetail(menuId) {
    // console.log('메뉴 상세 정보 요청:', menuId);
    
    const modal = document.getElementById('menu-detail-modal');
    if (!modal) {
        console.error('모달 요소를 찾을 수 없습니다.');
        alert('메뉴 상세 정보를 표시할 수 없습니다.');
        return;
    }
    
    displayUserAddressInfo();
    
    // 메뉴 상세 정보 가져오기
    fetch(`/api/menu/${menuId}`)
        .then(response => response.json())
        .then(menuData => {
            if (menuData.error) {
                alert('메뉴 정보를 가져오는데 실패했습니다.');
                return;
            }
            
            // 안전한 요소 업데이트
            const titleElement = document.getElementById('modal-menu-title');
            const categoryElement = document.getElementById('modal-menu-category');

            const kcalElement = document.getElementById('modal-menu-kcal');
            const priceElement = document.getElementById('modal-menu-price');
            const imageElement = document.getElementById('modal-menu-image');
            
            // 요소가 존재하는 경우에만 업데이트
            if (titleElement) {
                titleElement.textContent = menuData.MenuKor;
            }
            
            if (categoryElement) {
                categoryElement.textContent = menuData.Category || '정보 없음';
            }
            
            if (kcalElement) {
                kcalElement.textContent = menuData.kcal ? `${menuData.kcal}kcal` : '정보 없음';
            }
            
            if (priceElement) {
                priceElement.textContent = menuData.Price ? `${menuData.Price.toLocaleString()}원` : '정보 없음';
            }
            
            // 이미지 표시
            if (imageElement) {
                if (menuData.imagePath) {
                    imageElement.src = menuData.imagePath;
                    imageElement.onerror = function() {
                        this.onerror = null; // 무한 루프 방지
                        this.src = '../image/food-icon.png'; // 기본 이미지 경로
                    };
                    imageElement.alt = menuData.MenuKor;
                    imageElement.style.display = 'block';
                } else {
                    imageElement.style.display = 'none';
                }
            }

            fetch(`/api/menu/${menuId}/allergens`)
                .then(response => response.json())
                .then(allergens => {
                    const allergenContainer = document.getElementById('modal-menu-allergens');
                    
                    if (allergenContainer) {
                        if (allergens.length > 0) {
                            allergenContainer.innerHTML = allergens.map(allergen => 
                                `<span class="allergen-tag">${allergen.AllergenKor}</span>`
                            ).join('');
                        } else {
                            allergenContainer.innerHTML = '<span class="no-allergen">알레르기 정보 없음</span>';
                        }
                    }
                })
                .catch(error => {
                    console.error('알레르기 정보 조회 오류:', error);
                    const allergenContainer = document.getElementById('modal-menu-allergens');
                    if (allergenContainer) {
                        allergenContainer.innerHTML = '<span class="no-allergen">알레르기 정보 조회 실패</span>';
                    }
                });
            
            // GPT 응답 표시 (lastGPTData가 있는 경우)
            displayGPTResponseInModal(menuData.MenuKor);
            
            // 모달 표시
            modal.style.display = 'block';
            
            // 지도 초기화 (모달이 열릴 때 한 번만 실행)
            setTimeout(() => {
                initializeMapOnce(menuData.MenuKor);
            }, 100);
        })
        .catch(error => {
            console.error('메뉴 정보 가져오기 오류:', error);
            alert('메뉴 정보를 가져오는데 실패했습니다.');
        });
}

// 메뉴 상세 모달에 GPT 응답 표시하는 함수
function displayGPTResponseInModal(menuName) {
    const gptSection = document.getElementById('modal-gpt-section');
    const gptResponseElement = document.getElementById('modal-gpt-response');
    const pairResponseElement = document.getElementById('modal-pair-response');
    const fallbackInfoElement = document.getElementById('modal-fallback-info');
    
    if (!gptSection || !gptResponseElement) {
        return;
    }
    
    // 저장된 GPT 데이터가 있는지 확인
    if (window.lastGPTData && window.lastGPTData.gpt) {
        const data = window.lastGPTData;
        
        // 메뉴별 응답이 있는지 확인
        if (data.menuSpecificResponses && data.menuSpecificResponses.menuResponses[menuName]) {
            const menuResponse = data.menuSpecificResponses.menuResponses[menuName];
            
            // 해당 메뉴의 구체적인 응답 표시
            let menuSpecificContent = `
                <div class="menu-specific-response">
                    <h5>🎯 ${menuName} 추천 이유</h5>
                    <p><strong>추천 이유:</strong> ${menuResponse.reason}</p>
                    <p><strong>특징:</strong> ${menuResponse.feature}</p>
                </div>
            `;
            
            gptResponseElement.innerHTML = menuSpecificContent;

            
            let menuPairingsContent = `
                <div class = "menu-pairings-response">
                    <h5>🍽️ ${menuName} 와(과) 어울리는 조합</h5>
                    <p><strong>추천 조합:</strong> ${menuResponse.pairing}</p>
                </div>
            `

            pairResponseElement.innerHTML = menuPairingsContent;
            
        } else if (data.gpt.includes(menuName)) {
            // 기존 방식: 전체 응답에서 해당 메뉴 언급 부분 찾기
            const sentences = data.gpt.split(/[.!?]/);
            const relevantSentences = sentences.filter(sentence => 
                sentence.includes(menuName)
            ).slice(0, 3); // 최대 3개 문장
            
            if (relevantSentences.length > 0) {
                gptResponseElement.innerHTML = `
                    <div class="menu-relevant-response">
                        <h5>🎯 ${menuName} 관련 설명</h5>
                        <p>${relevantSentences.join('. ').trim()}.</p>
                    </div>
                `;
            } else {
                gptResponseElement.innerHTML = `
                    <div class="menu-default-response">
                        <h5>🎯 ${menuName}</h5>
                        <p>이 메뉴는 현재 선택하신 조건에 적합한 추천 메뉴입니다.</p>
                    </div>
                `;
            }
        } else {
            // 해당 메뉴가 GPT 응답에 언급되지 않은 경우
            gptResponseElement.innerHTML = `
                <div class="menu-not-mentioned">
                    <h5>🎯 ${menuName}</h5>
                    <p style="opacity: 0.7; font-style: italic;">
                        이 메뉴에 대한 구체적인 AI 설명이 없지만, 선택하신 조건에 부합하는 메뉴입니다.
                    </p>
                </div>
            `;
        }
        
        // 폴백 정보 표시 (기존 코드 유지)
        if (data.fallbackLevel && data.fallbackLevel !== 'none' && fallbackInfoElement) {
            let fallbackMessage = '';
            let fallbackIcon = '';
            
            switch (data.fallbackLevel) {
                case 'light':
                    fallbackIcon = '🔄';
                    fallbackMessage = '일부 조건을 완화하여 추천되었습니다.';
                    break;
                case 'moderate':
                    fallbackIcon = '⚡';
                    fallbackMessage = '조건을 상당히 완화하여 추천되었습니다.';
                    break;
                case 'heavy':
                    fallbackIcon = '🎯';
                    fallbackMessage = '핵심 조건만 적용하여 추천되었습니다.';
                    break;
            }
            
            if (fallbackMessage) {
                fallbackInfoElement.innerHTML = `
                    <p style="margin: 10px 0; font-size: 0.9em; opacity: 0.8;">
                        ${fallbackIcon} ${fallbackMessage}
                    </p>
                `;
                fallbackInfoElement.style.display = 'block';
            } else {
                fallbackInfoElement.style.display = 'none';
            }
        } else if (fallbackInfoElement) {
            fallbackInfoElement.style.display = 'none';
        }
        
        gptSection.style.display = 'block';
    } else {
        // GPT 데이터가 없는 경우
        gptSection.style.display = 'none';
    }
}

// 지도 초기화 함수 (한 번만 실행되도록 수정)
async function initializeMapOnce(menuName) {
    // 이미 초기화되었다면 기존 마커만 정리하고 새로운 검색 실행
    if (mapInitialized && kakaoMap) {
        clearRestaurantMarkers();
        searchNearbyRestaurants(menuName);
        return;
    }
    
    if (typeof kakao === 'undefined' || !kakao.maps) {
        console.error('카카오 지도 API가 로드되지 않았습니다.');
        return;
    }
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('지도 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    try {
        // 사용자 정보 가져오기
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        
        if (userData && userData.address) {
            // 사용자 주소가 있는 경우 주소를 좌표로 변환
            const fullAddress = userData.address;
            
            // console.log('[INFO] 사용자 주소로 지도 초기화:', fullAddress);
            initializeMapWithAddress(fullAddress, menuName);
        } else {
            // 사용자 주소가 없는 경우 현재 위치 사용
            console.log('[INFO] 사용자 주소 없음, 현재 위치로 지도 초기화');
            initializeMapWithCurrentLocation(menuName);
        }
    } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        // 오류 발생 시 현재 위치로 대체
        initializeMapWithCurrentLocation(menuName);
    }
}

function initializeMapWithAddress(address, menuName) {
    // console.log('주소 기반 지도 초기화 시작:', address);
    
    kakao.maps.load(() => {
        // services 라이브러리 로드 확인
        if (!kakao.maps.services) {
            console.error('카카오 지도 services 라이브러리가 로드되지 않았습니다.');
            // services 라이브러리가 없으면 현재 위치로 대체
            initializeMapWithCurrentLocation(menuName);
            return;
        }
        
        const geocoder = new kakao.maps.services.Geocoder();
        
        // 주소 전처리 (괄호 제거 등)
        const cleanedAddress = address.replace(/\([^)]*\)/g, '').trim();
        // console.log('정제된 주소:', cleanedAddress);
        
        geocoder.addressSearch(cleanedAddress, function(result, status) {
            // console.log('Geocoder 결과:', result, 'Status:', status);
            
            if (status === kakao.maps.services.Status.OK) {
                const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                // console.log('변환된 좌표:', coords);
                
                // 지도 옵션 설정
                const mapOption = {
                    center: coords,
                    level: 6
                };
                
                // 지도 생성
                const mapContainer = document.getElementById('map');
                kakaoMap = new kakao.maps.Map(mapContainer, mapOption);
                mapInitialized = true;
                
                // console.log('지도 생성 완료');
                
                // 사용자 주소 마커 생성
                createAddressMarker(coords, address);
                
                // 주변 식당 검색
                searchNearbyRestaurants(menuName);
                
                // console.log('주소 기반 지도 초기화 완료:', address);
            } else {
                console.error('주소 검색 실패:', cleanedAddress, 'Status:', status);
                // 주소 검색 실패 시 현재 위치로 대체
                initializeMapWithCurrentLocation(menuName);
            }
        });
    });
}

function initializeMapWithCurrentLocation(menuName) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                kakao.maps.load(() => {
                    // 지도 옵션 설정
                    const mapOption = {
                        center: new kakao.maps.LatLng(lat, lng),
                        level: 6
                    };
                    
                    // 지도 생성
                    const mapContainer = document.getElementById('map');
                    kakaoMap = new kakao.maps.Map(mapContainer, mapOption);
                    mapInitialized = true;
                    
                    // 사용자 위치 마커 생성
                    createUserLocationMarker(lat, lng);
                    
                    // 주변 식당 검색
                    searchNearbyRestaurants(menuName);
                    
                    console.log('현재 위치 기반 지도 초기화 완료');
                });
            },
            (error) => {
                console.error('위치 정보를 가져올 수 없습니다:', error);
                
                // 기본 위치로 지도 생성 (서울 시청)
                kakao.maps.load(() => {
                    // 기본 위치로 지도 생성
                    const defaultMapOption = {
                        center: new kakao.maps.LatLng(37.5665, 126.9780),
                        level: 6
                    };
                    
                    const mapContainer = document.getElementById('map');
                    kakaoMap = new kakao.maps.Map(mapContainer, defaultMapOption);
                    mapInitialized = true;
                    
                    searchNearbyRestaurants(menuName);
                });
            }
        );
    } else {
        console.error('이 브라우저는 Geolocation을 지원하지 않습니다.');
        
        // 기본 위치로 지도 생성
        const defaultMapOption = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 6
        };
        
        const mapContainer = document.getElementById('map');
        kakaoMap = new kakao.maps.Map(mapContainer, defaultMapOption);
        mapInitialized = true;
        
        searchNearbyRestaurants(menuName);
    }
}

function createAddressMarker(coords, address) {
    // console.log('주소 마커 생성 시작:', coords, address);
    
    if (!kakaoMap) {
        console.error('지도가 초기화되지 않았습니다.');
        return;
    }
    
    // 기존 사용자 마커 제거
    if (userMarker) {
        userMarker.setMap(null);
        console.log('기존 마커 제거됨');
    }
    
    const imageSrc = '../image/myloc-icon.png'; // 마커 이미지 경로
    const imageSize = new kakao.maps.Size(40, 40); // 마커 이미지 크기 (적절히 조정)
    const imageOption = {
        offset: new kakao.maps.Point(20, 20) // 마커의 중심점 설정 (이미지 크기의 절반)
    };
    
    // 마커 이미지 객체 생성
    const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
    
    userMarker = new kakao.maps.Marker({
        position: coords,
        map: kakaoMap,
        image: markerImage // 커스텀 이미지 적용
    });
    
    const addressOverlay = new kakao.maps.CustomOverlay({
        position: coords,
        content: `
            <div class="myLocDiv" style="
                background: white;
                border: 2px solid #007bff;
                border-radius: 8px;
                padding: 8px 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                text-align: center;
                font-size: 12px;
                min-width: 120px;
                position: relative;
                bottom: 20px;
            ">
                <div class="myLoc" style="
                    font-weight: bold;
                    color: #007bff;
                    margin-bottom: 2px;
                ">내 주소</div>
                <div class="myLocAddress" style="
                    color: #666;
                    font-size: 11px;
                ">${address}</div>
            </div>
        `,
        yAnchor: 1,
        xAnchor: 0.5
    });
    
    addressOverlay.setMap(kakaoMap);
    
    // 지도 중심을 사용자 주소로 설정
    kakaoMap.setCenter(coords);
    // console.log('지도 중심 설정 완료:', coords);
}

// 사용자 위치 마커 생성
function createUserLocationMarker(lat, lng) {
    if (!kakaoMap) return;
    
    kakao.maps.load(() => {
        // 기존 사용자 마커 제거
        if (userMarker) {
            userMarker.setMap(null);
        }

        const imageSrc = '../image/myloc-icon.png'; // 마커 이미지 경로
        const imageSize = new kakao.maps.Size(40, 40); // 마커 이미지 크기 (적절히 조정)
        const imageOption = {
            offset: new kakao.maps.Point(20, 20) // 마커의 중심점 설정 (이미지 크기의 절반)
        };
        
        // 마커 이미지 객체 생성
        const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
        
        // 사용자 위치 마커 생성
        const position = new kakao.maps.LatLng(lat, lng);
        userMarker = new kakao.maps.Marker({
            position: position,
            map: kakaoMap,
            image: markerImage // 커스텀 이미지 적용
        });
        
        // 위치 정보창
        const locationInfoWindow = new kakao.maps.InfoWindow({
            content: '<div class="myLocDiv"><div class="myLoc">현재 위치</div></div>',
            removable: false
        });
        
        locationInfoWindow.open(kakaoMap, userMarker);
        
        // 지도 중심을 현재 위치로 설정
        kakaoMap.setCenter(position);
    });
}

// 식당 마커들 정리 함수
function clearRestaurantMarkers() {
    // 기존 식당 마커들 제거
    restaurantMarkers.forEach(marker => {
        marker.setMap(null);
    });
    restaurantMarkers = [];
    
    // 식당 오버레이들도 제거
    restaurantOverlays.forEach(overlay => {
        overlay.setMap(null);
    });
    restaurantOverlays = [];
}

// 주변 식당 검색 함수 (처음 한 번만 실행)
function searchNearbyRestaurants(menuName) {
    if (!kakaoMap) {
        console.error('지도가 초기화되지 않았습니다.');
        return;
    }
    
    kakao.maps.load(() => {
        // services 라이브러리 확인
        if (!kakao.maps.services) {
            console.error('카카오 지도 services 라이브러리가 로드되지 않았습니다.');
            return;
        }
        
        // 기존 식당 마커들 제거
        clearRestaurantMarkers();
        
        const ps = new kakao.maps.services.Places();
        const center = kakaoMap.getCenter();
        
        // 검색 옵션 설정
        const searchOptions = {
            location: center,
            radius: 2000, // 2km 반경
            sort: kakao.maps.services.SortBy.DISTANCE
        };
        
        // 메뉴명으로 식당 검색
        ps.keywordSearch(`${menuName} 맛집`, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                // console.log(`"${menuName}" 관련 식당 ${data.length}개 발견`);
                
                // 최대 10개 식당만 표시
                const limitedData = data.slice(0, 10);
                
                limitedData.forEach((place, index) => {
                    const imageSrc = '../image/rest-icon.png'; // 마커 이미지 경로
                    const imageSize = new kakao.maps.Size(40, 40); // 마커 이미지 크기 (적절히 조정)
                    const imageOption = {
                        offset: new kakao.maps.Point(20, 20) // 마커의 중심점 설정 (이미지 크기의 절반)
                    };

                    // 마커 이미지 객체 생성
                    const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

                    // 커스텀 이미지를 사용한 마커 생성
                    const marker = new kakao.maps.Marker({
                        position: new kakao.maps.LatLng(place.y, place.x),
                        map: kakaoMap,
                        image: markerImage // 커스텀 이미지 적용
                    });
                    
                    // CustomOverlay로 식당 정보 표시 (내 주소와 동일한 디자인)
                    const restaurantOverlay = new kakao.maps.CustomOverlay({
                        position: new kakao.maps.LatLng(place.y, place.x),
                        content: `
                            <div class="restaurant-info-div" style="
                                background: white;
                                border: 2px solid #ff6b6b;
                                border-radius: 8px;
                                padding: 8px 12px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                text-align: center;
                                font-size: 12px;
                                min-width: 200px;
                                position: relative;
                                bottom: 20px;
                            ">
                                <div class="restaurant-name" style="
                                    font-weight: bold;
                                    color: #ff6b6b;
                                    margin-bottom: 4px;
                                    font-size: 13px;
                                ">${place.place_name}</div>
                                <div class="restaurant-category" style="
                                    color: #666;
                                    font-size: 11px;
                                    margin-bottom: 2px;
                                ">${place.category_name}</div>
                                <div class="restaurant-address" style="
                                    color: #666;
                                    font-size: 11px;
                                    margin-bottom: 2px;
                                ">${place.road_address_name || place.address_name}</div>
                                <div class="restaurant-phone" style="
                                    color: #666;
                                    font-size: 11px;
                                ">${place.phone || '전화번호 없음'}</div>
                                <button class="close-overlay-btn" onclick="closeRestaurantOverlay(${index})" style="
                                    position: absolute;
                                    top: 5px;
                                    right: 8px;
                                    background: none;
                                    border: none;
                                    color: #ff6b6b;
                                    font-size: 16px;
                                    cursor: pointer;
                                    line-height: 1;
                                ">×</button>
                            </div>
                        `,
                        yAnchor: 1,
                        xAnchor: 0.5
                    });
                    
                    // 마커 클릭 이벤트로 오버레이 토글
                    kakao.maps.event.addListener(marker, 'click', () => {
                        // 다른 식당 오버레이들 숨기기
                        restaurantOverlays.forEach((overlay, idx) => {
                            if (idx !== index) {
                                overlay.setMap(null);
                            }
                        });
                        
                        // 현재 오버레이 토글
                        if (restaurantOverlay.getMap()) {
                            restaurantOverlay.setMap(null);
                        } else {
                            restaurantOverlay.setMap(kakaoMap);
                        }
                    });
                    
                    restaurantMarkers.push(marker);
                    restaurantOverlays.push(restaurantOverlay);
                });
            } else {
                console.log(`"${menuName}" 관련 식당을 찾을 수 없습니다.`);
                
                // 지도 중앙에 "주변에 관련 식당이 없습니다" 텍스트 표시
                const customOverlay = new kakao.maps.CustomOverlay({
                    position: center,
                    content: `
                        <div class="customoverlay" id="no-restaurant-overlay" style="
                            background: white;
                            border: 2px solid #ff6b6b;
                            border-radius: 8px;
                            padding: 12px 16px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                            text-align: center;
                            font-size: 14px;
                            font-weight: bold;
                            color: #ff6b6b;
                            min-width: 200px;
                            transition: opacity 0.5s ease;
                            opacity: 1;
                        ">
                            주변에 "${menuName}" 관련 식당이 없습니다
                        </div>
                    `,
                    yAnchor: 0.5,
                    xAnchor: 0.5
                });
                
                customOverlay.setMap(kakaoMap);
                
                // 간단한 페이드 아웃 처리
                setTimeout(() => {
                    const overlayDiv = document.getElementById('no-restaurant-overlay');
                    if (overlayDiv) {
                        overlayDiv.style.opacity = '0';
                        setTimeout(() => {
                            customOverlay.setMap(null);
                        }, 500);
                    } else {
                        customOverlay.setMap(null);
                    }
                }, 2500);
            }
        }, searchOptions);
    });
}

function closeRestaurantOverlay(index) {
    if (restaurantOverlays[index]) {
        restaurantOverlays[index].setMap(null);
    }
}

// 모달 설정 함수
function setupModal() {
    const modal = document.getElementById('menu-detail-modal');
    const closeBtn = document.querySelector('.close-button');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            // 지도는 초기화 상태를 유지, 마커들도 그대로 유지
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            // 지도는 초기화 상태를 유지, 마커들도 그대로 유지
        }
    });
}

// 사용자 주소 정보 표시 함수
async function displayUserAddressInfo() {
    try {
        const userResponse = await fetch('/api/user');
        const userData = await userResponse.json();
        
        const addressInfoElement = document.getElementById('user-address-info');
        if (addressInfoElement && userData && userData.address) {
            const fullAddress = userData.detail_address 
                ? `${userData.address} ${userData.detail_address}` 
                : userData.address;
            
            addressInfoElement.innerHTML = `
                <div style="margin-bottom: 10px; padding: 8px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px;">
                    📍 설정된 주소: ${fullAddress}
                </div>
            `;
            addressInfoElement.style.display = 'block';
        }
    } catch (error) {
        console.error('사용자 주소 정보 표시 실패:', error);
    }
}

// 메뉴 카드 컨테이너에 마우스 휠 스크롤 기능 추가
function setupHorizontalWheelScroll() {
    const menuCardsContainer = document.querySelector('.menu-cards-container');
    
    if (!menuCardsContainer) return;
    
    // 카드 너비 + gap 계산
    const getCardWidth = () => {
        const card = menuCardsContainer.querySelector('.menu-card');
        if (!card) return 295; // 기본값: 280px(카드) + 15px(gap)
        
        const cardStyle = window.getComputedStyle(card);
        const cardWidth = parseFloat(cardStyle.width);
        const gap = parseFloat(window.getComputedStyle(menuCardsContainer).gap) || 15;
        
        return cardWidth + gap;
    };
    
    // 휠 이벤트 리스너 추가
    menuCardsContainer.addEventListener('wheel', (e) => {
        e.preventDefault(); // 기본 세로 스크롤 방지
        
        const cardWidth = getCardWidth();
        const scrollDirection = e.deltaY > 0 ? 1 : -1; // 휠 방향 감지
        
        // 현재 스크롤 위치에서 카드 하나만큼 이동
        menuCardsContainer.scrollBy({
            left: cardWidth * scrollDirection,
            behavior: 'smooth'
        });
    }, { passive: false });
    
    // console.log('메뉴 카드 마우스 휠 스크롤 설정 완료');
}

// 터치 스와이프 지원 (모바일용)
function setupTouchSwipe() {
    const menuCardsContainer = document.querySelector('.menu-cards-container');
    
    if (!menuCardsContainer) return;
    
    let startX = 0;
    let scrollLeft = 0;
    let isDown = false;
    let startTime = 0;
    
    menuCardsContainer.addEventListener('touchstart', (e) => {
        isDown = true;
        startTime = Date.now();
        startX = e.touches[0].pageX - menuCardsContainer.offsetLeft;
        scrollLeft = menuCardsContainer.scrollLeft;
        
        // 스크롤 애니메이션 중단
        menuCardsContainer.style.scrollBehavior = 'auto';
    }, { passive: false });
    
    menuCardsContainer.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const x = e.touches[0].pageX - menuCardsContainer.offsetLeft;
        const walk = (x - startX) * 1.5; // 스크롤 속도 조절
        menuCardsContainer.scrollLeft = scrollLeft - walk;
    }, { passive: false });
    
    menuCardsContainer.addEventListener('touchend', (e) => {
        if (!isDown) return;
        isDown = false;
        
        const endTime = Date.now();
        const touchDuration = endTime - startTime;
        const endX = e.changedTouches[0].pageX - menuCardsContainer.offsetLeft;
        const distance = Math.abs(endX - startX);
        
        // 부드러운 스크롤 다시 활성화
        menuCardsContainer.style.scrollBehavior = 'smooth';
        
        // 빠른 스와이프인지 판단 (플릭 제스처)
        const isFlick = touchDuration < 300 && distance > 50;
        
        if (isFlick) {
            // 플릭 방향에 따라 다음/이전 카드로 이동
            const direction = endX > startX ? -1 : 1;
            scrollToAdjacentCard(direction);
        } else {
            // 일반 스와이프는 가장 가까운 카드로 스냅
            snapToNearestCard();
        }
    }, { passive: false });
}

// 가장 가까운 카드로 스냅하는 함수 구현
function snapToNearestCard() {
    const menuCardsContainer = document.querySelector('.menu-cards-container');
    if (!menuCardsContainer) return;
    
    const cardWidth = 280 + 15; // 카드 너비 + gap
    const currentScroll = menuCardsContainer.scrollLeft;
    const nearestCardIndex = Math.round(currentScroll / cardWidth);
    const targetScroll = nearestCardIndex * cardWidth;
    
    menuCardsContainer.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
    });
}

function scrollToAdjacentCard(direction) {
    const menuCardsContainer = document.querySelector('.menu-cards-container');
    if (!menuCardsContainer) return;
    
    const cardWidth = 280 + 15; // 카드 너비 + gap
    const currentScroll = menuCardsContainer.scrollLeft;
    const currentCardIndex = Math.round(currentScroll / cardWidth);
    const targetCardIndex = Math.max(0, currentCardIndex + direction);
    const targetScroll = targetCardIndex * cardWidth;
    
    // 스크롤 범위 체크
    const maxScroll = menuCardsContainer.scrollWidth - menuCardsContainer.clientWidth;
    const finalScroll = Math.min(Math.max(0, targetScroll), maxScroll);
    
    menuCardsContainer.scrollTo({
        left: finalScroll,
        behavior: 'smooth'
    });
}

function handleLogout(event) {
    event.preventDefault(); // 기본 링크 동작 방지
    
    // 검색 결과 [9]에서 제시한 방법: confirm 사용
    const userConfirmed = confirm('정말 로그아웃 하시겠습니까?');
    if (userConfirmed) {
        // 서버에 로그아웃 요청
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('로그아웃되었습니다.');
                window.location.href = '/intro.html';
            } else {
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        })
        .catch(error => {
            console.error('로그아웃 중 오류:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        });
    }
}

let mobileCollapsibleInitialized = false;

function initializeMobileCollapsible() {
    // 모바일 환경이 아니거나 이미 초기화된 경우 건너뛰기
    if (window.innerWidth > 768 || mobileCollapsibleInitialized) {
        return;
    }

    console.log('모바일 콜랩시블 초기화 시작');
    
    const filterGroups = document.querySelectorAll('.filter-group:not(#user-allergen-info)');
    
    filterGroups.forEach((group, index) => {
        const label = group.querySelector('label');
        const content = group.querySelector('.checkbox-container, .range-slider-group, .user-allergen-display');
        
        if (label && content) {
            // 기존 래퍼 제거
            const existingWrapper = group.querySelector('.collapsible-content');
            if (existingWrapper) {
                const wrappedContent = existingWrapper.firstElementChild;
                if (wrappedContent) {
                    existingWrapper.parentNode.insertBefore(wrappedContent, existingWrapper);
                    existingWrapper.remove();
                }
            }
            
            // 새 래퍼 생성
            const wrapper = document.createElement('div');
            wrapper.className = 'collapsible-content';
            content.parentNode.insertBefore(wrapper, content);
            wrapper.appendChild(content);
            
            // 첫 번째 그룹은 열어두고, 나머지는 접기
            if (index > 0) {
                group.classList.add('collapsed');
            }
            
            // 기존 이벤트 리스너 제거
            const newLabel = label.cloneNode(true);
            label.parentNode.replaceChild(newLabel, label);
            
            // 새 이벤트 리스너 추가
            newLabel.addEventListener('click', function(e) {
                if (e.target === this || e.target.tagName === 'SPAN') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFilterGroupNew(group);
                }
            });
            
            newLabel.addEventListener('touchend', function(e) {
                if (e.target === this || e.target.tagName === 'SPAN') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFilterGroupNew(group);
                }
            });
        }
    });
    
    mobileCollapsibleInitialized = true;
    console.log('모바일 콜랩시블 초기화 완료');
}

function toggleFilterGroupNew(group) {
    const content = group.querySelector('.collapsible-content');
    if (!content) return;
    
    const isCollapsed = group.classList.contains('collapsed');
    
    // 애니메이션 중복 방지
    if (content.style.transition === 'none') return;
    
    if (isCollapsed) {
        // 펼치기
        console.log('펼치기 시작');
        
        // 1. 높이를 auto로 설정하여 실제 높이 측정
        content.style.transition = 'none';
        content.style.maxHeight = 'auto';
        const targetHeight = content.scrollHeight;
        content.style.maxHeight = '0px';
        
        // 2. 강제 리플로우
        content.offsetHeight;
        
        // 3. 트랜지션 재활성화 후 애니메이션 시작
        content.style.transition = 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            group.classList.remove('collapsed');
            content.style.maxHeight = targetHeight + 'px';
        });
        
        // 4. 애니메이션 완료 후 auto로 변경
        setTimeout(() => {
            if (!group.classList.contains('collapsed')) {
                content.style.maxHeight = '1000px';
            }
        }, 400);
        
    } else {
        // 접기
        console.log('접기 시작');
        
        // 1. 현재 높이 고정
        const currentHeight = content.scrollHeight;
        content.style.maxHeight = currentHeight + 'px';
        
        // 2. 강제 리플로우
        content.offsetHeight;
        
        // 3. 애니메이션 시작
        requestAnimationFrame(() => {
            group.classList.add('collapsed');
            content.style.maxHeight = '0px';
        });
    }
    
    // 선택 상태 업데이트
    setTimeout(() => {
        updateGroupSelectionStatus();
    }, 100);
}

// 화면 크기 변경 감지
function handleResize() {
    // 디바운싱
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        const filterGroups = document.querySelectorAll('.filter-group');
        
        if (window.innerWidth > 768) {
            // 데스크톱: 콜랩시블 해제
            console.log('데스크톱 모드로 전환');
            
            filterGroups.forEach(group => {
                group.classList.remove('collapsed', 'has-selection');
                
                // 래퍼 해제
                const wrapper = group.querySelector('.collapsible-content');
                if (wrapper) {
                    const content = wrapper.firstElementChild;
                    if (content) {
                        content.style.maxHeight = '';
                        content.style.transition = '';
                        wrapper.parentNode.insertBefore(content, wrapper);
                        wrapper.remove();
                    }
                }
            });
            
            mobileCollapsibleInitialized = false;
            
        } else {
            // 모바일: 콜랩시블 활성화
            console.log('모바일 모드로 전환');
            mobileCollapsibleInitialized = false;
            
            setTimeout(() => {
                initializeMobileCollapsible();
                updateGroupSelectionStatus();
            }, 100);
        }
    }, 300);
}

function updateGroupSelectionStatus() {
    if (window.innerWidth <= 768) {
        const filterGroups = document.querySelectorAll('.filter-group');
        
        filterGroups.forEach(group => {
            const checkboxes = group.querySelectorAll('input[type="checkbox"]:checked');
            const sliders = group.querySelectorAll('input[type="range"]');
            
            let hasSelection = false;
            
            // 체크박스 확인 ("상관없음" 제외)
            const nonAllCheckboxes = Array.from(checkboxes).filter(cb => cb.value !== 'all');
            hasSelection = nonAllCheckboxes.length > 0;
            
            // 슬라이더 값 확인
            sliders.forEach(slider => {
                if (slider.id === 'kcal-slider' && parseInt(slider.value) < 2000) hasSelection = true;
                if (slider.id === 'price-slider' && parseInt(slider.value) < 50000) hasSelection = true;
            });
            
            group.classList.toggle('has-selection', hasSelection);
        });
    }
}

// 선택 상태 업데이트 이벤트 리스너 설정
function setupSelectionStatusListeners() {
    // 체크박스 변경 감지
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            setTimeout(() => {
                updateGroupSelectionStatus();
            }, 50);
        }
    });
    
    // 슬라이더 변경 감지
    document.addEventListener('input', function(e) {
        if (e.target.type === 'range') {
            setTimeout(() => {
                updateGroupSelectionStatus();
            }, 50);
        }
    });
    
    // 초기 상태 설정
    setTimeout(() => {
        updateGroupSelectionStatus();
    }, 500);
}