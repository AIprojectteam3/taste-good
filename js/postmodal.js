// postmodal.js

document.addEventListener("DOMContentLoaded", () => {
    // 게시물 모달을 표시하는 함수
    async function displayPostModal(postId) {
        try {
            // 1. 서버로부터 게시물 상세 정보를 가져옵니다.
            const response = await fetch(`/api/post/${postId}`);
            if (!response.ok) {
                throw new Error(`HTTP 오류! 상태: ${response.status}`);
            }
            const postDetail = await response.json();
            console.log("[CLIENT LOG] 서버로부터 받은 postDetail:", JSON.parse(JSON.stringify(postDetail)));

            // 2. 모달창의 각 HTML 요소를 선택합니다.
            const modalOverlay = document.getElementById('index-modal');
            const slideContainerDiv = modalOverlay.querySelector('.slide-container');
            const mainSlideImg = slideContainerDiv.querySelector('.slide-img');
            const slideThumbnailsDiv = slideContainerDiv.querySelector('.slide-thumbnails');
            const userProfileImg = modalOverlay.querySelector('.post-user .user-profile-img img');
            const userNicknameSpan = modalOverlay.querySelector('.post-user .user-nickname > span:first-child');
            const postTitleH3 = modalOverlay.querySelector('.post-title');
            const postContentDiv = modalOverlay.querySelector('.post-content');
            const postCommentDiv = modalOverlay.querySelector('.post-comment');
            const readMoreBtn = modalOverlay.querySelector('.read-more-btn');

            const prevButton = modalOverlay.querySelector('.slide-nav.prev'); // 이전 버튼 선택
            const nextButton = modalOverlay.querySelector('.slide-nav.next'); // 다음 버튼 선택

            let currentImageIndex = 0; // 현재 표시된 이미지의 인덱스
            let images = []; // 게시물의 이미지 경로 배열

            // 이미지 업데이트 함수 (메인 이미지와 썸네일 활성화 상태 변경)
            function updateSlideView() {
                if (images.length > 0) {
                    mainSlideImg.src = images[currentImageIndex];
                    mainSlideImg.alt = `${postDetail.title} 이미지 ${currentImageIndex + 1}`;

                    // 모든 썸네일에서 'active' 클래스 제거
                    slideThumbnailsDiv.querySelectorAll('.slide-thumb').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    // 현재 인덱스에 해당하는 썸네일에 'active' 클래스 추가
                    const activeThumb = slideThumbnailsDiv.querySelector(`.slide-thumb[data-index="${currentImageIndex}"]`);
                    if (activeThumb) {
                        activeThumb.classList.add('active');
                        // 활성화된 썸네일이 화면 중앙에 오도록 스크롤 (선택적)
                        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }
                } else {
                    mainSlideImg.src = "";
                    mainSlideImg.alt = "이미지 없음";
                }
                // 네비게이션 버튼 활성화/비활성화 상태 업데이트
                if (prevButton && nextButton) { // 버튼이 존재하는 경우에만
                    prevButton.disabled = images.length <= 1 || currentImageIndex === 0;
                    nextButton.disabled = images.length <= 1 || currentImageIndex === images.length - 1;
                }
            }

            // 3. 이미지 슬라이드 및 썸네일을 채웁니다.
            if (postDetail.images && postDetail.images.length > 0) {
                images = postDetail.images; // 이미지 배열 저장
                currentImageIndex = 0; // 첫 번째 이미지로 초기화

                slideThumbnailsDiv.innerHTML = ''; // 기존 썸네일 초기화
                images.forEach((imagePath, index) => {
                    const thumbImg = document.createElement('img');
                    thumbImg.classList.add('slide-thumb');
                    thumbImg.src = imagePath;
                    thumbImg.alt = `썸네일 ${index + 1}`;
                    thumbImg.dataset.index = index; // 각 썸네일에 인덱스 저장

                    thumbImg.addEventListener('click', () => {
                        currentImageIndex = index; // 클릭된 썸네일의 인덱스로 현재 인덱스 변경
                        updateSlideView(); // 슬라이드 뷰 업데이트
                    });
                    slideThumbnailsDiv.appendChild(thumbImg);
                });

                updateSlideView(); // 초기 슬라이드 뷰 설정 (첫 이미지 표시 및 썸네일 활성화)

                // 이전 버튼 클릭 이벤트 리스너
                if (prevButton) { // 버튼이 존재하는 경우에만 리스너 추가
                    // 기존 리스너 제거 (모달이 여러 번 열릴 경우 중복 방지)
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

                // 다음 버튼 클릭 이벤트 리스너
                if (nextButton) { // 버튼이 존재하는 경우에만 리스너 추가
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

                const wheelHandler = (event) => {
                    if (slideThumbnailsDiv.scrollWidth > slideThumbnailsDiv.clientWidth) {
                        event.preventDefault();
                        slideThumbnailsDiv.scrollLeft += event.deltaY;
                    }
                };
                // 기존 리스너 제거 후 추가 (중복 방지)
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

            // 4. 작성자 정보를 채웁니다.
            userProfileImg.src = postDetail.author_profile_path || 'image/profile-icon.png';
            userProfileImg.alt = (postDetail.author_username || "사용자") + " 프로필 사진";
            userNicknameSpan.textContent = postDetail.author_username || "알 수 없는 사용자";

            const currentUserId = sessionStorage.getItem('loggedInUserId');
            const postMenuContainer = modalOverlay.querySelector('.user-nickname');

            const existingMenu = postMenuContainer.querySelector('.post-actions-menu');
            if (existingMenu) existingMenu.remove();

            if (currentUserId && parseInt(currentUserId) === postDetail.user_id) {
                const menuDiv = document.createElement('div');
                menuDiv.classList.add('post-actions-menu'); // CSS 스타일링용
                menuDiv.style.marginLeft = "auto"; // 오른쪽 정렬 예시

                const editButton = document.createElement('button');
                editButton.textContent = '수정';
                editButton.classList.add('edit-post-btn'); // CSS 클래스
                editButton.onclick = () => {
                    console.log(`게시물 ${postDetail.id} 수정 기능 실행`);
                    alert('게시물 수정 기능은 아직 구현되지 않았습니다. (UI/폼 필요)');
                };

                const deleteButton = document.createElement('button');
                deleteButton.textContent = '삭제';
                deleteButton.classList.add('delete-post-btn'); // CSS 클래스
                deleteButton.onclick = async () => {
                    if (confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
                        try {
                            const response = await fetch(`/api/post/${postDetail.id}`, {
                                method: 'DELETE',
                                headers: {
                                    // 'Authorization': `Bearer ${token}` // JWT 사용 시
                                }
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
                // userNicknameSpan의 부모에 추가하거나, 적절한 위치에 메뉴 버튼들 추가
                const nicknameContainer = userNicknameSpan.closest('.user-nickname');
                if (nicknameContainer) {
                    nicknameContainer.appendChild(menuDiv);
                } else {
                    userProfileImg.parentElement.appendChild(menuDiv); // 예비 위치
                }

            }

            // 5. 게시물 제목 및 내용을 채웁니다.
            postTitleH3.textContent = postDetail.title;
            postContentDiv.textContent = postDetail.content;

            // 모달이 표시된 후, 브라우저가 레이아웃을 계산할 시간을 주기 위해 setTimeout 사용
            setTimeout(() => {
                if (postContentDiv && readMoreBtn) {
                    console.log("readMoreBtn Check - scrollHeight (after timeout):", postContentDiv.scrollHeight);
                    console.log("readMoreBtn Check - clientHeight (after timeout):", postContentDiv.clientHeight);
                    console.log("readMoreBtn Check - Element (after timeout):", readMoreBtn);

                    if (postContentDiv.scrollHeight > postContentDiv.clientHeight) {
                        console.log("readMoreBtn: 표시 조건 충족 (내용 김)");
                        readMoreBtn.style.display = 'block';
                        readMoreBtn.onclick = () => {
                            postContentDiv.classList.toggle('expanded');
                            if (postContentDiv.classList.contains('expanded')) {
                                readMoreBtn.textContent = '닫기';
                            } else {
                                readMoreBtn.textContent = '더보기';
                                postContentDiv.scrollTop = 0;
                            }
                        };
                    } else {
                        console.log("readMoreBtn: 숨김 조건 충족 (내용 짧음 또는 같음)");
                        readMoreBtn.style.display = 'none';
                    }
                    console.log("readMoreBtn Check - 최종 display 스타일 (after timeout):", readMoreBtn.style.display);
                } else {
                    if (!postContentDiv) console.error(".post-content 요소를 찾을 수 없습니다.");
                    if (!readMoreBtn) console.error(".read-more-btn 요소를 찾을 수 없습니다.");
                }
            }, 0);

            // 6. 댓글 영역을 채웁니다.
            function renderComments(commentsData, commentContainerDiv, currentPostId) {
                commentContainerDiv.innerHTML = '';
                console.log("[CLIENT LOG] renderComments 호출됨, commentsData:", JSON.parse(JSON.stringify(commentsData)));

                if (commentsData && commentsData.length > 0) {
                    commentsData.forEach(comment => {
                        const commentUserDiv = document.createElement('div');
                        commentUserDiv.classList.add('comment-user');
                        const profileImgPath = comment.author_profile_path || 'image/profile-icon.png';
                        
                        // HTML로 렌더링할 때 XSS를 방지하기 위해 텍스트 내용은 textContent로 설정하거나,
                        // 서버 사이드에서 이스케이프 처리된 데이터를 받아야 합니다.
                        // 여기서는 간단히 줄바꿈만 <br>로 변경합니다.
                        let commentTextHtml = comment.comment.replace(/\n/g, '<br>');

                        commentUserDiv.innerHTML = `
                        <div class = "comment-div">
                            <div class="user-profile-img">
                                <img src="${profileImgPath}" alt="${comment.author_username || '사용자'} 프로필">
                            </div>
                            <div class="comment-main">
                                <span class="comment-user-nickname">${comment.author_username || '익명'}</span>
                                <p class="comment-content">${commentTextHtml}</p> <!-- CSS 클래스명 일치 확인 -->
                            </div>
                        </div>
                        <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                        `;
                        commentContainerDiv.appendChild(commentUserDiv);
                    });
                } else {
                    commentContainerDiv.innerHTML = '<div class="no-comment">아직 댓글이 없습니다.</div>';
                }
            }
            console.log("[CLIENT LOG] renderComments 호출 직전 postDetail.comments:", JSON.parse(JSON.stringify(postDetail.comments)));
            renderComments(postDetail.comments, postCommentDiv, postDetail.id);

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

            // 모달 표시
            modalOverlay.style.display = 'flex';

        } catch (error) {
            console.error("게시물 모달 표시 중 오류 발생:", error);
            alert("게시물 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    // 이벤트 위임(Event Delegation)을 사용하여 게시물 카드 클릭 처리
    const cardContainer = document.querySelector('.content'); // 카드 컨테이너 선택자 (index.html에 따름)

    if (cardContainer) {
        cardContainer.addEventListener('click', function(event) {
            const clickedCard = event.target.closest('.card');
            if (clickedCard) {
                // [수정된 부분 시작] 화면 너비 확인하여 PC 환경에서만 모달 띄우기
                const screenWidth = window.innerWidth;
                const pcMinWidth = 768; // PC로 간주할 최소 너비 (예: 768px) - index.css의 미디어쿼리 기준과 맞춤

                if (screenWidth >= pcMinWidth) {
                    console.log("게시물 카드 클릭됨 (PC 환경 - 모달 표시):", clickedCard);
                    const postId = clickedCard.getAttribute('data-post-id');
                    if (postId) {
                        displayPostModal(postId); // PC 환경에서만 displayPostModal 호출
                    } else {
                        console.warn(`클릭된 카드에서 'data-post-id' 속성을 찾을 수 없습니다.`);
                    }
                } else {
                    console.log("게시물 카드 클릭됨 (모바일 환경 - 모달 표시 안 함). screenWidth:", screenWidth);
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

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });
});
