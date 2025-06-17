document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.recommender-container')) {
        checkLoginStatus();
    }
});

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

function initializeRecommender() {
    const getBtn = document.getElementById('get-recommendation-btn');
    const resultsContainer = document.getElementById('recommendation-results');
    const loadingSpinner = document.getElementById('loading-spinner');

    Promise.all([
        populateCheckboxes('/api/options/categories', 'categories-container', 'Category', 'Category', 'category'),
        populateCheckboxes('/api/options/needs', 'needs-container', 'NeedID', 'NeedKor', 'need'),
        populateCheckboxes('/api/options/goals', 'goals-container', 'GoalID', 'GoalKor', 'goal'),
        populateCheckboxes('/api/options/weathers', 'weathers-container', 'WeatherID', 'WeatherKor', 'weather')
    ]).catch(error => {
        console.error("체크박스 생성 중 오류 발생:", error);
        resultsContainer.innerHTML = '<p>추천 옵션을 불러오는 데 실패했습니다. 페이지를 새로고침 해주세요.</p>';
    });

    setupRangeSlider('kcal-slider', 'kcal-value', ' kcal', 2000, '상관없음');
    setupRangeSlider('price-slider', 'price-value', ' 원', 50000, '상관없음');

    getBtn.addEventListener('click', async () => {
        const selectedCategories = getCheckedValues('category').filter(id => id !== 'none');
        const selectedNeeds = getCheckedValues('need').filter(id => id !== 'none');
        const selectedGoals = getCheckedValues('goal').filter(id => id !== 'none');
        // === 이 부분 수정: 날씨도 '상관없음' 값을 필터링 ===
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
            resultsContainer.innerHTML = '<p>추천 메뉴를 불러오는 데 실패했습니다. 다시 시도해주세요.</p>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });
}

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

async function populateCheckboxes(url, containerId, valueKey, textKey, name) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const fragment = document.createDocumentFragment();
    try {
        const response = await fetch(`http://localhost:5000${url}`);
        if (!response.ok) throw new Error('옵션을 가져오지 못했습니다.');
        
        const options = await response.json();

        // === 이 부분 수정: '상관없음' 옵션을 모든 필터에 추가 ===
        // 기존의 `if (name !== 'weather')` 조건을 제거하여 날씨를 포함한 모든 체크박스 그룹에 적용
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
        container.innerHTML = '옵션을 불러올 수 없습니다.';
        throw error;
    }
}

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

function getCheckedValues(name) {
    const checkedBoxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkedBoxes).map(cb => cb.value);
}

function displayRecommendations(items) {
    const container = document.getElementById('recommendation-results');
    container.innerHTML = '';
    if (!items || items.length === 0) {
        container.innerHTML = `<div class="no-results"><p>아쉽게도 조건에 맞는 메뉴를 찾지 못했어요. 😥</p><p>다른 조건으로 다시 시도해보세요!</p></div>`;
        return;
    }
    const cardGrid = document.createElement('div');
    cardGrid.className = 'card-grid';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <img src="${item.imagePath || 'placeholder.jpg'}" alt="${item.MenuKor}" class="card-img">
            <div class="card-body">
                <h3 class="card-title">${item.MenuKor}</h3>
                <p class="card-info">${item.Category} | ${item.kcal} kcal | ${item.Price.toLocaleString()}원</p>
            </div>
        `;
        cardGrid.appendChild(card);
    });
    container.appendChild(cardGrid);
}
