let modalLikedPosts = [];

// 게시물 모달을 표시하는 함수=
async function displayPostModal(postId) {
    try {
        // 1. 현재 로그인한 사용자 정보 가져오기
        let currentUserId = sessionStorage.getItem('loggedInUserId');
        // sessionStorage에 없으면 서버에서 가져오기
        if (!currentUserId) {
            try {
                const userResponse = await fetch('/api/user');
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    if (userData && userData.id) {
                        currentUserId = userData.id.toString();
                        // sessionStorage에도 저장 (다음번 사용을 위해)
                        sessionStorage.setItem('loggedInUserId', currentUserId);
                        console.log("서버에서 사용자 ID를 가져와 sessionStorage에 저장:", currentUserId);
                    }
                }
            } catch (userError) {
                console.error('사용자 정보 가져오기 실패:', userError);
            }
        }

        // 2. 게시물 상세 정보 가져오기
        const response = await fetch(`/api/post/${postId}`);
        if (!response.ok) {
            throw new Error(`HTTP 오류! 상태: ${response.status}`);
        }

        const postDetail = await response.json();
        // console.log("현재 사용자 ID:", currentUserId);
        // console.log("게시물 작성자 ID:", postDetail.user_id);

        // 3. 모달창의 각 HTML 요소를 선택합니다.
        const modalOverlay = document.getElementById('index-modal');
        const slideContainerDiv = modalOverlay.querySelector('.slide-container');
        const mainSlideImg = slideContainerDiv.querySelector('.slide-img');
        const slideThumbnailsDiv = slideContainerDiv.querySelector('.slide-thumbnails');
        const userProfileImg = modalOverlay.querySelector('.post-user .user-profile-img img');
        const userNicknameSpan = modalOverlay.querySelector('.post-user .user-nickname > span:first-child');
        const postTitleH3 = modalOverlay.querySelector('.post-title');
        const postContentDiv = modalOverlay.querySelector('.post-content');
        const postContentSpan = modalOverlay.querySelector('.post-content-text');
        const postCommentDiv = modalOverlay.querySelector('.post-comment');
        const readMoreBtn = modalOverlay.querySelector('.read-more-btn');
        const prevButton = modalOverlay.querySelector('.slide-nav.prev');
        const nextButton = modalOverlay.querySelector('.slide-nav.next');

        let currentImageIndex = 0;
        let images = [];

        // 이미지 업데이트 함수
        function updateSlideView() {
            if (images.length > 0) {
                mainSlideImg.src = images[currentImageIndex];
                mainSlideImg.alt = `${postDetail.title} 이미지 ${currentImageIndex + 1}`;

                slideThumbnailsDiv.querySelectorAll('.slide-thumb').forEach(thumb => {
                    thumb.classList.remove('active');
                });

                const activeThumb = slideThumbnailsDiv.querySelector(`.slide-thumb[data-index="${currentImageIndex}"]`);
                if (activeThumb) {
                    activeThumb.classList.add('active');
                    activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            } else {
                mainSlideImg.src = "";
                mainSlideImg.alt = "이미지 없음";
            }

            if (prevButton && nextButton) {
                prevButton.disabled = images.length <= 1 || currentImageIndex === 0;
                nextButton.disabled = images.length <= 1 || currentImageIndex === images.length - 1;
            }
        }

        // 4. 이미지 슬라이드 및 썸네일 설정
        if (postDetail.images && postDetail.images.length > 0) {
            images = postDetail.images;
            currentImageIndex = 0;

            slideThumbnailsDiv.innerHTML = '';
            images.forEach((imagePath, index) => {
                const thumbImg = document.createElement('img');
                thumbImg.classList.add('slide-thumb');
                thumbImg.src = imagePath;
                thumbImg.alt = `썸네일 ${index + 1}`;
                thumbImg.dataset.index = index;

                thumbImg.addEventListener('click', () => {
                    currentImageIndex = index;
                    updateSlideView();
                });

                slideThumbnailsDiv.appendChild(thumbImg);
            });

            updateSlideView();

            // 이전/다음 버튼 이벤트 리스너
            if (prevButton) {
                if (prevButton._clickHandler) {
                    prevButton.removeEventListener('click', prevButton._clickHandler);
                }

                prevButton._clickHandler = () => {
                    if (currentImageIndex > 0) {
                        currentImageIndex--;
                        updateSlideView();
                    }
                };

                prevButton.addEventListener('click', prevButton._clickHandler);
            }

            if (nextButton) {
                if (nextButton._clickHandler) {
                    nextButton.removeEventListener('click', nextButton._clickHandler);
                }

                nextButton._clickHandler = () => {
                    if (currentImageIndex < images.length - 1) {
                        currentImageIndex++;
                        updateSlideView();
                    }
                };

                nextButton.addEventListener('click', nextButton._clickHandler);
            }

            // 썸네일 휠 스크롤 이벤트
            const wheelHandler = (event) => {
                if (slideThumbnailsDiv.scrollWidth > slideThumbnailsDiv.clientWidth) {
                    event.preventDefault();
                    slideThumbnailsDiv.scrollLeft += event.deltaY;
                }
            };

            if (slideThumbnailsDiv._wheelHandler) {
                slideThumbnailsDiv.removeEventListener('wheel', slideThumbnailsDiv._wheelHandler);
            }

            slideThumbnailsDiv.addEventListener('wheel', wheelHandler);
            slideThumbnailsDiv._wheelHandler = wheelHandler;
        } else {
            mainSlideImg.src = "";
            mainSlideImg.alt = "이미지 없음";
            slideThumbnailsDiv.innerHTML = '';
        }

        // 5. 작성자 정보 설정
        userProfileImg.src = postDetail.author_profile_path || 'image/profile-icon.png';
        userProfileImg.alt = (postDetail.author_username || "사용자") + " 프로필 사진";
        userNicknameSpan.textContent = postDetail.author_username || "알 수 없는 사용자";

        // 기존 메뉴 제거
        const postMenuContainer = modalOverlay.querySelector('.user-nickname');
        const existingMenu = postMenuContainer.querySelector('.post-actions-menu');
        if (existingMenu) existingMenu.remove();

        // 6. 작성자 확인 및 수정/삭제 버튼 표시
        if (currentUserId && parseInt(currentUserId) === postDetail.user_id) {
            // console.log("현재 사용자와 게시물 작성자가 동일합니다. 수정 및 삭제 버튼 표시.");

            const menuDiv = document.createElement('div');
            menuDiv.classList.add('post-actions-menu');

            const editButton = document.createElement('button');
            editButton.textContent = '수정';
            editButton.classList.add('edit-post-btn');
            editButton.onclick = () => {
                openEditModal(postDetail);
            };

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.classList.add('delete-post-btn');
            deleteButton.onclick = async () => {
                if (confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
                    try {
                        const response = await fetch(`/api/post/${postDetail.id}`, {
                            method: 'DELETE'
                        });

                        const result = await response.json();
                        if (result.success) {
                            alert('게시물이 삭제되었습니다.');
                            modalOverlay.style.display = 'none';
                            const cardToRemove = document.querySelector(`.card[data-post-id="${postDetail.id}"]`);
                            if (cardToRemove) cardToRemove.remove();
                            location.reload();
                        } else {
                            alert(result.message || '게시물 삭제에 실패했습니다.');
                        }
                    } catch (error) {
                        console.error('게시물 삭제 중 오류:', error);
                        alert('게시물 삭제 중 오류가 발생했습니다.');
                    }
                }
            };

            menuDiv.appendChild(editButton);
            menuDiv.appendChild(deleteButton);

            const nicknameContainer = userNicknameSpan.closest('.user-nickname');
            if (nicknameContainer) {
                nicknameContainer.appendChild(menuDiv);
            } else {
                userProfileImg.parentElement.appendChild(menuDiv);
            }
        } else {
            // console.log("작성자가 아니거나 로그인하지 않은 사용자입니다.");
        }

        // 7. 게시물 제목 및 내용 설정
        postTitleH3.textContent = postDetail.title;
        postContentSpan.textContent = postDetail.content;

        // 더보기 버튼 처리
        setTimeout(() => {
            if (postContentDiv && readMoreBtn) {
                const postContentDivContainer = modalOverlay.querySelector('.post-content-div > div');
                // 실제 콘텐츠 높이와 컨테이너 높이 비교
                const hasOverflow = postContentDiv.scrollHeight > postContentDiv.clientHeight;
                // console.log('scrollHeight:', postContentDiv.scrollHeight);
                // console.log('clientHeight:', postContentDiv.clientHeight);
                // console.log('hasOverflow:', hasOverflow);

                if (hasOverflow) {
                    readMoreBtn.style.display = 'block';
                } else {
                    readMoreBtn.style.display = 'none';
                }

                readMoreBtn.onclick = () => {
                    postContentDivContainer.classList.toggle('expanded');
                    postContentDiv.classList.toggle('expanded'); // post-content에도 클래스 추가

                    if (postContentDivContainer.classList.contains('expanded')) {
                        readMoreBtn.textContent = '닫기';
                        // 스크롤을 맨 위로 이동
                        postContentDivContainer.scrollTop = 0;
                    } else {
                        readMoreBtn.textContent = '더보기';
                        postContentDivContainer.scrollTop = 0;
                    }
                };
            }
        }, 10);

        // 8. 댓글 렌더링 함수
        function renderComments(commentsData, commentContainerDiv, currentPostId) {
            commentContainerDiv.innerHTML = '';

            if (commentsData && commentsData.length > 0) {
                commentsData.forEach(comment => {
                    const commentUserDiv = document.createElement('div');
                    commentUserDiv.classList.add('comment-user');
                    commentUserDiv.setAttribute('data-comment-id', comment.id);

                    const profileImgPath = comment.author_profile_path || 'image/profile-icon.png';

                    let commentTextHtml = comment.comment.replace(/\n/g, '<br>');

                    // 댓글 작성자가 현재 로그인한 사용자인지 확인
                    const isCommentOwner = currentUserId && parseInt(currentUserId) === comment.user_id;

                    commentUserDiv.innerHTML = `
                        <div class="comment-div">
                            <div class="user-profile-img">
                                <img src="${profileImgPath}" alt="${comment.author_username} 프로필">
                            </div>
                            <div class="comment-main">
                                <span class="comment-user-nickname">${comment.author_username}</span>
                                <p class="comment-content">${commentTextHtml}</p>
                            </div>
                        </div>
                        <div class="comment-right">
                            <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                            ${isCommentOwner ? `
                                <div class="comment-actions">
                                    <button class="edit-comment-btn" data-comment-id="${comment.id}">
                                        <img class = "edit-comment-btn-img" src = "image/postedit-icon.png" alt="수정">
                                    </button>
                                    <button class="delete-comment-btn" data-comment-id="${comment.id}">
                                        <img class = "delete-comment-btn-img" src = "image/recycle-icon.png" alt="삭제">
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;

                    commentContainerDiv.appendChild(commentUserDiv);
                });
            } else {
                commentContainerDiv.innerHTML = '<div class="no-comment">댓글이 없습니다.</div>';
            }
        }

        // --- 댓글 작성 기능 ---
        const commentInputElement = modalOverlay.querySelector('.comment-input');
        const commentSubmitButton = modalOverlay.querySelector('.comment-submit');

        if (commentInputElement && commentSubmitButton) {
            const handleCommentSubmit = async () => {
                const commentText = commentInputElement.value.trim();
                if (!commentText) {
                    alert('댓글 내용을 입력해주세요.');
                    return;
                }

                if (!postDetail || typeof postDetail.id === 'undefined') {
                    console.error('댓글 작성 시 postDetail 또는 postDetail.id를 찾을 수 없습니다.');
                    alert('게시물 정보를 찾을 수 없어 댓글을 등록할 수 없습니다.');
                    return;
                }
                const currentPostId = postDetail.id;

                try {
                    const response = await fetch(`/api/post/${currentPostId}/comment`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ comment: commentText }),
                    });
                    const result = await response.json();

                    if (result.success && result.comment) {
                        commentInputElement.value = '';

                        if (!postDetail.comments || !Array.isArray(postDetail.comments)) {
                            console.warn(
                                "postDetail.comments가 배열이 아니거나 undefined였습니다. 빈 배열로 초기화합니다.",
                                "현재 postDetail.comments 상태:", postDetail.comments,
                                "전체 postDetail 객체:", JSON.parse(JSON.stringify(postDetail))
                            );
                            postDetail.comments = [];
                        }
                        postDetail.comments.push(result.comment);
                        renderComments(postDetail.comments, postCommentDiv, currentPostId);
                        postCommentDiv.scrollTop = postCommentDiv.scrollHeight;
                    } else {
                        alert(result.message || '댓글 등록에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('댓글 등록 중 오류:', error);
                    alert('댓글 등록 중 오류가 발생했습니다.');
                }
            };

            commentSubmitButton.onclick = handleCommentSubmit;

            const enterKeyListener = (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    commentSubmitButton.click();
                }
            };

            if (commentInputElement._enterKeyListener) {
                commentInputElement.removeEventListener('keydown', commentInputElement._enterKeyListener);
            }
            commentInputElement.addEventListener('keydown', enterKeyListener);
            commentInputElement._enterKeyListener = enterKeyListener;

        } else {
            console.warn("댓글 입력 필드(.comment-input) 또는 등록 버튼(.comment-submit)을 모달에서 찾을 수 없습니다.");
        }

        // 댓글 수정/삭제 기능 설정
        function setupCommentActions(container, postId) {
            // 기존 이벤트 리스너 제거
            const existingHandler = container._commentActionHandler;
            if (existingHandler) {
                container.removeEventListener('click', existingHandler);
            }

            // 새로운 이벤트 핸들러 함수 생성
            const commentActionHandler = async (e) => {
                // 수정 버튼 이벤트
                if (e.target.classList.contains('edit-comment-btn') || e.target.classList.contains('edit-comment-btn-img')) {
                    // 댓글 ID 가져오기 - 이미지를 클릭한 경우 부모 버튼에서 가져오기
                    let commentId;
                    if (e.target.classList.contains('edit-comment-btn-img')) {
                        // 이미지를 클릭한 경우, 부모 버튼에서 data-comment-id 가져오기
                        commentId = e.target.closest('.edit-comment-btn').getAttribute('data-comment-id');
                    } else {
                        // 버튼을 직접 클릭한 경우
                        commentId = e.target.getAttribute('data-comment-id');
                    }

                    console.log('수정할 댓글 ID:', commentId); // 디버깅용

                    if (!commentId) {
                        alert('댓글 ID를 찾을 수 없습니다.');
                        return;
                    }

                    const commentElement = e.target.closest('.comment-user');
                    const commentContentElement = commentElement.querySelector('.comment-content');
                    const currentText = commentContentElement.textContent;

                    // 수정 모드로 전환
                    const editContainer = document.createElement('div');
                    editContainer.classList.add('comment-edit-container');
                    editContainer.innerHTML = `
                        <textarea class="comment-edit-textarea">${currentText}</textarea>
                        <div class="comment-edit-btn-div">
                            <button class="comment-save-btn" data-comment-id="${commentId}">저장</button>
                            <button class="comment-cancel-btn">취소</button>
                        </div>
                    `;

                    // 기존 내용을 숨기고 수정 폼 표시
                    commentContentElement.style.display = 'none';
                    commentContentElement.parentNode.insertBefore(editContainer, commentContentElement.nextSibling);

                    // 저장 버튼 이벤트
                    editContainer.querySelector('.comment-save-btn').addEventListener('click', async () => {
                        const newCommentText = editContainer.querySelector('.comment-edit-textarea').value.trim();

                        if (!newCommentText) {
                            alert('댓글 내용을 입력해주세요.');
                            return;
                        }

                        try {
                            const response = await fetch(`/api/comment/${commentId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ comment: newCommentText })
                            });

                            const result = await response.json();

                            if (result.success) {
                                // 수정된 내용으로 업데이트
                                commentContentElement.innerHTML = newCommentText.replace(/\n/g, '<br>');
                                commentContentElement.style.display = 'block';
                                editContainer.remove();
                            } else {
                                alert(result.message || '댓글 수정에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('댓글 수정 중 오류:', error);
                            alert('댓글 수정 중 오류가 발생했습니다.');
                        }
                    });

                    // 취소 버튼 이벤트
                    editContainer.querySelector('.comment-cancel-btn').addEventListener('click', () => {
                        commentContentElement.style.display = 'block';
                        editContainer.remove();
                    });
                }

                // 삭제 버튼 이벤트
                if (e.target.classList.contains('delete-comment-btn') || e.target.classList.contains('delete-comment-btn-img')) {
                    let commentId;
                    if (e.target.classList.contains('delete-comment-btn-img')) {
                        commentId = e.target.closest('.delete-comment-btn').getAttribute('data-comment-id');
                    } else {
                        commentId = e.target.getAttribute('data-comment-id');
                    }

                    console.log('삭제할 댓글 ID:', commentId); // 디버깅용

                    if (!commentId) {
                        alert('댓글 ID를 찾을 수 없습니다.');
                        return;
                    }

                    if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
                        try {
                            const response = await fetch(`/api/comment/${commentId}`, {
                                method: 'DELETE'
                            });

                            const result = await response.json();

                            if (result.success) {
                                // 댓글 요소 제거
                                const commentElement = e.target.closest('.comment-user');
                                commentElement.remove();
                            } else {
                                alert(result.message || '댓글 삭제에 실패했습니다.');
                            }
                        } catch (error) {
                            console.error('댓글 삭제 중 오류:', error);
                            alert('댓글 삭제 중 오류가 발생했습니다.');
                        }
                    }
                }
            };

            // 새로운 이벤트 리스너 등록
            container.addEventListener('click', commentActionHandler);
            container._commentActionHandler = commentActionHandler; // 나중에 제거하기 위해 저장
        }

        // 좋아요 상태 확인 및 UI 업데이트
        async function updateLikeStatus() {
            try {
                // 현재 사용자의 모든 좋아요한 게시물 목록 가져오기
                const likeResponse = await fetch('/api/posts/likes');
                if (likeResponse.ok) {
                    const likeData = await likeResponse.json();
                    modalLikedPosts = likeData.likedPosts || []; // 전역 배열 업데이트
                    
                    // console.log('사용자 좋아요 목록:', modalLikedPosts);
                    // console.log('현재 게시물 ID:', postId);
                    
                } else {
                    console.warn('좋아요 상태를 가져올 수 없습니다.');
                    modalLikedPosts = []; // 빈 배열로 초기화
                }
            } catch (error) {
                console.error('좋아요 상태 확인 중 오류:', error);
                modalLikedPosts = []; // 오류 시 빈 배열로 초기화
            }
        }

        // 좋아요 상태 업데이트 함수 호출
        await updateLikeStatus();

        const communityBtnDiv = modalOverlay.querySelector('.communityBtn');
        if (communityBtnDiv) {
            // 기존 좋아요 관련 요소들 모두 제거
            const existingHeartBtns = communityBtnDiv.querySelectorAll('.heartBtn');
            const existingLikeCounts = communityBtnDiv.querySelectorAll('.like-count');
            
            existingHeartBtns.forEach(btn => btn.remove());
            existingLikeCounts.forEach(count => count.remove());
            
            // 좋아요 상태 확인
            const isLiked = modalLikedPosts.includes(parseInt(postId));
            const heartIcon = isLiked ? 'image/heart-red.png' : 'image/heart-icon.png';
            const likedClass = isLiked ? 'liked' : '';
            
            // 하트 버튼 생성
            const heartBtn = document.createElement('button');
            heartBtn.className = `heartBtn ${likedClass}`;
            heartBtn.setAttribute('data-post-id', postId);
            
            const heartImg = document.createElement('img');
            heartImg.src = heartIcon;
            heartImg.alt = '좋아요';
            
            heartBtn.appendChild(heartImg);
            
            // 좋아요 수 표시
            const likeCount = document.createElement('span');
            likeCount.className = 'like-count';
            likeCount.textContent = postDetail.likes || 0;
            
            // communityBtn의 첫 번째 자식으로 삽입
            communityBtnDiv.insertBefore(likeCount, communityBtnDiv.firstChild);
            communityBtnDiv.insertBefore(heartBtn, communityBtnDiv.firstChild);
        }

        // 댓글 목록 표시
        renderComments(postDetail.comments, postCommentDiv, postId);
        setupCommentActions(postCommentDiv, postId);

        // 9. 모달 표시
        modalOverlay.style.display = 'flex';

        const heartBtn = modalOverlay.querySelector('.heartBtn');
        if (heartBtn) {
            heartBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await handleLikeClick(postId, heartBtn);
            });
        }

    } catch (error) {
        console.error('게시물 모달 표시 중 오류:', error);
        alert('게시물을 불러오는 중 오류가 발생했습니다.');
    }
}

async function handleLikeClick(postId, heartBtn) {
    try {
        const response = await fetch(`/api/post/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const heartImg = heartBtn.querySelector('img');
            const likeCountElement = heartBtn.parentNode.querySelector('.like-count');
            
            // 애니메이션 클래스 추가
            heartBtn.classList.add('animating');
            
            // 애니메이션 완료 후 상태 업데이트
            setTimeout(() => {
                if (result.liked) {
                    heartImg.src = 'image/heart-red.png';
                    heartBtn.classList.add('liked');
                    if (!modalLikedPosts.includes(postId)) {
                        modalLikedPosts.push(postId);
                    }
                } else {
                    heartImg.src = 'image/heart-icon.png';
                    heartBtn.classList.remove('liked');
                    modalLikedPosts = modalLikedPosts.filter(id => id !== postId);
                }
                
                // 좋아요 수 업데이트
                if (likeCountElement) {
                    likeCountElement.textContent = result.likes || 0;
                }
                
                heartBtn.classList.remove('animating');
            }, 300);
        } else {
            alert(result.message || '좋아요 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('좋아요 처리 중 오류:', error);
        alert('좋아요 처리 중 오류가 발생했습니다.');
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 이벤트 위임(Event Delegation)을 사용하여 게시물 카드 클릭 처리
    const cardContainer = document.querySelector('.content'); // 카드 컨테이너 선택자 (index.html에 따름)

    if (cardContainer) {
        cardContainer.addEventListener('click', function(event) {
            const clickedCard = event.target.closest('.card');
            if (clickedCard) {
                if (!isMobile()) {
                    const postId = clickedCard.getAttribute('data-post-id');
                    if (postId) {
                        displayPostModal(postId); // PC 환경에서만 displayPostModal 호출
                    } else {
                        console.warn(`클릭된 카드에서 'data-post-id' 속성을 찾을 수 없습니다.`);
                    }
                } else {
                    // console.log("게시물 카드 클릭됨 (모바일 환경 - 모달 표시 안 함). screenWidth:", screenWidth);
                    // 모바일 환경에서는 다른 동작을 하도록 설정할 수 있습니다.
                    // (예: alert('모바일에서는 상세 페이지로 이동합니다.'); 또는 특정 함수 호출)
                    // 현재는 아무 작업도 하지 않습니다.
                }
                // [수정된 부분 끝]
            }
        });
    } else {
        console.warn("'.content' (카드 컨테이너) 요소를 찾을 수 없습니다. 카드 클릭 이벤트 리스너가 설정되지 않았습니다.");
    }

    // 모달 닫기 기능
    const modalOverlay = document.getElementById('index-modal');
    const closeButton = modalOverlay.querySelector('.close-area'); // HTML에 정의된 닫기 버튼 선택자

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    } else {
        console.warn("모달 닫기 버튼 ('.close-area')을 찾을 수 없습니다.");
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalOverlay.style.display === 'flex') {
            modalOverlay.style.display = 'none';
        }
    });

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });
});