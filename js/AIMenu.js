document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        
        if (!data.loggedIn) {
            alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/intro.html';
            return;
        }
    } catch (error) {
        console.error('세션 확인 중 오류:', error);
        alert('서버와 통신할 수 없습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/intro.html';
        return;
    }

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

    // 모든 옵션 로드 (알레르기 제외)
    Promise.all([
        populateCheckboxes('/api/options/categories', 'categories-container', 'Category', 'Category', 'category'),
        populateCheckboxes('/api/options/needs', 'needs-container', 'NeedID', 'NeedKor', 'need'),
        populateCheckboxes('/api/options/goals', 'goals-container', 'GoalID', 'GoalKor', 'goal'),
        populateCheckboxes('/api/options/season', 'season-container', 'SeasonID', 'SeasonKor', 'season'),
        populateCheckboxes('/api/options/weathers', 'weathers-container', 'WeatherID', 'WeatherKor', 'weather'),
        populateCheckboxes('/api/options/times', 'times-container', 'TimeID', 'TimeKor', 'time')
    ]).catch(error => {
        console.error("체크박스 생성 중 오류 발생:", error);
        resultsContainer.innerHTML = '<p>데이터 로드에 실패했습니다.</p>';
    });

    getBtn.addEventListener('click', getRecommendation);
    setupSliders();
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
            
            // 콘솔에 로드된 알레르기 정보 출력
            // console.log('[사용자 알레르기 정보 로드됨]:', allergens.map(a => a.AllergenKor).join(', '));
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
                <input type="checkbox" name="${name}" value="all" id="${name}-all">
                <label for="${name}-all">상관없음</label>
            </div>
        `;
        
        // value를 한글명(textKey)로!
        htmlString += data.map(item => `
            <div class="checkbox-item">
                <input type="checkbox" name="${name}" value="${item[textKey]}" id="${name}-${item[valueKey]}">
                <label for="${name}-${item[valueKey]}">${item[textKey]}</label>
            </div>
        `).join('');
        
        container.innerHTML = htmlString;
        
        setupAllCheckboxHandler(containerId, name);
        setupButtonAnimations(containerId);
        
    } catch (error) {
        console.error(`${apiUrl} 데이터 로드 실패:`, error);
        const container = document.getElementById(containerId);
        container.innerHTML = '<p>데이터 로드에 실패했습니다.</p>';
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

    // 자동 스크롤 함수
    function scrollToNextCheckboxGroup(currentContainerId) {
        const containerOrder = [
            'categories-container',
            'needs-container', 
            'goals-container',
            'season-container',
            'weathers-container',
            'times-container'
        ];
        
        const currentIndex = containerOrder.indexOf(currentContainerId);
        if (currentIndex >= 0 && currentIndex < containerOrder.length - 1) {
            const nextContainerId = containerOrder[currentIndex + 1];
            const nextContainer = document.getElementById(nextContainerId);
            
            if (nextContainer) {
                nextContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        } else if (currentIndex === containerOrder.length - 1) {
            // 마지막 그룹인 경우 추천 버튼으로 스크롤
            const recommendButton = document.getElementById('get-recommendation-btn');
            if (recommendButton) {
                recommendButton.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }

    // "상관없음" 체크박스 클릭 시
    allCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // "상관없음"이 체크되면 다른 모든 체크박스 해제
            otherCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // 자동 스크롤
            setTimeout(() => {
                scrollToNextCheckboxGroup(containerId);
            }, 300);
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
                
                // 자동 스크롤
                setTimeout(() => {
                    scrollToNextCheckboxGroup(containerId);
                }, 300);
            }
        });
    });
}

// 선택된 값들 가져오기 함수
function getSelectedValues(name) {
    const checkedBoxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkedBoxes).map(cb => cb.value);
}

// 슬라이더 설정
// 슬라이더 설정
function setupSliders() {
    const kcalSlider = document.getElementById('kcal-slider');
    const priceSlider = document.getElementById('price-slider');
    const peopleSlider = document.getElementById('people-slider'); // 인원 수 슬라이더 추가
    const menuCountSlider = document.getElementById('menu-count-slider'); // 메뉴 수 슬라이더 추가
    
    const kcalValue = document.getElementById('kcal-value');
    const priceValue = document.getElementById('price-value');
    const peopleValue = document.getElementById('people-value'); // 인원 수 표시
    const menuCountValue = document.getElementById('menu-count-value'); // 메뉴 수 표시

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

    // 인원 수 슬라이더 추가
    peopleSlider.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value === 1) {
            peopleValue.textContent = '1명';
        } else {
            peopleValue.textContent = `${value}명`;
        }
    });

    // 추천 메뉴 수 슬라이더 추가
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


// 추천 요청 함수
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
    const peopleCount = document.getElementById('people-slider').value; // 인원 수 추가
    const menuCount = document.getElementById('menu-count-slider').value; // 메뉴 수 추가

    // 콘솔에 선택값 출력
    console.log('[AI 추천 요청] 선택값:', {
        category: selectedCategories,
        need: selectedNeeds,
        goal: selectedGoals,
        season: selectedSeason,
        weather: selectedWeathers,
        time: selectedTimes,
        maxKcal,
        maxPrice,
        peopleCount, // 추가
        menuCount // 추가
    });

    // API 요청 파라미터 구성
    const params = new URLSearchParams();
    if (selectedCategories.length > 0 && !selectedCategories.includes('all')) {
        params.append('category', selectedCategories.join(','));
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

    // 인원 수와 메뉴 수 파라미터 추가
    params.append('people_count', peopleCount);
    params.append('menu_count', menuCount);

    // 로딩 표시
    loadingSpinner.style.display = 'block';
    resultsContainer.innerHTML = '';

    // 추천 버튼 클릭 시 결과 영역으로 스크롤
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }, 100);

    // Node.js API 호출
    fetch(`/api/recommend?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            loadingSpinner.style.display = 'none';
            displayRecommendations(data);
        })
        .catch(error => {
            loadingSpinner.style.display = 'none';
            console.error('추천 요청 중 오류:', error);
            resultsContainer.innerHTML = '<p>추천을 가져오는 중 오류가 발생했습니다.</p>';
        });
}

