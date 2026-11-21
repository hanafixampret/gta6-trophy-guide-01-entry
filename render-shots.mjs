// Renders screenshots/ from shots.json: serves app/ with serve.ts, then takes
// each shot with headless Chrome (the Playwright-cached Chrome for Testing
// binary — no browser library needed, --screenshot writes a PNG), and converts
// it to JPEG with Python + PIL inside the gate (1280px long side, <=256 KiB).
// Run: node render-shots.mjs

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const chrome = process.env.CHROME_BIN
  || `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;
const port = 8123;

const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
mkdirSync(join(here, 'screenshots'), { recursive: true });

const server = spawn(process.execPath, [join(here, 'serve.ts'), '--port', String(port)], {
  stdio: 'ignore', cwd: here,
});
await new Promise((r) => setTimeout(r, 2500));

try {
  for (const shot of shots) {
    const url = `http://127.0.0.1:${port}${shot.path}`;
    const png = join(here, 'screenshots', shot.file.replace(/\.jpg$/, '.tmp.png'));
    execFileSync(chrome, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${shot.viewport.width},${shot.viewport.height}`,
      '--virtual-time-budget=8000',
      `--screenshot=${png}`, url,
    ], { stdio: 'ignore', timeout: 60000 });
    // PNG -> JPEG quality 82, cap 256 KiB by lowering quality if needed.
    const jpg = join(here, 'screenshots', shot.file);
    for (const q of [82, 76, 70, 62]) {
      execFileSync('python3', ['-c',
        `from PIL import Image; im=Image.open(${JSON.stringify(png)}).convert('RGB'); im.save(${JSON.stringify(jpg)}, 'JPEG', quality=${q})`,
      ], { stdio: 'ignore' });
      if (statSync(jpg).size <= 262144) break;
    }
    rmSync(png, { force: true });
    const bytes = statSync(jpg).size;
    console.log(`${shot.file}: ${bytes} bytes${bytes > 262144 ? ' — OVER 256 KiB!' : ''}`);
  }
} finally {
  server.kill();
}
console.log('done');
