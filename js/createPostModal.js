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
    let draggedItem = null;

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

            // 썸네일 아이템 컨테이너 (삭제 버튼 포함)
            const thumbContainer = document.createElement('div');
            thumbContainer.classList.add('create-post-thumbnail-item-container');
            thumbContainer.dataset.index = index; // 데이터 인덱스 저장
            thumbContainer.setAttribute('draggable', 'true');

            thumbContainer.addEventListener('dragstart', handleDragStart);
            thumbContainer.addEventListener('dragover', handleDragOver);
            thumbContainer.addEventListener('drop', handleDrop);
            thumbContainer.addEventListener('dragend', handleDragEnd);
            // 터치 이벤트를 위한 리스너 (선택 사항, 모바일 지원 시)
            // thumbContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            // thumbContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            // thumbContainer.addEventListener('touchend', handleTouchEnd);

            const thumb = document.createElement('img');
            thumb.classList.add('create-post-thumbnail-item');
            thumb.src = item.blobUrl;
            thumb.alt = `썸네일 ${index + 1}`;
            // thumb.dataset.index = index;
            thumb.addEventListener('click', () => showCreatePostSlide(index));
            thumbContainer.appendChild(thumb);

            // 삭제 버튼
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-thumbnail-button');
            deleteButton.innerHTML = `
                <svg viewBox="0 0 10 10" width="8" height="8" fill="currentColor" style="display: block; margin: auto;">
                    <line x1="1" y1="1" x2="9" y2="9" stroke="white" stroke-width="1.5"/>
                    <line x1="1" y1="9" x2="9" y2="1" stroke="white" stroke-width="1.5"/>
                </svg>
            `;
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation(); // 이벤트 버블링 방지
                deleteImage(index);
            });
            thumbContainer.appendChild(deleteButton);

            createPostThumbnails.appendChild(thumbContainer);
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
        addThumb.innerHTML = `<div class="add-icon"><i class="fas fa-plus"></i></div>`;
        addThumb.addEventListener('click', () => showCreatePostSlide(uploadedFilesForCreatePost.length));
        addThumb.addEventListener('click', triggerImageUpload);
        createPostThumbnails.appendChild(addThumb);

        // 현재 인덱스에 맞춰 슬라이드 표시
        showCreatePostSlide(currentCreatePostSlideIndex);
    }

    function handleDragStart(e) {
        draggedItem = this; // 드래그 시작된 요소 저장
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML); // 필요한 경우 데이터 설정
        // 드래그 시작 시 약간 투명하게 보이도록 스타일 추가 (선택 사항)
        setTimeout(() => {
            this.style.opacity = '0.5';
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault(); // 기본 동작 방지 (드롭을 허용하기 위함)
        e.dataTransfer.dropEffect = 'move';

        // 드롭 대상 위에 있을 때 시각적 피드백 (예: 테두리 변경)
        const targetItem = e.target.closest('.create-post-thumbnail-item-container');
        if (targetItem && targetItem !== draggedItem) {
            // 기존 하이라이트 제거
            document.querySelectorAll('.create-post-thumbnail-item-container.drag-over').forEach(el => el.classList.remove('drag-over'));
            targetItem.classList.add('drag-over');
        }
        return false;
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation(); // 이벤트 전파 중지

        const targetItem = e.target.closest('.create-post-thumbnail-item-container');

        if (targetItem && draggedItem !== targetItem) {
            const fromIndex = parseInt(draggedItem.dataset.index);
            const toIndex = parseInt(targetItem.dataset.index);

            // uploadedFilesForCreatePost 배열 순서 변경
            const itemToMove = uploadedFilesForCreatePost.splice(fromIndex, 1)[0];
            uploadedFilesForCreatePost.splice(toIndex, 0, itemToMove);

            // 현재 선택된 슬라이드 인덱스 업데이트 로직 필요
            // 만약 드래그된 아이템이 현재 활성 슬라이드였다면, 새 위치로 currentCreatePostSlideIndex 업데이트
            // 또는 드롭된 위치에 따라 currentCreatePostSlideIndex 업데이트
            if (currentCreatePostSlideIndex === fromIndex) {
                currentCreatePostSlideIndex = toIndex;
            } else if (fromIndex < currentCreatePostSlideIndex && toIndex >= currentCreatePostSlideIndex) {
                currentCreatePostSlideIndex--;
            } else if (fromIndex > currentCreatePostSlideIndex && toIndex <= currentCreatePostSlideIndex) {
                currentCreatePostSlideIndex++;
            }

            updateCreatePostSliderView(); // 뷰 업데이트
        }
        return false;
    }

    function handleDragEnd(e) {
        // 드래그 종료 시 투명도 복원 및 정리
        this.style.opacity = '1';
        document.querySelectorAll('.create-post-thumbnail-item-container.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedItem = null;
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

        if (totalSlidesCount <= 1) { // 슬라이드가 하나뿐이면 (즉, '사진 추가' 슬라이드만 있는 경우)
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
        const initialLength = uploadedFilesForCreatePost.length;

        files.forEach(file => {
            uploadedFilesForCreatePost.push({ file: file, blobUrl: URL.createObjectURL(file) });
        });

        if (files.length > 0) {
            // 새로 추가된 첫 번째 이미지로 슬라이드 인덱스 설정
            // 또는 기존 로직 유지: currentCreatePostSlideIndex = uploadedFilesForCreatePost.length - files.length;
            currentCreatePostSlideIndex = initialLength; // 새로 추가된 이미지 그룹의 첫번째를 보여줌
        }

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

    const createPostThumbnailsContainer = document.querySelector('.create-post-thumbnails-container');
    if (createPostThumbnailsContainer) {
        createPostThumbnailsContainer.addEventListener('wheel', function(event) {
            event.preventDefault();
            createPostThumbnailsContainer.scrollLeft += event.deltaY;
        });
    } else {
        console.error('.create-post-thumbnails-container 요소를 찾을 수 없습니다.');
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
        submitCreatePostBtn.addEventListener('click', async function() {
            const title = document.getElementById('createPostTitle').value;
            const content = document.getElementById('createPostContent').value;
            // 실제 로그인 유저의 user_id를 가져와야 함(예시로 1 사용)
            const user_id = 1;

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id, title, content })
            });
            const data = await res.json();
            if (data.success) {
                alert('게시글이 등록되었습니다!');
                // 폼 초기화 및 모달 닫기 등 추가 작업
            } else {
                alert('게시글 등록 실패: ' + data.message);
            }
        });
    }

    // 이미지 삭제 함수
    function deleteImage(index) {
        uploadedFilesForCreatePost.splice(index, 1); // 이미지 배열에서 삭제
        updateCreatePostSliderView(); // 슬라이더 뷰 업데이트
    }
});