// 추천 결과 표시
async function displayRecommendations(data) {
    const resultsContainer = document.getElementById('recommendation-results');
    resultsContainer.innerHTML = '';

    // 오류 처리
    if (data.error && !data.gpt) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <h3>😅 추천 서비스에 문제가 발생했습니다</h3>
                <p>잠시 후 다시 시도해주세요.</p>
            </div>
        `;
        // 오류 메시지 출력 후 스크롤
        setTimeout(() => {
            resultsContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }, 100);
        return;
    }

    // GPT 응답일 경우
    if (data.gpt) {
        resultsContainer.innerHTML = `
            <div class="ai-recommendation">
                <h3>🤖 AI 추천 결과</h3>
                <div class="ai-response">
                    ${data.gpt.replace(/\n/g, '<br>')}
                </div>
                <p class="ai-note">💡 더 구체적인 추천을 원하시면 다른 조건으로 다시 시도해보세요!</p>
            </div>
        `;
        
        // GPT 답변 출력 후 해당 영역으로 스크롤
        setTimeout(() => {
            const aiRecommendation = resultsContainer.querySelector('.ai-recommendation');
            if (aiRecommendation) {
                aiRecommendation.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }
        }, 200);
        return;
    }

    // 기존 메뉴 데이터 배열일 경우 (향후 DB 연동 시)
    if (Array.isArray(data) && data.length > 0) {
        data.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="card-content">
                    <h3>${item.Name || item.MenuKor || '메뉴명 없음'}</h3>
                    <p><strong>카테고리:</strong> ${item.Category || '정보 없음'}</p>
                    <p><strong>칼로리:</strong> ${item.kcal || '정보 없음'}kcal</p>
                    <p><strong>가격:</strong> ${item.Price ? item.Price.toLocaleString() + '원' : '정보 없음'}</p>
                    ${item.imagePath ? `<img src="${item.imagePath}" alt="${item.Name}" class="menu-image">` : ''}
                    <div class="card-footer">
                        <span class="click-hint">클릭하여 상세 정보 보기</span>
                    </div>
                </div>
            `;

            // 카드 클릭 이벤트 (모달 표시)
            card.addEventListener('click', () => {
                showMenuModal(item);
            });

            resultsContainer.appendChild(card);
        });
        
        // 메뉴 카드 출력 후 스크롤
        setTimeout(() => {
            resultsContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
        return;
    }

    // 데이터가 없는 경우
    resultsContainer.innerHTML = `
        <div class="no-results">
            <h3>😅 조건에 맞는 추천 결과가 없습니다</h3>
            <p>다른 조건으로 다시 시도해보세요!</p>
        </div>
    `;
    
    // 결과 없음 메시지 출력 후 스크롤
    setTimeout(() => {
        resultsContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
    }, 100);
}


