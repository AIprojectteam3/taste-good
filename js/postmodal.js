document.addEventListener("DOMContentLoaded", () => {
    let currentSlideIndex = 0;
    let currentImages = [];

    const cards = document.querySelectorAll('.card');
    const modalTitle = document.querySelector('.post-title');
    const modalContent = document.querySelector('.post-content');
    const modalUserImg = document.querySelector('.post-user .user-profile-img img');
    const modalUserNickname = document.querySelector('.post-user .user-nickname span:first-child');
    const commentProfile = document.querySelector('.user-profile-img img');
    const commentUser = document.querySelector('.comment-user-nickname span');
    const commentContent = document.querySelector('.comment-content span');

    cards.forEach((card, index) => {
        card.addEventListener('click', function() {
            const data = cardData[index];

            // 1. 썸네일이 반드시 첫 번째가 되도록 이미지 배열 구성
            let images = [];
            if (Array.isArray(data.images) && data.images.length > 0) {
                images = [data.thumbnail_path, ...data.images.filter(img => img !== data.thumbnail_path)];
            } else {
                images = [data.thumbnail_path];
            }
            currentSlideIndex = 0;
            currentImages = images;

            // 2. 모달 이미지 영역 생성 (슬라이드 + 썸네일)
            const modalImgDiv = document.querySelector('.modal-img');
            modalImgDiv.innerHTML = `
                <button class="slide-nav prev">‹</button>
                <div class="slide-container" style="width:100%;height:calc(100% - 64px);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;position:relative;">
                    <img class="slide-img" src="post_Tempdata/image/${images[0]}" alt="${data.title}" style="max-width:100%;max-height:calc(100% - 64px);object-fit:contain;display:block;margin:auto;">
                    <div class="slide-thumbnails" style="width:100%;display:flex;justify-content:center;gap:8px;margin-top:10px;height:54px;">
                        ${images.map((img, i) => `
                            <img 
                                src="post_Tempdata/image/${img}" 
                                class="slide-thumb${i === 0 ? ' active' : ''}" 
                                data-idx="${i}" 
                                style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ${i === 0 ? '#ff6b6b' : 'rgba(255,255,255,0.7)'};box-shadow:0 2px 6px rgba(0,0,0,0.08);background:#fff;">
                        `).join('')}
                    </div>
                </div>
                <button class="slide-nav next">›</button>
            `;

            // 3. 제목, 내용, 작성자 정보 세팅 (여기를 꼭 넣어야 함!)
            modalTitle.textContent = data.title;
            modalContent.textContent = data.content;
            modalUserImg.src = postUserData[0].profile_path;
            modalUserImg.alt = postUserData[0].user + " 프로필 사진";
            modalUserNickname.textContent = postUserData[0].user;

            // 댓글 정보 세팅
            commentProfile.src = commentData[0].profile_path;
            commentProfile.alt = commentData[0].user + " 프로필 사진";
            commentUser.textContent = commentData[0].user_nickname;
            commentContent.textContent = commentData[0].comment;

            // 4. 슬라이드 버튼, 썸네일 클릭 이벤트
            const prevBtn = modalImgDiv.querySelector('.slide-nav.prev');
            const nextBtn = modalImgDiv.querySelector('.slide-nav.next');
            prevBtn.onclick = () => showSlide(currentSlideIndex - 1);
            nextBtn.onclick = () => showSlide(currentSlideIndex + 1);

            modalImgDiv.querySelectorAll('.slide-thumb').forEach(thumb => {
                thumb.onclick = function() {
                    const idx = parseInt(this.getAttribute('data-idx'));
                    showSlide(idx);
                };
            });

            function showSlide(idx) {
                if (idx < 0 || idx >= images.length) return;
                currentSlideIndex = (idx + images.length) % images.length;
                const slideImg = modalImgDiv.querySelector('.slide-img');
                slideImg.src = "post_Tempdata/image/" + images[currentSlideIndex];
                // 썸네일 active 표시
                modalImgDiv.querySelectorAll('.slide-thumb').forEach((thumb, i) => {
                    if (i === currentSlideIndex) {
                        thumb.classList.add('active');
                        thumb.style.border = '2px solid #ff6b6b';
                    } else {
                        thumb.classList.remove('active');
                        thumb.style.border = '2px solid rgba(255,255,255,0.7)';
                    }
                });
            }

            // 5. 모달 열기
            if (!isMobile()) {
                document.getElementById('index-modal').style.display = 'flex';
            }

            // PC 환경에서만 post-user 보이게 (기존 코드 유지)
            const modalUser = document.querySelector('#index-modal .post-user');
            if (modalUser) {
                modalUser.style.display = 'flex';
            }
        });
    });

    // 모달 닫기 시 초기화
    document.getElementById('modal-close').addEventListener('click', function() {
        document.getElementById('index-modal').style.display = 'none';
        const modalUser = document.querySelector('#index-modal .post-user');
        if (modalUser) {
            modalUser.style.display = '';
        }
        currentSlideIndex = 0;
        currentImages = [];
    });

    document.getElementById('index-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            const modalUser = document.querySelector('#index-modal .post-user');
            if (modalUser) {
                modalUser.style.display = '';
            }
            currentSlideIndex = 0;
            currentImages = [];
        }
    });
});