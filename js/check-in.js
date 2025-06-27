// 달력 관련 변수
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let today = new Date();

// 월 이름 배열
const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
];

// 요일 이름 배열
const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

// 출석 데이터 (실제로는 서버에서 가져와야 함)
let attendanceData = {
    '2025-6': [2, 3, 4, 9, 10, 15, 25, 26, 27], // 6월 출석일
    '2025-7': [1, 3, 5, 8, 12], // 7월 출석일 (예시)
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();
        
        if (!data.loggedIn) {
            // AIMenu.js와 동일한 방식 사용
            alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/intro.html';
            return;
        }
    } catch (error) {
        console.error('세션 확인 중 오류:', error);
        alert('서버와 통신할 수 없습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/intro.html';
        return;
    }

    initializeCalendar();
    initializeCheckIn();
    updateAttendanceSummary();
    
    // 매일 자정에 달력 업데이트 (실시간 업데이트)
    setInterval(checkDateChange, 60000); // 1분마다 체크
});

// 날짜 변경 체크
function checkDateChange() {
    const now = new Date();
    if (now.getDate() !== today.getDate() || 
        now.getMonth() !== today.getMonth() || 
        now.getFullYear() !== today.getFullYear()) {
        
        today = new Date();
        // 현재 보고 있는 달이 오늘 날짜의 달이면 달력 업데이트
        if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            generateCalendar(currentMonth, currentYear);
        }
        updateAttendanceSummary();
    }
}

// 달력 초기화
function initializeCalendar() {
    generateCalendar(currentMonth, currentYear);
    
    // 달력 네비게이션 이벤트
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(currentMonth, currentYear);
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
    });
}

// 동적 달력 생성
function generateCalendar(month, year) {
    const calendarGrid = document.querySelector('.calendar-grid');
    const monthYearDisplay = document.getElementById('currentMonth');
    
    // 월/년 표시 업데이트
    monthYearDisplay.textContent = `${year}년 ${monthNames[month]}`;
    
    // 기존 날짜들 제거 (요일 헤더는 유지)
    const existingDays = calendarGrid.querySelectorAll('.day, .day.other-month');
    existingDays.forEach(day => day.remove());
    
    // 해당 월의 첫 번째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // 이전 달의 마지막 날들
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    // 이전 달 날짜들 추가
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dayElement = createDayElement(prevMonthLastDay - i, 'other-month');
        calendarGrid.appendChild(dayElement);
    }
    
    // 현재 달 날짜들 추가
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day, 'current-month', month, year);
        calendarGrid.appendChild(dayElement);
    }
    
    // 다음 달 날짜들 추가 (6주 완성을 위해)
    const totalCells = calendarGrid.children.length - 7; // 요일 헤더 제외
    const remainingCells = 42 - totalCells; // 6주 * 7일 = 42셀
    
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, 'other-month');
        calendarGrid.appendChild(dayElement);
    }
}

// 날짜 요소 생성
function createDayElement(day, type, month = null, year = null) {
    const dayElement = document.createElement('div');
    dayElement.className = 'day';
    dayElement.textContent = day;
    
    if (type === 'other-month') {
        dayElement.classList.add('other-month');
        return dayElement;
    }
    
    // 오늘 날짜 체크
    if (year === today.getFullYear() && 
        month === today.getMonth() && 
        day === today.getDate()) {
        dayElement.classList.add('today');
    }
    
    // 출석 체크된 날짜 표시
    const dateKey = `${year}-${month + 1}`;
    if (attendanceData[dateKey] && attendanceData[dateKey].includes(day)) {
        dayElement.classList.add('checked');
    }
    
    // 미래 날짜는 클릭 비활성화
    const currentDateObj = new Date(year, month, day);
    if (currentDateObj > today) {
        dayElement.classList.add('future-date');
        dayElement.style.opacity = '0.5';
        dayElement.style.cursor = 'not-allowed';
    }
    
    return dayElement;
}

// 출석체크 초기화
function initializeCheckIn() {
    const checkInBtn = document.getElementById('checkInBtn');
    
    // 오늘 이미 출석했는지 체크
    updateCheckInButton();
    
    checkInBtn.addEventListener('click', function() {
        if (!checkInBtn.disabled) {
            performCheckIn();
        }
    });
}

