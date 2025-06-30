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

    // 액션 버튼 이벤트 리스너
    const feedBtn = document.querySelector('.food-btn');
    const careBtn = document.querySelector('.care-btn');
    const playBtn = document.querySelector('.play-btn');
    
    if (feedBtn) {
        feedBtn.addEventListener('click', handleFeedAction);
    }
    
    if (careBtn) {
        careBtn.addEventListener('click', handleCareAction);
    }
    
    if (playBtn) {
        playBtn.addEventListener('click', handlePlayAction);
    }
    
    // 펫 이름 편집 기능
    const petNameEditBtn = document.querySelector('.pet-name-edit-btn');
    if (petNameEditBtn) {
        petNameEditBtn.addEventListener('click', handlePetNameEdit);
    }

    const diaryBtn = document.querySelector('.diary-btn');
    if (diaryBtn) {
        diaryBtn.addEventListener('click', openDiaryModal);
        // 다이어리 버튼은 항상 활성화 상태로 설정
        diaryBtn.disabled = false;
        diaryBtn.style.opacity = '1';
        diaryBtn.style.cursor = 'pointer';
    }

    // 다이어리 모달 닫기 이벤트 리스너 추가
    const diaryModal = document.getElementById('diary-modal-overlay');
    const diaryCloseBtn = document.querySelector('.diary-close-btn');

    if (diaryCloseBtn) {
        diaryCloseBtn.addEventListener('click', closeDiaryModal);
    }

    if (diaryModal) {
        diaryModal.addEventListener('click', (e) => {
            if (e.target === diaryModal) {
                closeDiaryModal();
            }
        });
    }
});

