// 게시물 모달을 표시하는 함수
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
            menuDiv.style.marginLeft = "auto";

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
        postContentDiv.textContent = postDetail.content;

        // 더보기 버튼 처리
        setTimeout(() => {
            if (postContentDiv && readMoreBtn) {
                if (postContentDiv.scrollHeight > postContentDiv.clientHeight) {
                    // console.log("readMoreBtn: 표시 조건 충족 (내용 김)");
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
                    readMoreBtn.style.display = 'none';
                }
            } else {
                if (!postContentDiv) console.error(".post-content 요소를 찾을 수 없습니다.");
                if (!readMoreBtn) console.error(".read-more-btn 요소를 찾을 수 없습니다.");
            }
        }, 0);

        // 8. 댓글 렌더링 함수
        function renderComments(commentsData, commentContainerDiv, currentPostId) {
            commentContainerDiv.innerHTML = '';
            
            if (commentsData && commentsData.length > 0) {
                commentsData.forEach(comment => {
                    const commentUserDiv = document.createElement('div');
                    commentUserDiv.classList.add('comment-user');
                    const profileImgPath = comment.author_profile_path || 'image/profile-icon.png';
                    let commentTextHtml = comment.comment.replace(/\n/g, '<br>');
                    
                    commentUserDiv.innerHTML = `
                        <div class = "comment-div">
                            <div class="user-profile-img">
                                <img src="${profileImgPath}" alt="${comment.author_username} 프로필">
                            </div>
                            <div class="comment-main">
                                <span class="comment-user-nickname">${comment.author_username}</span>
                                <p class="comment-content">${commentTextHtml}</p> <!-- CSS 클래스명 일치 확인 -->
                            </div>
                        </div>
                        <div class = "comment-date-div">
                            <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                    `;
                    commentContainerDiv.appendChild(commentUserDiv);
                });
            } else {
                commentContainerDiv.innerHTML = '<p>댓글이 없습니다.</p>';
            }
        }

        // 9. 댓글 렌더링
        if (postDetail.comments) {
            renderComments(postDetail.comments, postCommentDiv, postDetail.id);
        }

        // 10. 모달 표시
        modalOverlay.style.display = 'flex';

    } catch (error) {
        console.error('게시물 모달 표시 중 오류:', error);
        alert('게시물을 불러오는 중 오류가 발생했습니다.');
    }
}


document.addEventListener("DOMContentLoaded", () => {
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
                    // console.log("게시물 카드 클릭됨 (PC 환경 - 모달 표시):", clickedCard);
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
