// Sunhaven Heat Cover Studio - editor wiring.
// Loads photos from the visitor's own machine (FileReader / object URLs,
// never uploaded), keeps the cover state, renders the live preview and
// exports the finished cover as a PNG at the chosen post size.
import { LAYOUTS, GRADES, SIZES, makeState, drawCover, panelAt } from './cover.js';
import { runShot } from './shots.js';

const state = makeState();
let selected = 0;

const stage = document.getElementById('stage');
const sctx = stage.getContext('2d');
const titleInput = document.getElementById('titleInput');
const captionInput = document.getElementById('captionInput');
const creditInput = document.getElementById('creditInput');
const zoomRange = document.getElementById('zoomRange');
const sizeSelect = document.getElementById('sizeSelect');
const panelPhotoInput = document.getElementById('panelPhotoInput');
const allPhotoInput = document.getElementById('allPhotoInput');
const statusLine = document.getElementById('statusLine');

function say(text) { statusLine.textContent = text; }

// ---- preview rendering -------------------------------------------------
function fitStage() {
  const size = SIZES[state.size];
  const holder = stage.parentElement;
  const maxW = holder.clientWidth;
  const maxH = Math.max(320, window.innerHeight * 0.78);
  const k = Math.min(maxW / size.w, maxH / size.h);
  stage.width = Math.round(size.w * k);
  stage.height = Math.round(size.h * k);
  stage.style.aspectRatio = `${size.w} / ${size.h}`;
}
function render() {
  drawCover(sctx, state, stage.width, stage.height);
  markSelectedPanel();
}
function refresh() { fitStage(); render(); }

// Outline the selected panel so dragging and zoom have a visible target.
function markSelectedPanel() {
  if (document.body.classList.contains('shot-cover')) return;
  const layout = LAYOUTS[state.layout];
  const rect = layout.panels[selected];
  if (!rect) return;
  sctx.save();
  sctx.strokeStyle = '#37e0ff';
  sctx.lineWidth = 3;
  sctx.setLineDash([10, 7]);
  sctx.strokeRect(rect.x * stage.width + 3, rect.y * stage.height + 3,
    rect.w * stage.width - 6, rect.h * stage.height - 6);
  sctx.restore();
}

// ---- photo loading ------------------------------------------------------
function imageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
async function loadIntoPanel(index, src) {
  const img = await imageFromUrl(src);
  const panel = state.panels[index];
  if (panel) { panel.img = img; panel.dx = 0; panel.dy = 0; panel.zoom = 1; }
  render();
}
async function loadEverywhere(src, caption) {
  const img = await imageFromUrl(src);
  state.panels.forEach((p) => { p.img = img; p.dx = 0; p.dy = 0; p.zoom = 1; });
  if (caption != null) { state.caption = caption; captionInput.value = caption; }
  render();
}
function readLocalFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---- studio API used by shots.js and the controls -----------------------
function setLayout(name) {
  if (!LAYOUTS[name]) return;
  state.layout = name;
  selected = 0;
  document.querySelectorAll('[data-layout]').forEach((b) =>
    b.classList.toggle('on', b.dataset.layout === name));
  buildPanelButtons();
  refresh();
}
function setGrade(name) {
  if (!GRADES[name]) return;
  state.grade = name;
  document.querySelectorAll('[data-grade]').forEach((b) =>
    b.classList.toggle('on', b.dataset.grade === name));
  render();
}
function setSize(name) {
  if (!SIZES[name]) return;
  state.size = name;
  sizeSelect.value = name;
  refresh();
}
function setTitle(text) { state.title = text; titleInput.value = text; render(); }
function setCaption(text) { state.caption = text; captionInput.value = text; render(); }

window.__coverStudio = { setLayout, setGrade, setSize, setTitle, setCaption, loadIntoPanel, state };

// ---- panel picker buttons ----------------------------------------------
function buildPanelButtons() {
  const wrap = document.getElementById('panelButtons');
  wrap.innerHTML = '';
  LAYOUTS[state.layout].panels.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `Panel ${i + 1}`;
    btn.className = 'chip' + (i === selected ? ' on' : '');
    btn.addEventListener('click', () => {
      selected = i;
      zoomRange.value = String(state.panels[i].zoom);
      buildPanelButtons();
      render();
    });
    wrap.appendChild(btn);
  });
}

