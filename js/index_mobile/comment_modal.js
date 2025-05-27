// comment_modal.js

document.addEventListener('DOMContentLoaded', () => {
    async function openCommentOnlyModal(postId) {
        const modal = document.getElementById('commentOnlyModal');
        const closeBtn = modal.querySelector('.close');
        const commentListDiv = modal.querySelector('.comment-modal-list');
        const input = modal.querySelector('.comment-modal-input input');
        const submitBtn = modal.querySelector('.comment-modal-input button');

        // 서버로부터 댓글 목록을 가져와 렌더링하는 함수
        async function fetchAndRenderComments() {
            try {
                const response = await fetch(`/api/post/${postId}/comments`); // 서버 API[2]
                if (!response.ok) {
                    console.error(`HTTP 오류! 댓글 목록 가져오기 실패: ${response.status}`);
                    commentListDiv.innerHTML = '<p>댓글을 불러오는 데 실패했습니다.</p>';
                    return;
                }
                const comments = await response.json();
                renderComments(comments);
            } catch (error) {
                console.error('댓글 로드 중 오류 발생:', error);
                commentListDiv.innerHTML = '<p>댓글을 불러오는 중 오류가 발생했습니다.</p>';
            }
        }

        // 댓글 데이터를 HTML로 렌더링하는 함수 (사용자 요청 구조 반영)
        function renderComments(commentsData) {
            commentListDiv.innerHTML = ''; // 기존 댓글 내용 초기화

            if (commentsData && commentsData.length > 0) {
                commentsData.forEach(comment => {
                    const commentWrapperDiv = document.createElement('div');
                    commentWrapperDiv.classList.add('comment-user'); // 요청하신 <div class="comment-user"> 구조

                    const profileImgPath = comment.author_profile_path || 'image/profile-icon.png'; // 기본 프로필 이미지
                    let commentTextHtml = comment.comment.replace(/\n/g, '<br>'); // 줄바꿈 처리

                    // 요청하신 HTML 구조에 따라 내부 요소를 구성합니다.
                    // 'clsss'를 'class'로 수정하여 적용했습니다.
                    commentWrapperDiv.innerHTML = `
                        <div class = "comment-div">
                            <div class="comment-profile-img">
                                <img src="${profileImgPath}" alt="${comment.author_username || '사용자'} 프로필">
                            </div>
                            <div class="comment-main">
                                <div class="comment-user-div">
                                    <span class="comment-user-nickname">${comment.author_username || '익명'}</span>
                                    <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                                </div>
                                <p class="comment-content">${commentTextHtml}</p> <!-- CSS 클래스명 일치 확인 -->
                            </div>
                        </div>
                    `;

                    commentListDiv.appendChild(commentWrapperDiv);
                });
            } else {
                commentListDiv.innerHTML = '<p>아직 댓글이 없습니다.</p>';
            }
        }

        // 댓글 작성 및 서버 전송 함수
        async function handleCommentSubmit() {
            const commentText = input.value.trim();
            if (!commentText) {
                alert('댓글 내용을 입력해주세요.');
                return;
            }

            try {
                const response = await fetch(`/api/post/${postId}/comment`, { // 서버 API[2]
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ comment: commentText }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP 오류! 상태: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    input.value = ''; // 입력창 비우기
                    await fetchAndRenderComments(); // 댓글 목록 새로고침
                } else {
                    alert(result.message || '댓글 등록에 실패했습니다.');
                }
            } catch (error) {
                console.error('댓글 등록 중 오류 발생:', error);
                alert(`댓글 등록 중 오류: ${error.message}`);
            }
        }
        
        // 모달이 닫힐 때 이벤트 리스너를 제거하기 위한 함수
        function closeModalCleanup() {
            submitBtn.removeEventListener('click', handleCommentSubmit);
            input.removeEventListener('keypress', handleKeyPress);
            // window.onclick 핸들러는 이 모달에만 국한되도록 관리하는 것이 좋습니다.
            // 이 예제에서는 openCommentOnlyModal 범위 내에서만 window.onclick을 설정하고,
            // 모달이 닫힐 때 명시적으로 null로 설정하거나 이전 핸들러로 복원합니다.
            window.onclick = null; 
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                handleCommentSubmit();
            }
        }

        // 이벤트 리스너 등록 (중복 방지를 위해 기존 리스너 제거 후 등록 권장)
        // 여기서는 모달이 열릴 때마다 새로 설정한다고 가정합니다.
        // 만약 closeModalCleanup에서 특정 리스너만 제거한다면, 여기서도 동일한 참조로 add/remove 해야 합니다.
        // submitBtn.onclick, input.onkeypress 등을 사용할 경우, closeModalCleanup에서 null로 설정하는 것으로 충분합니다.
        // addEventListener를 사용했으므로 removeEventListener로 제거합니다.
        // submitBtn에 대한 리스너는 이전 리스너가 있다면 제거하고 새로 추가하거나,
        // 또는 closeModalCleanup에서 명확히 제거해야 합니다.
        // 여기서는 함수 참조가 동일하므로, closeModalCleanup에서 제거됩니다.
        submitBtn.removeEventListener('click', handleCommentSubmit); // 혹시 모를 중복 방지
        submitBtn.addEventListener('click', handleCommentSubmit);
        
        input.removeEventListener('keypress', handleKeyPress); // 혹시 모를 중복 방지
        input.addEventListener('keypress', handleKeyPress);

        // 모달 열기
        modal.style.display = 'block';
        await fetchAndRenderComments(); // 모달이 열릴 때 댓글 목록 로드

        if (input) {
            setTimeout(() => { // 모달이 완전히 표시된 후 포커스
                input.focus();
            }, 50); // 약간의 지연시간 (필요에 따라 조정) [7]
        }

        // 모달 닫기 로직
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            closeModalCleanup();
        }

        const oldWindowOnClick = window.onclick; // 필요하다면 기존 핸들러 백업
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
                closeModalCleanup();
                // window.onclick = oldWindowOnClick; // 모달 닫힐 때 기존 핸들러 복원 (주의해서 사용)
            }
            // else if (typeof oldWindowOnClick === 'function' && event.target !== modal ) {
            //     // oldWindowOnClick(event); // 다른 곳 클릭 시 기존 핸들러 호출 (주의해서 사용)
            // }
        }
    }

    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('comInput')) {
            if (isMobile()) {
                const postId = e.target.getAttribute('data-post-id');
                openCommentOnlyModal(postId); // postId를 넘김
                e.stopPropagation();
            }
        }
    });

    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('comment-icon')) {
            if (isMobile()) {
                const postId = e.target.getAttribute('data-post-id');
                openCommentOnlyModal(postId); // postId를 넘김
                e.stopPropagation();
            }
        }
    });
});