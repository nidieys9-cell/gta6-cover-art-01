// SUNHAVEN HEAT Cover Studio — canvas cover rendering engine.
// Pure drawing code: given a state (photos, layout, grade, words) it paints
// a finished multi-panel cover onto any 2D context at any size. The editor
// uses it for the live preview and for PNG export; nothing here touches
// the DOM beyond the canvas contexts it is handed.

export const LAYOUTS = [
  { id: 'quad', label: 'Quad collage — four panels' },
  { id: 'trio', label: 'Vertical trio — three stacked panels' },
  { id: 'hero', label: 'Hero + minis — one big, two small' },
];

export const GRADES = [
  { id: 'sunset', label: 'Sunset grade' },
  { id: 'neon', label: 'Neon nights grade' },
  { id: 'gold', label: 'Golden hour grade' },
  { id: 'noir', label: 'Noir dark grade' },
];

const FONT_STACK = '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
const BODY_STACK = '"Helvetica Neue", Helvetica, Arial, sans-serif';

// Panel rectangles for a layout, in fractions of the artwork area.
// The artwork area is the whole canvas minus the credit bar at the bottom.
export function layoutCells(layoutId, w, h) {
  const gap = Math.max(4, Math.round(Math.min(w, h) * 0.012));
  if (layoutId === 'trio') {
    const rows = 3;
    const cellH = (h - gap * (rows + 1)) / rows;
    const cells = [];
    for (let i = 0; i < rows; i++) {
      cells.push({ x: gap, y: gap + i * (cellH + gap), w: w - gap * 2, h: cellH });
    }
    return cells;
  }
  if (layoutId === 'hero') {
    if (w >= h) {
      const heroW = Math.round((w - gap * 3) * 0.66);
      const miniW = w - gap * 3 - heroW;
      const miniH = (h - gap * 3) / 2;
      return [
        { x: gap, y: gap, w: heroW, h: h - gap * 2 },
        { x: gap * 2 + heroW, y: gap, w: miniW, h: miniH },
        { x: gap * 2 + heroW, y: gap * 2 + miniH, w: miniW, h: miniH },
      ];
    }
    const heroH = Math.round((h - gap * 3) * 0.62);
    const miniH = h - gap * 3 - heroH;
    const miniW = (w - gap * 3) / 2;
    return [
      { x: gap, y: gap, w: w - gap * 2, h: heroH },
      { x: gap, y: gap * 2 + heroH, w: miniW, h: miniH },
      { x: gap * 2 + miniW, y: gap * 2 + heroH, w: miniW, h: miniH },
    ];
  }
  // quad: two by two
  const cellW = (w - gap * 3) / 2;
  const cellH = (h - gap * 3) / 2;
  const cells = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      cells.push({ x: gap + c * (cellW + gap), y: gap + r * (cellH + gap), w: cellW, h: cellH });
    }
  }
  return cells;
}

export function cellCount(layoutId) {
  return layoutCells(layoutId, 100, 100).length;
}

// CSS filter string per grade, applied while a photo is drawn.
function gradeFilter(gradeId) {
  switch (gradeId) {
    case 'neon': return 'saturate(1.65) contrast(1.16) hue-rotate(14deg) brightness(1.04)';
    case 'gold': return 'saturate(1.3) contrast(1.1) sepia(0.38) brightness(1.06)';
    case 'noir': return 'saturate(0.25) contrast(1.28) brightness(0.82)';
    case 'sunset':
    default: return 'saturate(1.4) contrast(1.1) sepia(0.22) hue-rotate(-10deg) brightness(1.03)';
  }
}