// 출석체크 실행
function performCheckIn() {
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const todayDate = today.getDate();
    
    // 출석 데이터에 추가
    if (!attendanceData[todayKey]) {
        attendanceData[todayKey] = [];
    }
    
    if (!attendanceData[todayKey].includes(todayDate)) {
        attendanceData[todayKey].push(todayDate);
        
        // 버튼 상태 업데이트
        updateCheckInButton();
        
        // 달력 업데이트 (현재 월이 오늘 월과 같은 경우)
        if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            generateCalendar(currentMonth, currentYear);
        }
        
        // 출석 요약 업데이트
        updateAttendanceSummary();
        
        // 성공 애니메이션
        showCheckInSuccess();
        
        // 실제 서버 API 호출 (여기에 추가)
        // await fetch('/api/attendance/check-in', { method: 'POST' });
    }
}

// 출석체크 버튼 상태 업데이트
function updateCheckInButton() {
    const checkInBtn = document.getElementById('checkInBtn');
    const statusMessage = document.querySelector('.status-message');
    const rewardInfo = document.querySelector('.reward-info');
    
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const todayDate = today.getDate();
    
    const hasCheckedIn = attendanceData[todayKey] && 
                        attendanceData[todayKey].includes(todayDate);
    
    if (hasCheckedIn) {
        checkInBtn.disabled = true;
        checkInBtn.classList.add('completed');
        checkInBtn.innerHTML = '출석완료';
        statusMessage.textContent = '오늘 출석체크가 완료되었습니다!';
        rewardInfo.textContent = '내일 다시 출석해주세요!';
        rewardInfo.style.color = '#666';
    } else {
        checkInBtn.disabled = false;
        checkInBtn.classList.remove('completed');
        checkInBtn.innerHTML = '출석체크';
        statusMessage.textContent = '오늘 출석체크를 완료하세요!';
        rewardInfo.textContent = '+10 포인트 획득 가능';
    }
}

// 출석 현황 요약 업데이트
function updateAttendanceSummary() {
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const currentMonthAttendance = attendanceData[currentMonthKey] || [];
    
    // 이번 달 출석일 수
    document.querySelector('.summary-card:nth-child(1) .summary-value').textContent = 
        `${currentMonthAttendance.length}일`;
    
    // 연속 출석일 계산
    const consecutiveDays = calculateConsecutiveDays();
    document.querySelector('.summary-card:nth-child(2) .summary-value').textContent = 
        `${consecutiveDays}일`;
    
    // 총 포인트 계산 (임시)
    const totalPoints = calculateTotalPoints();
    document.querySelector('.summary-card:nth-child(3) .summary-value').textContent = 
        `${totalPoints}P`;
}

// 연속 출석일 계산
function calculateConsecutiveDays() {
    let consecutive = 0;
    let checkDate = new Date(today);
    
    // 오늘부터 거꾸로 확인
    while (true) {
        const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}`;
        const dateDay = checkDate.getDate();
        
        if (attendanceData[dateKey] && attendanceData[dateKey].includes(dateDay)) {
            consecutive++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return consecutive;
}

// 총 포인트 계산
function calculateTotalPoints() {
    let totalPoints = 0;
    
    // 모든 출석일에 대해 기본 포인트 계산
    Object.values(attendanceData).forEach(monthData => {
        totalPoints += monthData.length * 10; // 일일 10포인트
    });
    
    // 연속 출석 보너스 등 추가 계산 가능
    
    return totalPoints;
}

// 출석체크 성공 애니메이션
function showCheckInSuccess() {
    const checkInBtn = document.getElementById('checkInBtn');
    checkInBtn.classList.add('check-in-success');
    
    setTimeout(() => {
        checkInBtn.classList.remove('check-in-success');
    }, 600);
    
    // 포인트 획득 알림 (선택사항)
    showPointNotification('+10P');
}

// 포인트 알림 표시
function showPointNotification(points) {
    const notification = document.createElement('div');
    notification.className = 'point-notification';
    notification.textContent = points;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff8a65; /* 기존 #4caf50에서 변경 */
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        z-index: 9999;
        animation: pointPop 1.5s ease-out forwards;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 1500);
}

// CSS 애니메이션 추가
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

// 서버에서 출석 데이터 가져오기 (실제 구현시)
async function loadAttendanceData() {
    try {
        const response = await fetch('/api/attendance/data');
        const data = await response.json();
        if (data.success) {
            attendanceData = data.attendanceData;
            generateCalendar(currentMonth, currentYear);
            updateAttendanceSummary();
            updateCheckInButton();
        }
    } catch (error) {
        console.error('출석 데이터 로드 실패:', error);
    }
}