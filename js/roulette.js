// script.js
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const wheel = document.getElementById("wheel");
const newFoodInput = document.getElementById("newFood");
const foodList = document.getElementById("foodList");
const historyList = document.getElementById("historyList");

// 초기 음식 배열을 빈 배열로 설정
let foods = [];
let theWheel = null;

// 파스텔톤 색상 배열
const pastelColors = [
  "#FFD1DC", // 연핑크
  "#B5EAD7", // 연민트
  "#C7CEEA", // 연보라
  "#FFDAC1", // 연살구
  "#E2F0CB", // 연연두
  "#FFF1BA", // 연노랑
  "#B5D8FA", // 연하늘
  "#FFB7B2"  // 연코랄
];

function drawWheel() {
  const numSlices = foods.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (numSlices === 0) {
    ctx.save();
    ctx.translate(200, 200);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#bbb";
    ctx.font = "20px sans-serif";
    ctx.fillText("음식을 추가해 주세요!", 0, 0);
    ctx.restore();
    updateFoodList();
    return;
  }

  const angle = (2 * Math.PI) / numSlices;
  for (let i = 0; i < numSlices; i++) {
    // 조각 그리기: 12시 방향(-Math.PI/2)부터 시작
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.arc(200, 200, 200, i * angle - Math.PI / 2, (i + 1) * angle - Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? "#ffd54f" : "#4fc3f7";
    ctx.fill();

    // 텍스트: 조각의 중앙, 12시 기준
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(i * angle + angle / 2 - Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.fillText(foods[i], 120, 0);
    ctx.restore();
  }
  updateFoodList();
}

function updateFoodList() {
  foodList.innerHTML = "";
  foods.forEach(food => {
    const li = document.createElement("li");
    li.textContent = food;
    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.onclick = () => removeFood(food);
    li.appendChild(delBtn);
    foodList.appendChild(li);
  });
}

function addFood() {
  const newFood = newFoodInput.value.trim();
  if (newFood && !foods.includes(newFood)) {
    foods.push(newFood);
    newFoodInput.value = "";
    makeWheel(); // drawWheel() 대신 makeWheel() 호출
    updateFoodList();
  }
}

function removeFood(name) {
  foods = foods.filter(f => f !== name);
  if (foods.length === 0) {
    currentRotation = 0;
    wheel.style.transform = `rotate(0deg)`;
  }
  makeWheel(); // drawWheel() 대신 makeWheel() 호출
  updateFoodList();
}

function spin() {
  if (foods.length === 0) {
    alert("음식이 없습니다.");
    return;
  }
  theWheel.startAnimation();
}

function alertResult(indicatedSegment) {
  alert(`오늘은 "${indicatedSegment.text}" 어때요? 😋`);
  addToHistory(indicatedSegment.text);
}

function addToHistory(food) {
  const li = document.createElement("li");
  li.textContent = food;
  historyList.prepend(li);
}

function makeWheel() {
  if (!foods.length) {
    // 음식이 없으면 안내 메시지
    ctx.clearRect(0, 0, 400, 400);
    ctx.save();
    ctx.translate(200, 200);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#bbb";
    ctx.font = "20px sans-serif";
    ctx.fillText("음식을 추가해 주세요!", 0, 0);
    ctx.restore();
    return;
  }
  theWheel = new Winwheel({
    'canvasId': 'canvas',
    'numSegments': foods.length,
    'segments': foods.map((f, i) => ({
      'fillStyle': pastelColors[i % pastelColors.length], // 파스텔톤 순환
      'strokeStyle': 'transparent', // 테두리 색상
      'lineWidth': 0,
      'text': f
    })),
    'animation': {
      'type': 'spinToStop',
      'duration': 5,
      'spins': 5,
      'callbackFinished': alertResult
    },
    'pointerAngle': 0 // 12시 방향
  });
}

document.getElementById('addBtn').onclick = function() {
  const input = document.getElementById('newFood');
  const value = input.value.trim();
  if (value && !foods.includes(value)) {
    foods.push(value);
    input.value = '';
    updateFoodList();
    makeWheel();
  }
};

// spin 버튼 클릭 이벤트에서 룰렛 도는 동안 입력, 추가, 삭제 버튼 모두 비활성화
document.getElementById('spinBtn').onclick = function() {
  if (theWheel && foods.length) {
    // 입력창, 추가 버튼, 삭제 버튼 비활성화
    document.getElementById('newFood').disabled = true;
    document.getElementById('addBtn').disabled = true;
    document.querySelectorAll('#foodList button').forEach(btn => btn.disabled = true);

    // 애니메이션 상태 초기화
    theWheel.stopAnimation(false);
    theWheel.rotationAngle = 0;
    theWheel.draw();

    // 애니메이션 옵션 새로 할당
    theWheel.animation = {
      'type': 'spinToStop',
      'duration': 5,
      'spins': 5,
      'callbackFinished': function(seg) {
        alertResult(seg);
        // 룰렛 멈추면 다시 활성화
        document.getElementById('newFood').disabled = false;
        document.getElementById('addBtn').disabled = false;
        document.querySelectorAll('#foodList button').forEach(btn => btn.disabled = false);
      }
    };

    theWheel.startAnimation();
  }
};

function toggleControls(enabled) {
  newFoodInput.disabled = !enabled;
  // 모든 버튼 비활성화
  document.querySelectorAll('.controls button').forEach(btn => btn.disabled = !enabled);
  document.querySelectorAll('#foodList button').forEach(btn => btn.disabled = !enabled);
}

function resizeCanvas() {
  const area = document.querySelector('.roulette-area');
  const size = Math.min(area.offsetWidth, 400); // 최대 400px
  const canvas = document.getElementById('canvas');
  canvas.width = size;
  canvas.height = size;
  if (typeof makeWheel === 'function') makeWheel(); // Winwheel.js라면 다시 그리기
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('DOMContentLoaded', resizeCanvas);

makeWheel();
