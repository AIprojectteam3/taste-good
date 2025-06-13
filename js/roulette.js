// script.js
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const wheel = document.getElementById("wheel");
const newFoodInput = document.getElementById("newFood");
const foodList = document.getElementById("foodList");
const historyList = document.getElementById("historyList");

// 초기 음식 배열을 빈 배열로 설정
let foods = [];
let currentRotation = 0;
let isSpinning = false;

function drawWheel() {
  const numSlices = foods.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (numSlices === 0) {
    // 음식이 없을 때 안내 메시지
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
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.arc(200, 200, 200, i * angle, (i + 1) * angle);
    ctx.fillStyle = i % 2 === 0 ? "#ffd54f" : "#4fc3f7";
    ctx.fill();
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(i * angle + angle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    ctx.fillText(foods[i], 180, 10);
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
  if (isSpinning) return;
  const newFood = newFoodInput.value.trim();
  if (newFood && !foods.includes(newFood)) {
    foods.push(newFood);
    newFoodInput.value = "";
    drawWheel();
  }
}

function removeFood(name) {
  if (isSpinning) return;
  foods = foods.filter(f => f !== name);
  if (foods.length === 0) {
    currentRotation = 0;
    wheel.style.transform = `rotate(0deg)`;
  }
  drawWheel();
}

function spin() {
  if (isSpinning || foods.length === 0) {
    alert("현재 회전 중이거나 음식이 없습니다.");
    return;
  }
  isSpinning = true;
  toggleControls(false);

  const sliceDeg = 360 / foods.length;
  const extra = 360 * 5;
  const randomAngleWithinSlice = Math.random() * sliceDeg;
  const targetAngle = extra + randomAngleWithinSlice;

  currentRotation += targetAngle;
  wheel.style.transition = "transform 5s cubic-bezier(0.33, 1, 0.68, 1)";
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    const normalizedRotation = currentRotation % 360;
    const pointerDeg = 270; // 12시 방향
    const adjustedRotation = (normalizedRotation + pointerDeg) % 360;
    const index = Math.floor(adjustedRotation / sliceDeg) % foods.length;
    const result = foods[index];

    alert(`오늘은 "${result}" 어때요? 😋`);
    addToHistory(result);
    isSpinning = false;
    toggleControls(true);
  }, 5200);
}

function addToHistory(food) {
  const li = document.createElement("li");
  li.textContent = food;
  historyList.prepend(li);
}

function toggleControls(enabled) {
  newFoodInput.disabled = !enabled;
  // 모든 버튼 비활성화
  document.querySelectorAll('.controls button').forEach(btn => btn.disabled = !enabled);
  document.querySelectorAll('#foodList button').forEach(btn => btn.disabled = !enabled);
}

drawWheel();
