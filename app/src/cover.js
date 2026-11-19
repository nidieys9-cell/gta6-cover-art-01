// Sunhaven Heat Cover Studio - canvas rendering engine.
// Everything is drawn locally on a 2D canvas: panel collage, colour grade,
// masthead lettering and caption bar. No network, no external assets.

// Panel layouts in normalised coordinates (x, y, w, h fractions of the page).
export const LAYOUTS = {
  quad: {
    label: 'Quad Collage',
    panels: [
      { x: 0.0, y: 0.0, w: 0.52, h: 0.58 },
      { x: 0.54, y: 0.0, w: 0.46, h: 0.58 },
      { x: 0.0, y: 0.6, w: 0.46, h: 0.4 },
      { x: 0.48, y: 0.6, w: 0.52, h: 0.4 },
    ],
  },
  trio: {
    label: 'Triple Strip',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.4 },
      { x: 0.0, y: 0.42, w: 0.49, h: 0.58 },
      { x: 0.51, y: 0.42, w: 0.49, h: 0.58 },
    ],
  },
  hero: {
    label: 'Hero Plus Two',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.66 },
      { x: 0.0, y: 0.68, w: 0.49, h: 0.32 },
      { x: 0.51, y: 0.68, w: 0.49, h: 0.32 },
    ],
  },
  duo: {
    label: 'Split Duo',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 1.0 },
      { x: 0.52, y: 0.0, w: 0.48, h: 1.0 },
    ],
  },
};

// Colour grades: a canvas filter for the photo plus overlay washes.
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.45) contrast(1.08) brightness(1.02)',
    washTop: 'rgba(255,94,160,0.20)',
    washBottom: 'rgba(255,140,40,0.26)',
    accent: '#ffb03a',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.7) contrast(1.15) hue-rotate(-12deg)',
    washTop: 'rgba(40,220,255,0.16)',
    washBottom: 'rgba(200,40,255,0.24)',
    accent: '#37e0ff',
  },
  gold: {
    label: 'Golden Hour',
    filter: 'saturate(1.25) contrast(1.05) sepia(0.28) brightness(1.05)',
    washTop: 'rgba(255,210,90,0.14)',
    washBottom: 'rgba(160,70,10,0.22)',
    accent: '#ffd94d',
  },
  noir: {
    label: 'Midnight Noir',
    filter: 'saturate(0.45) contrast(1.3) brightness(0.92)',
    washTop: 'rgba(30,40,90,0.22)',
    washBottom: 'rgba(0,0,10,0.34)',
    accent: '#9db4ff',
  },
};

export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

export function makePanel() {
  return { img: null, dx: 0, dy: 0, zoom: 1 };
}

export function makeState() {
  return {
    layout: 'quad',
    grade: 'sunset',
    size: 'square',
    title: 'SUNHAVEN HEAT',
    caption: 'Sunset Heist',
    credit: 'COVER STUDIO',
    panels: [makePanel(), makePanel(), makePanel(), makePanel()],
  };
}

// Draw one photo into a rect with cover-fit, user pan (dx, dy in -1..1) and zoom.
function drawPhoto(ctx, img, rx, ry, rw, rh, panel, filter) {
  if (!img) {
    const g = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
    g.addColorStop(0, '#2b1055');
    g.addColorStop(1, '#ff7e47');
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
    return;
  }
  const scale = Math.max(rw / img.naturalWidth, rh / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const cx = rx + rw / 2 + panel.dx * (rw * 0.45);
  const cy = ry + rh / 2 + panel.dy * (rh * 0.45);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.filter = filter;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

function drawPanelFrame(ctx, rx, ry, rw, rh, W) {
  const lw = Math.max(4, W * 0.006);
  ctx.lineWidth = lw;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(rx + lw / 2, ry + lw / 2, rw - lw, rh - lw);
  ctx.lineWidth = lw * 0.45;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeRect(rx - lw * 0.2, ry - lw * 0.2, rw + lw * 0.4, rh + lw * 0.4);
}

// Masthead: stacked bold display lettering with a hard outline and gradient fill.
function drawMasthead(ctx, state, W, H, accent) {
  const title = (state.title || '').trim();
  if (!title) return;
  const words = title.split(/\s+/);
  const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [title];
  const base = Math.min(W, H);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let y = H * 0.035;
  lines.forEach((line, i) => {
    const size = base * (i === lines.length - 1 ? 0.155 : 0.115);
    ctx.font = `900 ${size}px 'Arial Black', Arial, Helvetica, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older engines */ }
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = '#0b0018';
    ctx.strokeText(line, W / 2, y);
    const g = ctx.createLinearGradient(0, y, 0, y + size);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#ffe9c9');
    g.addColorStop(1, accent);
    ctx.fillStyle = g;
    ctx.fillText(line, W / 2, y);
    y += size * 1.02;
  });
  ctx.restore();
  return y;
}

// Bottom caption ribbon with the story caption and the studio credit.
function drawCaptionBar(ctx, state, W, H, accent) {
  const caption = (state.caption || '').trim();
  const credit = (state.credit || '').trim();
  if (!caption && !credit) return;
  const barH = H * 0.115;
  const y = H - barH;
  ctx.save();
  ctx.fillStyle = 'rgba(8,0,20,0.82)';
  ctx.fillRect(0, y, W, barH);
  ctx.fillStyle = accent;
  ctx.fillRect(0, y, W, Math.max(3, H * 0.006));
  ctx.textBaseline = 'middle';
  if (caption) {
    const size = Math.min(W, H) * 0.062;
    ctx.font = `800 ${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(caption.toUpperCase(), W * 0.045, y + barH * 0.52);
  }
  if (credit) {
    const size = Math.min(W, H) * 0.034;
    ctx.font = `700 ${size}px Arial, Helvetica, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.fillText(credit.toUpperCase(), W * 0.955, y + barH * 0.52);
  }
  ctx.restore();
}

// Render the whole cover described by state onto ctx at pixel size W x H.
export function drawCover(ctx, state, W, H) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.quad;
  ctx.save();
  ctx.fillStyle = '#0b0018';
  ctx.fillRect(0, 0, W, H);
  const gap = Math.max(6, W * 0.008);
  layout.panels.forEach((rect, i) => {
    const panel = state.panels[i] || makePanel();
    const rx = rect.x * W + gap / 2;
    const ry = rect.y * H + gap / 2;
    const rw = rect.w * W - gap;
    const rh = rect.h * H - gap;
    drawPhoto(ctx, panel.img, rx, ry, rw, rh, panel, grade.filter);
    // Per-panel grade wash, stronger toward the bottom of the page.
    const wash = ctx.createLinearGradient(0, ry, 0, ry + rh);
    wash.addColorStop(0, grade.washTop);
    wash.addColorStop(1, grade.washBottom);
    ctx.fillStyle = wash;
    ctx.fillRect(rx, ry, rw, rh);
    drawPanelFrame(ctx, rx, ry, rw, rh, W);
  });
  // Overall vignette for a printed-poster feel.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(5,0,16,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  drawMasthead(ctx, state, W, H, grade.accent);
  drawCaptionBar(ctx, state, W, H, grade.accent);
  ctx.restore();
}

// Which panel (index) contains a normalised point, or -1.
export function panelAt(state, nx, ny) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.quad;
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const r = layout.panels[i];
    if (nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h) return i;
  }
  return -1;
}
