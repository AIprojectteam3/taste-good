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
    /* 1) 세션 확인 */
    try {
        const sess = await (await fetch('/api/check-session')).json();
        if (!sess.loggedIn) {
            alert('로그인이 필요한 서비스입니다.');
            location.href = '/intro.html';
            return;
        }
    } catch (e) {
        alert('서버와 통신할 수 없습니다.');
        location.href = '/intro.html';
        return;
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
        const res  = await fetch('/api/attendance/check-in',{method:'POST',headers:{'Content-Type':'application/json'}});
        const json = await res.json();
        if(!json.success){ alert(json.message); return; }

        if(json.hasQuestion){
            showQuestionModal(json.question);
        }else{
            await completeCheckIn(json.points);
        }
    }catch(e){ console.error(e); alert('출석체크 중 오류 발생'); }
}

/* ---------- 질문 모달 ---------- */
function showQuestionModal(q){
    const modal = document.createElement('div');
    modal.id = 'questionModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>출석체크 질문</h3>
            <p class="question-text">${q.question_text}</p>
            <textarea id="userAnswer" rows="4" placeholder="답변을 입력해주세요..."></textarea>
            <div class="modal-buttons">
                <button class="btn-cancel">취소</button>
                <button class="btn-submit">제출</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    modal.querySelector('.btn-cancel').onclick = closeQuestionModal;
    modal.querySelector('.btn-submit').onclick  = ()=>submitAnswer(q.id);
}

function closeQuestionModal(){
    document.getElementById('questionModal')?.remove();
}

async function submitAnswer(questionId){
    const answer = document.getElementById('userAnswer').value.trim();
    if(!answer){ alert('답변을 입력해주세요.'); return; }

    try{
        const res  = await fetch('/api/attendance/submit-answer',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({questionId,answer})
        });
        const json = await res.json();
        if(json.success){
            closeQuestionModal();
            await completeCheckIn(json.points);
        }else alert(json.message);
    }catch(e){ console.error(e); alert('답변 제출 오류'); }
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