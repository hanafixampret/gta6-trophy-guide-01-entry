// Vice Ledger — the hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
// It copies this repository's app/ (the guide: index.html, app.js, style.css and
// data/trophies.json + steps.json) and screenshots/ into the output directory and
// writes /output/dossier.json with the kit's vendored library, which is the
// summary the judge reads. Run it as:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; inside the
// grader, /output is used. vendor/makefun-frontend.ts must stay byte-identical
// to the kit's copy: the scorer rebuilds the dossier with its own copy and the
// two must match.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsDir, { recursive: true });
}

// The gate's own caps, from the competition's reference/gate.json: at most 4
// screenshots of at most 256 KiB, app/ at most 993 files and 48 MiB, and the
// dossier text at most 160 KiB. The scorer refuses anything past them, so the
// program refuses first, with the library's words.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
