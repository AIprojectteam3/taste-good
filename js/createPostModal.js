document.addEventListener('DOMContentLoaded', function() {
    // --- 게시물 작성 모달 관련 변수 ---
    const openCreatePostModalBtn = document.getElementById('openPostModalBtn');
    const createPostModal = document.getElementById('createPostFormModal');
    const createPostModalCloseBtn = createPostModal.querySelector('.create-post-form-close-btn');
    const createPostImageUpload = document.getElementById('createPostImageUpload');
    const createPostSliderMain = document.getElementById('createPostSliderMain'); // 메인 슬라이드 컨테이너
    const createPostThumbnails = document.getElementById('createPostThumbnails'); // 썸네일 컨테이너
    const createPostNavPrev = document.getElementById('createPostNavPrev');
    const createPostNavNext = document.getElementById('createPostNavNext');
    const createPostTitleInput = document.getElementById('createPostTitle');
    const createPostContentInput = document.getElementById('createPostContent');
    const submitCreatePostBtn = document.getElementById('submitCreatePostBtn');

    let uploadedFilesForCreatePost = []; // { file: FileObject, blobUrl: "blob:..." }
    let currentCreatePostSlideIndex = 0;

    // 파일 업로드 input 숨김 해제 및 이벤트 연결
    function triggerImageUpload() {
        createPostImageUpload.click();
    }

    // 슬라이더 뷰 업데이트 (메인 슬라이드 및 썸네일)
    function updateCreatePostSliderView() {
        createPostSliderMain.innerHTML = ''; // 메인 슬라이드 영역 초기화
        createPostThumbnails.innerHTML = ''; // 썸네일 영역 초기화

        // 1. 업로드된 이미지들에 대한 슬라이드 및 썸네일 생성
        uploadedFilesForCreatePost.forEach((item, index) => {
            // 메인 슬라이드 아이템
            const slide = document.createElement('div');
            slide.classList.add('create-post-slide');
            slide.dataset.index = index;
            const img = document.createElement('img');
            img.src = item.blobUrl;
            img.alt = `업로드 이미지 ${index + 1}`;
            slide.appendChild(img);
            createPostSliderMain.appendChild(slide);

            // 썸네일 아이템
            const thumb = document.createElement('img');
            thumb.classList.add('create-post-thumbnail-item');
            thumb.src = item.blobUrl;
            thumb.alt = `썸네일 ${index + 1}`;
            thumb.dataset.index = index;
            thumb.addEventListener('click', () => showCreatePostSlide(index));
            createPostThumbnails.appendChild(thumb);
        });

        // 2. '사진 추가' 슬라이드 (메인 슬라이드 영역)
        const addSlide = document.createElement('div');
        addSlide.classList.add('create-post-slide', 'create-post-add-new-slide');
        // '사진 추가' 슬라이드의 인덱스는 업로드된 이미지 개수와 동일
        addSlide.dataset.index = uploadedFilesForCreatePost.length;
        addSlide.innerHTML = `
            <div class = "add-icon-div">
                <div class="add-icon"><i class="fas fa-plus"></i></div>
                <span>사진 추가</span>
            </div>
        `;
        addSlide.addEventListener('click', triggerImageUpload);
        createPostSliderMain.appendChild(addSlide);

        // 3. '사진 추가' 썸네일 버튼
        const addThumb = document.createElement('div');
        addThumb.classList.add('create-post-thumbnail-item', 'create-post-add-new-thumb-btn');
        addThumb.innerHTML = `<div class="add-icon-thum"><i class="fas fa-plus"></i></div>`; // 아이콘을 포함하려면 여기에 i 태그 추가 가능
        // '사진 추가' 썸네일 클릭 시 '사진 추가' 메인 슬라이드 표시
        addThumb.addEventListener('click', () => showCreatePostSlide(uploadedFilesForCreatePost.length));
        addThumb.addEventListener('click', triggerImageUpload);
        createPostThumbnails.appendChild(addThumb);

        // 현재 인덱스에 맞춰 슬라이드 표시
        showCreatePostSlide(currentCreatePostSlideIndex);
    }

    // 특정 인덱스의 슬라이드 표시
    function showCreatePostSlide(index) {
        const allSlides = createPostSliderMain.querySelectorAll('.create-post-slide');
        const allThumbnails = createPostThumbnails.querySelectorAll('.create-post-thumbnail-item');

        // 전체 슬라이드 개수 = 이미지 개수 + '사진 추가' 슬라이드 1개
        const totalSlidesCount = uploadedFilesForCreatePost.length + 1;

        if (index < 0) {
            index = 0;
        } else if (index >= totalSlidesCount) {
            // 새 이미지가 추가되어 인덱스가 범위를 벗어날 경우, 마지막 이미지 또는 '사진 추가' 슬라이드로 조정
            index = totalSlidesCount - 1;
        }
        currentCreatePostSlideIndex = index;

        // 모든 메인 슬라이드 숨기고 현재 슬라이드만 표시
        allSlides.forEach((slide, i) => {
            slide.classList.toggle('active-slide', parseInt(slide.dataset.index) === currentCreatePostSlideIndex);
        });

        // 모든 썸네일 비활성화 후 현재 썸네일(또는 '사진 추가' 썸네일) 활성화
        allThumbnails.forEach((thumb) => {
            const thumbIndex = thumb.dataset.index !== undefined ? parseInt(thumb.dataset.index) : uploadedFilesForCreatePost.length;
            thumb.classList.toggle('active', thumbIndex === currentCreatePostSlideIndex);
        });

        updateNavigationButtons();
    }

    // 네비게이션 버튼 상태 업데이트
    function updateNavigationButtons() {
        const totalSlidesCount = uploadedFilesForCreatePost.length + 1; // 이미지 슬라이드 + '사진 추가' 슬라이드

        if (totalSlidesCount <= 1) {
            // 슬라이드가 하나뿐이면 (즉, '사진 추가' 슬라이드만 있는 경우)
            createPostNavPrev.style.display = 'none';
            createPostNavNext.style.display = 'none';
        } else {
            createPostNavPrev.style.display = 'flex';
            createPostNavNext.style.display = 'flex';
            createPostNavPrev.disabled = currentCreatePostSlideIndex === 0;
            createPostNavNext.disabled = currentCreatePostSlideIndex === totalSlidesCount - 1;
        }
    }

    // 파일 선택 시 처리
    createPostImageUpload.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            // 동일한 파일이 이미 있는지 확인 (선택사항)
            // if (!uploadedFilesForCreatePost.find(f => f.file.name === file.name && f.file.size === file.size)) {
            uploadedFilesForCreatePost.push({ file: file, blobUrl: URL.createObjectURL(file) });
            // }
        });

        // 파일 선택 후, 새로 추가된 이미지가 있다면 그 중 첫 번째를 보여주거나,
        // 기존 이미지가 있다면 마지막 이미지 다음, 즉 '사진 추가' 슬라이드 바로 전으로 이동할 수 있도록 조정
        // 또는 간단하게 마지막 이미지(새로 추가된 이미지 중 첫번째)를 보여주도록 설정
        if (files.length > 0) {
             // 새로 추가된 이미지 중 첫 번째 이미지가 기존 배열에서 몇 번째 인덱스인지 계산
            currentCreatePostSlideIndex = uploadedFilesForCreatePost.length - files.length;
        }
        // input 값 초기화하여 같은 파일 다시 선택 가능하게 함
        createPostImageUpload.value = '';
        updateCreatePostSliderView();
    });

    // 이전/다음 버튼 이벤트 리스너
    createPostNavPrev.addEventListener('click', () => {
        if (currentCreatePostSlideIndex > 0) {
            showCreatePostSlide(currentCreatePostSlideIndex - 1);
        }
    });

    createPostNavNext.addEventListener('click', () => {
        const totalSlidesCount = uploadedFilesForCreatePost.length + 1;
        if (currentCreatePostSlideIndex < totalSlidesCount - 1) {
            showCreatePostSlide(currentCreatePostSlideIndex + 1);
        }
    });

    // 모달 열 때 초기화
    function resetCreatePostModal() {
        createPostTitleInput.value = '';
        createPostContentInput.value = '';
        createPostImageUpload.value = ''; // 파일 인풋 초기화

        // Blob URL 해제
        uploadedFilesForCreatePost.forEach(item => URL.revokeObjectURL(item.blobUrl));
        uploadedFilesForCreatePost = [];
        currentCreatePostSlideIndex = 0; // 초기 슬라이드는 '사진 추가' 슬라이드
        updateCreatePostSliderView();
    }

    // 모달 열기/닫기 로직
    if (openCreatePostModalBtn) {
        openCreatePostModalBtn.addEventListener('click', function() {
            openCreatePostModalBtn.classList.toggle('active');
            if (openCreatePostModalBtn.classList.contains('active')) {
                if (createPostModal) {
                    createPostModal.style.display = 'flex';
                    resetCreatePostModal(); // 모달 열 때마다 초기화
                }
            } else {
                if (createPostModal) {
                    createPostModal.style.display = 'none';
                    // 모달이 닫힐 때도 Blob URL 해제가 필요하면 여기에 추가
                    // 하지만 resetCreatePostModal에서 이미 처리하므로, 여기서는 중복될 수 있음
                    // 만약 resetCreatePostModal 호출 없이 닫는 경우가 있다면 필요
                }
            }
        });
    }

    function closeCreatePostModal() {
        if (createPostModal) {
            createPostModal.style.display = 'none';
        }
        if (openCreatePostModalBtn && openCreatePostModalBtn.classList.contains('active')) {
            openCreatePostModalBtn.classList.remove('active');
        }
        // 모달 닫을 때 Blob URL 해제 (메모리 누수 방지)
        // resetCreatePostModal() 호출 시 이미 해제되지만, X 버튼 등으로 직접 닫을 경우를 대비
        uploadedFilesForCreatePost.forEach(item => URL.revokeObjectURL(item.blobUrl));
        uploadedFilesForCreatePost = []; // 배열도 비워줌
    }

    if (createPostModalCloseBtn) {
        createPostModalCloseBtn.addEventListener('click', closeCreatePostModal);
    }

    if (createPostModal) {
        createPostModal.addEventListener('click', function(e) {
            if (e.target === createPostModal) { // 오버레이 클릭 시
                closeCreatePostModal();
            }
        });
    }

    // 게시 버튼 클릭 이벤트
    if (submitCreatePostBtn) {
        submitCreatePostBtn.addEventListener('click', function() {
            const title = createPostTitleInput.value;
            const content = createPostContentInput.value;
            const imageFiles = uploadedFilesForCreatePost.map(item => item.file);

            console.log('새 게시물 제목:', title);
            console.log('새 게시물 내용:', content);
            if (imageFiles.length > 0) {
                imageFiles.forEach(file => console.log('새 게시물 이미지 파일:', file.name));
            }

            closeCreatePostModal(); // 게시 후 모달 닫기
            alert('게시물이 등록되었습니다! (실제 서버 연동 필요)');
        });
    }
});
