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

    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // 입력값 가져오기
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // 서버에 로그인 요청
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();
            if (result.success && result.token) {
                localStorage.setItem('token', result.token); // 토큰 저장
                window.location.href = result.redirectUrl || '/index.html'; // 이동
            } else {
                alert(result.message || '잘못된 정보입니다');
            }
        });
    }

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
        window.Kakao.init("0ad0234b4cdaf5ff61c8c89276f01dcf");
        console.log("Kakao SDK 초기화 완료");
    } else {
        console.error("Kakao SDK 로드 실패");
    }

    // // 카카오 로그인 함수
    // function kakaoLogin() {
    //     window.Kakao.Auth.login({
    //         scope: 'profile, account_email',
    //         success: function (authObj) {
    //             console.log(authObj);
    //             window.Kakao.API.request({
    //                 url: '/v2/user/me',
    //                 success: function (res) {
    //                     const kakao_account = res.kakao_account;
    //                     console.log(kakao_account);
    //                 },
    //                 fail: function (error) {
    //                     console.error(error);
    //                 },
    //             });
    //         },
    //         fail: function (err) {
    //             console.error(err);
    //         },
    //     });
    // }

    // // 로그인 버튼 이벤트
    // // document.querySelector('.kakao-login-btn').addEventListener('click', kakaoLogin);
    // document.querySelector('.kakaoSignBtn').addEventListener('click', kakaoLogin());
});