async function loadUserData() {
    try {
        const [userResponse, tamagotchiResponse] = await Promise.all([
            fetch('/api/user'),
            fetch('/api/user/tamagotchi')
        ]);
        
        if (!userResponse.ok || !tamagotchiResponse.ok) {
            throw new Error('API 응답 오류');
        }
        
        const userData = await userResponse.json();
        const tamagotchiData = await tamagotchiResponse.json();
        
        console.log('서버에서 받은 다마고치 데이터:', tamagotchiData);
        
        if (!userData) {
            throw new Error('사용자 데이터가 없습니다.');
        }
        
        // current-stats 영역 업데이트
        updateCurrentStats(userData);
        
        // 다마고치 정보 업데이트
        if (tamagotchiData.success && tamagotchiData.tamagotchi) {
            console.log('다마고치 최대 스텟 확인:', {
                hunger_max: tamagotchiData.tamagotchi.hunger_max_requirement,
                health_max: tamagotchiData.tamagotchi.health_max_requirement,
                happiness_max: tamagotchiData.tamagotchi.happiness_max_requirement
            });
            updateTamagotchiDisplay(tamagotchiData.tamagotchi);
        } else {
            console.log('다마고치 데이터 없음');
            updateTamagotchiDisplay(null);
        }
        
        return { userData, tamagotchi: tamagotchiData.tamagotchi || null };
    } catch (error) {
        console.error('사용자 데이터 로드 실패:', error);
        alert('사용자 정보를 불러오는데 실패했습니다: ' + error.message);
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
    // 현재 키우는 펫이 있는지 먼저 확인
    const petStatus = await checkCurrentPet();
    
    if (petStatus.hasPet && !petStatus.isCompleted) {
        const confirmMessage = `현재 키우고 있는 펫이 있습니다.\n펫 이름: ${petStatus.petName}\n\n새로운 펫을 키우려면 현재 펫을 먼저 완성해야 합니다.\n\n그래도 펫 분양소를 보시겠습니까?`;
        
        if (!confirm(confirmMessage)) {
            return; // 사용자가 취소하면 모달을 열지 않음
        }
    }
    
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
        const [userResponse, petsResponse] = await Promise.all([
            fetch('/api/user'),
            fetch('/api/pets')
        ]);
        
        if (!userResponse.ok) {
            throw new Error(`사용자 정보 API 오류: ${userResponse.status}`);
        }
        
        if (!petsResponse.ok) {
            throw new Error(`펫 정보 API 오류: ${petsResponse.status}`);
        }
        
        const userData = await userResponse.json();
        const petsData = await petsResponse.json();
        
        if (!userData) {
            throw new Error('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        }
        
        const userLevel = userData.level || 1;
        
        if (petsData.success) {
            displayPetshopPets(petsData.pets, userLevel);
        } else {
            petGrid.innerHTML = `
                <div class="petshop-loading">
                    <span>펫 정보를 불러올 수 없습니다.</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('펫 데이터 로드 실패:', error);
        
        let errorMessage = '펫 정보를 불러올 수 없습니다.';
        
        if (error.message.includes('401')) {
            errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
            setTimeout(() => {
                window.location.href = '/intro.html';
            }, 2000);
        } else if (error.message.includes('500')) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        
        petGrid.innerHTML = `
            <div class="petshop-loading">
                <span>${errorMessage}</span>
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
                        🌟 완성 시 ${pet.completion_exp_reward.toLocaleString()}exp 획득
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

// 펫 선택 함수 수정
async function selectPetFromShop(petId, petName) {
    if (confirm(`${petName}을(를) 선택하시겠습니까?\n\n새로운 펫을 선택하면 스텟이 0부터 시작됩니다.`)) {
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
                await loadUserData();
            } else {
                // 이미 키우고 있는 펫이 있는 경우 특별한 처리
                if (result.hasExistingPet) {
                    alert(`⚠️ ${result.message}`);
                } else {
                    alert(result.message || '펫 선택에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('펫 선택 오류:', error);
            alert('펫 선택 중 오류가 발생했습니다.');
        }
    }
}

// 다마고치 디스플레이 업데이트 함수
function updateTamagotchiDisplay(tamagotchi) {
    console.log('다마고치 디스플레이 업데이트:', tamagotchi);
    
    if (!tamagotchi) {
        showNoPetMessage();
        return;
    }
    
    // 펫 정보 표시 영역 복원 (no-pet-container가 있는 경우)
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay.querySelector('.no-pet-container')) {
        showPetDisplay();
    }
    
    // 펫 이름 업데이트
    const petNameElement = document.querySelector('.pet-name');
    if (petNameElement) {
        petNameElement.textContent = tamagotchi.pet_name || '내 다마고치';
    }
    
    // 펫 이미지 업데이트
    const petImageElement = document.querySelector('.pet-image');
    if (petImageElement && tamagotchi.pet_image_path) {
        petImageElement.src = tamagotchi.pet_image_path;
        petImageElement.alt = tamagotchi.pet_name || '다마고치';
        petImageElement.onerror = function() {
            this.src = 'image/pet/default.png';
        };
    }
    
    // 펫 타입별 최대값 가져오기
    const hungerMax = tamagotchi.hunger_max_requirement || 100;
    const healthMax = tamagotchi.health_max_requirement || 100;
    const happinessMax = tamagotchi.happiness_max_requirement || 100;
    
    // 상태 바 업데이트
    updateStatusBar('hunger', tamagotchi.hunger, hungerMax);
    updateStatusBar('health', tamagotchi.health, healthMax);
    updateStatusBar('happiness', tamagotchi.happiness, happinessMax);
    
    // 액션 버튼 상태 업데이트
    updateActionButtonsState(tamagotchi);
    
    // 펫 완성 체크
    if (checkPetCompletion(tamagotchi)) {
        showPetCompletionModal(tamagotchi);
    }
    
    // 액션 버튼들 활성화
    enableActionButtons();
}

// 상태 바 업데이트 함수 수정
function updateStatusBar(statusType, currentValue, maxValue) {
    console.log(`상태 바 업데이트: ${statusType} = ${currentValue}/${maxValue}`);
    
    // data-status 속성을 사용하여 정확한 상태 바 찾기
    const statusBar = document.querySelector(`.status-bar[data-status="${statusType}"]`);
    
    if (statusBar) {
        const progressFill = statusBar.querySelector('.progress-fill');
        const statusValue = statusBar.querySelector('.status-value');
        
        if (progressFill) {
            // 최대값 기준으로 퍼센티지 계산
            const percentage = maxValue > 0 ? Math.min((currentValue / maxValue) * 100, 100) : 0;
            progressFill.style.width = `${percentage}%`;
            
            console.log(`${statusType} 진행률: ${percentage}%`);
        }
        
        if (statusValue) {
            // 현재값/최대값 형식으로 표시
            statusValue.textContent = `${currentValue}/${maxValue}`;
        }
    } else {
        console.error(`상태 바를 찾을 수 없습니다: ${statusType}`);
    }
}

function showNoPetMessage() {
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay) {
        tamagotchiDisplay.innerHTML = `
            <div class="no-pet-container">
                <div class="no-pet-icon">🐣</div>
                <h2 class="no-pet-title">키우고 있는 펫이 없습니다</h2>
                <p class="no-pet-description">
                    펫 분양소에서 새로운 친구를 만나보세요!<br>
                    귀여운 다마고치가 여러분을 기다리고 있어요.
                </p>
                <button class="adopt-pet-btn" onclick="openPetshopModal()">
                    <span class="btn-icon">🏪</span>
                    <span class="btn-text">펫 분양소 가기</span>
                </button>
            </div>
        `;
    }
    
    // 액션 버튼들 비활성화 (다이어리 버튼 제외)
    disableActionButtons();
}

function showPetDisplay() {
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay && tamagotchiDisplay.querySelector('.no-pet-container')) {
        // 기존 펫 디스플레이 구조로 복원 (data-status 속성 추가)
        tamagotchiDisplay.innerHTML = `
            <div class="pet-container">
                <div class="pet-name-section">
                    <h2 class="pet-name">내 다마고치</h2>
                    <button class="pet-name-edit-btn" title="이름 편집">
                        <img src="image/edit-icon.png" alt="편집" class="edit-icon">
                    </button>
                </div>
                
                <img src="image/pet/default.png" alt="다마고치" class="pet-image" id="pet-image">
                
                <div class="pet-status">
                    <div class="status-bar" data-status="hunger">
                        <span class="status-label">배고픔</span>
                        <div class="status-progress">
                            <div class="progress-fill hunger" style="width: 0%"></div>
                        </div>
                        <span class="status-value">0/0</span>
                    </div>
                    
                    <div class="status-bar" data-status="health">
                        <span class="status-label">건강도</span>
                        <div class="status-progress">
                            <div class="progress-fill health" style="width: 0%"></div>
                        </div>
                        <span class="status-value">0/0</span>
                    </div>
                    
                    <div class="status-bar" data-status="happiness">
                        <span class="status-label">행복도</span>
                        <div class="status-progress">
                            <div class="progress-fill happiness" style="width: 0%"></div>
                        </div>
                        <span class="status-value">0/0</span>
                    </div>
                </div>
            </div>
        `;
        
        // 이벤트 리스너 재등록
        const petNameEditBtn = document.querySelector('.pet-name-edit-btn');
        if (petNameEditBtn) {
            petNameEditBtn.addEventListener('click', handlePetNameEdit);
        }
    }
    
    // 액션 버튼들 활성화
    enableActionButtons();
}

// 액션 버튼 비활성화 함수
function disableActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn:not(.petshop-btn):not(.diary-btn)');
    actionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
    
    // 다이어리 버튼은 항상 활성화 상태 유지
    const diaryBtn = document.querySelector('.diary-btn');
    if (diaryBtn) {
        diaryBtn.disabled = false;
        diaryBtn.style.opacity = '1';
        diaryBtn.style.cursor = 'pointer';
    }
}

// 액션 버튼 활성화 함수
function enableActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn:not(.petshop-btn):not(.diary-btn)');
    actionButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
    
    // 다이어리 버튼은 항상 활성화 상태 유지
    const diaryBtn = document.querySelector('.diary-btn');
    if (diaryBtn) {
        diaryBtn.disabled = false;
        diaryBtn.style.opacity = '1';
        diaryBtn.style.cursor = 'pointer';
    }
}

// 먹이주기 액션
async function handleFeedAction() {
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay.querySelector('.no-pet-container')) {
        alert('키우고 있는 펫이 없습니다. 먼저 펫을 분양받아주세요!');
        return;
    }
    
    // 버튼이 비활성화되어 있는지 확인
    const feedBtn = document.querySelector('.food-btn');
    if (feedBtn && feedBtn.disabled) {
        alert('배고픔이 이미 최대치입니다!');
        return;
    }
    
    try {
        const response = await fetch('/api/user/tamagotchi/feed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            await loadUserData();
        } else {
            alert(result.message || '먹이주기에 실패했습니다.');
        }
    } catch (error) {
        console.error('먹이주기 오류:', error);
        alert('먹이주기 중 오류가 발생했습니다.');
    }
}

