/* ---------- 전역 설정 ---------- */
const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const dayNames   = ['일','월','화','수','목','금','토'];

let currentDate  = new Date();
let currentMonth = currentDate.getMonth();
let currentYear  = currentDate.getFullYear();
let today        = new Date();

let attendanceData  = {};   // { '2025-7': [1,3,5 …] }
let attendanceStats = {};   // user_attendance_stats 1행

/* ---------- 진입점 ---------- */
document.addEventListener('DOMContentLoaded', initPage);

async function initPage() {
    // auth.js에 추가한 로그인 확인 함수를 호출합니다.
    const userData = await verifyLoginStatus();

    // userData가 null이 아니면 로그인된 상태입니다.
    if (userData) {
        console.log(`${userData.username}님, 환영합니다!`);
    }
    
    /* 2) 서버 데이터 로드 */
    await Promise.all([
        loadAttendanceData(), 
        loadAttendanceStats(),
        loadRewardInfo()  // 보상 정보 로드 추가
    ]);

    /* 3) UI 초기화 */
    initializeCalendar();
    initializeCheckIn();
    updateAttendanceSummary();

    /* 4) 자정 변화 감지 */
    setInterval(checkDateChange, 60_000);
}

/* ---------- 서버 통신 ---------- */
async function loadAttendanceData() {
    try {
        const res = await fetch('/api/attendance/data');
        const json = await res.json();
        if (json.success) attendanceData = json.attendanceData;
    } catch (e) { console.error('loadAttendanceData 실패', e); }
}

async function loadAttendanceStats() {
    try {
        const res = await fetch('/api/attendance/stats');
        const json = await res.json();
        if (json.success) attendanceStats = json.stats;
    } catch (e) { console.error('loadAttendanceStats 실패', e); }
}

/* ---------- 달력 ---------- */
function initializeCalendar() {
    generateCalendar(currentMonth, currentYear);

    document.getElementById('prevMonth').onclick = () => {
        currentMonth--; if (currentMonth < 0){ currentMonth=11; currentYear--; }
        generateCalendar(currentMonth, currentYear);
    };
    document.getElementById('nextMonth').onclick = () => {
        currentMonth++; if (currentMonth > 11){ currentMonth=0; currentYear++; }
        generateCalendar(currentMonth, currentYear);
    };
}

function generateCalendar(month, year) {
    const grid   = document.querySelector('.calendar-grid');
    const header = document.getElementById('currentMonth');
    header.textContent = `${year}년 ${monthNames[month]}`;

    /* 기존 셀 제거 (요일 헤더 제외) */
    grid.querySelectorAll('.day, .day.other-month').forEach(el => el.remove());

    const firstDay   = new Date(year, month, 1);
    const lastDay    = new Date(year, month+1, 0);
    const daysInMon  = lastDay.getDate();
    const startWeek  = firstDay.getDay();

    /* 이전 달 날짜 */
    const prevLast   = new Date(year, month, 0).getDate();
    for (let i=startWeek-1;i>=0;i--) grid.appendChild(createDayElement(prevLast-i,'other'));

    /* 현재 달 날짜 */
    for (let d=1; d<=daysInMon; d++) grid.appendChild(createDayElement(d,'current',month,year));

    /* 다음 달 (6주 채우기) */
    const cells = grid.children.length - 7;
    for (let d=1; cells+d<42; d++) grid.appendChild(createDayElement(d,'other'));
}

function createDayElement(day,type,month=null,year=null){
    const el = document.createElement('div');
    el.className = 'day';
    if(type==='other') el.classList.add('other-month');
    el.textContent = day;

    if(type==='current'){
        /* 오늘 */
        if(year===today.getFullYear() && month===today.getMonth() && day===today.getDate()){
            el.classList.add('today');
        }
        /* 출석 표시 */
        const key = `${year}-${month+1}`;
        if(attendanceData[key]?.includes(day)) el.classList.add('checked');

        /* 미래 비활성 */
        const dateObj = new Date(year,month,day);
        if(dateObj>today){
            el.classList.add('future-date');
            el.style.opacity='0.5';
            el.style.cursor='not-allowed';
        }
    }
    return el;
}

/* ---------- 출석 ---------- */
function initializeCheckIn(){
    updateCheckInButton();
    document.getElementById('checkInBtn').onclick = () => {
        if(document.getElementById('checkInBtn').disabled) return;
        performCheckIn();
    };
}

