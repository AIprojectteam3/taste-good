document.addEventListener('DOMContentLoaded', () => {
    async function openCommentOnlyModal(postId) {
        const modal = document.getElementById('commentOnlyModal');
        const closeBtn = modal.querySelector('.close');
        const commentListDiv = modal.querySelector('.comment-modal-list');
        const input = modal.querySelector('.comment-modal-input input');
        const submitBtn = modal.querySelector('.comment-modal-input button');
    
        const filteredComments = commentData.filter(com => String(com.postId) === String(postId));

        // 1. 서버로부터 게시물 상세 정보를 가져옵니다.
        const response = await fetch(`/api/post/${postId}`);
        if (!response.ok) {
            throw new Error(`HTTP 오류! 상태: ${response.status}`);
        }
        const postDetail = await response.json();
        console.log("[CLIENT LOG] 서버로부터 받은 postDetail:", JSON.parse(JSON.stringify(postDetail)));

        function renderComments(commentsData, commentContainerDiv, currentPostId) {
            commentContainerDiv.innerHTML = '';
            console.log("[CLIENT LOG] renderComments 호출됨, commentsData:", JSON.parse(JSON.stringify(commentsData)));

            if (commentsData && commentsData.length > 0) {
                commentsData.forEach(comment => {
                    const commentUserDiv = document.createElement('div');
                    commentUserDiv.classList.add('comment-item');
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
                            <div class="comment-user-div">
                                <span class="comment-user-nickname">${comment.author_username || '익명'}</span>
                                <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <p class="comment-content">${commentTextHtml}</p> <!-- CSS 클래스명 일치 확인 -->
                        </div>
                    </div>
                    `;
                    commentContainerDiv.appendChild(commentUserDiv);
                });
            } else {
                commentContainerDiv.innerHTML = '<div class="no-comment">아직 댓글이 없습니다.</div>';
            }
        }
        renderComments(postDetail.comments, commentListDiv, postDetail.id);

        if (filteredComments.length === 0) {
            const div = document.createElement('div');
            div.innerHTML = `
                <div class="no-comment">
                    댓글이 없습니다.
                </div>
            `;
            commentListDiv.appendChild(div);
        }
    
        // 입력 초기화
        input.value = '';
    
        // 모달 표시
        modal.style.display = 'block';
    
        // 닫기
        closeBtn.onclick = () => { modal.style.display = 'none'; };
        window.onclick = (event) => {
            if (event.target === modal) modal.style.display = 'none';
        };
    
        // 댓글 등록 (예시)
        // submitBtn.onclick = () => {
        //     if (input.value.trim()) {
        //         const newDiv = document.createElement('div');
        //         newDiv.className = 'comment-item';
        //         newDiv.innerHTML = `<div style="font-weight:bold;">나</div><div>${input.value}</div>`;
        //         commentListDiv.appendChild(newDiv);
        //         input.value = '';
        //         commentListDiv.scrollTop = commentListDiv.scrollHeight;
        //     }
        // };
    }

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