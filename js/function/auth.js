/**
 * JWT 토큰을 포함하여 API에 요청을 보내는 범용 fetch 함수
 * @param {string} url - 요청할 API의 URL
 * @param {object} options - fetch에 전달할 옵션 (method, body 등)
 * @returns {Promise<Response>} - fetch의 응답(Response) 객체
 */
async function fetchWithToken(url, options = {}) {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/intro.html';
        throw new Error('인증 토큰이 없습니다.'); // 함수 실행 중단
    }

    // 기본 헤더 설정
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers // 추가적인 헤더가 있을 경우 병합
    };
    
    // FormData를 사용할 경우 Content-Type을 브라우저가 자동으로 설정하도록 해야 함
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...options, headers });

    // 토큰이 유효하지 않거나 만료된 경우
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        alert('인증 정보가 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/intro.html';
        throw new Error('인증 실패');
    }

    return response;
}

async function verifyLoginStatus() {
    try {
        const response = await fetchWithToken('/api/user');
        return await response.json(); // 성공 시 사용자 데이터 반환
    } catch (error) {
        // fetchWithToken이 페이지 이동을 처리하므로, 여기서는 null만 반환
        return null;
    }
}