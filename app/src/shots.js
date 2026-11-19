// Fixed scenes for screenshots, driven by the query string:
//   ?shot=cover   the finished cover alone, filling the window
//   ?shot=editor  the full editor with sample photos loaded
// Query knobs: layout (quad|trio|hero), grade (sunset|neon|gold|noir),
// title, credit, and photo (a comma list of sample names, no extension).
// `load(samples, title, credit)` is the editor's own loader; window.__shotReady
// is set once the scene has painted, so a headless browser can wait for it.
export async function runShot(shot, query, load, state, applyPatch) {
  const patch = {};
  if (query.get('layout')) patch.layout = query.get('layout');
  if (query.get('grade')) patch.grade = query.get('grade');
  if (typeof applyPatch === 'function') applyPatch(patch);

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  const names = (query.get('photo') ?? 'pier,boulevard').split(',').map((s) => s.trim()).filter(Boolean);
  const samples = names.map((name) => `samples/${name}.jpg`);
  await load(
    samples,
    query.get('title') ?? 'SUNHAVEN HEAT',
    query.get('credit') ?? 'A SUNHAVEN ORIGINAL',
  );
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