async function handleCareAction() {
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay.querySelector('.no-pet-container')) {
        alert('키우고 있는 펫이 없습니다. 먼저 펫을 분양받아주세요!');
        return;
    }
    
    // 버튼이 비활성화되어 있는지 확인
    const careBtn = document.querySelector('.care-btn');
    if (careBtn && careBtn.disabled) {
        alert('건강도가 이미 최대치입니다!');
        return;
    }
    
    try {
        const response = await fetch('/api/user/tamagotchi/care', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            await loadUserData();
        } else {
            alert(result.message || '돌보기에 실패했습니다.');
        }
    } catch (error) {
        console.error('돌보기 오류:', error);
        alert('돌보기 중 오류가 발생했습니다.');
    }
}

async function handlePlayAction() {
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay.querySelector('.no-pet-container')) {
        alert('키우고 있는 펫이 없습니다. 먼저 펫을 분양받아주세요!');
        return;
    }
    
    // 버튼이 비활성화되어 있는지 확인
    const playBtn = document.querySelector('.play-btn');
    if (playBtn && playBtn.disabled) {
        alert('행복도가 이미 최대치입니다!');
        return;
    }
    
    try {
        const response = await fetch('/api/user/tamagotchi/play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            await loadUserData();
        } else {
            alert(result.message || '놀아주기에 실패했습니다.');
        }
    } catch (error) {
        console.error('놀아주기 오류:', error);
        alert('놀아주기 중 오류가 발생했습니다.');
    }
}

