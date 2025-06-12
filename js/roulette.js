// script.js
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const wheel = document.getElementById("wheel");
const newFoodInput = document.getElementById("newFood");
const foodList = document.getElementById("foodList");
const historyList = document.getElementById("historyList");

let foods = ["김치찌개", "된장찌개", "치킨", "피자"];
let currentRotation = 0;
let isSpinning = false;

function drawWheel() {
  const numSlices = foods.length;
  const angle = (2 * Math.PI) / numSlices;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    const adjustedRotation = (360 - normalizedRotation + sliceDeg / 2) % 360;
    const index = Math.floor(adjustedRotation / sliceDeg);
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
  document.querySelector('.controls button').disabled = !enabled;
  const deleteButtons = document.querySelectorAll('#foodList button');
  deleteButtons.forEach(btn => btn.disabled = !enabled);
}

drawWheel();
