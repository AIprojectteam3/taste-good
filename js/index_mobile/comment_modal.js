document.addEventListener('DOMContentLoaded', () => {
    function openCommentOnlyModal(postId) {
        const modal = document.getElementById('commentOnlyModal');
        const closeBtn = modal.querySelector('.close');
        const commentListDiv = modal.querySelector('.comment-modal-list');
        const input = modal.querySelector('.comment-modal-input input');
        const submitBtn = modal.querySelector('.comment-modal-input button');
    
        const filteredComments = commentData.filter(com => String(com.postId) === String(postId));

        // 댓글 데이터 가져오기 (postId로 필터링, 예시는 전체 사용)
        commentListDiv.innerHTML = '';

        if (filteredComments.length === 0) {
            const div = document.createElement('div');
            div.innerHTML = `
                <div class="no-comment">
                    댓글이 없습니다.
                </div>
            `;
            commentListDiv.appendChild(div);
        }

        filteredComments.forEach(com => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `
                <div class="user-profile-img">
                    <img src="${com.profile_path}" alt="${com.profile_path} 프로필 사진">
                </div>
                <div class = "comment-mobile-content">
                    <div class="comment-user-nickname" style="font-weight:bold;">${com.user_nickname}</div>
                    <div><span class="comment-content">${com.comment}</span></div>
                </div>
            `;
            commentListDiv.appendChild(div);
        });
    
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