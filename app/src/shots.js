// Fixed scenes for screenshots, driven by the query string:
//   ?shot=cover   shows only the finished cover, filling the viewport
//   ?shot=editor  shows the full editor with photos loaded
// Extra params understood here: photo (comma list of sample names, repeated
// across panels), layout, grade, size, title and caption.
// `load(src, caption)` is supplied by main.js and loads one photo into every
// panel; window.__coverStudio (also from main.js) fine-tunes the scene.
// window.__shotReady flips true once the scene has painted two frames.
export async function runShot(shot, query, load) {
  const studio = window.__coverStudio;
  const names = (query.get('photo') || 'pier').split(',').map((s) => s.trim()).filter(Boolean);
  const caption = query.get('caption') || 'Sunset Heist';

  if (studio) {
    if (query.get('layout')) studio.setLayout(query.get('layout'));
    if (query.get('grade')) studio.setGrade(query.get('grade'));
    if (query.get('size')) studio.setSize(query.get('size'));
    if (query.get('title')) studio.setTitle(query.get('title'));
  }

  // Load each named sample into successive panels; a single name fills all.
  for (let i = 0; i < names.length; i++) {
    const src = `samples/${names[i]}.jpg`;
    if (i === 0) {
      await load(src, caption);
    } else if (studio) {
      await studio.loadIntoPanel(i, src);
    }
  }
  if (studio) studio.setCaption(caption);

  if (shot === 'cover') document.body.classList.add('shot-cover');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
