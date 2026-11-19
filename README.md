[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/nidieys9-cell/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/nidieys9-cell/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# SUNHAVEN HEAT Cover Studio

An original multi-panel poster cover maker that runs entirely in the
browser. Drop in your own photos, arrange them panel by panel, pick a
layout and a colour grade, stamp on a big outlined title, and export a
share-ready PNG. **SUNHAVEN HEAT** is an original brand invented for this
project: every layout, grade, word and line of code here is our own work,
the fonts are the visitor's system font stack, and the two bundled sample
photos (`app/samples/`) were made for this competition and are free to use.

Competition: https://make.fun/c/gta6-cover-art-01

## What it does

- **Three multi-panel layouts** — quad collage (2×2), vertical trio
  (three stacked panels) and hero + minis (one large panel with two small).
- **Four colour grades** — sunset, neon nights, golden hour and noir dark,
  each painted with a canvas filter, a diagonal colour wash and a vignette.
- **Real editing** — photos are read locally on your machine and never
  uploaded. Fill all panels from one photo or give each panel its own,
  click a panel to select it, drag the photo inside it to reposition, and
  use the zoom slider to crop in.
- **Your words** — the stroked display title and the bottom credit bar are
  both editable.
- **PNG export** in the three common post sizes: 1080×1080, 1080×1350 and
  1920×1080.
- Opens with a finished cover already composed from the sample photos, so
  the first thing you see is the first thing you can export.

## Run it

No build step and no network needed — the app is static files under `app/`.

```sh
node serve.ts            # then open http://localhost:8080
```

Any static HTTP server pointed at `app/` works just as well.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes
`out/dossier.json` with the vendored library in `vendor/makefun-app.ts`
(kept byte-for-byte identical to the competition kit).

## Screenshots

- `screenshots/1-cover.jpg` — finished landscape cover, quad layout, sunset grade
- `screenshots/2-editor.jpg` — the editor with sample photos loaded
- `screenshots/3-cover.jpg` — finished portrait cover, trio layout, neon grade
- `screenshots/4-cover.jpg` — finished square cover, hero layout, gold grade