// Colour wash drawn over a graded photo: a diagonal gradient plus a vignette.
function gradeWash(ctx, rect, gradeId) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  if (gradeId === 'neon') {
    g.addColorStop(0, 'rgba(0,229,255,0.20)');
    g.addColorStop(0.55, 'rgba(120,0,255,0.10)');
    g.addColorStop(1, 'rgba(255,0,128,0.24)');
  } else if (gradeId === 'gold') {
    g.addColorStop(0, 'rgba(255,196,64,0.22)');
    g.addColorStop(0.6, 'rgba(255,140,0,0.08)');
    g.addColorStop(1, 'rgba(80,40,0,0.20)');
  } else if (gradeId === 'noir') {
    g.addColorStop(0, 'rgba(0,0,0,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.38)');
  } else {
    g.addColorStop(0, 'rgba(255,170,60,0.20)');
    g.addColorStop(0.55, 'rgba(255,80,120,0.12)');
    g.addColorStop(1, 'rgba(70,20,120,0.26)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const radius = Math.max(rect.w, rect.h) * 0.78;
  const v = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = v;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

// Draw one photo into a panel with cover-fit, zoom and pan from its cell state.
function drawPhoto(ctx, img, rect, cell, gradeId) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = '#14101d';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (img) {
    const zoom = Math.max(1, cell.zoom || 1);
    const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const panX = (cell.x || 0) * Math.max(0, (dw - rect.w) / 2);
    const panY = (cell.y || 0) * Math.max(0, (dh - rect.h) / 2);
    const dx = rect.x + (rect.w - dw) / 2 + panX;
    const dy = rect.y + (rect.h - dh) / 2 + panY;
    try { ctx.filter = gradeFilter(gradeId); } catch { /* older canvas: wash still applies */ }
    ctx.drawImage(img, dx, dy, dw, dh);
    try { ctx.filter = 'none'; } catch { /* ignore */ }
    gradeWash(ctx, rect, gradeId);
  }
  ctx.restore();
  ctx.save();
  ctx.lineWidth = Math.max(3, Math.min(rect.w, rect.h) * 0.014);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
  ctx.restore();
}

// Wrap the title into at most two balanced lines.
function titleLines(ctx, text, maxWidth) {
  const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  if (words.length === 1) return [words[0]];
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const score = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
    if (!best || score < best.score) best = { score, lines: [a, b] };
  }
  const lines = best.lines;
  if (lines.some((line) => ctx.measureText(line).width > maxWidth)) return [words.join(' ')];
  return lines;
}

function drawTitle(ctx, w, h, title, gradeId) {
  const text = String(title || '').trim();
  if (!text) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = Math.min(w, h) * 0.155;
  ctx.font = `900 ${size}px ${FONT_STACK}`;
  const maxWidth = w * 0.92;
  let lines = titleLines(ctx, text, maxWidth);
  while (size > 18 && lines.some((line) => ctx.measureText(line).width > maxWidth)) {
    size *= 0.92;
    ctx.font = `900 ${size}px ${FONT_STACK}`;
    lines = titleLines(ctx, text, maxWidth);
  }
  const lineHeight = size * 1.04;
  const totalH = lineHeight * lines.length;
  const cy = h * 0.44;
  const fill = ctx.createLinearGradient(0, cy - totalH / 2, 0, cy + totalH / 2);
  if (gradeId === 'neon') { fill.addColorStop(0, '#aefcff'); fill.addColorStop(1, '#ff5fd2'); }
  else if (gradeId === 'noir') { fill.addColorStop(0, '#ffffff'); fill.addColorStop(1, '#9aa3ad'); }
  else if (gradeId === 'gold') { fill.addColorStop(0, '#fff3c4'); fill.addColorStop(1, '#ffb52e'); }
  else { fill.addColorStop(0, '#fff7d6'); fill.addColorStop(1, '#ff9a3d'); }
  lines.forEach((line, i) => {
    const y = cy - totalH / 2 + lineHeight * (i + 0.5);
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = '#160a24';
    ctx.strokeText(line, w / 2, y);
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = fill;
    ctx.fillText(line, w / 2, y);
  });
  ctx.restore();
}

function drawCreditBar(ctx, w, h, barH, credit) {
  ctx.save();
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, h - barH, w, barH);
  ctx.fillStyle = '#ffb52e';
  ctx.fillRect(0, h - barH, w, Math.max(2, barH * 0.07));
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(barH * 0.36)}px ${BODY_STACK}`;
  ctx.fillStyle = '#f5eefc';
  ctx.textAlign = 'left';
  const left = String(credit || '').trim() || 'A SUNHAVEN ORIGINAL';
  ctx.fillText(left.toUpperCase(), Math.round(w * 0.03), h - barH / 2 + 1);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffb52e';
  ctx.fillText('SUNHAVEN HEAT', Math.round(w * 0.97), h - barH / 2 + 1);
  ctx.restore();
}

// Paint the whole cover. state: { layout, grade, title, credit, cells: [{img,x,y,zoom}] }
export function drawCover(ctx, w, h, state) {
  const barH = Math.round(h * 0.085);
  const artH = h - barH;
  ctx.save();
  ctx.fillStyle = '#0d0716';
  ctx.fillRect(0, 0, w, h);
  const cells = layoutCells(state.layout, w, artH);
  cells.forEach((rect, i) => {
    const cell = state.cells[i] || { img: null, x: 0, y: 0, zoom: 1 };
    drawPhoto(ctx, cell.img, rect, cell, state.grade);
  });
  drawTitle(ctx, w, artH, state.title, state.grade);
  drawCreditBar(ctx, w, h, barH, state.credit);
  ctx.restore();
  return { barH, cells, artH };
}

// Which panel (index) contains a point, or -1. Used by the editor for
// click-to-select and drag-to-reposition.
export function cellAt(layoutId, w, h, px, py) {
  const barH = Math.round(h * 0.085);
  const cells = layoutCells(layoutId, w, h - barH);
  for (let i = cells.length - 1; i >= 0; i--) {
    const r = cells[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