// 펫 이름 편집 기능
async function handlePetNameEdit() {
    const petNameElement = document.querySelector('.pet-name');
    const currentName = petNameElement.textContent;
    
    const newName = prompt('새로운 펫 이름을 입력하세요:', currentName);
    
    if (newName === null || newName.trim() === '' || newName.trim() === currentName) {
        return; // 취소하거나 변경사항이 없는 경우
    }
    
    try {
        const response = await fetch('/api/user/tamagotchi/name', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ petName: newName.trim() })
        });
        
        const result = await response.json();
        
        if (result.success) {
            petNameElement.textContent = result.newName;
            alert(result.message);
        } else {
            alert(result.message || '펫 이름 변경에 실패했습니다.');
        }
    } catch (error) {
        console.error('펫 이름 변경 오류:', error);
        alert('펫 이름 변경 중 오류가 발생했습니다.');
    }
}

// 액션 버튼 상태 업데이트 함수
function updateActionButtonsState(tamagotchi) {
    if (!tamagotchi) return;
    
    const feedBtn = document.querySelector('.food-btn');
    const careBtn = document.querySelector('.care-btn');
    const playBtn = document.querySelector('.play-btn');
    
    // 먹이주기 버튼 상태
    if (feedBtn) {
        const hungerMax = tamagotchi.hunger_max_requirement || 100;
        const isHungerMax = tamagotchi.hunger >= hungerMax;
        
        feedBtn.disabled = isHungerMax;
        if (isHungerMax) {
            feedBtn.style.opacity = '0.5';
            feedBtn.style.cursor = 'not-allowed';
            feedBtn.title = `배고픔이 이미 최대치(${hungerMax})입니다.`;
        } else {
            feedBtn.style.opacity = '1';
            feedBtn.style.cursor = 'pointer';
            feedBtn.title = '먹이주기 (5포인트)';
        }
    }
    
    // 돌보기 버튼 상태
    if (careBtn) {
        const healthMax = tamagotchi.health_max_requirement || 100;
        const isHealthMax = tamagotchi.health >= healthMax;
        
        careBtn.disabled = isHealthMax;
        if (isHealthMax) {
            careBtn.style.opacity = '0.5';
            careBtn.style.cursor = 'not-allowed';
            careBtn.title = `건강도가 이미 최대치(${healthMax})입니다.`;
        } else {
            careBtn.style.opacity = '1';
            careBtn.style.cursor = 'pointer';
            careBtn.title = '돌보기 (10포인트)';
        }
    }
    
    // 놀아주기 버튼 상태
    if (playBtn) {
        const happinessMax = tamagotchi.happiness_max_requirement || 100;
        const isHappinessMax = tamagotchi.happiness >= happinessMax;
        
        playBtn.disabled = isHappinessMax;
        if (isHappinessMax) {
            playBtn.style.opacity = '0.5';
            playBtn.style.cursor = 'not-allowed';
            playBtn.title = `행복도가 이미 최대치(${happinessMax})입니다.`;
        } else {
            playBtn.style.opacity = '1';
            playBtn.style.cursor = 'pointer';
            playBtn.title = '놀아주기 (15포인트)';
        }
    }
}

