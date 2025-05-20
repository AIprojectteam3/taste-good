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

            // 3. 이미지 슬라이드 및 썸네일을 채웁니다.
            if (postDetail.images && postDetail.images.length > 0) {
                mainSlideImg.src = postDetail.images[0];
                mainSlideImg.alt = postDetail.title + " 이미지 슬라이드";
                slideThumbnailsDiv.innerHTML = '';

                postDetail.images.forEach((imagePath, index) => {
                    const thumbImg = document.createElement('img');
                    thumbImg.classList.add('slide-thumb');
                    thumbImg.src = imagePath;
                    thumbImg.alt = `썸네일 ${index + 1}`;
                    thumbImg.dataset.index = index;

                    if (index === 0) {
                        thumbImg.classList.add('active');
                    }

                    thumbImg.addEventListener('click', () => {
                        mainSlideImg.src = imagePath;
                        slideThumbnailsDiv.querySelectorAll('.slide-thumb').forEach(t => t.classList.remove('active'));
                        thumbImg.classList.add('active');
                    });
                    slideThumbnailsDiv.appendChild(thumbImg);
                });

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
                            <div class="user-profile-img">
                                <img src="${profileImgPath}" alt="${comment.author_username || '사용자'} 프로필">
                            </div>
                            <div class="comment-main">
                                <span class="comment-user-nickname">${comment.author_username || '익명'}</span>
                                <p class="comment-content">${commentTextHtml}</p> <!-- CSS 클래스명 일치 확인 -->
                                <span class="comment-date" style="font-size:0.8em; color:gray;">${new Date(comment.created_at).toLocaleString()}</span>
                            </div>
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
                console.log("게시물 카드 클릭됨 (이벤트 위임):", clickedCard);
                const postId = clickedCard.getAttribute('data-post-id');
                if (postId) {
                    displayPostModal(postId);
                } else {
                    console.warn(`클릭된 카드에서 'data-post-id' 속성을 찾을 수 없습니다.`);
                }
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
