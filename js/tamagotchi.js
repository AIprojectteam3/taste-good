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