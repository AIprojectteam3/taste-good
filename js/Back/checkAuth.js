async function checkAuthAndRedirect() {
    try {
        const response = await fetch('/api/user');
        const userData = await response.json();
        
        if (!userData || response.status === 401) {
            console.log('로그인되지 않은 사용자 - intro 페이지로 리다이렉트');
            alert('로그인 후 이용 가능한 페이지입니다.');
            window.location.href = '/intro.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error);
        alert('로그인 후 이용 가능한 페이지입니다.');
        window.location.href = '/intro.html';
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuthAndRedirect();
    
    if (!isAuthenticated) {
        return; // 리다이렉트되므로 더 이상 실행하지 않음
    }
});