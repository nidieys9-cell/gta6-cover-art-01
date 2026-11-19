[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/nidieys9-cell/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/nidieys9-cell/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Sunhaven Heat Cover Studio

An original, fully offline web app that turns your own photos into a
multi-panel open-world crime-game style cover poster, ready to share.

Sunhaven Heat is an original brand created for this project. The artwork,
lettering and layout are drawn by the app itself on a canvas; no third-party
logos, characters, artwork or font files are used, and the type is rendered
with system fonts only.

## What it does

- Load photos from your own machine (they are read locally, never uploaded),
  one photo for every panel or a different photo per panel.
- Four collage layouts: Quad Collage, Triple Strip, Hero Plus Two, Split Duo.
- Click a panel and drag its photo to reposition it; zoom slider crops tighter.
- Editable masthead title, caption and credit line with bold outlined lettering.
- Four colour grades: Vice Sunset, Neon Nights, Golden Hour, Midnight Noir.
- Export a PNG at 1080 x 1080, 1080 x 1350 or 1920 x 1080 in a couple of clicks.
- Opens with a finished demo cover built from the bundled sample photos.

## Run it

Serve the `app/` folder with any static file server, or from this repo:

```
node serve.ts
```

then open http://localhost:8080 in a desktop browser. No build step and no
network access are needed.

## Hand-in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` using the kit library in `vendor/`.

Competition: https://make.fun/c/gta6-cover-art-01