async function performCheckIn(){
    try{
        const res = await fetch('/api/attendance/check-in',{
            method:'POST',
            headers:{'Content-Type':'application/json'}
        });
        const json = await res.json();
        
        if(!json.success){
            alert(json.message);
            return;
        }

        if(json.hasQuestion){
            showMultipleQuestionsModal(json.questions);
        } else {
            await completeCheckIn(json.points);
        }
    } catch(e){
        console.error(e);
        alert('출석체크 중 오류 발생');
    }
}

// 다중 질문 모달 표시 함수
function showMultipleQuestionsModal(questions) {
    // console.log('=== showMultipleQuestionsModal 시작 ===');
    // console.log('전달받은 질문 수:', questions.length);
    
    // questions.forEach((question, index) => {
    //     console.log(`질문 ${index + 1}:`, {
    //         id: question.id,
    //         text: question.question_text,
    //         category: question.category_name,
    //         optionsCount: question.options ? question.options.length : 0,
    //         options: question.options
    //     });
    // });

    const modal = document.createElement('div');
    modal.id = 'multipleQuestionsModal';
    modal.className = 'modal-overlay';
    
    let questionsHtml = '';
    questions.forEach((question, index) => {
        if (!question.options || question.options.length === 0) {
            console.error(`질문 ${question.id}에 옵션이 없습니다!`);
            questionsHtml += `
                <div class="question-item" data-question-id="${question.id}">
                    <div class="question-category">
                        <span class="category-badge">${question.category_name}</span>
                    </div>
                    <div class="question-text">${question.question_text}</div>
                    <div class="options-container">
                        <p style="color: red;">이 질문에는 선택지가 없습니다.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        questionsHtml += `
            <div class="question-item" data-question-id="${question.id}">
                <div class="question-category">
                    <span class="category-badge">${question.category_name}</span>
                </div>
                <div class="question-text">${question.question_text}</div>
                <div class="options-container">
                    ${question.options.map((option, optionIndex) => {
                        console.log(`질문 ${question.id} 옵션 ${optionIndex}:`, option);
                        return `
                            <label class="option-item">
                                <input type="radio" 
                                       name="question_${question.id}" 
                                       value="${option.value || optionIndex + 1}"
                                       data-text="${option.text || '옵션 없음'}"
                                       id="option_${question.id}_${optionIndex}">
                                <span class="option-content">
                                    <span class="option-text">${option.text || '옵션 없음'}</span>
                                </span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    modal.innerHTML = `
        <div class="modal-content multiple-questions">
            <h3>오늘의 질문 (${questions.length}개)</h3>
            <div class="questions-container">
                ${questionsHtml}
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn-submit">답변 완료</button>
                <button type="button" class="btn-cancel">취소</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // DOM에 추가된 후 라디오 버튼 확인
    setTimeout(() => {
        const addedRadios = modal.querySelectorAll('input[type="radio"]');
        console.log('모달에 추가된 라디오 버튼 수:', addedRadios.length);
        addedRadios.forEach((radio, index) => {
            console.log(`추가된 라디오 ${index}:`, {
                name: radio.name,
                value: radio.value,
                dataText: radio.dataset.text
            });
        });
    }, 100);

    // 이벤트 리스너 추가
    modal.querySelector('.btn-cancel').onclick = closeMultipleQuestionsModal;
    modal.querySelector('.btn-submit').onclick = () => submitMultipleAnswers(questions);
}

// 다중 답변 제출
async function submitMultipleAnswers(questions) {
    console.log('submitMultipleAnswers 호출됨, 질문 수:', questions.length);
    
    const answers = [];
    let hasEmptyAnswer = false;

    // 모든 라디오 버튼 다시 확인
    const allRadios = document.querySelectorAll('input[type="radio"]');
    console.log('현재 페이지의 모든 라디오 버튼 수:', allRadios.length);

    questions.forEach((question, index) => {
        console.log(`질문 ${index + 1} (ID: ${question.id}) 처리 중...`);
        
        // 여러 방법으로 선택된 라디오 버튼 찾기
        let selectedOption = document.querySelector(`input[name="question_${question.id}"]:checked`);
        
        // 첫 번째 방법으로 찾지 못하면 다른 방법 시도
        if (!selectedOption) {
            console.log(`방법 1 실패, 다른 방법으로 시도... (question_${question.id})`);
            
            // 모든 라디오 버튼을 순회하면서 찾기
            const questionRadios = document.querySelectorAll(`input[name="question_${question.id}"]`);
            console.log(`질문 ${question.id}의 라디오 버튼 수:`, questionRadios.length);
            
            questionRadios.forEach(radio => {
                console.log(`라디오 확인:`, {
                    name: radio.name,
                    value: radio.value,
                    checked: radio.checked,
                    dataText: radio.dataset.text
                });
                
                if (radio.checked) {
                    selectedOption = radio;
                }
            });
        }
        
        if (!selectedOption) {
            console.log(`질문 ${question.id}에 선택된 답변이 없습니다.`);
            hasEmptyAnswer = true;
            const questionItem = document.querySelector(`[data-question-id="${question.id}"]`);
            if (questionItem) {
                questionItem.style.borderColor = '#ff6f61';
                questionItem.style.backgroundColor = '#fff5f4';
                questionItem.classList.add('error');
            }
            return;
        }
        
        // 오류 스타일 제거
        const questionItem = document.querySelector(`[data-question-id="${question.id}"]`);
        if (questionItem) {
            questionItem.style.borderColor = '';
            questionItem.style.backgroundColor = '';
            questionItem.classList.remove('error');
        }
        
        // 안전한 데이터 추출
        const answerText = selectedOption.dataset.text || selectedOption.getAttribute('data-text') || '답변 없음';
        const answerCode = selectedOption.value || '0';
        
        console.log(`질문 ${question.id} 답변:`, answerText, '코드:', answerCode);
        
        answers.push({
            questionId: question.id,
            answer: answerText,
            answerCode: answerCode
        });
    });

    if (hasEmptyAnswer) {
        alert('모든 질문에 답변해주세요.');
        return;
    }

    console.log('제출할 답변들:', answers);

    try {
        const res = await fetch('/api/attendance/submit-answers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ answers })
        });
        
        const json = await res.json();
        
        if (json.success) {
            closeMultipleQuestionsModal();
            await completeCheckIn(json.points);
        } else {
            alert(json.message);
        }
    } catch (e) {
        console.error(e);
        alert('답변 제출 오류');
    }
}

// 다중 질문 모달 닫기
function closeMultipleQuestionsModal() {
    document.getElementById('multipleQuestionsModal')?.remove();
}

// 다중 답변 제출
async function submitMultipleAnswers(questions) {
    console.log('=== submitMultipleAnswers 시작 ===');
    console.log('전달받은 질문들:', questions);
    
    // 현재 DOM에 있는 모든 라디오 버튼 확인
    const allRadios = document.querySelectorAll('input[type="radio"]');
    console.log('페이지의 모든 라디오 버튼 수:', allRadios.length);
    
    allRadios.forEach((radio, index) => {
        console.log(`라디오 ${index}:`, {
            name: radio.name,
            value: radio.value,
            checked: radio.checked,
            dataText: radio.dataset.text
        });
    });
    
    const answers = [];
    let hasEmptyAnswer = false;

    questions.forEach((question, questionIndex) => {
        console.log(`\n=== 질문 ${questionIndex + 1} 처리 (ID: ${question.id}) ===`);
        
        // 해당 질문의 모든 라디오 버튼 찾기
        const questionRadios = document.querySelectorAll(`input[name="question_${question.id}"]`);
        console.log(`질문 ${question.id}의 라디오 버튼 수:`, questionRadios.length);
        
        if (questionRadios.length === 0) {
            console.error(`질문 ${question.id}의 라디오 버튼을 찾을 수 없습니다!`);
            hasEmptyAnswer = true;
            return;
        }
        
        // 각 라디오 버튼 상태 확인
        let selectedOption = null;
        questionRadios.forEach((radio, radioIndex) => {
            console.log(`  라디오 ${radioIndex}:`, {
                name: radio.name,
                value: radio.value,
                checked: radio.checked,
                dataText: radio.dataset.text
            });
            
            if (radio.checked) {
                selectedOption = radio;
            }
        });
        
        if (!selectedOption) {
            console.log(`질문 ${question.id}에 선택된 답변이 없습니다.`);
            hasEmptyAnswer = true;
            const questionItem = document.querySelector(`[data-question-id="${question.id}"]`);
            if (questionItem) {
                questionItem.style.borderColor = '#ff6f61';
                questionItem.style.backgroundColor = '#fff5f4';
            }
            return;
        }
        
        console.log(`질문 ${question.id} 선택된 답변:`, {
            value: selectedOption.value,
            dataText: selectedOption.dataset.text
        });
        
        answers.push({
            questionId: question.id,
            answer: selectedOption.dataset.text || selectedOption.value,
            answerCode: selectedOption.value
        });
    });

    console.log('=== 최종 답변 목록 ===');
    console.log('hasEmptyAnswer:', hasEmptyAnswer);
    console.log('answers:', answers);

    if (hasEmptyAnswer) {
        alert('모든 질문에 답변해주세요.');
        return;
    }

    try {
        const res = await fetch('/api/attendance/submit-answers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ answers })
        });
        
        const json = await res.json();
        
        if (json.success) {
            closeMultipleQuestionsModal();
            await completeCheckIn(json.points);
        } else {
            alert(json.message);
        }
    } catch (e) {
        console.error(e);
        alert('답변 제출 오류');
    }
}

/* ---------- 출석 완료 후 처리 ---------- */
async function completeCheckIn(points){
    await loadAttendanceData();
    await loadAttendanceStats();

    updateCheckInButton();
    if(currentMonth===today.getMonth() && currentYear===today.getFullYear())
        generateCalendar(currentMonth,currentYear);
    updateAttendanceSummary();

    showCheckInSuccess();
    showPointNotification(`+${points}P`);
}

function updateCheckInButton(){
    const btn   = document.getElementById('checkInBtn');
    const msg   = document.querySelector('.status-message');
    const info  = document.querySelector('.reward-info');
    const key   = `${today.getFullYear()}-${today.getMonth()+1}`;
    const day   = today.getDate();
    const done  = attendanceData[key]?.includes(day);

    if(done){
        btn.disabled = true;
        btn.classList.add('completed');
        btn.textContent = '출석완료';
        msg.textContent = '오늘 출석체크가 완료되었습니다!';
        info.textContent= '내일 다시 출석해주세요!';
        info.style.color='#666';
    }else{
        btn.disabled = false;
        btn.classList.remove('completed');
        btn.textContent = '출석체크';
        msg.textContent = '오늘 출석체크를 완료하세요!';
        info.textContent= '+10 포인트 획득 가능';
        info.style.color='#4caf50';
    }
}

/* ---------- 통계 & 요약 ---------- */
function updateAttendanceSummary(){
    document.querySelector('.summary-card:nth-child(1) .summary-value').textContent =
        `${attendanceStats.current_month_attendance||0}일`;
    document.querySelector('.summary-card:nth-child(2) .summary-value').textContent =
        `${attendanceStats.current_consecutive_days||0}일`;
    document.querySelector('.summary-card:nth-child(3) .summary-value').textContent =
        `${attendanceStats.total_points_earned||0}P`;
}

/* ---------- 보조 ---------- */
function showCheckInSuccess(){
    const btn = document.getElementById('checkInBtn');
    btn.classList.add('check-in-success');
    setTimeout(()=>btn.classList.remove('check-in-success'),600);
}

function showPointNotification(txt){
    const noti = document.createElement('div');
    noti.className = 'point-notification';
    noti.textContent = txt;
    noti.style.cssText = `
        position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:#ff8a65;color:#fff;padding:10px 25px;border-radius:20px;
        font-weight:bold;z-index:9999;animation:pointPop 1.5s ease-out forwards;`;
    document.body.appendChild(noti);
    setTimeout(()=>noti.remove(),1500);
}

/* ---------- 날짜 변경 감지 ---------- */
function checkDateChange(){
    const now = new Date();
    if(now.getDate()!==today.getDate()||
        now.getMonth()!==today.getMonth()||
        now.getFullYear()!==today.getFullYear()){
        today = now;
        if(currentMonth===today.getMonth() && currentYear===today.getFullYear()){
            generateCalendar(currentMonth,currentYear);
        }
        updateCheckInButton();
        updateAttendanceSummary();
    }
}

/* ---------- 보상 정보 동적 로드 ---------- */
async function loadRewardInfo() {
    try {
        const res = await fetch('/api/attendance/rewards');
        const json = await res.json();
        
        if (json.success && json.rewards) {
            updateRewardDisplay(json.rewards);
        }
    } catch (e) {
        console.error('보상 정보 로드 실패', e);
    }
}

function updateRewardDisplay(rewards) {
    const rewardList = document.querySelector('.reward-list');
    
    if (!rewardList) {
        console.error('reward-list 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 기존 보상 아이템들 제거
    rewardList.innerHTML = '';
    
    // DB에서 가져온 보상 정보로 동적 생성
    rewards.forEach(reward => {
        const rewardItem = document.createElement('div');
        rewardItem.className = 'reward-item';
        
        rewardItem.innerHTML = `
            <span class="reward-day">${reward.consecutive_days}일 연속</span>
            <span class="reward-points">+${reward.reward_points}P</span>
        `;
        
        // 보상 설명이 있으면 툴팁으로 추가
        if (reward.reward_description) {
            rewardItem.title = reward.reward_description;
        }
        
        rewardList.appendChild(rewardItem);
    });
}

/* ---------- CSS 애니메이션 추가 ---------- */
const style = document.createElement('style');
style.textContent = `
    @keyframes pointPop {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1) translateY(-50px);
        }
    }
    .future-date {
        pointer-events: none;
    }
`;
document.head.appendChild(style);