// 펫 완성 체크 함수 추가
function checkPetCompletion(tamagotchi) {
    if (!tamagotchi) return false;
    
    const hungerMax = tamagotchi.hunger_max_requirement || 100;
    const healthMax = tamagotchi.health_max_requirement || 100;
    const happinessMax = tamagotchi.happiness_max_requirement || 100;
    
    return (
        tamagotchi.hunger >= hungerMax &&
        tamagotchi.health >= healthMax &&
        tamagotchi.happiness >= happinessMax
    );
}

// 펫 완성 모달 표시
function showPetCompletionModal(tamagotchi) {
    if (confirm(`🎉 축하합니다! ${tamagotchi.pet_name}의 모든 스텟이 최대치에 도달했습니다!\n\n펫을 완성하고 새로운 펫을 키우시겠습니까?\n(완성 시 ${tamagotchi.completion_exp_reward}exp를 획득합니다)`)) {
        completePet();
    }
}

// 펫 완성 처리
async function completePet() {
    try {
        const response = await fetch('/api/user/tamagotchi/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            let message = result.message;
            
            // 레벨 정보가 있으면 추가 메시지 표시
            if (result.levelInfo) {
                message += `\n\n🎉 경험치 ${result.levelInfo.expGained}exp 획득!`;
                message += `\n현재 레벨: ${result.levelInfo.currentLevel}`;
                message += `\n현재 경험치: ${result.levelInfo.currentExp}`;
            }
            
            alert(message);
            
            // 펫 분양소 모달 자동 열기
            openPetshopModal();
        } else {
            alert(result.message || '펫 완성 처리에 실패했습니다.');
        }
    } catch (error) {
        console.error('펫 완성 처리 오류:', error);
        alert('펫 완성 처리 중 오류가 발생했습니다.');
    }
}

