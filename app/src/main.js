// SUNHAVEN HEAT Cover Studio — editor.
// Opens with a finished cover built from the bundled sample photos, then
// lets the visitor swap in their own photos (read locally, never uploaded),
// arrange them panel by panel, retitle the cover and export PNG files.

import { LAYOUTS, GRADES, drawCover, cellAt, cellCount } from './cover.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const titleInput = document.getElementById('title');
const creditInput = document.getElementById('credit');
const layoutSelect = document.getElementById('layout');
const gradeSelect = document.getElementById('grade');
const zoomInput = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');
const cellLabel = document.getElementById('cellLabel');
const statusEl = document.getElementById('status');
const thumbsEl = document.getElementById('thumbs');

const state = {
  layout: 'quad',
  grade: 'sunset',
  title: titleInput.value,
  credit: creditInput.value,
  cells: [],
  selected: 0,
};

function blankCell(img) {
  return { img: img || null, x: 0, y: 0, zoom: 1 };
}

function ensureCells() {
  const n = cellCount(state.layout);
  while (state.cells.length < n) state.cells.push(blankCell(null));
  if (state.selected >= n) state.selected = 0;
}

function setStatus(message) {
  statusEl.textContent = message;
}

let lastCells = [];

function drawSelection() {
  // A pure cover scene must stay clean: no editor overlay on the artwork.
  if (document.body.classList.contains('shot-cover')) return;
  const rect = lastCells[state.selected];
  if (!rect) return;
  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffd23e';
  ctx.setLineDash([16, 10]);
  ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
  ctx.setLineDash([]);
  ctx.font = '700 22px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#ffd23e';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 4;
  const label = `PANEL ${state.selected + 1}`;
  ctx.strokeText(label, rect.x + 14, rect.y + 30);
  ctx.fillText(label, rect.x + 14, rect.y + 30);
  ctx.restore();
}

// Single render path: paint the cover, remember its panel rectangles for
// hit-testing, draw the selection overlay, then sync the controls.
function renderTracked() {
  ensureCells();
  const result = drawCover(ctx, canvas.width, canvas.height, state);
  lastCells = result.cells;
  drawSelection();
  renderThumbs();
  const cell = state.cells[state.selected];
  zoomInput.value = String(cell ? cell.zoom : 1);
  zoomValue.textContent = `${Math.round((cell ? cell.zoom : 1) * 100)}%`;
  cellLabel.textContent = `Panel ${state.selected + 1} of ${cellCount(state.layout)}`;
}

function renderThumbs() {
  thumbsEl.innerHTML = '';
  const n = cellCount(state.layout);
  for (let i = 0; i < n; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb' + (i === state.selected ? ' active' : '');
    button.textContent = state.cells[i] && state.cells[i].img ? `Panel ${i + 1} · photo` : `Panel ${i + 1} · empty`;
    button.addEventListener('click', () => {
      state.selected = i;
      renderTracked();
    });
    thumbsEl.appendChild(button);
  }
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Loader handed to the screenshot scenes: fills the cover from sample
// photos and words, in order, wrapping around when panels outnumber photos.
async function load(samples, title, credit) {
  const images = [];
  for (const src of samples) images.push(await loadImageFromUrl(src));
  const n = cellCount(state.layout);
  state.cells = [];
  for (let i = 0; i < n; i++) state.cells.push(blankCell(images[i % images.length]));
  if (typeof title === 'string') { state.title = title; titleInput.value = title; }
  if (typeof credit === 'string') { state.credit = credit; creditInput.value = credit; }
  state.selected = 0;
  renderTracked();
}

async function loadDefaults() {
  await load(['samples/pier.jpg', 'samples/boulevard.jpg'], state.title, state.credit);
  setStatus('Sample cover ready — add your own photos to make it yours.');
}

// ---- Controls ----------------------------------------------------------

for (const layout of LAYOUTS) {
  const option = document.createElement('option');
  option.value = layout.id;
  option.textContent = layout.label;
  layoutSelect.appendChild(option);
}
for (const grade of GRADES) {
  const option = document.createElement('option');
  option.value = grade.id;
  option.textContent = grade.label;
  gradeSelect.appendChild(option);
}
layoutSelect.value = state.layout;
gradeSelect.value = state.grade;

layoutSelect.addEventListener('change', () => {
  state.layout = layoutSelect.value;
  state.selected = 0;
  ensureCells();
  renderTracked();
});
gradeSelect.addEventListener('change', () => {
  state.grade = gradeSelect.value;
  renderTracked();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; renderTracked(); });
creditInput.addEventListener('input', () => { state.credit = creditInput.value; renderTracked(); });
zoomInput.addEventListener('input', () => {
  const cell = state.cells[state.selected];
  if (cell) cell.zoom = Number(zoomInput.value);
  renderTracked();
});

document.getElementById('photos').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  if (!files.length) return;
  const start = state.selected;
  for (let i = 0; i < files.length; i++) {
    const img = await loadImageFromFile(files[i]);
    const idx = (start + i) % cellCount(state.layout);
    state.cells[idx] = blankCell(img);
  }
  setStatus(`${files.length} photo(s) loaded locally — nothing was uploaded.`);
  renderTracked();
});

document.getElementById('fillAll').addEventListener('click', () => {
  const source = state.cells[state.selected];
  if (!source || !source.img) { setStatus('Pick a panel with a photo first.'); return; }
  const n = cellCount(state.layout);
  for (let i = 0; i < n; i++) state.cells[i] = blankCell(source.img);
  setStatus('Every panel now uses the selected photo.');
  renderTracked();
});

document.getElementById('resetView').addEventListener('click', () => {
  const cell = state.cells[state.selected];
  if (cell) { cell.x = 0; cell.y = 0; cell.zoom = 1; }
  renderTracked();
});

// ---- Drag to reposition the selected panel's photo ---------------------

let drag = null;
function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const hit = cellAt(state.layout, canvas.width, canvas.height, point.x, point.y);
  if (hit >= 0) state.selected = hit;
  drag = { x: point.x, y: point.y };
  canvas.setPointerCapture(event.pointerId);
  renderTracked();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const cell = state.cells[state.selected];
  if (cell && cell.img) {
    cell.x = Math.max(-1, Math.min(1, cell.x + (point.x - drag.x) / 220));
    cell.y = Math.max(-1, Math.min(1, cell.y + (point.y - drag.y) / 220));
  }
  drag = point;
  renderTracked();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// ---- PNG export ----------------------------------------------------------

function exportPng(width, height) {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  drawCover(off.getContext('2d'), width, height, state);
  off.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sunhaven-cover-${width}x${height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setStatus(`Exported PNG ${width} x ${height}.`);
  }, 'image/png');
}
document.querySelectorAll('[data-export]').forEach((button) => {
  button.addEventListener('click', () => {
    const [w, h] = button.getAttribute('data-export').split('x').map(Number);
    exportPng(w, h);
  });
});

// ---- Boot / screenshot scenes --------------------------------------------

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  const { runShot } = await import('./shots.js');
  await runShot(shot, params, load, state, (patch) => {
    Object.assign(state, patch);
    layoutSelect.value = state.layout;
    gradeSelect.value = state.grade;
  });
} else {
  await loadDefaults();
}
renderTracked();
