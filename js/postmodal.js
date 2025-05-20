document.addEventListener("DOMContentLoaded", () => {
    let currentSlideIndex = 0;
    let currentImages = []; // 현재 모달에서 사용 중인 이미지 목록

    // --- DOM 요소 선택 ---
    // 게시물 목록 컨테이너
    const contentContainer = document.querySelector('.content');

    // 게시물 상세 모달 (PC 환경)
    const postDetailModal = document.getElementById('index-modal');

    // 모달 내부 요소들 (선택자는 index.html 구조에 맞게 조정 필요)
    const modalTitle = postDetailModal ? postDetailModal.querySelector('.post-title') : null; // 예시, 실제 클래스명으로 변경
    const modalContentElement = postDetailModal ? postDetailModal.querySelector('.post-content') : null; // 예시
    const modalUserImg = postDetailModal ? postDetailModal.querySelector('.post-user .user-profile-img img') : null; // 예시
    const modalUserNickname = postDetailModal ? postDetailModal.querySelector('.post-user .user-nickname span:first-child') : null; // 예시
    const readMoreButton = postDetailModal ? postDetailModal.querySelector('.post-content-div .read-more-btn') : null; // 예시

    // 이미지 슬라이더 관련 요소 (PC 모달)
    const modalMainImageContainer = postDetailModal ? postDetailModal.querySelector('.modal-img .slides') : null; // 메인 이미지가 표시될 컨테이너 (.slides 내부)
    const modalThumbnailsContainer = postDetailModal ? postDetailModal.querySelector('.modal-img .slide-thumbnails') : null; // 썸네일 컨테이너
    const prevSlideButton = postDetailModal ? postDetailModal.querySelector('.modal-img .slide-nav.prev') : null; // 이전 버튼
    const nextSlideButton = postDetailModal ? postDetailModal.querySelector('.modal-img .slide-nav.next') : null; // 다음 버튼
    const closeModalButton = postDetailModal ? postDetailModal.querySelector('.close-area') : null; // 닫기 버튼

    // ================================================================================================
    // 게시물 상세 데이터 가져오기
    // ================================================================================================
    async function fetchPostData(postId) {
        console.log(`[fetchPostData] postId ${postId}로 상세 정보 요청 시작...`);
        try {
            const response = await fetch(`/api/post/${postId}`);
            console.log('[fetchPostData] fetch 응답 객체:', response);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '서버 응답 JSON 파싱 실패' }));
                console.error('[fetchPostData] 서버 응답 오류:', response.status, errorData);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const postData = await response.json();
            console.log('[fetchPostData] 서버로부터 받은 postData:', postData);
            return postData;
        } catch (error) {
            console.error('[fetchPostData] 게시물 상세 정보 가져오기 중 오류:', error);
            alert(error.message || '게시물 정보를 불러오는 데 실패했습니다.');
            return null;
        }
    }

    // ================================================================================================
    // 모달 내용 채우기
    // ================================================================================================
    function populateModalWithData(postData) {
        if (!postData) return;

        console.log('[populateModalWithData] 모달 내용 채우기 시작:', postData);

        if (modalTitle) modalTitle.textContent = postData.title || '제목 없음';
        if (modalContentElement) modalContentElement.textContent = postData.content || '내용 없음';

        if (modalUserImg) modalUserImg.src = postData.author_profile_path || 'image/profile-icon.png'; // 기본 프로필 이미지 경로
        if (modalUserNickname) modalUserNickname.textContent = postData.author_username || '익명';

        // 이미지 데이터 준비
        currentImages = [];
        if (postData.thumbnail_path) {
            currentImages.push(postData.thumbnail_path);
        }
        if (Array.isArray(postData.images)) {
            postData.images.forEach(imgPath => {
                if (imgPath !== postData.thumbnail_path) { // 썸네일과 중복 방지
                    currentImages.push(imgPath);
                }
            });
        }
        console.log('[populateModalWithData] 모달에 사용할 이미지 목록:', currentImages);
        populateModalImageSlider(currentImages);

        // '더보기' 버튼 상태 업데이트
        if (readMoreButton && modalContentElement) {
            modalContentElement.classList.remove('expanded');
            readMoreButton.textContent = '더보기';
            // DOM 업데이트 후 실제 높이 계산 위해 setTimeout 사용
            setTimeout(() => {
                if (modalContentElement.scrollHeight > modalContentElement.clientHeight) {
                    readMoreButton.style.display = 'block';
                } else {
                    readMoreButton.style.display = 'none';
                }
            }, 0);
        }
        // TODO: 댓글 로드 로직 호출
        // loadComments(postData.id);
    }

    // ================================================================================================
    // 이미지 슬라이더(메인 이미지, 썸네일) 채우기
    // ================================================================================================
    function populateModalImageSlider(images) {
        console.log('[populateModalImageSlider] 이미지 슬라이더 채우기 시작. 이미지 개수:', images.length);
        if (modalMainImageContainer) modalMainImageContainer.innerHTML = '';
        if (modalThumbnailsContainer) modalThumbnailsContainer.innerHTML = '';

        if (!images || images.length === 0) {
            if (modalMainImageContainer) modalMainImageContainer.innerHTML = '<p style="color: white; text-align: center; width:100%;">이미지가 없습니다.</p>';
            console.log('[populateModalImageSlider] 이미지가 없어 메시지 표시.');
            updateSlideNavigation(0, 0); // 버튼 비활성화
            return;
        }

        images.forEach((imgPath, index) => {
            // 메인 슬라이드 이미지 생성
            if (modalMainImageContainer) {
                const slideElement = document.createElement('img');
                slideElement.src = imgPath;
                slideElement.alt = `게시물 이미지 ${index + 1}`;
                slideElement.classList.add('slide'); // CSS 클래스: .slide
                if (index === 0) {
                    slideElement.classList.add('active'); // 첫 번째 슬라이드 활성화
                }
                modalMainImageContainer.appendChild(slideElement);
            }

            // 썸네일 이미지 생성
            if (modalThumbnailsContainer) {
                const thumbElement = document.createElement('img');
                thumbElement.src = imgPath;
                thumbElement.alt = `썸네일 ${index + 1}`;
                thumbElement.classList.add('slide-thumb'); // CSS 클래스: .slide-thumb
                if (index === 0) {
                    thumbElement.classList.add('active');
                }
                thumbElement.addEventListener('click', () => {
                    displaySpecificSlide(index);
                });
                modalThumbnailsContainer.appendChild(thumbElement);
            }
        });
        displaySpecificSlide(0); // 첫 번째 슬라이드 표시 및 네비게이션 업데이트
        console.log('[populateModalImageSlider] 이미지 슬라이더 구성 완료.');
    }

    // ================================================================================================
    // 특정 인덱스의 슬라이드 표시
    // ================================================================================================
    function displaySpecificSlide(index) {
        console.log(`[displaySpecificSlide] 인덱스 ${index} 슬라이드 표시 시도.`);
        if (!modalMainImageContainer || !currentImages || currentImages.length === 0) {
            console.log('[displaySpecificSlide] 메인 이미지 컨테이너 없거나 이미지 목록 비어있음.');
            updateSlideNavigation(0, 0);
            return;
        }

        currentSlideIndex = index;

        const allSlides = modalMainImageContainer.querySelectorAll('.slide');
        allSlides.forEach((slide, idx) => {
            slide.classList.toggle('active', idx === currentSlideIndex);
        });

        const allThumbs = modalThumbnailsContainer ? modalThumbnailsContainer.querySelectorAll('.slide-thumb') : [];
        allThumbs.forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === currentSlideIndex);
        });

        updateSlideNavigation(currentSlideIndex, currentImages.length);
        console.log(`[displaySpecificSlide] 인덱스 ${currentSlideIndex} 슬라이드 표시 완료.`);
    }

    // ================================================================================================
    // 슬라이드 네비게이션 버튼 활성화/비활성화
    // ================================================================================================
    function updateSlideNavigation(currentIndex, totalSlides) {
        if (prevSlideButton) {
            prevSlideButton.disabled = totalSlides <= 1 || currentIndex === 0;
        }
        if (nextSlideButton) {
            nextSlideButton.disabled = totalSlides <= 1 || currentIndex >= totalSlides - 1;
        }
        console.log(`[updateSlideNavigation] 네비게이션 버튼 상태 업데이트: 현재 ${currentIndex}, 전체 ${totalSlides}`);
    }

    // ================================================================================================
    // 게시물 상세 모달 열기 및 닫기
    // ================================================================================================
    function openPostDetailModal() {
        if (postDetailModal) {
            postDetailModal.style.display = 'flex';
            console.log('[openPostDetailModal] 상세 모달 열림.');
        } else {
            console.error('[openPostDetailModal] 상세 모달 요소를 찾을 수 없습니다.');
        }
    }
    function closePostDetailModal() {
        if (postDetailModal) {
            postDetailModal.style.display = 'none';
            console.log('[closePostDetailModal] 상세 모달 닫힘.');
            // 모달 닫을 때 내용 초기화 (선택 사항)
            if (modalMainImageContainer) modalMainImageContainer.innerHTML = '';
            if (modalThumbnailsContainer) modalThumbnailsContainer.innerHTML = '';
            if (modalTitle) modalTitle.textContent = '';
            if (modalContentElement) modalContentElement.textContent = '';
            // ... 기타 초기화
        }
    }

    // ================================================================================================
    // 이벤트 리스너 등록
    // ================================================================================================
    // 게시물 목록 클릭 시 모달 열기
    if (contentContainer) {
        console.log('[DOMContentLoaded] .content 요소를 찾았습니다. 이벤트 리스너 설정합니다.');
        contentContainer.addEventListener('click', async (event) => {
            console.log('[카드 클릭] .content 내부 클릭 감지됨. 클릭된 대상:', event.target);

            const cardElement = event.target.closest('.card'); // 클릭된 요소 또는 그 부모 중 .card 찾기
            console.log('[카드 클릭] 찾은 .card 요소:', cardElement);
            if (!cardElement) {
                console.log('[카드 클릭] .card 요소를 찾지 못했습니다.');
                return;
            }

            const postId = cardElement.getAttribute('data-post-id');
            console.log('[카드 클릭] 가져온 postId:', postId);
            if (!postId) {
                console.log('[카드 클릭] data-post-id 속성 또는 값을 찾지 못했습니다.');
                return;
            }

            const postData = await fetchPostData(postId);
            if (postData) {
                populateModalWithData(postData);
                openPostDetailModal();
            }
        });
    } else {
        console.error('[DOMContentLoaded] .content 요소를 찾지 못했습니다.');
    }

    // 더보기 버튼 클릭 이벤트
    if (readMoreButton && modalContentElement) {
        readMoreButton.addEventListener('click', () => {
            modalContentElement.classList.toggle('expanded');
            readMoreButton.textContent = modalContentElement.classList.contains('expanded') ? '닫기' : '더보기';
            console.log(`[더보기 클릭] 'expanded' 클래스 상태: ${modalContentElement.classList.contains('expanded')}`);
        });
    }

    // 모달 닫기 버튼 클릭 이벤트
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closePostDetailModal);
    }

    // 모달 외부 영역 클릭 시 닫기
    if (postDetailModal) {
        postDetailModal.addEventListener('click', (event) => {
            if (event.target === postDetailModal) { // 클릭된 요소가 모달 오버레이 자체인지 확인
                closePostDetailModal();
            }
        });
    }

    // 이전 슬라이드 버튼 클릭
    if (prevSlideButton) {
        prevSlideButton.addEventListener('click', () => {
            if (currentSlideIndex > 0) {
                displaySpecificSlide(currentSlideIndex - 1);
            }
        });
    }

    // 다음 슬라이드 버튼 클릭
    if (nextSlideButton) {
        nextSlideButton.addEventListener('click', () => {
            if (currentImages && currentSlideIndex < currentImages.length - 1) {
                displaySpecificSlide(currentSlideIndex + 1);
            }
        });
    }

    console.log('[postmodal.js] 스크립트 로드 및 초기 설정 완료.');
});