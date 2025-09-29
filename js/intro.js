function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
}

function validateUsername(username) {
    if (!username || username.trim().length < 2) {
        return { valid: false, message: '닉네임은 최소 2자 이상이어야 합니다.' };
    }
    if (username.trim().length > 8) {
        return { valid: false, message: '닉네임은 최대 8자까지 입력 가능합니다.' };
    }
    return { valid: true, message: '' };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/;
    return passwordRegex.test(password);
}

document.addEventListener('DOMContentLoaded', () => {
    // 스크롤 복원 방지
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    let currentPage = 0;
    let isScrolling = false;
    const pages = document.querySelectorAll('.page');

    // 수직 네비게이션 점 관련 함수들
    function updateNavDots(currentPageIndex) {
        const navDots = document.querySelectorAll('.nav-dot');
        navDots.forEach((dot, index) => {
            if (index === currentPageIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function initVerticalNav() {
        const navDots = document.querySelectorAll('.nav-dot');
        
        navDots.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = parseInt(dot.getAttribute('data-page'));
                moveToPage(targetPage);
            });
        });
    }
    
    // 페이지 이동 함수
    function moveToPage(targetPage) {
        if (targetPage < 0 || targetPage >= pages.length) return;
        
        currentPage = targetPage;
        const targetElement = pages[currentPage];
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
        }
        
        activateAnimation(currentPage);
        toggleFooter(currentPage);
        
        // 네비게이션 점 업데이트
        updateNavDots(currentPage);
    }

    // PC 휠 이벤트 핸들러
    function wheelHandler(e) {
        if (isMobile()) return;
        
        e.preventDefault();
        if (isScrolling) return;
        
        isScrolling = true;
        const direction = e.deltaY > 0 ? 1 : -1;
        const targetPage = Math.min(Math.max(currentPage + direction, 0), pages.length - 1);
        
        if (targetPage !== currentPage) {
            moveToPage(targetPage);
        }
        
        setTimeout(() => {
            isScrolling = false;
        }, 1000);
    }

    // PC 키보드 이벤트 핸들러
    function keydownHandler(e) {
        if (isMobile()) return;
        if (isScrolling) return;
        
        let direction = 0;
        if ([32, 40].includes(e.keyCode)) {
            e.preventDefault();
            direction = 1;
        }
        
        if ([38].includes(e.keyCode)) {
            e.preventDefault();
            direction = -1;
        }
        
        if (direction !== 0) {
            isScrolling = true;
            const targetPage = Math.min(Math.max(currentPage + direction, 0), pages.length - 1);
            
            if (targetPage !== currentPage) {
                moveToPage(targetPage);
            }
            
            setTimeout(() => {
                isScrolling = false;
            }, 1000);
        }
    }

    function addScrollListeners() {
        // PC에서만 페이지 단위 스크롤 이벤트 등록
        if (!isMobile()) {
            window.addEventListener('wheel', wheelHandler, { passive: false });
            window.addEventListener('keydown', keydownHandler);
        }
        // 모바일에서는 기본 스크롤 동작 허용 (이벤트 등록 안함)
    }

    function removeScrollListeners() {
        window.removeEventListener('wheel', wheelHandler);
        window.removeEventListener('keydown', keydownHandler);
    }

    // 화면 크기 변경 시 이벤트 리스너 재등록
    function handleResize() {
        removeScrollListeners();
        addScrollListeners();
    }

    // 풋터 애니메이션 함수
    function toggleFooter(pageIndex) {
        const footer = document.querySelector('.footer');
        const isLastPage = pageIndex === pages.length - 1;

        // 모바일에서는 풋터를 항상 표시하고 애니메이션 없음
        if (isMobile()) {
            return;
        }

        // PC에서는 기존 애니메이션 로직 유지
        footer.style.animation = 'none';
        void footer.offsetWidth;

        function clearAnimationHandler(e) {
            if (e.animationName === 'fadeInFooter' || e.animationName === 'fadeOutFooter') {
                footer.style.animation = '';
                footer.removeEventListener('animationend', clearAnimationHandler);
                
                if (e.animationName === 'fadeOutFooter') {
                    footer.classList.remove('active');
                    footer.style.opacity = '0';
                    footer.style.pointerEvents = 'none';
                }
            }
        }

        if (isLastPage) {
            if (!footer.classList.contains('active')) {
                footer.classList.add('active');
                footer.style.opacity = '1';
                footer.style.pointerEvents = 'auto';
                footer.style.animation = 'fadeInFooter 0.7s ease forwards';
                footer.addEventListener('animationend', clearAnimationHandler, { once: true });
            } else {
                footer.style.opacity = '1';
                footer.style.pointerEvents = 'auto';
            }
        } else {
            if (footer.classList.contains('active')) {
                footer.style.animation = 'fadeOutFooter 0.7s ease forwards';
                footer.addEventListener('animationend', clearAnimationHandler, { once: true });
            }
        }
    }

    // PC환경 애니메이션
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

            if (window.innerWidth <= 768) {
                element.style.animation = 'fadeInOpacity 0.8s ease-out forwards';
            } else {
                element.style.animation = type === 'left'
                    ? 'fadeInLeft 1s ease-in-out forwards'
                    : 'fadeInRight 1s ease-in-out forwards';
            }
        });
    }

    // 초기 이벤트 리스너 등록
    addScrollListeners();
    
    // 리사이즈 이벤트 등록
    window.addEventListener('resize', handleResize);

    // 모달 관련 코드
    const signInBtn = document.getElementById("signin");
    const signUpBtn = document.getElementById("signup");
    const firstForm = document.getElementById("form1");
    const secondForm = document.getElementById("form2");
    const modal = document.getElementById("modal");
    const container = document.querySelector(".container");
    const startBtn = document.getElementById("startBtn");

    startBtn.addEventListener("click", () => {
        const modal = document.getElementById("modal");
        modal.style.display = "flex";
        removeScrollListeners(); // 스크롤 이벤트 제거
    });

    // 모달 닫기 시
    function closeModal() {
        const modal = document.getElementById("modal");
        const container = document.querySelector(".container");
        modal.style.display = "none";
        container.classList.remove("right-panel-active");
        addScrollListeners(); // 스크롤 이벤트 다시 등록
    }

    // 모달 외부 클릭 시 닫기
    window.addEventListener("click", (e) => {
        const modal = document.getElementById("modal");
        if (e.target === modal) {
            closeModal();
        }
    });

    // 모달 닫기 버튼
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    initVerticalNav();
    // 초기 페이지 설정
    moveToPage(0);

    // 회원가입/로그인 전환
    signUpBtn.addEventListener("click", () => {
        container.classList.add("right-panel-active");
    });

    signInBtn.addEventListener("click", () => {
        container.classList.remove("right-panel-active");
    });

    // 모바일 토글 함수
    function handleMobileToggle(isSignup) {
        const container = document.querySelector('.container');
        const animDuration = 500;
        
        if(container.classList.contains('animating')) return;
        
        container.classList.add('animating');
        container.style.animation = 'none';
        void container.offsetWidth;
        
        container.classList.toggle('right-panel-active', isSignup);
        
        setTimeout(() => {
            container.classList.remove('animating');
            const activeForm = isSignup
                ? document.querySelector('.container--signup')
                : document.querySelector('.container--signin');
            activeForm.querySelector('input').focus();
        }, animDuration);
    }

    // 모바일 링크 이벤트
    document.querySelectorAll('.toggle-link a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMobileToggle(link.id === 'show-signup');
        });
    });

    // 폼 제출 방지
    firstForm.addEventListener("submit", (e) => e.preventDefault());
    secondForm.addEventListener("submit", (e) => e.preventDefault());

    // 회원가입 폼 제출
    document.getElementById('form1').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            username: e.target.querySelector('input[name="username"]').value,
            email: e.target.querySelector('input[name="email"]').value,
            password: e.target.querySelector('input[name="password"]').value,
            passwordConfirm: e.target.querySelector('input[name="passwordConfirm"]').value,
            address: e.target.querySelector('input[name="address"]').value,
            detailAddress: e.target.querySelector('input[name="detailAddress"]').value,
        };

        // 닉네임 유효성 검사 추가
        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.valid) {
            alert(usernameValidation.message);
            return;
        }

        // 이메일 유효성 검사
        if (!validateEmail(formData.email)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        // 비밀번호 유효성 검사
        if (!validatePassword(formData.password)) {
            alert('비밀번호는 8-20자리여야하며, 영문자와 숫자가 모두 포함되어야 합니다.');
            return;
        }

        // 비밀번호 확인
        if (formData.password !== formData.passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        alert(result.message);
    });

    // 로그인 폼 제출
    document.getElementById('form2').addEventListener('submit', async (e) => {
        e.preventDefault(); // 폼의 기본 제출 동작을 막음

        // 입력된 이메일과 비밀번호 값을 가져옴
        const email = e.target.querySelector('input[placeholder="이메일"]').value;
        const password = e.target.querySelector('input[placeholder="비밀번호"]').value;

        // 입력값 검증 (간단한 예)
        if (!email || !password) {
            alert('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            // 서버에 로그인 요청
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
            });

            // 서버로부터 받은 응답을 JSON 형태로 파싱
            const data = await response.json();

            // 응답이 성공적이고, 데이터에 success: true가 포함된 경우
            if (response.ok && data.success) {
                // ✅ 가장 중요한 부분: 서버로부터 받은 토큰을 localStorage에 저장합니다.
                localStorage.setItem('token', data.token);

                // 사용자에게 로그인 성공을 알림
                alert('로그인에 성공했습니다!');

                // 메인 페이지(index.html)로 이동
                window.location.href = '/index.html';

            } else {
                // 서버가 보낸 오류 메시지를 사용자에게 표시
                alert(data.message || '로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.');
            }

        } catch (error) {
            // 네트워크 오류 등 fetch 요청 자체에서 예외가 발생한 경우
            console.error('로그인 요청 중 오류 발생:', error);
            alert('로그인 중 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
    });

    // 주소 검색
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
        // console.log("Kakao SDK 초기화 완료");
    } else {
        console.error("Kakao SDK 로드 실패");
    }

    // 초기 페이지 설정
    moveToPage(0);
});