// 스크롤 이동 함수
function scrollToResults() {
    const resultsContainer = document.getElementById('recommendation-results');
    if (resultsContainer) {
        // 부드러운 스크롤 애니메이션
        resultsContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // 또는 페이지 맨 아래로 스크롤하려면 다음 코드 사용
        // window.scrollTo({
        //     top: document.body.scrollHeight,
        //     behavior: 'smooth'
        // });
    }
}

// 모달 표시 함수
function showMenuModal(item) {
    const modal = document.getElementById('recommendation-modal');
    const modalLeft = document.getElementById('modal-left');
    
    modalLeft.innerHTML = `
        <img src="${item.imagePath || '/image/default-food.png'}" alt="${item.MenuKor}">
        <h3>${item.MenuKor}</h3>
        <div class="menu-info">
            <p><strong>카테고리:</strong> ${item.Category}</p>
            <p><strong>칼로리:</strong> ${item.kcal}kcal</p>
            <p><strong>가격:</strong> ${item.Price ? item.Price.toLocaleString() + '원' : '정보 없음'}</p>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // 지도 초기화
    setTimeout(() => {
        initializeMap();
    }, 500);
}

// 모달 설정
function setupModal() {
    const modal = document.getElementById('recommendation-modal');
    const closeBtn = document.querySelector('.close-button');
    
    // 닫기 버튼 클릭
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 모달 외부 클릭시 닫기
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

let kakaoMap = null;
let currentMarker = null;

// 지도 초기화 함수
function initializeMap() {
    return new Promise((resolve, reject) => {
        // kakao 객체가 존재하는지 확인
        if (typeof kakao === 'undefined') {
            reject(new Error('카카오 지도 API가 로드되지 않았습니다.'));
            return;
        }

        // kakao.maps.load를 사용하여 API가 완전히 로드된 후 실행
        kakao.maps.load(() => {
            try {
                const mapContainer = document.getElementById('map');
                if (!mapContainer) {
                    reject(new Error('지도 컨테이너를 찾을 수 없습니다.'));
                    return;
                }

                const mapOption = {
                    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
                    level: 3
                };
                
                kakaoMap = new kakao.maps.Map(mapContainer, mapOption);
                resolve(kakaoMap);
            } catch (error) {
                reject(error);
            }
        });
    });
}

function createMarkerImage() {
    const svgMarker = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#4285F4">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
    `;
    const imageSrc = 'data:image/svg+xml;base64,' + btoa(svgMarker);
    const imageSize = new kakao.maps.Size(44, 44); // 마커 이미지 크기
    const imageOption = { offset: new kakao.maps.Point(22, 44) }; // 마커 좌표에 일치시킬 이미지 내에서의 좌표
    
    return new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
}

// 주변 음식점 검색
function searchNearbyRestaurants(map, coords) {
    const ps = new kakao.maps.services.Places();
    
    ps.keywordSearch('음식점', function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            const bounds = new kakao.maps.LatLngBounds();
            
            // 내 위치 좌표를 bounds에 포함
            bounds.extend(coords);
            
            for (let i = 0; i < Math.min(data.length, 10); i++) {
                const place = data[i];
                const placePosition = new kakao.maps.LatLng(place.y, place.x);
                
                // 일반 음식점 마커 (기본 색상)
                const marker = new kakao.maps.Marker({
                    map: map,
                    position: placePosition
                });
                
                const infowindow = new kakao.maps.InfoWindow({
                    content: `<div style="padding:5px;font-size:12px;">${place.place_name}</div>`
                });
                
                kakao.maps.event.addListener(marker, 'click', function() {
                    infowindow.open(map, marker);
                });
                
                bounds.extend(placePosition);
            }
            
            map.setBounds(bounds);
        } else {
            console.error('주변 음식점 검색 실패:', status);
        }
    }, {
        location: coords,
        radius: 1000
    });
}

function handleLogout(event) {
    event.preventDefault();
    
    const userConfirmed = confirm('정말 로그아웃 하시겠습니까?');
    if (userConfirmed) {
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