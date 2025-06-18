document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.recommender-container')) {
        checkLoginStatus();
        setupModal(); // 모달 설정 함수 호출
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
    const loadingSpinner = document.getElementById('loading-spinner');

    // 모든 옵션 로드
    Promise.all([
        populateCheckboxes('/api/options/categories', 'categories-container', 'Category', 'Category', 'category'),
        populateCheckboxes('/api/options/needs', 'needs-container', 'NeedID', 'NeedKor', 'need'),
        populateCheckboxes('/api/options/goals', 'goals-container', 'GoalID', 'GoalKor', 'goal'),
        populateCheckboxes('/api/options/weathers', 'weathers-container', 'WeatherID', 'WeatherKor', 'weather')
    ]).catch(error => {
        console.error("체크박스 생성 중 오류 발생:", error);
        resultsContainer.innerHTML = '<div class="result-card"><h3>추천 옵션을 불러오는 데 실패했습니다. 페이지를 새로고침 해주세요.</h3></div>';
    });

    // 레인지 슬라이더 설정
    setupRangeSlider('kcal-slider', 'kcal-value', ' kcal', 2000, '상관없음');
    setupRangeSlider('price-slider', 'price-value', ' 원', 50000, '상관없음');

    // 추천 버튼 이벤트 리스너
    getBtn.addEventListener('click', async () => {
        const selectedCategories = getCheckedValues('category').filter(id => id !== 'none');
        const selectedNeeds = getCheckedValues('need').filter(id => id !== 'none');
        const selectedGoals = getCheckedValues('goal').filter(id => id !== 'none');
        const selectedWeathers = getCheckedValues('weather').filter(id => id !== 'none');
        const maxKcal = document.getElementById('kcal-slider').value;
        const maxPrice = document.getElementById('price-slider').value;

        loadingSpinner.style.display = 'block';
        resultsContainer.innerHTML = '';

        try {
            const queryParams = new URLSearchParams({
                category: selectedCategories.join(','),
                need: selectedNeeds.join(','),
                goal: selectedGoals.join(','),
                weather: selectedWeathers.join(','),
                max_kcal: maxKcal,
                max_price: maxPrice,
            });

            const response = await fetch(`http://localhost:5000/api/recommend?${queryParams}`);
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);

            const recommendations = await response.json();
            displayRecommendations(recommendations);
        } catch (error) {
            console.error('추천 메뉴를 가져오는 데 실패했습니다:', error);
            resultsContainer.innerHTML = '<div class="result-card"><h3>추천 메뉴를 불러오는 데 실패했습니다. 다시 시도해주세요.</h3></div>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });
}

// 레인지 슬라이더 설정
function setupRangeSlider(sliderId, valueId, unit, maxValue, defaultText) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(valueId);
    
    if (!slider || !valueDisplay) return;

    const updateValue = () => {
        if (parseInt(slider.value) === maxValue) {
            valueDisplay.textContent = defaultText;
        } else {
            valueDisplay.textContent = `~ ${parseInt(slider.value).toLocaleString()}${unit}`;
        }
    };

    slider.addEventListener('input', updateValue);
    updateValue();
}

// 체크박스 옵션 생성
async function populateCheckboxes(url, containerId, valueKey, textKey, name) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const fragment = document.createDocumentFragment();

    try {
        const response = await fetch(`http://localhost:5000${url}`);
        if (!response.ok) throw new Error('옵션을 가져오지 못했습니다.');

        const options = await response.json();

        // 상관없음 옵션 추가
        addIrrelevantOption(fragment, container, name);

        options.forEach(option => {
            const wrapper = document.createElement('div');
            wrapper.classList.add('checkbox-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            const optionValue = option[valueKey];
            checkbox.id = `${name}-${optionValue}`;
            checkbox.name = name;
            checkbox.value = optionValue;

            const label = document.createElement('label');
            label.htmlFor = `${name}-${optionValue}`;
            label.textContent = option[textKey];

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const irrelevantCheckbox = container.querySelector(`input[value="none"]`);
                    if (irrelevantCheckbox) {
                        irrelevantCheckbox.checked = false;
                        const otherCheckboxes = container.querySelectorAll(`input[name="${name}"]:not([value="none"])`);
                        otherCheckboxes.forEach(cb => cb.disabled = false);
                    }
                }
            });

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            fragment.appendChild(wrapper);
        });

        container.appendChild(fragment);
    } catch (error) {
        console.error(`${url}에서 옵션을 가져오지 못했습니다:`, error);
        container.innerHTML = '<div>옵션을 불러올 수 없습니다.</div>';
        throw error;
    }
}

