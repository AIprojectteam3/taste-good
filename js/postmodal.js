document.addEventListener("DOMContentLoaded", () => {
    // 게시물 모달을 표시하는 함수
    async function displayPostModal(postId) {
        try {
            // 1. 서버로부터 게시물 상세 정보를 가져옵니다.
            //    `/api/post/${postId}` 엔드포인트를 호출합니다.
            const response = await fetch(`/api/post/${postId}`);
            if (!response.ok) {
                throw new Error(`HTTP 오류! 상태: ${response.status}`);
            }
            const postDetail = await response.json(); // 응답 예시: { id, title, content, ..., author_username, author_profile_path, images: [...] }

            // 2. 모달창의 각 HTML 요소를 선택합니다.
            const modalOverlay = document.getElementById('index-modal');
            const slideContainerDiv = modalOverlay.querySelector('.slide-container');
            const mainSlideImg = slideContainerDiv.querySelector('.slide-img'); // 메인 슬라이드 이미지
            const slideThumbnailsDiv = slideContainerDiv.querySelector('.slide-thumbnails'); // 썸네일 컨테이너
            const userProfileImg = modalOverlay.querySelector('.post-user .user-profile-img img'); // 작성자 프로필 이미지
            const userNicknameSpan = modalOverlay.querySelector('.post-user .user-nickname > span:first-child'); // 작성자 닉네임
            const postTitleH3 = modalOverlay.querySelector('.post-title'); // 게시물 제목
            const postContentDiv = modalOverlay.querySelector('.post-content'); // 게시물 내용
            const postCommentDiv = modalOverlay.querySelector('.post-comment'); // 댓글 영역
            const readMoreBtn = modalOverlay.querySelector('.read-more-btn'); // 더보기 버튼

            // 3. 이미지 슬라이드 및 썸네일을 채웁니다.
            if (postDetail.images && postDetail.images.length > 0) {
                mainSlideImg.src = postDetail.images[0];
                mainSlideImg.alt = postDetail.title + " 이미지 슬라이드";

                slideThumbnailsDiv.innerHTML = ''; // 기존 썸네일 초기화

                // 썸네일 이미지들을 동적으로 생성하고 삽입합니다.
                postDetail.images.forEach((imagePath, index) => {
                    const thumbImg = document.createElement('img');
                    thumbImg.classList.add('slide-thumb');
                    thumbImg.src = imagePath;
                    thumbImg.alt = `썸네일 ${index + 1}`;
                    thumbImg.dataset.index = index; // 클릭 시 해당 이미지로 변경하기 위한 인덱스

                    if (index === 0) {
                        thumbImg.classList.add('active'); // 첫 번째 썸네일을 활성화 상태로 표시
                    }

                    // 썸네일 클릭 이벤트: 메인 이미지 변경
                    thumbImg.addEventListener('click', () => {
                        mainSlideImg.src = imagePath;
                        // 모든 썸네일에서 'active' 클래스 제거 후 현재 클릭된 썸네일에 추가
                        slideThumbnailsDiv.querySelectorAll('.slide-thumb').forEach(t => t.classList.remove('active'));
                        thumbImg.classList.add('active');
                    });
                    slideThumbnailsDiv.appendChild(thumbImg);
                });

                // 썸네일 컨테이너 마우스 휠 가로 스크롤 기능 추가
                const newWheelHandler = (event) => {
                    if (slideThumbnailsDiv.scrollWidth > slideThumbnailsDiv.clientWidth) {
                        event.preventDefault(); // 기본 세로 스크롤 방지
                        slideThumbnailsDiv.scrollLeft += event.deltaY; // 휠의 Y축 변화량만큼 가로로 스크롤
                    }
                };
                // 기존 이벤트 리스너가 있다면 제거 (옵션)
                // if (slideThumbnailsDiv._wheelHandler) {
                //     slideThumbnailsDiv.removeEventListener('wheel', slideThumbnailsDiv._wheelHandler);
                // }
                slideThumbnailsDiv.addEventListener('wheel', newWheelHandler);
                // slideThumbnailsDiv._wheelHandler = newWheelHandler; // 핸들러 참조 저장 (옵션)

            } else {
                // 이미지가 없는 경우 처리
                mainSlideImg.src = ""; // 기본 이미지 또는 빈 값
                mainSlideImg.alt = "이미지 없음";
                slideThumbnailsDiv.innerHTML = ''; // 썸네일 없음
            }

            // 4. 작성자 정보를 채웁니다.
            userProfileImg.src = postDetail.author_profile_path || 'image/profile-icon.png'; // 프로필 이미지 경로, 없을 경우 기본값 (기본 이미지 경로 수정)
            userProfileImg.alt = (postDetail.author_username || "사용자") + " 프로필 사진";
            userNicknameSpan.textContent = postDetail.author_username || "알 수 없는 사용자";

            // 5. 게시물 제목 및 내용을 채웁니다.
            postTitleH3.textContent = postDetail.title;
            postContentDiv.textContent = postDetail.content; // 내용에 HTML 태그가 포함되어 있다면 `.innerHTML` 사용을 고려하세요.
            modalOverlay.style.display = 'flex';

            setTimeout(() => {
                if (postContentDiv && readMoreBtn) { // 요소들이 존재하는지 먼저 확인
                    console.log("readMoreBtn Check - scrollHeight (after timeout):", postContentDiv.scrollHeight);
                    console.log("readMoreBtn Check - clientHeight (after timeout):", postContentDiv.clientHeight);
                    console.log("readMoreBtn Check - Element (after timeout):", readMoreBtn);

                    if (postContentDiv.scrollHeight > postContentDiv.clientHeight) {
                        console.log("readMoreBtn: 표시 조건 충족 (내용 김)");
                        readMoreBtn.style.display = 'block'; // 내용이 넘치면 "더보기" 버튼 표시
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
                        readMoreBtn.style.display = 'none'; // 내용이 짧으면 "더보기" 버튼 숨김
                    }
                    console.log("readMoreBtn Check - 최종 display 스타일 (after timeout):", readMoreBtn.style.display);
                } else {
                    if (!postContentDiv) console.error(".post-content 요소를 찾을 수 없습니다.");
                    if (!readMoreBtn) console.error(".read-more-btn 요소를 찾을 수 없습니다.");
                }
            }, 0);

            // 6. 댓글 영역을 채웁니다.
            // 현재 서버 응답에 댓글 데이터가 포함되어 있지 않으므로, 이 부분은 예시로 남겨둡니다.
            // 실제 댓글 데이터를 가져오려면 서버 API 수정 및 추가 fetch 요청이 필요합니다.
            if (postDetail.comments && postDetail.comments.length > 0) { // API가 'comments' 배열을 반환한다고 가정
                postCommentDiv.innerHTML = ''; // 기존 댓글 내용 초기화
                postDetail.comments.forEach(comment => {
                    const commentUserDiv = document.createElement('div');
                    commentUserDiv.classList.add('comment-user'); // index.html의 실제 댓글 구조에 맞게 수정 필요
                    commentUserDiv.innerHTML = `
                        <div class="user-profile-img">
                            <img src="${comment.author_profile_path || 'image/profile-icon.png'}" alt="${comment.author_username} 프로필">
                        </div>
                        <div class="comment-main">
                            <span class="comment-user-nickname">${comment.author_username}</span>
                            <p class="comment-text">${comment.text}</p>
                        </div>
                        <!-- 필요한 경우 날짜, 수정/삭제 버튼 등 추가 -->
                    `;
                    postCommentDiv.appendChild(commentUserDiv);
                });
            } else {
                postCommentDiv.innerHTML = '<div class="no-comment">아직 댓글이 없습니다.</div>'; // 댓글 없을 때 메시지 (index.css 참고)
            }

            // 마지막으로, 모달을 화면에 표시합니다.
            modalOverlay.style.display = 'flex'; // 또는 'block', CSS 설정에 따라 다릅니다.

        } catch (error) {
            console.error("게시물 모달 표시 중 오류 발생:", error);
            alert("게시물 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    // 이벤트 위임(Event Delegation)을 사용하여 게시물 카드 클릭 처리
    // 카드를 감싸는 정적 부모 요소에 이벤트 리스너를 추가합니다.
    // '.content'는 index.html에서 카드들을 감싸는 컨테이너로 사용됨 [2][3]
    const cardContainer = document.querySelector('.content'); // 카드 컨테이너 선택자 수정

    if (cardContainer) {
        cardContainer.addEventListener('click', function(event) {
            const clickedCard = event.target.closest('.card'); // 클릭된 요소 또는 그 부모 중 .card 찾기

            if (clickedCard) {
                console.log("게시물 카드 클릭됨 (이벤트 위임):", clickedCard);
                const postId = clickedCard.getAttribute('data-post-id');
                if (postId) {
                    displayPostModal(postId);
                } else {
                    console.warn(`클릭된 카드에서 'data-post-id' 속성을 찾을 수 없습니다. HTML 태그: <${clickedCard.tagName.toLowerCase()} class="${clickedCard.className}">`);
                }
            }
        });
    } else {
        console.warn("'.content' (카드 컨테이너) 요소를 찾을 수 없습니다. 카드 클릭 이벤트 리스너가 설정되지 않았습니다.");
    }

    // 모달 닫기 기능
    const modalOverlay = document.getElementById('index-modal');
    const closeButton = modalOverlay.querySelector('.close-area'); // HTML에 정의된 닫기 버튼 선택자 (예: .close-area 또는 내부의 특정 버튼) [3]

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
    } else {
        console.warn("모달 닫기 버튼 ('.close-area')을 찾을 수 없습니다.");
    }

    // 선택 사항: 모달 외부(배경)를 클릭했을 때 모달을 닫는 기능
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) { // 클릭된 요소가 모달 오버레이 자체인 경우
            modalOverlay.style.display = 'none';
        }
    });
});