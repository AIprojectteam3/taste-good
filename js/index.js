function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
}

// =======================================================================================================
// 게시물(카드) 생성 함수
// =======================================================================================================
function createCard(item, isPlaceholder = false) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-post-id', item.id);

    // 슬라이더 컨테이너 생성
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    if (!isPlaceholder) {
        let images = [];
        if (Array.isArray(item.images) && item.images.length > 0) {
            item.images.forEach(img => {
                images.push(img);
            });
        }

        if (!isMobile()) {
            // PC 환경
            const img = document.createElement('img');
            img.src = item.thumbnail_path;
            img.alt = item.title;
            sliderContainer.appendChild(img);
        } else {
            // 모바일 환경
            images.forEach((imgPath, index) => {
                const slide = document.createElement('img');
                slide.className = `slide ${index === 0 ? 'active' : ''}`;
                slide.src = imgPath;
                slide.alt = item.title;
                sliderContainer.appendChild(slide);
            });

            // 네비게이션 버튼 추가
            const prevBtn = document.createElement('button');
            prevBtn.className = 'slide-nav prev';
            prevBtn.innerHTML = '‹';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'slide-nav next';
            nextBtn.innerHTML = '›';

            sliderContainer.appendChild(prevBtn);
            sliderContainer.appendChild(nextBtn);

            // 슬라이드 이동 함수
            let currentSlide = 0;
            function showSlide(idx) {
                if (idx < 0 || idx >= images.length) return;
                currentSlide = idx;

                const slideEls = sliderContainer.querySelectorAll('.slide');
                slideEls.forEach((el, i) => {
                    el.classList.toggle('active', i === currentSlide);
                    el.style.opacity = i === currentSlide ? '1' : '0';
                });

                prevBtn.disabled = currentSlide === 0;
                nextBtn.disabled = currentSlide === images.length - 1;
                prevBtn.classList.toggle('disabled', currentSlide === 0);
                nextBtn.classList.toggle('disabled', currentSlide === images.length - 1);
            }

            showSlide(0);

            prevBtn.addEventListener('click', e => {
                e.stopPropagation();
                showSlide(currentSlide - 1);
            });

            nextBtn.addEventListener('click', e => {
                e.stopPropagation();
                showSlide(currentSlide + 1);
            });

            let touchStartX = null;
            let touchEndX = null;

            sliderContainer.addEventListener('touchstart', e => {
                if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
            });

            sliderContainer.addEventListener('touchend', e => {
                if (touchStartX === null) return;
                touchEndX = e.changedTouches[0].clientX;

                if (touchStartX - touchEndX > 40 && currentSlide < images.length - 1) {
                    showSlide(currentSlide + 1);
                } else if (touchEndX - touchStartX > 40 && currentSlide > 0) {
                    showSlide(currentSlide - 1);
                }

                touchStartX = null;
                touchEndX = null;
            });
        }
    }

    card.appendChild(sliderContainer);

    // 작성자 정보 추가
    const postUserDiv = document.createElement('div');
    postUserDiv.className = 'post-user';

    const profileImg = document.createElement('img');
    if (!isPlaceholder) {
        profileImg.src = item.author_profile_path || 'image/profile-icon.png';
        profileImg.alt = (item.author_username || '사용자') + ' 프로필';
    } else {
        profileImg.src = 'image/profile-icon.png';
        profileImg.alt = '사용자 프로필';
    }
    profileImg.className = 'user-profile-img';

    const nicknameSpan = document.createElement('span');
    nicknameSpan.className = 'user-nickname';
    if (!isPlaceholder) {
        nicknameSpan.textContent = item.author_username;
    } else {
        nicknameSpan.textContent = '사용자';
    }

    postUserDiv.appendChild(profileImg);
    postUserDiv.appendChild(nicknameSpan);

    // 모바일에서만 수정/삭제 버튼 추가
    if (isMobile() && !isPlaceholder) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'post-action-buttons';

        const editBtn = document.createElement('button');
        editBtn.className = 'post-edit-btn';
        editBtn.textContent = '수정';
        editBtn.setAttribute('data-post-id', item.id);
        editBtn.setAttribute('data-author-id', item.user_id);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'post-delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.setAttribute('data-post-id', item.id);
        deleteBtn.setAttribute('data-author-id', item.user_id);

        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(deleteBtn);
        postUserDiv.appendChild(buttonContainer);
    }

    card.appendChild(postUserDiv);

    // 오버레이
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    // 중앙 타이틀+콘텐츠
    const centerBox = document.createElement('div');
    centerBox.className = 'card-center-box';

    const title = document.createElement('div');
    title.className = 'card-center-title';
    title.textContent = isPlaceholder ? '타이틀' : item.title;

    const cutStringNum = 80;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-center-content';

    if (!isMobile()) {
        contentDiv.textContent = isPlaceholder ? '임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠' : 
            item.content.length > cutStringNum ? item.content.substring(0, cutStringNum) + '...' : item.content;
    } else {
        contentDiv.textContent = isPlaceholder ? '임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠, 임시 콘텐츠' : item.content;
    }

    centerBox.appendChild(title);
    centerBox.appendChild(contentDiv);

    // 모바일에서만 더보기 버튼 추가
    if (isMobile()) {
        const readmoreBtn = document.createElement('button');
        readmoreBtn.className = 'read-more-btn';
        readmoreBtn.textContent = '더보기';
        readmoreBtn.style.display = 'none';
        centerBox.appendChild(readmoreBtn);
    }

    overlay.appendChild(centerBox);
    card.appendChild(overlay);

    const commentInput = document.createElement('div');
    commentInput.className = 'commentInputM';
    overlay.appendChild(commentInput);

    commentInput.innerHTML = `
        <div class = "iconDiv">
            <img src = "../image/heart-icon.png" alt = "좋아요">
            <img src = "../image/SpeechBubble-icon.png" alt = "댓글" class = "comment-icon" data-post-id = "${item.id}">
        </div>
        <input class = "comInput" name = "commentM" type = "text" placeholder = "댓글 입력" data-post-id = "${item.id}">
    `;

    return card;
}

