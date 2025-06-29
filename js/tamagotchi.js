document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 세션 확인
        const response = await fetch('/api/check-session');
        const data = await response.json();
        if (!data.loggedIn) {
            alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/intro.html';
            return;
        }

        await loadUserData();

    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
        alert('서버와 통신할 수 없습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/intro.html';
        return;
    }

    const petshopBtn = document.querySelector('.petshop-btn');
    if (petshopBtn) {
        petshopBtn.addEventListener('click', openPetshopModal);
    }
    
    // 모달 닫기 이벤트 리스너
    const modal = document.getElementById('petshop-modal-overlay');
    const closeBtn = document.querySelector('.petshop-close-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePetshopModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePetshopModal();
            }
        });
    }
});

async function loadUserData() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            throw new Error('사용자 정보를 가져올 수 없습니다.');
        }

        const userData = await response.json();
        if (!userData) {
            throw new Error('사용자 데이터가 없습니다.');
        }

        // current-stats 영역 업데이트
        updateCurrentStats(userData);

        return userData;
    } catch (error) {
        console.error('사용자 데이터 로드 실패:', error);
        alert('사용자 정보를 불러오는데 실패했습니다.');
    }
}

// current-stats 영역 업데이트 함수
function updateCurrentStats(userData) {
    // 보유 포인트 업데이트
    const pointElement = document.querySelector('.current-stats .stat-item:nth-child(1) .stat-value');
    if (pointElement) {
        pointElement.textContent = (userData.point || 0).toLocaleString();
    }

    // 현재 레벨 업데이트
    const levelElement = document.querySelector('.current-stats .stat-item:nth-child(2) .stat-value');
    if (levelElement) {
        levelElement.textContent = userData.level || 1;
    }

    // 경험치 업데이트
    const expElement = document.querySelector('.current-stats .stat-item:nth-child(3) .stat-value-with-progress .stat-value');
    if (expElement) {
        const currentExp = userData.experience || 0;
        const requiredExp = userData.required_exp || 100;
        
        expElement.textContent = `${currentExp.toLocaleString()} / ${requiredExp.toLocaleString()}`;
    }

    // 경험치 진행률 바 업데이트
    const expProgressElement = document.querySelector('.current-stats .exp-progress-fill');
    if (expProgressElement) {
        const currentExp = userData.experience || 0;
        const requiredExp = userData.required_exp || 100;
        const progressPercent = Math.min((currentExp / requiredExp) * 100, 100);
        
        expProgressElement.style.width = `${progressPercent}%`;
    }
}

async function openPetshopModal() {
    const modal = document.getElementById('petshop-modal-overlay');
    const petGrid = document.getElementById('petshop-grid');
    
    // 모달 표시
    modal.style.display = 'block';
    
    // 로딩 표시
    petGrid.innerHTML = `
        <div class="petshop-loading">
            <div class="petshop-loading-spinner"></div>
            <span>펫 정보를 불러오는 중...</span>
        </div>
    `;
    
    try {
        // 사용자 정보와 펫 데이터 동시 로드
        const [userResponse, petsResponse] = await Promise.all([
            fetch('/api/user'),
            fetch('/api/pets')
        ]);
        
        const userData = await userResponse.json();
        const petsData = await petsResponse.json();
        
        if (petsData.success) {
            displayPetshopPets(petsData.pets, userData.level || 1);
        } else {
            petGrid.innerHTML = `
                <div class="petshop-loading">
                    <span>펫 정보를 불러올 수 없습니다.</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('펫 데이터 로드 실패:', error);
        petGrid.innerHTML = `
            <div class="petshop-loading">
                <span>펫 정보를 불러올 수 없습니다.</span>
            </div>
        `;
    }
}

// 펫 분양소 모달 닫기
function closePetshopModal() {
    const modal = document.getElementById('petshop-modal-overlay');
    modal.style.display = 'none';
}

// 펫 목록 표시
function displayPetshopPets(pets, userLevel) {
    const petGrid = document.getElementById('petshop-grid');
    
    if (!pets || pets.length === 0) {
        petGrid.innerHTML = `
            <div class="petshop-loading">
                <span>등록된 펫이 없습니다.</span>
            </div>
        `;
        return;
    }
    
    const petCards = pets.map(pet => {
        const isLocked = userLevel < pet.unlock_level;
        
        return `
            <div class="petshop-card ${isLocked ? 'petshop-locked' : ''}" data-pet-id="${pet.id}">
                <div class="petshop-image-container">
                    <img src="${pet.pet_image_path}" alt="${pet.pet_name}" class="petshop-pet-image" 
                         onerror="this.src='image/pet/default.png'">
                    <div class="petshop-level-badge ${isLocked ? 'petshop-locked-badge' : ''}">
                        Lv.${pet.unlock_level}
                    </div>
                </div>
                
                <div class="petshop-info">
                    <h3 class="petshop-pet-name">${pet.pet_name}</h3>
                    <p class="petshop-pet-description">${pet.pet_description || '특별한 펫입니다.'}</p>
                    
                    <div class="petshop-stats">
                        <div class="petshop-stat-item">
                            <div class="petshop-stat-label">배고픔</div>
                            <div class="petshop-stat-value petshop-hunger">${pet.hunger_max_requirement}</div>
                        </div>
                        <div class="petshop-stat-item">
                            <div class="petshop-stat-label">건강도</div>
                            <div class="petshop-stat-value petshop-health">${pet.health_max_requirement}</div>
                        </div>
                        <div class="petshop-stat-item">
                            <div class="petshop-stat-label">행복도</div>
                            <div class="petshop-stat-value petshop-happiness">${pet.happiness_max_requirement}</div>
                        </div>
                        <div class="petshop-stat-item">
                            <div class="petshop-stat-label">레벨 제한</div>
                            <div class="petshop-stat-value">${pet.unlock_level}</div>
                        </div>
                    </div>
                    
                    <div class="petshop-exp-reward">
                        🌟 완료 시 ${pet.completion_exp_reward.toLocaleString()}exp 획득
                    </div>
                    
                    <button class="petshop-select-btn" 
                            ${isLocked ? 'disabled' : ''} 
                            onclick="selectPetFromShop(${pet.id}, '${pet.pet_name}')">
                        ${isLocked ? `레벨 ${pet.unlock_level} 필요` : '이 펫 선택하기'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    petGrid.innerHTML = petCards;
}

// 펫 선택 함수
async function selectPetFromShop(petId, petName) {
    if (confirm(`${petName}을(를) 선택하시겠습니까?`)) {
        try {
            const response = await fetch('/api/user/select-pet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ petId: petId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`${petName}이(가) 선택되었습니다!`);
                closePetshopModal();
                // 페이지 새로고침하여 선택된 펫 반영
                window.location.reload();
            } else {
                alert(result.message || '펫 선택에 실패했습니다.');
            }
        } catch (error) {
            console.error('펫 선택 오류:', error);
            alert('펫 선택 중 오류가 발생했습니다.');
        }
    }
}