// 다이어리 모달 열기
async function openDiaryModal() {
    const modal = document.getElementById('diary-modal-overlay');
    const diaryGrid = document.getElementById('diary-grid');
    
    // 모달 표시
    modal.style.display = 'block';
    
    // 로딩 표시
    diaryGrid.innerHTML = `
        <div class="diary-loading">
            <div class="diary-loading-spinner"></div>
            <span>완성한 펫들을 불러오는 중...</span>
        </div>
    `;
    
    try {
        const response = await fetch('/api/user/completed-pets');
        const result = await response.json();
        
        if (result.success) {
            displayCompletedPets(result.completedPets);
            updateDiarySummary(result.completedPets);
        } else {
            diaryGrid.innerHTML = `
                <div class="diary-loading">
                    <span>완성된 펫 목록을 불러올 수 없습니다.</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('완성된 펫 목록 로드 실패:', error);
        diaryGrid.innerHTML = `
            <div class="diary-loading">
                <span>완성된 펫 목록을 불러오는데 실패했습니다.</span>
            </div>
        `;
    }
}

function closeDiaryModal() {
    const modal = document.getElementById('diary-modal-overlay');
    modal.style.display = 'none';
}

// 완성된 펫 목록 표시
function displayCompletedPets(completedPets) {
    const diaryGrid = document.getElementById('diary-grid');
    
    if (!completedPets || completedPets.length === 0) {
        diaryGrid.innerHTML = `
            <div class="empty-diary">
                <div class="empty-diary-icon">📖</div>
                <h3 class="empty-diary-title">아직 완성한 펫이 없어요</h3>
                <p class="empty-diary-description">
                    첫 번째 펫을 키워서 완성해보세요!<br>
                    완성한 펫들의 추억이 여기에 기록됩니다.
                </p>
            </div>
        `;
        return;
    }
    
    const petCards = completedPets.map(pet => {
        const completedDate = new Date(pet.completed_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="diary-card">
                <div class="completion-badge">✅ 완성</div>
                
                <div class="diary-image-container">
                    <img src="${pet.pet_image_path || 'image/pet/default.png'}" 
                         alt="${pet.pet_name}" 
                         class="diary-pet-image"
                         onerror="this.src='image/pet/default.png'">
                </div>
                
                <div class="diary-info">
                    <h3 class="diary-pet-name">${pet.pet_name}</h3>
                    <p class="diary-pet-description">${pet.pet_description || '특별한 추억을 남긴 펫입니다.'}</p>
                    
                    <div class="max-stats-display">
                        <div class="max-stat-item">
                            <div class="max-stat-icon">🍽️</div>
                            <div class="max-stat-label">배고픔</div>
                            <div class="max-stat-value">${pet.hunger_max_requirement || 100}</div>
                        </div>
                        <div class="max-stat-item">
                            <div class="max-stat-icon">❤️</div>
                            <div class="max-stat-label">건강도</div>
                            <div class="max-stat-value">${pet.health_max_requirement || 100}</div>
                        </div>
                        <div class="max-stat-item">
                            <div class="max-stat-icon">😊</div>
                            <div class="max-stat-label">행복도</div>
                            <div class="max-stat-value">${pet.happiness_max_requirement || 100}</div>
                        </div>
                    </div>
                    
                    <div class="completion-info">
                        <div class="completion-item">
                            <div class="completion-label">완성일</div>
                            <div class="completion-value date">${completedDate}</div>
                        </div>
                        <div class="completion-item">
                            <div class="completion-label">획득 경험치</div>
                            <div class="completion-value exp">${(pet.completion_exp_reward || 0).toLocaleString()}exp</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    diaryGrid.innerHTML = petCards;
}

function updateDiarySummary(completedPets) {
    const totalCompletedElement = document.getElementById('total-completed');
    const totalExpElement = document.getElementById('total-exp');
    
    if (totalCompletedElement) {
        totalCompletedElement.textContent = `${completedPets.length}마리`;
    }
    
    if (totalExpElement) {
        const totalExp = completedPets.reduce((sum, pet) => sum + (pet.completion_exp_reward || 0), 0);
        totalExpElement.textContent = `${totalExp.toLocaleString()}exp`;
    }
}

async function checkCurrentPet() {
    try {
        const response = await fetch('/api/user/tamagotchi');
        const result = await response.json();
        
        if (result.success && result.tamagotchi) {
            return {
                hasPet: true,
                petName: result.tamagotchi.pet_name,
                isCompleted: false
            };
        } else {
            return {
                hasPet: false,
                petName: null,
                isCompleted: false
            };
        }
    } catch (error) {
        console.error('현재 펫 상태 확인 오류:', error);
        return {
            hasPet: false,
            petName: null,
            isCompleted: false
        };
    }
}