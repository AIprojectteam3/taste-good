document.addEventListener('DOMContentLoaded', () => {
    // 스크롤 복원 방지
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

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
        
        // 요소 직접 참조 방식으로 변경
        const targetElement = pages[currentPage];
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
        }
        
        // dot 버튼 표시 보장
        const dots = document.querySelector('.dots');
        if (dots) {
            dots.style.display = 'block';
            dots.style.opacity = '1';
        }
        
        activateAnimation(currentPage);
        updateDotStyle(currentPage);
        toggleFooter(currentPage);
    }

    function updateDotStyle(pageIndex) {
        dots.forEach((dot, index) => {
            dot.style.backgroundColor = index === pageIndex ? 'black' : 'white';
        });
    }

    // 풋터 애니메이션
    function toggleFooter(pageIndex) {
        const footer = document.querySelector('.footer');
        const isLastPage = pageIndex === pages.length - 1;

        // 애니메이션 초기화 (중복 방지)
        footer.style.animation = 'none';
        void footer.offsetWidth; // 리플로우 강제

        function clearAnimationHandler(e) {
            if (e.animationName === 'fadeInFooter' || e.animationName === 'fadeOutFooter') {
                footer.style.animation = '';
                footer.removeEventListener('animationend', clearAnimationHandler);
                // fadeOutFooter 끝난 후 active 해제
                if (e.animationName === 'fadeOutFooter') {
                    footer.classList.remove('active');
                    // opacity와 pointer-events도 초기화
                    footer.style.opacity = '0';
                    footer.style.pointerEvents = 'none';
                }
            }
        }

        if (isLastPage) {
            // 이미 active면 중복 적용 방지
            if (!footer.classList.contains('active')) {
                footer.classList.add('active');
                footer.style.opacity = '1';
                footer.style.pointerEvents = 'auto';
                footer.style.animation = 'fadeInFooter 0.7s ease forwards';
                footer.addEventListener('animationend', clearAnimationHandler, { once: true });
            } else {
                // 이미 active면 스타일만 보장
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

    // PC환경 2, 3, 4 페이지 글귀 애니메이션
    function activateAnimation(pageIndex) {
        const page = pages[pageIndex];
        const elements = {
            left: page.querySelector('#ani_left'),
            right: page.querySelector('#ani_right')
        };
    
        Object.entries(elements).forEach(([type, element]) => {
            if (!element) return;
            
            // 모바일 애니메이션 강제 재설정
            element.style.animation = 'none';
            void element.offsetWidth; // 리플로우 강제
            
            if (window.innerWidth <= 768) {
                element.style.animation = 'fadeInOpacity 0.8s ease-out forwards';
            } else {
                element.style.animation = type === 'left' 
                    ? 'fadeInLeft 1s ease-in-out forwards' 
                    : 'fadeInRight 1s ease-in-out forwards';
            }
        });
    }    

    // 모바일 스크롤 애니메이션
    let touchStartY = 0;
    let isScrolling = false;

    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });

    window.addEventListener('touchend', (e) => {
        if (isScrolling) return;
    
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        const isLastPage = currentPage === pages.length - 1;
        const threshold = window.innerHeight * 0.1; // 감도 개선
    
        if (Math.abs(deltaY) > threshold) {
            isScrolling = true;
    
            // 4페이지 특수 처리
            if (isLastPage) {
                const footer = document.querySelector('.footer');
                if (deltaY < 0 && !footer.classList.contains('active')) {
                    toggleFooter(currentPage, true);
                } else {
                    handleScroll(deltaY > 0 ? 1 : -1);
                }
            } else {
                handleScroll(deltaY > 0 ? 1 : -1);
            }
    
            setTimeout(() => { isScrolling = false }, 800);
        }
    });

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

    function handleMobileToggle(isSignup) {
        const container = document.querySelector('.container');
        const animDuration = 500;
    
        if(container.classList.contains('animating')) return;
        container.classList.add('animating');
    
        // 애니메이션 리셋 로직 추가
        container.style.animation = 'none';
        void container.offsetWidth; // 리플로우 강제 실행
    
        container.classList.toggle('right-panel-active', isSignup);
    
        setTimeout(() => {
            container.classList.remove('animating');
            const activeForm = isSignup 
                ? document.querySelector('.container--signup')
                : document.querySelector('.container--signin');
            activeForm.querySelector('input').focus();
        }, animDuration);
    }

    // 모바일 링크 이벤트 바인딩
    document.querySelectorAll('.toggle-link a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMobileToggle(link.id === 'show-signup');
        });
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = "none";
            container.classList.remove("right-panel-active");
            window.addEventListener("wheel", wheelHandler);
            window.addEventListener("keydown", keydownHandler);
        });
    });

    // 폼 제출 시 새로고침 방지
    firstForm.addEventListener("submit", (e) => e.preventDefault());
    secondForm.addEventListener("submit", (e) => e.preventDefault());

    // 시작하기 버튼 클릭 시 모달 열기 + 스크롤 막기
    startBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        window.removeEventListener("wheel", wheelHandler);
        window.removeEventListener("keydown", keydownHandler);
        hideDotsOnModal();
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

    // 모바일 환경에서 모달 열었을 때 페이지 이동 버튼 숨기기
    function hideDotsOnModal() {
        const dots = document.querySelector('.dots');
        if (window.innerWidth <= 768 && dots) {
            dots.style.display = 'none';
        }
    }
    
    // 모바일 환경에서 모달 닫았을 때 페이지 이동 버튼 나타내기
    function showDotsOnModalClose() {
        const dots = document.querySelector('.dots');
        if (window.innerWidth <= 768 && dots) {
            dots.style.display = 'block';
        }
    }

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = "none";
            container.classList.remove("right-panel-active");
            window.addEventListener("wheel", wheelHandler);
            window.addEventListener("keydown", keydownHandler);
            showDotsOnModalClose();
        });
    });

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

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log('서버 응답:', data); // 디버깅용 로그

            if (data.success) {
                // 로그인 성공 후 사용자 정보를 가져와서 sessionStorage에 저장
                try {
                    const userResponse = await fetch('/api/user');
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        if (userData && userData.id) {
                            sessionStorage.setItem('loggedInUserId', userData.id.toString());
                            console.log("사용자 ID가 sessionStorage에 저장됨:", userData.id);
                        }
                    }
                } catch (userError) {
                    console.error('사용자 정보 가져오기 실패:', userError);
                }
                
                // 성공 메시지 표시 후 리다이렉트
                alert(data.message || '로그인 성공!');
                window.location.href = data.redirectUrl || '/index.html';
            } else {
                alert(data.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 처리 중 오류:', error);
            alert('로그인 처리 중 오류가 발생했습니다.');
        }
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

    // 로그인 버튼 이벤트
    // document.querySelector('.kakao-login-btn').addEventListener('click', kakaoLogin);
    // document.querySelector('.kakaoSignBtn').addEventListener('click', kakaoLogin());
});