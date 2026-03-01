const STORAGE_KEY = "dumbbell-tracker";

// Valid weights: 15 lb handle, +10 per large plate, +2.5 per small insert (max 2)
const WEIGHTS = [];
for (let large = 0; large <= 7; large++) {
  for (let small = 0; small <= 2; small++) {
    WEIGHTS.push(15 + large * 10 + small * 2.5);
  }
}
// WEIGHTS = [15, 17.5, 20, 25, 27.5, 30, ..., 85, 87.5, 90]

const DEFAULT_WEIGHT = 15;

function loadExercises() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveExercises(exercises) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatWeight(w) {
  return w % 1 === 0 ? w.toString() : w.toFixed(1);
}

let exercises = loadExercises();
let longPressTimer = null;

const listEl = document.getElementById("exercise-list");
const emptyEl = document.getElementById("empty-state");

function render() {
  emptyEl.classList.toggle("hidden", exercises.length > 0);
  listEl.innerHTML = "";

  exercises.forEach((ex) => {
    const li = document.createElement("li");
    li.className = "exercise-card";

    const idx = WEIGHTS.indexOf(ex.weight);
    const atMin = idx <= 0;
    const atMax = idx >= WEIGHTS.length - 1;

    li.innerHTML = `
      <button class="exercise-name" data-id="${ex.id}" data-action="rename">${escapeHtml(ex.name)}</button>
      <div class="weight-controls">
        <button class="step-btn" data-id="${ex.id}" data-action="dec" ${atMin ? "disabled" : ""}>\u25BC</button>
        <div class="weight-display">${formatWeight(ex.weight)}</div>
        <button class="step-btn" data-id="${ex.id}" data-action="inc" ${atMax ? "disabled" : ""}>\u25B2</button>
      </div>
    `;

    listEl.appendChild(li);
  });

  const addLi = document.createElement("li");
  addLi.className = "add-row";
  addLi.innerHTML = `<button class="add-btn" data-action="add">+</button>`;
  listEl.appendChild(addLi);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function findExercise(id) {
  return exercises.find((e) => e.id === id);
}

// Event: List actions (delegation)
listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { id, action } = btn.dataset;

  if (action === "add") {
    const name = prompt("Exercise name:");
    if (name !== null && name.trim()) {
      exercises.push({ id: generateId(), name: name.trim(), weight: DEFAULT_WEIGHT });
      saveExercises(exercises);
      render();
    }
    return;
  }

  const ex = findExercise(id);
  if (!ex) return;

  switch (action) {
    case "inc": {
      const i = WEIGHTS.indexOf(ex.weight);
      if (i < WEIGHTS.length - 1) ex.weight = WEIGHTS[i + 1];
      saveExercises(exercises);
      render();
      break;
    }

    case "dec": {
      const i = WEIGHTS.indexOf(ex.weight);
      if (i > 0) ex.weight = WEIGHTS[i - 1];
      saveExercises(exercises);
      render();
      break;
    }

    case "rename": {
      const newName = prompt("Rename exercise:", ex.name);
      if (newName !== null && newName.trim()) {
        ex.name = newName.trim();
        saveExercises(exercises);
        render();
      }
      break;
    }
  }
});

// Event: Long-press to delete
function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

listEl.addEventListener("pointerdown", (e) => {
  const card = e.target.closest(".exercise-card");
  if (!card) return;
  const nameBtn = card.querySelector(".exercise-name");
  if (!nameBtn) return;
  const id = nameBtn.dataset.id;

  clearLongPress();
  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    const ex = findExercise(id);
    if (!ex) return;
    if (confirm(`Delete "${ex.name}"?`)) {
      exercises = exercises.filter((e) => e.id !== id);
      saveExercises(exercises);
      render();
    }
  }, 500);
});

listEl.addEventListener("pointerup", clearLongPress);
listEl.addEventListener("pointercancel", clearLongPress);
listEl.addEventListener("pointermove", (e) => {
  if (longPressTimer && (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5)) {
    clearLongPress();
  }
});

// Initial render
render();