// ---- control events -------------------------------------------------------
titleInput.addEventListener('input', () => { state.title = titleInput.value; render(); });
captionInput.addEventListener('input', () => { state.caption = captionInput.value; render(); });
creditInput.addEventListener('input', () => { state.credit = creditInput.value; render(); });
sizeSelect.addEventListener('change', () => setSize(sizeSelect.value));
zoomRange.addEventListener('input', () => {
  state.panels[selected].zoom = Number(zoomRange.value);
  render();
});
document.querySelectorAll('[data-layout]').forEach((b) =>
  b.addEventListener('click', () => setLayout(b.dataset.layout)));
document.querySelectorAll('[data-grade]').forEach((b) =>
  b.addEventListener('click', () => setGrade(b.dataset.grade)));

document.getElementById('panelPhotoBtn').addEventListener('click', () => panelPhotoInput.click());
document.getElementById('allPhotoBtn').addEventListener('click', () => allPhotoInput.click());
panelPhotoInput.addEventListener('change', async () => {
  const file = panelPhotoInput.files[0];
  if (!file) return;
  const url = await readLocalFile(file);
  await loadIntoPanel(selected, url);
  say(`Panel ${selected + 1} now shows your photo. Drag it on the cover to reposition.`);
});
allPhotoInput.addEventListener('change', async () => {
  const file = allPhotoInput.files[0];
  if (!file) return;
  const url = await readLocalFile(file);
  await loadEverywhere(url, null);
  say('One photo fills every panel. Switch panels to fine-tune each crop.');
});

// Drag on the preview repositions the selected panel's photo.
let drag = null;
stage.addEventListener('pointerdown', (ev) => {
  const r = stage.getBoundingClientRect();
  const nx = (ev.clientX - r.left) / r.width;
  const ny = (ev.clientY - r.top) / r.height;
  const hit = panelAt(state, nx, ny);
  if (hit >= 0) {
    selected = hit;
    zoomRange.value = String(state.panels[hit].zoom);
    buildPanelButtons();
  }
  drag = { x: ev.clientX, y: ev.clientY };
  stage.setPointerCapture(ev.pointerId);
});
stage.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const panel = state.panels[selected];
  panel.dx = Math.max(-1, Math.min(1, panel.dx + (ev.clientX - drag.x) / stage.width * 2.2));
  panel.dy = Math.max(-1, Math.min(1, panel.dy + (ev.clientY - drag.y) / stage.height * 2.2));
  drag = { x: ev.clientX, y: ev.clientY };
  render();
});
stage.addEventListener('pointerup', () => { drag = null; });

// Arrow keys nudge the selected panel's photo a step at a time.
window.addEventListener('keydown', (ev) => {
  const step = { ArrowLeft: [-0.04, 0], ArrowRight: [0.04, 0], ArrowUp: [0, -0.04], ArrowDown: [0, 0.04] }[ev.key];
  if (!step || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const panel = state.panels[selected];
  panel.dx = Math.max(-1, Math.min(1, panel.dx + step[0]));
  panel.dy = Math.max(-1, Math.min(1, panel.dy + step[1]));
  ev.preventDefault();
  render();
});

// ---- export ---------------------------------------------------------------
document.getElementById('exportBtn').addEventListener('click', () => {
  const size = SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out.getContext('2d'), state, size.w, size.h);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunhaven-heat-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say(`Exported a ${size.w} x ${size.h} PNG.`);
  }, 'image/png');
});

window.addEventListener('resize', refresh);

// ---- boot: demo cover from the bundled samples, or a screenshot scene -----
async function boot() {
  buildPanelButtons();
  refresh();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, loadEverywhere);
    refresh();
    if (shot === 'cover') { fitStageToWindow(); }
    return;
  }
  await loadEverywhere('samples/pier.jpg', 'Sunset Heist');
  await loadIntoPanel(1, 'samples/boulevard.jpg');
  await loadIntoPanel(3, 'samples/boulevard.jpg');
  say('Demo cover loaded from the bundled samples. Add your own photos to make it yours.');
}

// In cover-shot mode the stage fills the whole viewport at the shot's size.
function fitStageToWindow() {
  stage.width = window.innerWidth;
  stage.height = window.innerHeight;
  render();
}

boot();
