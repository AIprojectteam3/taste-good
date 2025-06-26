// comment_modal.js
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
    async function renderComments(commentsData) {
        commentListDiv.innerHTML = '';
        
        let currentUser = null;
        try {
            const userResponse = await fetch('/api/user');
            if (userResponse.ok) {
                currentUser = await userResponse.json();
            }
        } catch (error) {
            console.error('사용자 정보 가져오기 실패:', error);
        }

        if (commentsData && commentsData.length > 0) {
            commentsData.forEach(comment => {
                const commentWrapperDiv = document.createElement('div');
                commentWrapperDiv.classList.add('comment-user');
                
                const commentTextHtml = comment.comment.replace(/\n/g, '<br>');
                
                // 액션 버튼 HTML (현재 사용자만 수정/삭제 가능)
                let actionButtonsHtml = '';
                // console.log('현재 사용자 정보:', currentUser); // 디버깅용
                // console.log(currentUser.id, comment.user_id); // 디버깅용
                if (currentUser && currentUser.id === comment.user_id) {
                    actionButtonsHtml = `
                        <div class="comment-action-buttons">
                            <button class="comment-edit-btn" data-comment-id="${comment.id}">수정</button>
                            <button class="comment-delete-btn" data-comment-id="${comment.id}">삭제</button>
                        </div>
                    `;
                }
                
                commentWrapperDiv.innerHTML = `
                    <div class="comment-div">
                        <div class="comment-profile-img">
                            <img src="${comment.author_profile_path || 'image/profile-icon.png'}" alt="${comment.author_username || '사용자'} 프로필">
                        </div>
                        <div class="comment-main">
                            <div class="comment-top">
                                <span class="comment-user-nickname">${comment.author_username || '익명'}</span>
                                <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
                            </div>
                            <div class="comment-bottom">
                                <span class="comment_content" data-comment-id="${comment.id}">${commentTextHtml}</span>
                                ${actionButtonsHtml}
                            </div>
                        </div>
                    </div>
                `;
                
                commentListDiv.appendChild(commentWrapperDiv);
            });
            
            addCommentActionListeners();
        } else {
            commentListDiv.innerHTML = '<div class="no-comment">아직 댓글이 없습니다.</div>';
        }
    }

    function addCommentActionListeners() {
        // 기존 이벤트 리스너 제거 (중복 방지)
        document.querySelectorAll('.comment-edit-btn').forEach(btn => {
            btn.removeEventListener('click', handleCommentEdit);
        });
        document.querySelectorAll('.comment-delete-btn').forEach(btn => {
            btn.removeEventListener('click', handleCommentDelete);
        });
        
        // 새로운 이벤트 리스너 추가
        document.querySelectorAll('.comment-edit-btn').forEach(btn => {
            btn.addEventListener('click', handleCommentEdit);
        });
        document.querySelectorAll('.comment-delete-btn').forEach(btn => {
            btn.addEventListener('click', handleCommentDelete);
        });
    }

    let currentEditingComment = null;

    // 댓글 수정 처리 함수
    async function handleCommentEdit(event) {
        // console.log('수정 버튼 클릭됨:', event.target); // 디버깅용
        
        const commentId = event.target.getAttribute('data-comment-id');
        // console.log('추출된 댓글 ID:', commentId); // 디버깅용
        
        if (!commentId) {
            console.error('댓글 ID를 찾을 수 없습니다.');
            alert('댓글 ID를 찾을 수 없습니다.');
            return;
        }
        
        const commentElement = event.target.closest('.comment-user');
        
        if (!commentElement) {
            console.error('댓글 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 이미 다른 댓글이 수정 중이면 취소
        if (currentEditingComment && currentEditingComment !== commentElement) {
            cancelCurrentEdit();
        }
        
        // 현재 수정 중인 댓글 설정
        currentEditingComment = commentElement;
        
        // 편집 모드 클래스 추가
        commentElement.classList.add('editing');
        
        const commentTextElement = commentElement.querySelector('.comment_content');
        const actionButtons = commentElement.querySelector('.comment-action-buttons');
        
        if (!commentTextElement) {
            console.error('댓글 텍스트 요소를 찾을 수 없습니다.');
            commentElement.classList.remove('editing');
            currentEditingComment = null;
            return;
        }
        
        // 기존 수정/삭제 버튼 숨기기
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
        
        const currentText = commentTextElement.innerHTML.replace(/<br>/g, '\n');
        
        // 수정 UI 생성
        commentTextElement.innerHTML = `
            <textarea class="comment_edit_textarea" rows="4">${currentText}</textarea>
            <div class="comment-edit-btn-div">
                <button class="comment_save_btn" data-comment-id="${commentId}">저장</button>
                <button class="comment_cancel_btn">취소</button>
            </div>
        `;
        
        // DOM 업데이트 후 이벤트 리스너 바인딩
        setTimeout(() => {
            const saveBtn = commentTextElement.querySelector('.comment_save_btn');
            const cancelBtn = commentTextElement.querySelector('.comment_cancel_btn');
            const textarea = commentTextElement.querySelector('.comment_edit_textarea');
            
            if (saveBtn && cancelBtn && textarea) {
                textarea.focus();
                
                // 저장 버튼 이벤트
                saveBtn.addEventListener('click', async () => {
                    const finalCommentId = saveBtn.getAttribute('data-comment-id');
                    // console.log('저장 버튼 클릭, 댓글 ID:', finalCommentId); // 디버깅용
                    await saveCommentEdit(finalCommentId, textarea.value, commentTextElement, commentElement, currentText);
                });
                
                // 취소 버튼 이벤트
                cancelBtn.addEventListener('click', () => {
                    cancelCommentEdit(currentText, commentTextElement, commentElement);
                });
            } else {
                console.error('수정 UI 요소를 찾을 수 없습니다:', {
                    saveBtn: !!saveBtn,
                    cancelBtn: !!cancelBtn,
                    textarea: !!textarea
                });
            }
        }, 0);
    }

    function cancelCurrentEdit() {
        if (currentEditingComment) {
            const textElement = currentEditingComment.querySelector('.comment_content');
            const actionButtons = currentEditingComment.querySelector('.comment-action-buttons');
            
            // 원래 텍스트 복원 (저장된 원본 텍스트가 있다면)
            if (textElement && textElement.dataset.originalText) {
                textElement.innerHTML = textElement.dataset.originalText;
            }
            
            // 수정/삭제 버튼 다시 보이기
            if (actionButtons) {
                actionButtons.style.display = 'flex';
            }
            
            // 편집 모드 해제
            currentEditingComment.classList.remove('editing');
            currentEditingComment = null;
        }
    }

    async function saveCommentEdit(commentId, newText, commentTextElement, commentElement, originalText) {
        try {
            // 댓글 내용 유효성 검사
            if (!newText || newText.trim() === '') {
                alert('댓글 내용을 입력해주세요.');
                return;
            }

            // 댓글 ID 유효성 검사
            if (!commentId || isNaN(parseInt(commentId))) {
                alert('유효하지 않은 댓글입니다.');
                return;
            }

            const response = await fetch(`/api/comment/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    comment: newText.trim()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // 성공 시 편집 모드 해제
            commentElement.classList.remove('editing');
            currentEditingComment = null;
            
            // ✅ UI 업데이트 - 새로운 텍스트와 액션 버튼 함께 추가
            commentTextElement.innerHTML = newText.replace(/\n/g, '<br>');
            
            // ✅ 수정/삭제 버튼 다시 추가
            const actionButtonsHtml = `
                <div class="comment-action-buttons">
                    <button class="comment-edit-btn" data-comment-id="${commentId}">수정</button>
                    <button class="comment-delete-btn" data-comment-id="${commentId}">삭제</button>
                </div>
            `;
            
            // ✅ 댓글 텍스트 다음에 액션 버튼 추가
            commentTextElement.insertAdjacentHTML('afterend', actionButtonsHtml);
            
            // ✅ 이벤트 리스너 다시 바인딩
            addCommentActionListeners();
            
            // console.log('댓글이 성공적으로 수정되었습니다.');
            
        } catch (error) {
            console.error('댓글 수정 실패:', error);
            alert(`댓글 수정에 실패했습니다: ${error.message}`);
            
            // 실패 시 원래 상태로 복원
            if (originalText && commentTextElement && commentElement) {
                cancelCommentEdit(originalText, commentTextElement, commentElement);
            }
        }
    }

    // 취소 시 편집 모드 해제
    function cancelCommentEdit(originalText, textElement, commentElement) {
        // 편집 모드 해제
        commentElement.classList.remove('editing');
        currentEditingComment = null;
        
        // 원래 텍스트로 복원
        textElement.innerHTML = originalText;
        
        // ✅ 수정/삭제 버튼 다시 추가
        const commentId = textElement.getAttribute('data-comment-id') || 
                        commentElement.querySelector('[data-comment-id]')?.getAttribute('data-comment-id');
        
        if (commentId) {
            const actionButtonsHtml = `
                <div class="comment-action-buttons">
                    <button class="comment-edit-btn" data-comment-id="${commentId}">수정</button>
                    <button class="comment-delete-btn" data-comment-id="${commentId}">삭제</button>
                </div>
            `;
            textElement.insertAdjacentHTML('afterend', actionButtonsHtml);
            addCommentActionListeners();
        }
    }

    async function handleCommentDelete(event) {
        const commentId = event.target.getAttribute('data-comment-id');
        
        if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/comment/${commentId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '댓글 삭제에 실패했습니다.');
            }
            
            const result = await response.json();
            if (result.success) {
                await fetchAndRenderComments(); // 댓글 목록 새로고침
            } else {
                alert(result.message || '댓글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 삭제 중 오류:', error);
            alert(`댓글 삭제 중 오류: ${error.message}`);
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

document.addEventListener('DOMContentLoaded', () => {

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
        if (e.target.classList.contains('commentBtn')) {
            if (isMobile()) {
                const postId = e.target.getAttribute('data-post-id');
                openCommentOnlyModal(postId); // postId를 넘김
                e.stopPropagation();
            }
        }
    });
});