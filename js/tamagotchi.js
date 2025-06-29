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
});

async function loadUserData() {
    try {
        const [userResponse, tamagotchiResponse] = await Promise.all([
            fetch('/api/user'),
            fetch('/api/user/tamagotchi')
        ]);
        
        if (!userResponse.ok || !tamagotchiResponse.ok) {
            throw new Error('사용자 정보를 가져올 수 없습니다.');
        }
        
        const userData = await userResponse.json();
        const tamagotchiData = await tamagotchiResponse.json();
        
        if (!userData) {
            throw new Error('사용자 데이터가 없습니다.');
        }
        
        // current-stats 영역 업데이트
        updateCurrentStats(userData);
        
        // 다마고치 정보 업데이트 (펫이 없어도 처리)
        if (tamagotchiData.success && tamagotchiData.tamagotchi) {
            updateTamagotchiDisplay(tamagotchiData.tamagotchi);
        } else {
            updateTamagotchiDisplay(null);
        }
        
        return { userData, tamagotchi: tamagotchiData.tamagotchi || null };
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

// 펫 선택 함수 수정
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
                await loadUserData();
            } else {
                alert(result.message || '펫 선택에 실패했습니다.');
            }
        } catch (error) {
            console.error('펫 선택 오류:', error);
            alert('펫 선택 중 오류가 발생했습니다.');
        }
    }
}

// 다마고치 디스플레이 업데이트 함수
function updateTamagotchiDisplay(tamagotchi) {
    if (!tamagotchi) {
        // 펫이 없는 경우 메시지 표시
        showNoPetMessage();
        return;
    }
    
    // 기존 펫 정보 표시 로직
    const petNameElement = document.querySelector('.pet-name');
    if (petNameElement) {
        petNameElement.textContent = tamagotchi.pet_name || '내 다마고치';
    }
    
    // 배고픔 상태 업데이트
    updateStatusBar('hunger', tamagotchi.hunger);
    
    // 건강도 상태 업데이트
    updateStatusBar('health', tamagotchi.health);
    
    // 행복도 상태 업데이트
    updateStatusBar('happiness', tamagotchi.happiness);
    
    // 펫 디스플레이 영역 보이기
    showPetDisplay();
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
    
    // 액션 버튼들 비활성화
    disableActionButtons();
}

function showPetDisplay() {
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay && tamagotchiDisplay.querySelector('.no-pet-container')) {
        // 기존 펫 디스플레이 구조로 복원
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
                    <div class="status-bar">
                        <span class="status-label">배고픔</span>
                        <div class="status-progress">
                            <div class="progress-fill hunger" style="width: 70%"></div>
                        </div>
                        <span class="status-value">70/100</span>
                    </div>
                    
                    <div class="status-bar">
                        <span class="status-label">건강도</span>
                        <div class="status-progress">
                            <div class="progress-fill health" style="width: 70%"></div>
                        </div>
                        <span class="status-value">70/100</span>
                    </div>
                    
                    <div class="status-bar">
                        <span class="status-label">행복도</span>
                        <div class="status-progress">
                            <div class="progress-fill happiness" style="width: 70%"></div>
                        </div>
                        <span class="status-value">70/100</span>
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
    const actionButtons = document.querySelectorAll('.action-btn:not(.petshop-btn)');
    actionButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
}

// 액션 버튼 활성화 함수
function enableActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn:not(.petshop-btn)');
    actionButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
}

// 상태 바 업데이트 함수
function updateStatusBar(statusType, value) {
    const statusBar = document.querySelector(`.status-bar .progress-fill.${statusType}`);
    const statusValue = document.querySelector(`.status-bar .status-value`);
    
    if (statusBar) {
        statusBar.style.width = `${value}%`;
    }
    
    // 해당 상태의 값 텍스트 업데이트
    const statusElement = document.querySelector(`.status-bar:has(.progress-fill.${statusType}) .status-value`);
    if (statusElement) {
        statusElement.textContent = `${value}/100`;
    }
}

// 먹이주기 액션
async function handleFeedAction() {
    const tamagotchiDisplay = document.querySelector('.tamagotchi-display');
    if (tamagotchiDisplay.querySelector('.no-pet-container')) {
        alert('키우고 있는 펫이 없습니다. 먼저 펫을 분양받아주세요!');
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