// =======================================================================================================
// 게시물 수정 함수
// =======================================================================================================
async function editPost(postId) {
    try {
        // 게시물 정보 가져오기
        const response = await fetch(`/api/post/${postId}`);
        if (!response.ok) {
            throw new Error('게시물 정보를 가져올 수 없습니다.');
        }
        
        const post = await response.json();
        
        // 수정 폼 표시 (간단한 prompt 사용, 추후 모달로 개선 가능)
        const newTitle = prompt('제목을 수정하세요:', post.title);
        if (newTitle === null) return; // 취소
        
        const newContent = prompt('내용을 수정하세요:', post.content);
        if (newContent === null) return; // 취소
        
        if (!newTitle.trim() || !newContent.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        // 수정 요청
        const updateResponse = await fetch(`/api/post/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTitle.trim(),
                content: newContent.trim(),
                existingImages: post.images || []
            })
        });

        const result = await updateResponse.json();
        
        if (result.success) {
            alert('게시물이 수정되었습니다.');
            // 페이지 새로고침하여 변경사항 반영
            location.reload();
        } else {
            alert(result.message || '게시물 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('게시물 수정 중 오류:', error);
        alert('게시물 수정 중 오류가 발생했습니다.');
    }
}

// =======================================================================================================
// 게시물 삭제 함수
// =======================================================================================================
async function deletePost(postId) {
    try {
        const deleteConfirm = confirm('정말로 이 게시물을 삭제하시겠습니까?');
        if (!deleteConfirm) return;

        const response = await fetch(`/api/post/${postId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            alert('게시물이 삭제되었습니다.');
            // 페이지 새로고침하여 변경사항 반영
            location.reload();
        } else {
            alert(result.message || '게시물 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('게시물 삭제 중 오류:', error);
        alert('게시물 삭제 중 오류가 발생했습니다.');
    }
}

// =======================================================================================================
// 권한 확인 함수
// =======================================================================================================
async function checkPostPermission(authorId, action) {
    try {
        // 현재 로그인한 사용자 정보 가져오기
        const userResponse = await fetch('/api/user');
        const currentUser = await userResponse.json();
        
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return false;
        }

        // 작성자 본인인지 확인
        if (currentUser.id !== authorId) {
            alert(`본인이 작성한 게시물만 ${action}할 수 있습니다.`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('권한 확인 중 오류:', error);
        alert('권한 확인 중 오류가 발생했습니다.');
        return false;
    }
}

function setupMobileCardSliderAndReadMore() {
    if (!isMobile()) {
        document.querySelectorAll('.card .read-more-btn').forEach(btn => {
            btn.style.display = 'none';
            const contentDiv = btn.closest('.card-center-box')?.querySelector('.card-center-content');
            if (contentDiv) {
                contentDiv.classList.remove('expanded');
            }
        });
        return;
    }

    const cardContainer = document.querySelector('.content');
    if (!cardContainer) return;

    // 이벤트 위임으로 버튼 처리
    cardContainer.addEventListener('click', function(event) {
        // 더보기 버튼 처리
        if (event.target.classList.contains('read-more-btn')) {
            const btn = event.target;
            const contentDiv = btn.closest('.card-center-box')?.querySelector('.card-center-content');
            if (contentDiv) {
                contentDiv.classList.toggle('expanded');
                btn.textContent = contentDiv.classList.contains('expanded') ? '닫기' : '더보기';
                if (!contentDiv.classList.contains('expanded')) {
                    contentDiv.scrollTop = 0;
                }
            }
        }

        // 수정 버튼 처리
        if (event.target.classList.contains('post-edit-btn')) {
            event.stopPropagation();
            const postId = event.target.getAttribute('data-post-id');
            const authorId = parseInt(event.target.getAttribute('data-author-id'));
            
            if (postId && authorId) {
                checkPostPermission(authorId, '수정').then(hasPermission => {
                    if (hasPermission) {
                        editPost(postId);
                    }
                });
            }
        }

        // 삭제 버튼 처리
        if (event.target.classList.contains('post-delete-btn')) {
            event.stopPropagation();
            const postId = event.target.getAttribute('data-post-id');
            const authorId = parseInt(event.target.getAttribute('data-author-id'));
            
            if (postId && authorId) {
                checkPostPermission(authorId, '삭제').then(hasPermission => {
                    if (hasPermission) {
                        deletePost(postId);
                    }
                });
            }
        }

        // 슬라이드 네비게이션 처리
        if (event.target.classList.contains('slide-nav')) {
            event.stopPropagation();
            const navBtn = event.target;
            const slider = navBtn.closest('.slider-container');
            if (!slider) return;

            const slides = Array.from(slider.querySelectorAll('.slide'));
            if (slides.length <= 1) return;

            let activeIndex = slides.findIndex(slide => slide.classList.contains('active'));

            slides[activeIndex].classList.remove('active');

            if (navBtn.classList.contains('prev')) {
                activeIndex = (activeIndex - 1 + slides.length) % slides.length;
            } else if (navBtn.classList.contains('next')) {
                activeIndex = (activeIndex + 1) % slides.length;
            }

            slides[activeIndex].classList.add('active');

            const prevButton = slider.querySelector('.slide-nav.prev');
            const nextButton = slider.querySelector('.slide-nav.next');
            if (prevButton && nextButton) {
                prevButton.disabled = activeIndex === 0;
                nextButton.disabled = activeIndex === slides.length - 1;
                prevButton.classList.toggle('disabled', activeIndex === 0);
                nextButton.classList.toggle('disabled', activeIndex === slides.length - 1);
            }
        }
    });

    // 더보기 버튼 표시 여부 결정 (DOM이 완전히 렌더링된 후)
    setTimeout(() => {
        document.querySelectorAll('.card').forEach(function(cardElement) {
            const content = cardElement.querySelector('.card-center-content');
            const btn = cardElement.querySelector('.read-more-btn');

            if (content && btn) {
                if (content.scrollHeight > content.clientHeight) {
                    btn.style.display = 'block';
                    btn.textContent = '더보기';
                } else {
                    btn.style.display = 'none';
                }
                content.classList.remove('expanded');
            }
        });
    }, 100);
}

async function renderCards() {
    const cardContainer = document.querySelector('.content');
    cardContainer.innerHTML = '';

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const cardElement = createCard(post);
                if (cardElement) {
                    cardContainer.appendChild(cardElement);
                }
            });
        } else {
            cardContainer.innerHTML = '<p>게시물이 없습니다.</p>';
        }
        
        adjustGridRows();
        setupMobileCardSliderAndReadMore(); // 카드 렌더링 후 호출
    } catch (error) {
        console.error('게시물 데이터를 가져오는 중 오류 발생:', error);
        cardContainer.innerHTML = '<p>게시물을 불러오는 데 실패했습니다.</p>';
    }
}

function adjustGridRows() {
    if (isMobile()) return;
    requestAnimationFrame(() => {
        const grid = document.querySelector('.content');
        const cards = grid.querySelectorAll('.card:not(.hidden)');
        if (cards.length === 0) return;

        const cardWidth = cards[0].offsetWidth;
        grid.style.gridAutoRows = `${cardWidth}px`;

        cards.forEach(card => {
            card.style.height = `${cardWidth}px`;
        });

        const container = document.querySelector('.container');
        if (container) {
            container.style.height = `${grid.scrollHeight}px`;
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderCards();

    let lastIsMobile = isMobile();

    window.addEventListener('resize', function() {
        const nowIsMobile = isMobile();
        if (lastIsMobile !== nowIsMobile) {
            location.reload();
        }
        lastIsMobile = nowIsMobile;
    });

    window.addEventListener('resize', () => {
        adjustGridRows();
    });
});
