document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.recommender-container')) {
        checkLoginStatus();
        setupModal();
    }
});

// 로그인 상태 확인
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        if (data.loggedIn) {
            initializeRecommender();
        } else {
            alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/intro.html';
        }
    } catch (error) {
        console.error('세션 확인 중 오류 발생:', error);
        alert('서버와 통신할 수 없습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/intro.html';
    }
}

// 추천 시스템 초기화
function initializeRecommender() {
    const getBtn = document.getElementById('get-recommendation-btn');
    const resultsContainer = document.getElementById('recommendation-results');

    // 모든 옵션 로드
    Promise.all([
        populateCheckboxes('/api/options/categories', 'categories-container', 'Category', 'Category', 'category'),
        populateCheckboxes('/api/options/needs', 'needs-container', 'NeedID', 'NeedKor', 'need'),
        populateCheckboxes('/api/options/goals', 'goals-container', 'GoalID', 'GoalKor', 'goal'),
        populateCheckboxes('/api/options/weathers', 'weathers-container', 'WeatherID', 'WeatherKor', 'weather'),
        populateCheckboxes('/api/options/times', 'times-container', 'TimeID', 'TimeKor', 'time')
    ]).catch(error => {
        console.error("체크박스 생성 중 오류 발생:", error);
        resultsContainer.innerHTML = '<p>데이터 로드에 실패했습니다.</p>';
    });

    // 추천 버튼 이벤트 리스너
    getBtn.addEventListener('click', getRecommendation);

    // 슬라이더 이벤트 리스너
    setupSliders();
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
        
        // 데이터베이스에서 가져온 옵션들 추가
        htmlString += data.map(item => `
            <div class="checkbox-item">
                <input type="checkbox" name="${name}" value="${item[valueKey]}" id="${name}-${item[valueKey]}">
                <label for="${name}-${item[valueKey]}">${item[textKey]}</label>
            </div>
        `).join('');
        
        container.innerHTML = htmlString;
        
        // "상관없음" 체크박스 이벤트 리스너 추가
        setupAllCheckboxHandler(containerId, name);
        
        // 버튼 클릭 애니메이션 추가
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
    
    // "상관없음" 체크박스 클릭 시
    allCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // "상관없음"이 체크되면 다른 모든 체크박스 해제
            otherCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    });
    
    // 다른 체크박스들 클릭 시
    otherCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // 다른 체크박스가 체크되면 "상관없음" 해제
                allCheckbox.checked = false;
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
function setupSliders() {
    const kcalSlider = document.getElementById('kcal-slider');
    const priceSlider = document.getElementById('price-slider');
    const kcalValue = document.getElementById('kcal-value');
    const priceValue = document.getElementById('price-value');

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

    // 초기값 설정
    kcalSlider.dispatchEvent(new Event('input'));
    priceSlider.dispatchEvent(new Event('input'));
}

