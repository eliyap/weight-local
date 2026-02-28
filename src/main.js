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
let deleteConfirmId = null;
let deleteTimeout = null;

const listEl = document.getElementById("exercise-list");
const emptyEl = document.getElementById("empty-state");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("exercise-input");

function render() {
  emptyEl.classList.toggle("hidden", exercises.length > 0);
  listEl.innerHTML = "";

  exercises.forEach((ex) => {
    const li = document.createElement("li");
    li.className = "exercise-card";

    const idx = WEIGHTS.indexOf(ex.weight);
    const atMin = idx <= 0;
    const atMax = idx >= WEIGHTS.length - 1;
    const decLabel = atMin ? "" : formatWeight(ex.weight - WEIGHTS[idx - 1]);
    const incLabel = atMax ? "" : formatWeight(WEIGHTS[idx + 1] - ex.weight);

    li.innerHTML = `
      <div class="exercise-header">
        <button class="exercise-name" data-id="${ex.id}" data-action="rename">${escapeHtml(ex.name)}</button>
        <button class="delete-btn${deleteConfirmId === ex.id ? " confirm" : ""}" data-id="${ex.id}" data-action="delete" aria-label="Delete exercise">
          ${deleteConfirmId === ex.id ? "?" : "\u00d7"}
        </button>
      </div>
      <div class="weight-controls">
        <button class="step-btn" data-id="${ex.id}" data-action="dec" ${atMin ? "disabled" : ""}>-${decLabel}</button>
        <div class="weight-display">${formatWeight(ex.weight)}<span class="weight-unit">lbs</span></div>
        <button class="step-btn" data-id="${ex.id}" data-action="inc" ${atMax ? "disabled" : ""}>+${incLabel}</button>
      </div>
    `;

    listEl.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function findExercise(id) {
  return exercises.find((e) => e.id === id);
}

function clearDeleteConfirm() {
  deleteConfirmId = null;
  if (deleteTimeout) {
    clearTimeout(deleteTimeout);
    deleteTimeout = null;
  }
}

// Event: Add exercise
formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = inputEl.value.trim();
  if (!name) return;

  exercises.push({ id: generateId(), name, weight: DEFAULT_WEIGHT });
  saveExercises(exercises);
  inputEl.value = "";
  inputEl.blur();
  render();
});

// Event: List actions (delegation)
listEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { id, action } = btn.dataset;
  const ex = findExercise(id);
  if (!ex) return;

  switch (action) {
    case "inc": {
      const i = WEIGHTS.indexOf(ex.weight);
      if (i < WEIGHTS.length - 1) ex.weight = WEIGHTS[i + 1];
      clearDeleteConfirm();
      saveExercises(exercises);
      render();
      break;
    }

    case "dec": {
      const i = WEIGHTS.indexOf(ex.weight);
      if (i > 0) ex.weight = WEIGHTS[i - 1];
      clearDeleteConfirm();
      saveExercises(exercises);
      render();
      break;
    }

    case "rename": {
      clearDeleteConfirm();
      const newName = prompt("Rename exercise:", ex.name);
      if (newName !== null && newName.trim()) {
        ex.name = newName.trim();
        saveExercises(exercises);
        render();
      }
      break;
    }

    case "delete":
      if (deleteConfirmId === id) {
        // Second tap — delete
        clearDeleteConfirm();
        exercises = exercises.filter((e) => e.id !== id);
        saveExercises(exercises);
        render();
      } else {
        // First tap — confirm
        clearDeleteConfirm();
        deleteConfirmId = id;
        render();
        deleteTimeout = setTimeout(() => {
          deleteConfirmId = null;
          render();
        }, 2000);
      }
      break;
  }
});

// Initial render
render();
