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
        resultsContainer.innerHTML = '<div class="ai-recommendation"><h3>⚠️ 오류 발생</h3><p>데이터 로드에 실패했습니다.</p></div>';
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

    // 자동 스크롤 함수
    function scrollToNextCheckboxGroup(currentContainerId) {
        const containerOrder = [
            'categories-container', 'needs-container', 'goals-container', 
            'season-container', 'weathers-container', 'times-container'
        ];
        
        const currentIndex = containerOrder.indexOf(currentContainerId);
        if (currentIndex >= 0 && currentIndex < containerOrder.length - 1) {
            const nextContainerId = containerOrder[currentIndex + 1];
            const nextContainer = document.getElementById(nextContainerId);
            if (nextContainer) {
                nextContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else if (currentIndex === containerOrder.length - 1) {
            // 마지막 그룹인 경우 추천 버튼으로 스크롤
            const recommendButton = document.getElementById('get-recommendation-btn');
            if (recommendButton) {
                recommendButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// 추천 요청 함수 (폴백 시스템 적용)
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

    console.log('[스마트 필터링 AI 추천 요청] 선택값:', {
        category: selectedCategories,
        need: selectedNeeds,
        goal: selectedGoals,
        season: selectedSeason,
        weather: selectedWeathers,
        time: selectedTimes,
        maxKcal,
        maxPrice,
        peopleCount,
        menuCount
    });

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
            displaySmartFilteredRecommendations(data);
        })
        .catch(error => {
            loadingSpinner.style.display = 'none';
            console.error('추천 요청 중 오류:', error);
            resultsContainer.innerHTML = `
                <div class="ai-recommendation">
                    <h3>⚠️ 오류 발생</h3>
                    <p>추천을 가져오는 중 오류가 발생했습니다.</p>
                </div>
            `;
        });
}

// 스마트 필터링된 추천 결과 표시 함수 (폴백 정보 포함)
function displaySmartFilteredRecommendations(data) {
    const resultsContainer = document.getElementById('recommendation-results');
    
    if (data.error && !data.gpt) {
        resultsContainer.innerHTML = `
            <div class="ai-recommendation">
                <h3>⚠️ 서비스 일시 중단</h3>
                <p>${data.error}</p>
                <p class="ai-note">잠시 후 다시 시도해주세요.</p>
            </div>
        `;
        return;
    }

    let recommendationHTML = `
        <div class="ai-recommendation">
            <h3>🤖 AI 메뉴 추천</h3>
    `;

    // 폴백 레벨에 따른 안내 메시지
    if (data.fallbackLevel && data.fallbackLevel !== 'none') {
        let fallbackMessage = '';
        let fallbackIcon = '';
        
        switch (data.fallbackLevel) {
            case 'light':
                fallbackIcon = '🔄';
                fallbackMessage = '일부 조건을 완화하여 더 많은 메뉴를 찾았습니다.';
                break;
            case 'moderate':
                fallbackIcon = '⚡';
                fallbackMessage = '조건을 상당히 완화하여 추천 메뉴를 확보했습니다.';
                break;
            case 'heavy':
                fallbackIcon = '🎯';
                fallbackMessage = '핵심 조건만 적용하여 추천합니다.';
                break;
        }
        
        if (fallbackMessage) {
            recommendationHTML += `
                <div class="fallback-notice" style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0; font-size: 0.9em; opacity: 0.9;">
                        ${fallbackIcon} ${fallbackMessage}
                    </p>
                </div>
            `;
        }
    }

    recommendationHTML += `<div class="ai-response">${data.gpt.replace(/\n/g, '<br>')}</div>`;

    // 추천된 메뉴가 있는 경우 상세 정보 표시
    if (data.menus && data.menus.length > 0) {
        recommendationHTML += '<div class="recommended-menus">';
        data.menus.forEach(menu => {
            recommendationHTML += `
                <div class="menu-card" onclick="showMenuDetail(${menu.MenuID})">
                    <h4>${menu.MenuKor}</h4>
                    <p><strong>카테고리:</strong> ${menu.Category || '정보 없음'}</p>
                    <p><strong>칼로리:</strong> ${menu.kcal || '정보 없음'}kcal</p>
                    <p><strong>가격:</strong> ${menu.Price ? menu.Price.toLocaleString() + '원' : '정보 없음'}</p>
                    ${menu.imagePath ? `<img src="${menu.imagePath}" alt="${menu.MenuKor}" style="width: 100%; max-width: 200px; border-radius: 8px; margin-top: 10px;">` : ''}
                </div>
            `;
        });
        recommendationHTML += '</div>';
    }

    // 필터링 정보 표시
    let filteringInfo = '';
    if (data.totalFiltered !== undefined) {
        filteringInfo += `총 ${data.totalFiltered}개 메뉴 중에서 추천`;
        
        if (data.optimizedCount && data.optimizedCount !== data.totalFiltered) {
            filteringInfo += ` (GPT 분석: ${data.optimizedCount}개)`;
        }
        
        if (data.promptLength) {
            filteringInfo += ` | 프롬프트: ${data.promptLength}자`;
        }
    }

    recommendationHTML += `
            <p class="ai-note">
                💡 ${filteringInfo || '스마트 필터링으로 최적화된 추천입니다.'}
            </p>
        </div>
    `;

    resultsContainer.innerHTML = recommendationHTML;
}

// 지도 관련 변수들 (한 번만 초기화되도록 수정)
let mapInitialized = false;
let kakaoMap = null;
let userMarker = null;
let restaurantMarkers = [];

// 메뉴 상세 정보 표시 함수 (지도 로직 수정)
function showMenuDetail(menuId) {
    console.log('메뉴 상세 정보 요청:', menuId);
    
    const modal = document.getElementById('menu-detail-modal');
    
    // 메뉴 상세 정보 가져오기
    fetch(`/api/menu/${menuId}`)
        .then(response => response.json())
        .then(menuData => {
            if (menuData.error) {
                alert('메뉴 정보를 가져오는데 실패했습니다.');
                return;
            }
            
            // 모달 내용 업데이트
            document.getElementById('modal-menu-title').textContent = menuData.MenuKor;
            document.getElementById('modal-menu-category').textContent = menuData.Category || '정보 없음';
            document.getElementById('modal-menu-kcal').textContent = menuData.kcal ? `${menuData.kcal}kcal` : '정보 없음';
            document.getElementById('modal-menu-price').textContent = menuData.Price ? `${menuData.Price.toLocaleString()}원` : '정보 없음';
            
            // 이미지 표시
            const modalImage = document.getElementById('modal-menu-image');
            if (menuData.imagePath) {
                modalImage.src = menuData.imagePath;
                modalImage.alt = menuData.MenuKor;
                modalImage.style.display = 'block';
            } else {
                modalImage.style.display = 'none';
            }
            
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

// 지도 초기화 함수 (한 번만 실행되도록 수정)
function initializeMapOnce(menuName) {
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
    
    // 사용자 위치 가져오기
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // 지도 옵션 설정
                const mapOption = {
                    center: new kakao.maps.LatLng(lat, lng),
                    level: 3
                };
                
                // 지도 생성
                kakaoMap = new kakao.maps.Map(mapContainer, mapOption);
                mapInitialized = true;
                
                // 사용자 위치 마커 생성
                createUserLocationMarker(lat, lng);
                
                // 주변 식당 검색 (처음 한 번만)
                searchNearbyRestaurants(menuName);
                
                console.log('지도 초기화 완료 및 주변 식당 검색 실행');
            },
            (error) => {
                console.error('위치 정보를 가져올 수 없습니다:', error);
                
                // 기본 위치로 지도 생성 (서울 시청)
                const defaultMapOption = {
                    center: new kakao.maps.LatLng(37.5665, 126.9780),
                    level: 3
                };
                
                kakaoMap = new kakao.maps.Map(mapContainer, defaultMapOption);
                mapInitialized = true;
                
                // 기본 위치에서 식당 검색
                searchNearbyRestaurants(menuName);
            }
        );
    } else {
        console.error('이 브라우저는 Geolocation을 지원하지 않습니다.');
        
        // 기본 위치로 지도 생성
        const defaultMapOption = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 3
        };
        
        kakaoMap = new kakao.maps.Map(mapContainer, defaultMapOption);
        mapInitialized = true;
        
        searchNearbyRestaurants(menuName);
    }
}

// 사용자 위치 마커 생성
function createUserLocationMarker(lat, lng) {
    if (!kakaoMap) return;
    
    const userPosition = new kakao.maps.LatLng(lat, lng);
    
    // 기존 사용자 마커 제거
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    // 사용자 위치 마커 생성
    userMarker = new kakao.maps.Marker({
        position: userPosition,
        map: kakaoMap
    });
    
    // 사용자 위치 정보창
    const userInfoWindow = new kakao.maps.InfoWindow({
        content: '<div class="myLocDiv"><div class="myLoc">내 위치</div><div class="myLocAddress">현재 위치</div></div>',
        removable: false
    });
    
    userInfoWindow.open(kakaoMap, userMarker);
}

// 식당 마커들 정리 함수
function clearRestaurantMarkers() {
    restaurantMarkers.forEach(marker => {
        marker.setMap(null);
    });
    restaurantMarkers = [];
}

// 주변 식당 검색 함수 (처음 한 번만 실행)
function searchNearbyRestaurants(menuName) {
    if (!kakaoMap) {
        console.error('지도가 초기화되지 않았습니다.');
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
            console.log(`"${menuName}" 관련 식당 ${data.length}개 발견`);
            
            // 최대 10개 식당만 표시
            const limitedData = data.slice(0, 10);
            
            limitedData.forEach((place, index) => {
                const marker = new kakao.maps.Marker({
                    position: new kakao.maps.LatLng(place.y, place.x),
                    map: kakaoMap
                });
                
                const infoWindow = new kakao.maps.InfoWindow({
                    content: `
                        <div style="padding:8px; min-width:200px;">
                            <div style="font-weight:bold; margin-bottom:4px;">${place.place_name}</div>
                            <div style="font-size:12px; color:#666; margin-bottom:2px;">${place.category_name}</div>
                            <div style="font-size:12px; color:#666; margin-bottom:2px;">${place.road_address_name || place.address_name}</div>
                            <div style="font-size:12px; color:#666;">${place.phone || '전화번호 없음'}</div>
                        </div>
                    `,
                    removable: true
                });
                
                // 마커 클릭 이벤트
                kakao.maps.event.addListener(marker, 'click', () => {
                    infoWindow.open(kakaoMap, marker);
                });
                
                restaurantMarkers.push(marker);
            });
        } else {
            console.log(`"${menuName}" 관련 식당을 찾을 수 없습니다.`);
            
            // 일반 식당 검색으로 대체
            ps.keywordSearch('맛집', (data, status) => {
                if (status === kakao.maps.services.Status.OK) {
                    console.log(`일반 맛집 ${data.length}개 발견`);
                    
                    const limitedData = data.slice(0, 10);
                    
                    limitedData.forEach((place) => {
                        const marker = new kakao.maps.Marker({
                            position: new kakao.maps.LatLng(place.y, place.x),
                            map: kakaoMap
                        });
                        
                        const infoWindow = new kakao.maps.InfoWindow({
                            content: `
                                <div style="padding:8px; min-width:200px;">
                                    <div style="font-weight:bold; margin-bottom:4px;">${place.place_name}</div>
                                    <div style="font-size:12px; color:#666; margin-bottom:2px;">${place.category_name}</div>
                                    <div style="font-size:12px; color:#666; margin-bottom:2px;">${place.road_address_name || place.address_name}</div>
                                    <div style="font-size:12px; color:#666;">${place.phone || '전화번호 없음'}</div>
                                </div>
                            `,
                            removable: true
                        });
                        
                        kakao.maps.event.addListener(marker, 'click', () => {
                            infoWindow.open(kakaoMap, marker);
                        });
                        
                        restaurantMarkers.push(marker);
                    });
                }
            }, searchOptions);
        }
    }, searchOptions);
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