// 추천 요청 함수
function getRecommendation() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultsContainer = document.getElementById('recommendation-results');
    
    // 선택된 값들 수집
    const selectedCategories = getSelectedValues('category');
    const selectedNeeds = getSelectedValues('need');
    const selectedGoals = getSelectedValues('goal');
    const selectedWeathers = getSelectedValues('weather');
    const selectedTimes = getSelectedValues('time');
    
    const maxKcal = document.getElementById('kcal-slider').value;
    const maxPrice = document.getElementById('price-slider').value;
    
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
    if (selectedWeathers.length > 0 && !selectedWeathers.includes('all')) {
        params.append('weather', selectedWeathers.join(','));
    }
    if (selectedTimes.length > 0 && !selectedTimes.includes('all')) {
        params.append('time', selectedTimes.join(','));
    }
    
    if (maxKcal < 2000) params.append('max_kcal', maxKcal);
    if (maxPrice < 50000) params.append('max_price', maxPrice);
    
    // 로딩 표시
    loadingSpinner.style.display = 'block';
    resultsContainer.innerHTML = '';
    
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
async function displayRecommendations(items) {
    const modal = document.getElementById('recommendation-modal');
    const modalLeft = document.getElementById('modal-left');
    const resultsContainer = document.getElementById('recommendation-results');
    
    resultsContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h3>조건에 맞는 메뉴를 찾을 수 없습니다</h3>
                <p>다른 조건으로 다시 시도해보세요!</p>
            </div>
        `;
        return;
    }

    const item = items[0]; // 첫 번째 추천 메뉴
    
    // 결과 카드 생성
    const resultCard = document.createElement('div');
    resultCard.className = 'recommendation-card';
    resultCard.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        padding: 20px;
        margin: 20px auto;
        max-width: 600px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    `;
    
    resultCard.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center;">
            <img src="${item.imagePath || '/image/default-food.png'}" 
                 alt="${item.MenuKor}" 
                 style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">
            <div style="flex: 1;">
                <h3 style="margin: 0 0 10px 0; color: #ff6f61; font-size: 1.5em;">${item.MenuKor}</h3>
                <p style="margin: 5px 0; color: #666;"><strong>카테고리:</strong> ${item.Category}</p>
                <p style="margin: 5px 0; color: #666;"><strong>칼로리:</strong> ${item.kcal}kcal</p>
                <p style="margin: 5px 0; color: #666;"><strong>가격:</strong> ${item.Price ? item.Price.toLocaleString() + '원' : '정보 없음'}</p>
                <p style="margin: 10px 0 0 0; color: #ff6f61; font-weight: bold;">클릭하여 상세 정보 보기</p>
            </div>
        </div>
    `;
    
    // 호버 효과
    resultCard.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
    });
    
    resultCard.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    });
    
    // 클릭 이벤트 - 모달 열기
    resultCard.addEventListener('click', function() {
        showMenuModal(item);
    });
    
    resultsContainer.appendChild(resultCard);
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
            ${item.total_score ? `<p><strong>추천 점수:</strong> ${item.total_score}점</p>` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
    
    // 지도 초기화
    setTimeout(() => {
        initializeMap();
    }, 100);
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

// 지도 초기화 함수
async function initializeMap() {
    try {
        const response = await fetch('/api/user');
        const userData = await response.json();
        
        if (!userData || !userData.address) {
            document.getElementById('modal-right').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h4>위치 정보가 없습니다</h4>
                    <p>정확한 위치 기반 검색을 위해<br>마이페이지에서 주소를 설정해주세요.</p>
                </div>
            `;
            return;
        }

        // 카카오맵 API 로드 및 초기화
        if (typeof kakao !== 'undefined' && kakao.maps) {
            const mapContainer = document.getElementById('map');
            const mapOption = {
                center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
                level: 3
            };
            
            const map = new kakao.maps.Map(mapContainer, mapOption);
            
            // 주소로 좌표 검색
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(userData.address, function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                    map.setCenter(coords);
                    
                    // 마커 표시
                    const marker = new kakao.maps.Marker({
                        map: map,
                        position: coords
                    });
                    
                    // 주변 음식점 검색
                    searchNearbyRestaurants(map, coords);
                }
            });
        } else {
            document.getElementById('modal-right').innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <h4>지도 로딩 중...</h4>
                    <p>잠시 후 다시 시도해주세요.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('지도 초기화 중 오류:', error);
        document.getElementById('modal-right').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>지도 로딩 실패</h4>
                <p>네트워크 연결을 확인해주세요.</p>
            </div>
        `;
    }
}

// 주변 음식점 검색
function searchNearbyRestaurants(map, coords) {
    const ps = new kakao.maps.services.Places();
    
    ps.keywordSearch('음식점', function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            const bounds = new kakao.maps.LatLngBounds();
            
            for (let i = 0; i < Math.min(data.length, 10); i++) {
                const place = data[i];
                const placePosition = new kakao.maps.LatLng(place.y, place.x);
                
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
        }
    }, {
        location: coords,
        radius: 1000
    });
}