// 상관없음 옵션 추가
function addIrrelevantOption(fragment, container, name) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('checkbox-item', 'irrelevant-option');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `${name}-none`;
    checkbox.name = name;
    checkbox.value = 'none';

    const label = document.createElement('label');
    label.htmlFor = `${name}-none`;
    label.textContent = '상관없음';

    checkbox.addEventListener('change', (e) => {
        const otherCheckboxes = container.querySelectorAll(`input[name="${name}"]:not([value="none"])`);
        if (e.target.checked) {
            otherCheckboxes.forEach(cb => {
                cb.checked = false;
                cb.disabled = true;
            });
        } else {
            otherCheckboxes.forEach(cb => {
                cb.disabled = false;
            });
        }
    });

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    fragment.appendChild(wrapper);
}

// 체크된 값들 가져오기
function getCheckedValues(name) {
    const checkedBoxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkedBoxes).map(cb => cb.value);
}

// === 단순화된 추천 결과 표시 및 지도 연동 ===
async function displayRecommendations(items) {
    const modal = document.getElementById('recommendation-modal');
    const modalLeft = document.getElementById('modal-left');
    const resultsContainer = document.getElementById('recommendation-results');
    
    resultsContainer.innerHTML = '';

    if (!items || items.length === 0) {
        resultsContainer.innerHTML = `
            <div class="result-card">
                <h3>아쉽게도 조건에 맞는 메뉴를 찾지 못했어요. 😥</h3>
                <p>다른 조건으로 다시 시도해보세요!</p>
            </div>`;
        return;
    }

    const item = items[0];

    // 모달 왼쪽 컨텐츠 채우기
    modalLeft.innerHTML = `
        <img src="${item.imagePath || 'image/food-icon.png'}" 
             alt="${item.MenuKor}"
             onerror="this.src='image/food-icon.png'; this.onerror=null;"
             style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">
        <h3>${item.MenuKor}</h3>
        <div class="menu-info">
            <p><strong>카테고리:</strong> ${item.Category}</p>
            <p><strong>칼로리:</strong> ${item.kcal} kcal</p>
            <p><strong>예상 가격:</strong> ${item.Price.toLocaleString()} 원</p>
        </div>
    `;

    // 사용자 정보 가져오기 및 단순화된 지도 검색 시작
    try {
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
            throw new Error('사용자 정보 조회에 실패했습니다.');
        }
        const userData = await userResponse.json();

        if (userData && userData.address) {
            // 단순화된 메뉴 검색 시스템 초기화
            initializeSimpleMenuSearch(userData.address, item.MenuKor);
        } else {
            document.getElementById('map').innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    <h4>지도를 표시할 수 없습니다</h4>
                    <p>정확한 위치 기반 검색을 위해<br>
                    <a href="/myprofile.html" style="color: #ff6f61; text-decoration: underline;">
                    마이페이지</a>에서 주소를 설정해주세요.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('사용자 정보 조회 또는 지도 로딩 실패:', error);
        document.getElementById('map').innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                <h4>일시적인 오류가 발생했습니다</h4>
                <p>잠시 후 다시 시도해주세요.</p>
            </div>
        `;
    }

    // 모달 표시
    modal.style.display = 'block';
}

// === 단순화된 메뉴 검색 시스템 (실시간 검색 비활성화) ===
function initializeSimpleMenuSearch(address, menuName) {
    kakao.maps.load(() => {
        const geocoder = new kakao.maps.services.Geocoder();
        
        // 주소를 좌표로 변환
        geocoder.addressSearch(address, function(result, status) {
            if (status === kakao.maps.services.Status.OK) {
                const userCoords = new kakao.maps.LatLng(result[0].y, result[0].x);
                
                // 단일 검색만 실행 (실시간 검색 비활성화)
                searchRestaurantsByRadius(userCoords, menuName, 3000); // 3km로 확대
                
            } else {
                console.error('주소를 좌표로 변환하는데 실패했습니다.');
                // 기본 위치로 지도 표시
                const defaultCoords = new kakao.maps.LatLng(37.5665, 126.9780);
                searchRestaurantsByRadius(defaultCoords, menuName, 5000); // 기본 위치에서는 5km
            }
        });
    });
}

// === 단일 좌표 기반 반경 검색 구현 ===
function searchRestaurantsByRadius(userCoords, menuName, radius = 3000) {
    const mapContainer = document.getElementById('map');
    const map = new kakao.maps.Map(mapContainer, {
        center: userCoords,
        level: 6
    });
    
    // 사용자 위치 마커 표시
    const userMarkerImage = new kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
        new kakao.maps.Size(24, 35)
    );
    
    const userMarker = new kakao.maps.Marker({
        map: map,
        position: userCoords,
        image: userMarkerImage
    });
    
    const userInfowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;color:#0066cc;font-weight:bold;">내 위치</div>`
    });
    userInfowindow.open(map, userMarker);
    
    // 메뉴명만으로 키워드 검색
    const ps = new kakao.maps.services.Places();
    
    // 1차: 메뉴명으로만 키워드 검색
    ps.keywordSearch(menuName, function(data, status) {
        if (status === kakao.maps.services.Status.OK && data.length > 0) {
            displayRestaurantsWithDistance(data, map, userCoords);
        } else {
            // 2차: 메뉴명 + "맛집"으로 검색
            ps.keywordSearch(`${menuName} 맛집`, function(data2, status2) {
                if (status2 === kakao.maps.services.Status.OK && data2.length > 0) {
                    displayRestaurantsWithDistance(data2, map, userCoords);
                } else {
                    // 3차: 메뉴명 + "전문점"으로 검색
                    ps.keywordSearch(`${menuName} 전문점`, function(data3, status3) {
                        if (status3 === kakao.maps.services.Status.OK && data3.length > 0) {
                            displayRestaurantsWithDistance(data3, map, userCoords);
                        } else {
                            // 최종 대안: 일반 "음식점"으로 검색
                            ps.keywordSearch('음식점', function(data4, status4) {
                                if (status4 === kakao.maps.services.Status.OK) {
                                    displayRestaurantsWithDistance(data4.slice(0, 10), map, userCoords);
                                } else {
                                    // 검색 실패 메시지 표시
                                    const errorInfowindow = new kakao.maps.InfoWindow({
                                        content: `<div style="padding:10px;font-size:12px;color:#ff0000;">
                                            "${menuName}" 관련 식당을 찾을 수 없습니다.<br>
                                            다른 메뉴를 추천받아보세요.
                                        </div>`
                                    });
                                    errorInfowindow.open(map);
                                }
                            }, {
                                location: userCoords,
                                radius: radius
                            });
                        }
                    }, {
                        location: userCoords,
                        radius: radius
                    });
                }
            }, {
                location: userCoords,
                radius: radius
            });
        }
    }, {
        location: userCoords,
        radius: radius
    });
}

