// menu.js 파일 하단에 추가

// 페이지가 완전히 로드된 후 추천 시스템 관련 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    // 추천 컨테이너가 페이지에 존재하는 경우에만 초기화 함수를 실행합니다.
    if (document.querySelector('.recommender-container')) {
        initializeRecommender();
    }
});

// 추천 시스템의 모든 기능을 초기화하고 이벤트 리스너를 설정하는 함수
function initializeRecommender() {
    const needSelect = document.getElementById('need-select');
    const goalSelect = document.getElementById('goal-select');
    const weatherSelect = document.getElementById('weather-select');
    const getBtn = document.getElementById('get-recommendation-btn');
    const resultsContainer = document.getElementById('recommendation-results');
    const loadingSpinner = document.getElementById('loading-spinner');

    // 서버 API를 호출하여 각 드롭다운의 옵션을 동적으로 채웁니다.
    // 백엔드에 해당 API(/api/options/...)가 구현되어 있어야 합니다.
    populateSelect('/api/options/needs', needSelect, 'NeedID', 'NeedKor');
    populateSelect('/api/options/goals', goalSelect, 'GoalID', 'GoalKor');
    populateSelect('/api/options/weathers', weatherSelect, 'WeatherID', 'WeatherKor');

    // '추천받기' 버튼 클릭 이벤트
    getBtn.addEventListener('click', async () => {
        const selectedNeed = needSelect.value;
        const selectedGoal = goalSelect.value;
        const selectedWeather = weatherSelect.value;

        if (!selectedNeed || !selectedGoal || !selectedWeather) {
            alert('모든 조건을 선택해주세요!');
            return;
        }

        // 로딩 시작
        loadingSpinner.style.display = 'block';
        resultsContainer.innerHTML = '';

        try {
            const response = await fetch(`http://localhost:5000/api/recommend?need=${selectedNeed}&goal=${selectedGoal}&weather=${selectedWeather}`);
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
            const recommendations = await response.json();
            displayRecommendations(recommendations);
        } catch (error) {
            console.error('추천 메뉴를 가져오는 데 실패했습니다:', error);
            resultsContainer.innerHTML = '<p>추천 메뉴를 불러오는 데 실패했습니다. 서버 상태를 확인하거나 다시 시도해주세요.</p>';
        } finally {
            // 로딩 종료
            loadingSpinner.style.display = 'none';
        }
    });
}

// 서버에서 데이터를 받아와 <select> 태그의 <option>을 채우는 범용 함수
async function populateSelect(apiUrl, selectEl, valueKey, textKey) {
    try {
        const response = await fetch(`http://localhost:5000${apiUrl}`);
        if (!response.ok) throw new Error('API 호출 실패');
        const options = await response.json();

        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option[valueKey];
            optionEl.textContent = option[textKey];
            selectEl.appendChild(optionEl);
        });
    } catch (error) {
        console.error(`${apiUrl}에서 옵션을 가져오지 못했습니다:`, error);
        // 에러 발생 시 사용자에게 알림 (선택적)
        const errorOption = document.createElement('option');
        errorOption.textContent = '목록 로딩 실패';
        errorOption.disabled = true;
        selectEl.appendChild(errorOption);
    }
}

// 추천받은 메뉴 목록을 화면에 표시하는 함수
function displayRecommendations(items) {
    const container = document.getElementById('recommendation-results');
    container.innerHTML = '';

    if (!items || items.length === 0) {
        container.innerHTML = '<p style="font-weight: bold; color: #555;">아쉽게도 조건에 맞는 메뉴를 찾지 못했어요. 😥<br>다른 조건으로 다시 시도해보세요!</p>';
        return;
    }

    items.forEach(item => {
        // 기존 게시물 카드 생성 함수(createCard)가 있다면 재사용하는 것이 좋습니다.
        // 없다면 아래 코드를 사용하여 카드를 생성합니다.
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${item.imagePath}" alt="${item.MenuKor}" style="width:100%; height:200px; object-fit:cover;">
            <div class="card-body">
                <h5 class="card-title">${item.MenuKor}</h5>
                <p class="card-text">${item.Category} | ${item.kcal} kcal</p>
            </div>
        `;
        // 카드를 클릭하면 상세 모달이 뜨도록 이벤트 리스너 추가
        card.addEventListener('click', () => {
             // displayPostModal 함수가 전역에 정의되어 있다고 가정합니다.
            if (typeof displayPostModal === 'function') {
                displayPostModal(item.MenuID);
            }
        });
        container.appendChild(card);
    });
}
