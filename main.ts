// SUNHAVEN HEAT Cover Studio — handover program for gta6-cover-art-01.
// The artwork lives in app/ as plain static files (no build step, no network
// needed in the browser). This program copies app/ and screenshots/ next to
// itself into the output directory and writes dossier.json there with the
// vendored library, exactly as the scorer will recompute it.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader.)
// Try the app itself with: node serve.ts  ->  http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps: only text_max_bytes shapes the dossier bytes; the rest
// make this program refuse anything the scorer would refuse anyway (over 4
// screenshots or one over 256 KiB, over 993 app files or 48 MiB in app/, or
// an app path over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
