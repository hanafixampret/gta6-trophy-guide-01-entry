// Leonida Platinum — GTA VI trophy guide & tracker (make.fun gta6-trophy-guide-01).
// Node 22, standard library only. The guide itself is plain static files under
// app/ (index.html + app.js + style.css + data/trophies.json + data/steps.json):
// it opens in a desktop browser and works with the network off. This program
// hands it in: it copies app/ and screenshots/ from beside this file to /output
// and writes /output/dossier.json with the vendored make.fun library, exactly
// as the kit's starter does. vendor/makefun-frontend.ts is the kit's copy,
// unchanged. The cited steps live in data/steps.json (189 numbered steps, each
// naming its source); the hand-in refuses to run without it, because a guide
// with no steps is not the entry this program claims to hand in.
//
// Never delete the output directory here: the grader's /output is a mount
// point, so only mkdirSync it (rmSync would throw EBUSY). Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The v2 guide is nothing without its cited steps: refuse the hand-in rather
// than shipping a checklist whose detail panels come up empty.
if (!existsSync(join(here, 'app', 'data', 'steps.json'))) {
  throw new Error('app/data/steps.json is missing: the cited steps are part of this entry');
}
if (!existsSync(join(here, 'app', 'data', 'trophies.json'))) {
  throw new Error('app/data/trophies.json is missing: the trophy list is part of this entry');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in app/
// or 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
