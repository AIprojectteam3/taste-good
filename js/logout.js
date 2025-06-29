function handleLogout(event) {
    event.preventDefault(); // 기본 링크 동작 방지
    
    // 검색 결과 [9]에서 제시한 방법: confirm 사용
    const userConfirmed = confirm('정말 로그아웃 하시겠습니까?');
    if (userConfirmed) {
        // 서버에 로그아웃 요청
        fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('로그아웃되었습니다.');
                window.location.href = '/intro.html';
            } else {
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        })
        .catch(error => {
            console.error('로그아웃 중 오류:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        });
    }
}