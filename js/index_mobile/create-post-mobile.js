document.addEventListener('DOMContentLoaded', function() {
    const MAX_FILES = 8;
    let uploadedFiles = [];
    let currentSlideIndex = 0;
    let draggedItem = null;
    let isEditMode = false;
    let editPostId = null;

    // URL 파라미터 확인하여 수정 모드인지 판단
    const urlParams = new URLSearchParams(window.location.search);
    editPostId = urlParams.get('edit');
    isEditMode = !!editPostId;

    // DOM 요소들
    const imageUpload = document.getElementById('mobileImageUpload');
    const sliderMain = document.getElementById('mobileSliderMain');
    const thumbnails = document.getElementById('mobileThumbnails');
    const navPrev = document.getElementById('mobileNavPrev');
    const navNext = document.getElementById('mobileNavNext');
    const indicators = document.getElementById('mobileSlideIndicators');
    const titleInput = document.getElementById('mobilePostTitle');
    const contentInput = document.getElementById('mobilePostContent');
    const titleCharCount = document.getElementById('titleCharCount');
    const contentCharCount = document.getElementById('contentCharCount');

    // 뒤로가기 버튼
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.innerHTML = '←';
    backButton.addEventListener('click', goBack);
    document.body.appendChild(backButton);

    // 플로팅 액션 버튼 생성
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-floating-btn';
    submitBtn.innerHTML = isEditMode ? '✓' : '→';
    submitBtn.disabled = true;
    document.body.appendChild(submitBtn);

    // 초기화
    init();

    async function init() {
        if (isEditMode) {
            await loadPostForEdit();
        }
        updateSliderView();
        setupEventListeners();
        checkFormValidity();
    }

    // 수정할 게시물 데이터 로드
    async function loadPostForEdit() {
        try {
            const response = await fetch(`/api/post/${editPostId}`);
            const postData = await response.json();

            if (response.ok) {
                // 제목과 내용 설정
                titleInput.value = postData.title;
                contentInput.value = postData.content;

                // 기존 이미지들 로드
                if (postData.images && postData.images.length > 0) {
                    uploadedFiles = postData.images.map(imagePath => ({
                        file: null,
                        blobUrl: imagePath,
                        isExisting: true,
                        originalPath: imagePath
                    }));
                    currentSlideIndex = 0;
                }

                // 문자 수 카운터 업데이트
                updateCharCount();
            } else {
                alert('게시물을 불러오는데 실패했습니다.');
                goBack();
            }
        } catch (error) {
            console.error('게시물 로드 중 오류:', error);
            alert('게시물을 불러오는데 실패했습니다.');
            goBack();
        }
    }

    function setupEventListeners() {
        // 파일 업로드
        imageUpload.addEventListener('change', handleFileSelect);

        // 네비게이션
        navPrev.addEventListener('click', () => showSlide(currentSlideIndex - 1));
        navNext.addEventListener('click', () => showSlide(currentSlideIndex + 1));

        // 텍스트 입력
        titleInput.addEventListener('input', handleTitleInput);
        contentInput.addEventListener('input', handleContentInput);

        // 게시 버튼
        submitBtn.addEventListener('click', handleSubmit);

        // 터치 스와이프 지원
        setupTouchEvents();
    }

    function handleFileSelect(e) {
        const newFiles = Array.from(e.target.files);
        const remainingSlots = MAX_FILES - uploadedFiles.length;

        if (newFiles.length === 0) return;

        if (remainingSlots <= 0) {
            alert(`최대 ${MAX_FILES}개의 이미지만 업로드할 수 있습니다.`);
            return;
        }

        let filesToAdd = newFiles;
        if (newFiles.length > remainingSlots) {
            alert(`최대 ${MAX_FILES}개까지 추가할 수 있습니다. 처음 ${remainingSlots}개만 추가됩니다.`);
            filesToAdd = newFiles.slice(0, remainingSlots);
        }

        const startIndex = uploadedFiles.length;
        filesToAdd.forEach(file => {
            uploadedFiles.push({
                file: file,
                blobUrl: URL.createObjectURL(file),
                isExisting: false
            });
        });

        currentSlideIndex = startIndex;
        imageUpload.value = '';
        updateSliderView();
        checkFormValidity();
    }

    function updateSliderView() {
        // 메인 슬라이더 업데이트
        sliderMain.innerHTML = '';
        thumbnails.innerHTML = '';
        indicators.innerHTML = '';

        // 업로드된 이미지들
        uploadedFiles.forEach((item, index) => {
            // 메인 슬라이드
            const slide = document.createElement('div');
            slide.className = 'mobile-slide';
            slide.innerHTML = `<img src="${item.blobUrl}" alt="이미지 ${index + 1}">`;
            sliderMain.appendChild(slide);

            // 썸네일
            const thumbContainer = document.createElement('div');
            thumbContainer.className = 'thumbnail-container';
            thumbContainer.draggable = true;
            thumbContainer.dataset.index = index;

            const thumb = document.createElement('img');
            thumb.className = 'thumbnail-item';
            thumb.src = item.blobUrl;
            thumb.addEventListener('click', () => showSlide(index));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-thumbnail-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteImage(index);
            });

            thumbContainer.appendChild(thumb);
            thumbContainer.appendChild(deleteBtn);
            thumbnails.appendChild(thumbContainer);

            // 인디케이터
            const dot = document.createElement('div');
            dot.className = 'indicator-dot';
            dot.addEventListener('click', () => showSlide(index));
            indicators.appendChild(dot);

            // 드래그 이벤트
            setupDragEvents(thumbContainer);
        });

        // 사진 추가 슬라이드
        const addSlide = document.createElement('div');
        addSlide.className = 'mobile-slide mobile-add-slide';
        addSlide.innerHTML = `
            <div class="mobile-add-content">
                <div class="mobile-add-icon">
                    <i class="fas fa-plus"></i>
                </div>
                <div class="mobile-add-text">사진 추가</div>
            </div>
        `;
        addSlide.addEventListener('click', () => imageUpload.click());
        sliderMain.appendChild(addSlide);

        // 사진 추가 썸네일
        const addThumb = document.createElement('div');
        addThumb.className = 'thumbnail-add-btn';
        addThumb.innerHTML = '<i class="fas fa-plus"></i>';
        addThumb.addEventListener('click', () => imageUpload.click());
        thumbnails.appendChild(addThumb);

        // 현재 슬라이드 표시
        showSlide(currentSlideIndex);
    }

    function showSlide(index) {
        const slides = sliderMain.querySelectorAll('.mobile-slide');
        const dots = indicators.querySelectorAll('.indicator-dot');
        const thumbs = thumbnails.querySelectorAll('.thumbnail-item');

        // 범위 체크
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;

        currentSlideIndex = index;

        // 슬라이드 표시
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });

        // 인디케이터 업데이트
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // 썸네일 활성화
        thumbs.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        // 네비게이션 버튼 상태
        navPrev.disabled = index === 0;
        navNext.disabled = index >= uploadedFiles.length;
    }

    function deleteImage(index) {
        if (uploadedFiles[index] && !uploadedFiles[index].isExisting) {
            URL.revokeObjectURL(uploadedFiles[index].blobUrl);
        }
        
        uploadedFiles.splice(index, 1);
        
        if (currentSlideIndex >= uploadedFiles.length && uploadedFiles.length > 0) {
            currentSlideIndex = uploadedFiles.length - 1;
        } else if (uploadedFiles.length === 0) {
            currentSlideIndex = 0;
        }
        
        updateSliderView();
        checkFormValidity();
    }

    function setupDragEvents(element) {
        element.addEventListener('dragstart', (e) => {
            draggedItem = parseInt(element.dataset.index);
            element.classList.add('dragging');
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
            draggedItem = null;
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('drag-over');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('drag-over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            
            const dropIndex = parseInt(element.dataset.index);
            if (draggedItem !== null && draggedItem !== dropIndex) {
                const draggedFile = uploadedFiles[draggedItem];
                uploadedFiles.splice(draggedItem, 1);
                uploadedFiles.splice(dropIndex, 0, draggedFile);
                
                currentSlideIndex = dropIndex;
                updateSliderView();
            }
        });
    }

    function setupTouchEvents() {
        let startX = null;
        let startY = null;
        let isScrolling = null;

        sliderMain.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = null;
        });

        sliderMain.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;

            if (isScrolling === null) {
                isScrolling = Math.abs(diffY) > Math.abs(diffX);
            }

            if (!isScrolling) {
                e.preventDefault();
            }
        });

        sliderMain.addEventListener('touchend', (e) => {
            if (!startX || isScrolling) return;

            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) {
                if (diff > 0 && currentSlideIndex < uploadedFiles.length) {
                    showSlide(currentSlideIndex + 1);
                } else if (diff < 0 && currentSlideIndex > 0) {
                    showSlide(currentSlideIndex - 1);
                }
            }

            startX = null;
            startY = null;
            isScrolling = null;
        });
    }

    function handleTitleInput() {
        const title = titleInput.value;
        const charCount = title.length;
        titleCharCount.textContent = `${charCount}`;
        
        if (charCount > 100) {
            titleCharCount.style.color = '#ff4444';
        } else {
            titleCharCount.style.color = '#666';
        }
        
        checkFormValidity();
    }

    function handleContentInput() {
        const content = contentInput.value;
        const charCount = content.length;
        contentCharCount.textContent = `${charCount}`;
        
        if (charCount > 2000) {
            contentCharCount.style.color = '#ff4444';
        } else {
            contentCharCount.style.color = '#666';
        }
        
        checkFormValidity();
    }

    function updateCharCount() {
        handleTitleInput();
        handleContentInput();
    }

    async function handleSubmit() {
        if (!checkFormValidity()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (title.length > 100) {
            alert('제목은 100자 이내로 입력해주세요.');
            return;
        }

        if (content.length > 2000) {
            alert('내용은 2000자 이내로 입력해주세요.');
            return;
        }

        submitBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);

            // 기존 이미지 경로들 추가 (수정 모드에서)
            if (isEditMode) {
                const existingImages = uploadedFiles
                    .filter(file => file.isExisting)
                    .map(file => file.originalPath);
                
                existingImages.forEach(path => {
                    formData.append('existingImages', path);
                });
            }

            // 새로 추가된 파일들만 추가
            uploadedFiles
                .filter(file => !file.isExisting && file.file)
                .forEach(fileObj => {
                    formData.append('postImages', fileObj.file);
                });

            const url = isEditMode ? `/api/post/${editPostId}` : '/api/createPost';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                alert(isEditMode ? '게시물이 성공적으로 수정되었습니다!' : '게시물이 성공적으로 등록되었습니다!');
                window.location.href = '/index.html';
            } else {
                alert(result.message || (isEditMode ? '게시물 수정에 실패했습니다.' : '게시물 등록에 실패했습니다.'));
            }
        } catch (error) {
            console.error('게시물 처리 중 오류:', error);
            alert(isEditMode ? '게시물 수정 중 오류가 발생했습니다.' : '게시물 등록 중 오류가 발생했습니다.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isEditMode ? '✓' : '→';
        }
    }

    function checkFormValidity() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const isValid = title.length > 0 && content.length > 0 && 
                        title.length <= 100 && content.length <= 2000;
        
        submitBtn.disabled = !isValid;
        return isValid;
    }

    function goBack() {
        if (confirm('작성 중인 내용이 사라집니다. 정말 나가시겠습니까?')) {
            window.location.href = '/index.html';
        }
    }
});