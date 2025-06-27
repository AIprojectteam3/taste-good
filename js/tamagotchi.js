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
});