// === 거리 계산 함수 ===
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

// === 거리 포맷팅 함수 ===
function formatDistance(distance) {
    if (distance < 1) {
        return Math.round(distance * 1000) + 'm';
    } else {
        return distance.toFixed(1) + 'km';
    }
}

// === 거리 정보와 함께 식당 표시 ===
function displayRestaurantsWithDistance(restaurants, map, userCoords) {
    const bounds = new kakao.maps.LatLngBounds();
    
    // 사용자 위치도 bounds에 포함
    if (userCoords) {
        bounds.extend(userCoords);
    }

    restaurants.forEach(restaurant => {
        const marker = new kakao.maps.Marker({
            map: map,
            position: new kakao.maps.LatLng(restaurant.y, restaurant.x)
        });

        // 거리 계산
        let distanceText = '';
        if (userCoords) {
            const distance = calculateDistance(
                userCoords.getLat(), 
                userCoords.getLng(), 
                parseFloat(restaurant.y), 
                parseFloat(restaurant.x)
            );
            distanceText = `<br><span style="color:#666;font-size:11px;">거리: ${formatDistance(distance)}</span>`;
        }

        // 인포윈도우 생성
        const infowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:8px;font-size:12px;line-height:1.4;">
                        <strong>${restaurant.place_name}</strong><br>
                        <span style="color:#666;font-size:11px;">${restaurant.road_address_name || restaurant.address_name}</span>
                        ${distanceText}
                      </div>`,
            zIndex: 1
        });

        // 마커 클릭 이벤트
        kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
        });

        bounds.extend(new kakao.maps.LatLng(restaurant.y, restaurant.x));
    });
    
    // 지도 범위 조정
    map.setBounds(bounds);
}

// === 모달 닫기 기능 설정 ===
function setupModal() {
    const modal = document.getElementById('recommendation-modal');
    const closeBtn = document.querySelector('.close-button');

    // 닫기 버튼 클릭 시
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        }
    }

    // 모달 바깥 영역 클릭 시
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}
