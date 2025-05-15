console.log("intro.js 파일이 로드되었습니다.");

document.addEventListener('DOMContentLoaded', () => {
    // 스크롤 복원 방지
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    let isScrolling = false;
    let currentPage = 0;
    const pages = document.querySelectorAll('.page');
    const dots = document.querySelectorAll('.dot');

    updateDotStyle(currentPage);

    // 👉 휠/키보드 이벤트 핸들러를 함수로 따로 분리
    function wheelHandler(e) {
        if (!isScrolling) {
            isScrolling = true;
            handleScroll(e.deltaY > 0 ? 1 : -1);
            setTimeout(() => { isScrolling = false }, 1000);
        }
    }

    function keydownHandler(e) {
        if ([32, 40].includes(e.keyCode)) handleScroll(1);
        if ([38].includes(e.keyCode)) handleScroll(-1);
    }

    // 처음에 이벤트 붙이기
    window.addEventListener('wheel', wheelHandler);
    window.addEventListener('keydown', keydownHandler);

    // dot 클릭 이벤트
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (currentPage === index) return;
            handleScrollToPage(index);
        });
    });

    let lastScrollY = window.scrollY;

    function handleScroll(direction) {
        const maxPage = pages.length - 1;
        const prevPage = currentPage;
        const footer = document.querySelector('.footer');
        
        currentPage = Math.min(Math.max(currentPage + direction, 0), maxPage);
        
        // 4페이지에서 올라갈 때만 추가 처리
        if (prevPage === maxPage && currentPage !== maxPage) {
            footer.style.animation = 'fadeOutFooter 0.7s ease forwards';
            footer.addEventListener('animationend', () => {
                footer.classList.remove('active');
                footer.style.animation = ''; // 애니메이션 초기화
            }, { once: true });
        }
        
        handleScrollToPage(currentPage);
    }

    function handleScrollToPage(targetPage) {
        currentPage = targetPage;
        const scrollPosition = Array.from(pages)
            .slice(0, currentPage)
            .reduce((acc, page) => acc + page.offsetHeight, 0);

        window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });

        activateAnimation(currentPage);
        updateDotStyle(currentPage);
        toggleFooter(currentPage);
    }

    function updateDotStyle(pageIndex) {
        dots.forEach((dot, index) => {
            dot.style.backgroundColor = index === pageIndex ? 'black' : 'white';
        });
    }

    function toggleFooter(pageIndex) {
        const footer = document.querySelector('.footer');
        const isLastPage = pageIndex === pages.length - 1;

        // 이미 active 상태면 중복 애니메이션 방지
        if (isLastPage) {
            if (!footer.classList.contains('active')) {
                footer.classList.add('active');
                footer.style.animation = 'fadeInFooter 0.7s ease forwards';
                footer.addEventListener('animationend', () => {
                    footer.style.animation = '';
                }, { once: true });
            }
        } else {
            if (footer.classList.contains('active')) {
                footer.style.animation = 'fadeOutFooter 0.7s ease forwards';
                footer.addEventListener('animationend', () => {
                    footer.classList.remove('active');
                    footer.style.animation = '';
                }, { once: true });
            }
        }
    }

    function activateAnimation(pageIndex) {
        const page = pages[pageIndex];
        const elements = {
            left: page.querySelector('#ani_left'),
            right: page.querySelector('#ani_right')
        };

        Object.entries(elements).forEach(([type, element]) => {
            if (!element) return;
            element.style.animation = 'none';
            void element.offsetWidth;
            element.style.animation = type === 'left'
                ? 'fadeInLeft 1s ease-in-out forwards'
                : 'fadeInRight 1s ease-in-out forwards';
        });
    }

    // ===============================
    // 🟨 로그인/회원가입 모달 제어
    // ===============================
    const signInBtn = document.getElementById("signin");
    const signUpBtn = document.getElementById("signup");
    const firstForm = document.getElementById("form1");
    const secondForm = document.getElementById("form2");
    const modal = document.getElementById("modal");
    const container = document.querySelector(".container");
    const startBtn = document.getElementById("startBtn");

    // 오른쪽 패널 활성화 → 회원가입 폼으로 전환
    signUpBtn.addEventListener("click", () => {
        container.classList.add("right-panel-active");
    });

    // 왼쪽 패널 활성화 → 로그인 폼으로 전환
    signInBtn.addEventListener("click", () => {
        container.classList.remove("right-panel-active");
    });

    // 폼 제출 시 새로고침 방지
    firstForm.addEventListener("submit", (e) => e.preventDefault());
    secondForm.addEventListener("submit", (e) => e.preventDefault());

    // 시작하기 버튼 클릭 시 모달 열기 + 스크롤 막기
    startBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        window.removeEventListener("wheel", wheelHandler);
        window.removeEventListener("keydown", keydownHandler);
    });

    // 모달 외부 클릭 시 닫기 + 스크롤 다시 활성화
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            container.classList.remove("right-panel-active");
            window.addEventListener("wheel", wheelHandler);
            window.addEventListener("keydown", keydownHandler);
        }
    });

    document.getElementById('form1').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            username: e.target.querySelector('input[name="username"]').value,
            email: e.target.querySelector('input[name="email"]').value,
            password: e.target.querySelector('input[name="password"]').value,
            address: e.target.querySelector('input[name="address"]').value,
            detailAddress: e.target.querySelector('input[name="detailAddress"]').value,
        };

        console.log('전송 데이터:', formData); // 디버깅용 로그

        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        alert(result.message);
    });

    document.getElementById('form2').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = e.target.querySelector('input[placeholder="이메일"]').value;
        const password = e.target.querySelector('input[placeholder="비밀번호"]').value;

        console.log('전송 데이터:', { email, password }); // 디버깅용 로그

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        console.log('서버 응답:', result); // 디버깅용 로그
        alert(result.message);
    });

    document.getElementById('searchAddress').addEventListener('click', function () {
        daum.postcode.load(function() {
            new daum.Postcode({
                oncomplete: function (data) {
                    document.getElementById('address').value = data.address;
                    document.getElementById('detailAddress').focus();
                }
            }).open();
        });
    });

    // Kakao SDK 초기화
    if (window.Kakao) {
        window.Kakao.init("0ad0234b4cdaf5ff61c8c89276f01dcf"); // 카카오 JavaScript 키
        console.log("Kakao SDK 초기화 완료");
    } else {
        console.error("Kakao SDK 로드 실패");
    }

    // 카카오 로그인 함수
    async function kakaoLogin() {
        window.Kakao.Auth.authorize({
            redirectUri: 'http://localhost:3000/kakao/callback', // Redirect URI
        });

        // // 서버에서 사용자 정보를 가져오는 로직
        // const response = await fetch('/kakao/callback');
        // const result = await response.json();

        // if (result.success) {
        //     console.log('카카오 사용자 정보:', result.user);
        //     alert(`환영합니다, ${result.user.properties.nickname}님!`);
        // } else {
        //     alert('카카오 로그인 실패');
        // }
    }

    // 네이버 로그인 함수
    function naverLogin() {
        const clientId = '4tm4ibvzRt4UK09un3v9'; // 네이버 개발자 센터에서 발급받은 클라이언트 ID
        const redirectUri = encodeURIComponent('http://localhost:3000/naver/callback'); // Redirect URI
        const state = encodeURIComponent('random_state_string'); // CSRF 방지를 위한 상태 값

        // 네이버 로그인 URL
        const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;

        // 네이버 로그인 페이지로 리다이렉트
        window.location.href = naverAuthUrl;
    }

    // 로그인 버튼 이벤트
    // document.querySelector('.kakao-login-btn').addEventListener('click', kakaoLogin);
    document.getElementById('kakaoSignBtn').addEventListener('click', kakaoLogin);

    document.getElementById('loginButton').addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 성공 시 리다이렉트
                    window.location.href = data.redirectUrl;
                } else {
                    // 실패 시 에러 메시지 표시
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('로그인 처리 중 오류:', error);
                alert('로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
            });
    });또또

    const obj = { key: "value", key2: "value2" }; // 콤마 누락 수정

    // 수정된 JSON
    const jsonString = '{ "key": "value" }';
    const parsed = JSON.parse(jsonString);
    
});


