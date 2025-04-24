document.addEventListener("DOMContentLoaded", () => {
    // 카드 클릭 이벤트 등록
    const cards = document.querySelectorAll('.card');
    const modalImg = document.querySelector('.modal-img > img');
    const modalTitle = document.querySelector('.post-title');
    const modalContent = document.querySelector('.post-content');
    const modalUserImg = document.querySelector('.post-user .user-profile-img img');
    const modalUserNickname = document.querySelector('.post-user .user-nickname span:first-child');

    cards.forEach((card, index) => {
        card.addEventListener('click', function() {
            // 카드 데이터에서 값 가져오기
            const data = cardData[index];

            // 이미지, 제목, 내용 세팅
            modalImg.src = "post_Tempdata/image/" + data.thumbnail_path;
            modalTitle.textContent = data.title;
            modalContent.textContent = data.content;

            // 작성자 정보 세팅 (임시 데이터 사용)
            modalUserImg.src = postUserData[0].profile_path;
            modalUserImg.alt = postUserData[0].user + " 프로필 사진";
            modalUserNickname.textContent = postUserData[0].user;

            // 모달 열기
            document.getElementById('index-modal').style.display = 'flex';
        });
    });

    // 모달 닫기
    document.getElementById('modal-close').addEventListener('click', function() {
        document.getElementById('index-modal').style.display = 'none';
    });

    // 모달 바깥 클릭 시 닫기
    document.getElementById('index-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
});