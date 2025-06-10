document.addEventListener('DOMContentLoaded', function() {
    const MAX_FILES = 8;
    let uploadedFiles = [];
    let currentSlideIndex = 0;
    let draggedItem = null;

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
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
    backButton.addEventListener('click', goBack);
    document.body.appendChild(backButton);

    // 플로팅 액션 버튼 생성
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-floating-btn';
    submitBtn.innerHTML = '<i class="fas fa-check"></i>';
    submitBtn.disabled = true;
    document.body.appendChild(submitBtn);

    // 초기화
    init();

    function init() {
        updateSliderView();
        setupEventListeners();
        checkFormValidity();
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
                <span class="mobile-add-text">사진 추가</span>
            </div>
        `;
        addSlide.addEventListener('click', () => imageUpload.click());
        sliderMain.appendChild(addSlide);

        // 사진 추가 썸네일
        const addThumb = document.createElement('div');
        addThumb.className = 'thumbnail-add-btn';
        addThumb.innerHTML = '<i class="fas fa-plus"></i>';
        addThumb.addEventListener('click', () => {
            showSlide(uploadedFiles.length);
            imageUpload.click();
        });
        thumbnails.appendChild(addThumb);

        showSlide(currentSlideIndex);
    }

    function showSlide(index) {
        const totalSlides = uploadedFiles.length + 1;
        
        if (index < 0) index = 0;
        if (index >= totalSlides) index = totalSlides - 1;
        
        currentSlideIndex = index;

        // 슬라이드 표시
        const slides = sliderMain.querySelectorAll('.mobile-slide');
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlideIndex);
        });

        // 썸네일 활성화
        const thumbs = thumbnails.querySelectorAll('.thumbnail-item');
        thumbs.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentSlideIndex);
        });

        // 인디케이터 활성화
        const dots = indicators.querySelectorAll('.indicator-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlideIndex);
        });

        updateNavigation();
    }

    function updateNavigation() {
        const totalSlides = uploadedFiles.length + 1;
        
        if (totalSlides <= 1) {
            navPrev.style.display = 'none';
            navNext.style.display = 'none';
        } else {
            navPrev.style.display = 'block';
            navNext.style.display = 'block';
            navPrev.disabled = currentSlideIndex === 0;
            navNext.disabled = currentSlideIndex === totalSlides - 1;
        }

        // 인디케이터 표시/숨김
        indicators.style.display = uploadedFiles.length > 1 ? 'flex' : 'none';
    }

    function deleteImage(index) {
        URL.revokeObjectURL(uploadedFiles[index].blobUrl);
        uploadedFiles.splice(index, 1);
        
        if (currentSlideIndex >= uploadedFiles.length) {
            currentSlideIndex = Math.max(0, uploadedFiles.length - 1);
        }
        
        updateSliderView();
        checkFormValidity();
    }

    function setupDragEvents(container) {
        container.addEventListener('dragstart', handleDragStart);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
        container.addEventListener('dragend', handleDragEnd);
    }

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.thumbnail-container');
        if (target && target !== draggedItem) {
            document.querySelectorAll('.thumbnail-container.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
            target.classList.add('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.thumbnail-container');
        
        if (target && draggedItem !== target) {
            const fromIndex = parseInt(draggedItem.dataset.index);
            const toIndex = parseInt(target.dataset.index);
            
            const item = uploadedFiles.splice(fromIndex, 1)[0];
            uploadedFiles.splice(toIndex, 0, item);
            
            if (currentSlideIndex === fromIndex) {
                currentSlideIndex = toIndex;
            } else if (fromIndex < currentSlideIndex && toIndex >= currentSlideIndex) {
                currentSlideIndex--;
            } else if (fromIndex > currentSlideIndex && toIndex <= currentSlideIndex) {
                currentSlideIndex++;
            }
            
            updateSliderView();
        }
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        document.querySelectorAll('.thumbnail-container.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        draggedItem = null;
    }

    function setupTouchEvents() {
        let touchStartX = null;
        let touchEndX = null;

        sliderMain.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        sliderMain.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            
            if (touchStartX && touchEndX) {
                const diff = touchStartX - touchEndX;
                
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        showSlide(currentSlideIndex + 1);
                    } else {
                        showSlide(currentSlideIndex - 1);
                    }
                }
            }
            
            touchStartX = null;
            touchEndX = null;
        });
    }

    function handleTitleInput() {
        const length = titleInput.value.length;
        titleCharCount.textContent = length;
        
        if (length > 100) {
            titleInput.value = titleInput.value.substring(0, 100);
            titleCharCount.textContent = 100;
        }
        
        checkFormValidity();
    }

    function handleContentInput() {
        const length = contentInput.value.length;
        contentCharCount.textContent = length;
        
        if (length > 2000) {
            contentInput.value = contentInput.value.substring(0, 2000);
            contentCharCount.textContent = 2000;
        }
        
        checkFormValidity();
    }

    function checkFormValidity() {
        const hasTitle = titleInput.value.trim().length > 0;
        const hasContent = contentInput.value.trim().length > 0;
        
        submitBtn.disabled = !(hasTitle && hasContent);
    }

    async function handleSubmit() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!title || !content) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            
            uploadedFiles.forEach(item => {
                if (item.file) {
                    formData.append('postImages', item.file);
                }
            });

            const response = await fetch('/api/createPost', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                alert('게시물이 성공적으로 등록되었습니다.');
                window.location.href = '/index.html';
            } else {
                throw new Error(result.message || '게시물 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('게시물 등록 오류:', error);
            alert(error.message || '게시물 등록 중 오류가 발생했습니다.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i>';
        }
    }

    function goBack() {
        if (uploadedFiles.length > 0 || titleInput.value.trim() || contentInput.value.trim()) {
            if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
                window.history.back();
            }
        } else {
            window.history.back();
        }
    }
});
