#!/usr/bin/env node
/**
 * Draws the Orbit icon and renders every size from it:
 *   assets/icon/orbit.svg   the master (vector)
 *   assets/icon/orbit.png   512 px: sidebar, favicon and loading screen
 *   src-tauri/icons/*       desktop icons (PNG, ICO, ICNS through `tauri icon`)
 *   Android launcher icons  legacy, round and adaptive foreground, in every density
 *
 * Run with `npm run icons`. It needs Chrome (set CHROME to its path if it is not `google-chrome`).
 * Change the look here, in one place: the tile colours, the two ring colours, the angle and the thickness.
 */
import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME ?? 'google-chrome';

/* The look: the app's Slate ground for the tile, its primary indigo and its text colour for the rings. */
const TILE_A = '#171b24';
const TILE_B = '#0b0e13';
const RING_BACK = '#8b93ff';
const RING_FRONT = '#e6e9f2';
const ANGLE = 30; // half the crossing angle of the two rings, in degrees
const TURN = -10; // the whole pair turned, in degrees
const THICKNESS = 6 * 1.1; // thickness of a ring at its thick end

const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const group = (ang, inner) => `<g transform="translate(50 50) rotate(${ang})">${inner}</g>`;
/* a tapered ring: an ellipse minus a slightly smaller one pushed to one side, so the stroke thins to a point */
const taper = (rx, ry, t, fill, extra = '') =>
  `<path fill-rule="evenodd" fill="${fill}" ${extra} d="${ell(0, 0, rx, ry)}${ell(t - 0.8, 0, rx - t, ry - t * 0.8)}"/>`;

/** The crossed pair with four crossings, alternately over and under, and a soft shadow where one ring lies on the other. */
function weave() {
  const rx = 42, ry = 16, t = THICKNESS, a = ANGLE + 0;
  const rad = (a * Math.PI) / 180, mx = rx - t * 0.5, my = ry - t * 0.4;
  const c2 = Math.cos(rad) ** 2, s2 = 1 - c2;
  const x0 = 1 / Math.sqrt(c2 / mx ** 2 + s2 / my ** 2), y0 = 1 / Math.sqrt(s2 / mx ** 2 + c2 / my ** 2);
  const rr = (TURN * Math.PI) / 180;
  const at = (x, y) => [(50 + x * Math.cos(rr) - y * Math.sin(rr)).toFixed(2), (50 + x * Math.sin(rr) + y * Math.cos(rr)).toFixed(2)];
  const circles = (pts) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13"/>`).join('');
  /* the outline of each ring, so a shadow only falls on the ring beneath and never on the tile */
  const outline = (id, ang) => `<clipPath id="${id}"><path clip-rule="evenodd" transform="translate(50 50) rotate(${ang})" d="${ell(0, 0, rx, ry)}${ell(t - 0.8, 0, rx - t, ry - t * 0.8)}"/></clipPath>`;
  const A = (extra = '', fill = RING_BACK) => group(a + TURN, taper(rx, ry, t, fill, extra));
  const B = (extra = '', fill = RING_FRONT) => group(-a + TURN, taper(rx, ry, t, fill, extra));
  const shadow = (ring) => `<g transform="translate(1.4 2.4)">${ring('filter="url(#blur)" style="opacity:.6"', '#000')}</g>`;
  return (
    `<clipPath id="over-x">${circles([at(x0, 0), at(-x0, 0)])}</clipPath><clipPath id="over-y">${circles([at(0, y0), at(0, -y0)])}</clipPath>` +
    outline('shape-a', a + TURN) + outline('shape-b', -a + TURN) +
    A() + `<g clip-path="url(#over-y)"><g clip-path="url(#shape-a)">${shadow(B)}</g></g>` + B() +
    `<g clip-path="url(#over-x)"><g clip-path="url(#shape-b)">${shadow(A)}</g>${A()}</g>`
  );
}

/** One icon as an SVG string. `tile`: squircle, circle or none (glyph only); `scale` shrinks the mark inside the tile. */
function icon({ tile = 'squircle', scale = 1 } = {}) {
  const rx = tile === 'circle' ? 50 : 22.5;
  const defs =
    `<defs><linearGradient id="tile" x1=".25" y1=".067" x2=".75" y2=".933"><stop offset="0" stop-color="${TILE_A}"/><stop offset="1" stop-color="${TILE_B}"/></linearGradient>` +
    `<filter id="blur" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`;
  const base =
    tile === 'none'
      ? ''
      : `<rect width="100" height="100" rx="${rx}" fill="url(#tile)"/><rect x=".4" y=".4" width="99.2" height="99.2" rx="${rx - 0.4}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width=".8"/>`;
  const mark = `<g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${weave()}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}${base}${mark}</svg>`;
}

/* Headless Chrome over the DevTools protocol, so each size is drawn as vector at its own size, with a transparent background. */
async function renderer() {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-icons-'));
  const port = 9500 + Math.floor(Math.random() * 400);
  const proc = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 100 && !page; i += 1) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch { /* not up yet */ }
    if (!page) await new Promise((r) => setTimeout(r, 100));
  }
  if (!page) throw new Error('Chrome did not start; set CHROME to its path');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); } };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; waiting.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  return {
    async png(svg, px) {
      await send('Emulation.setDeviceMetricsOverride', { width: px, height: px, deviceScaleFactor: 1, mobile: false });
      await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
      const sized = svg.replace('<svg ', `<svg width="${px}" height="${px}" style="display:block" `);
      await send('Page.navigate', { url: `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><body style="margin:0;background:transparent">${sized}</body>`)}` });
      await new Promise((r) => setTimeout(r, 350));
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      return Buffer.from(shot.result.data, 'base64');
    },
    async close() {
      ws.close();
      const exited = new Promise((r) => proc.once('exit', r));
      proc.kill();
      await exited;
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    },
  };
}

const write = (path, data) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, data); console.log('wrote', path.replace(root + '/', '')); };

const r = await renderer();
try {
  const master = icon();
  write(join(root, 'assets/icon/orbit.svg'), master + '\n');
  write(join(root, 'assets/icon/orbit.png'), await r.png(master, 512));

  /* desktop: render a 1024 px source, let the Tauri CLI make the ICO and ICNS, and keep the files the app lists */
  const work = mkdtempSync(join(tmpdir(), 'orbit-tauri-'));
  const source = join(work, 'source.png');
  writeFileSync(source, await r.png(master, 1024));
  execFileSync('npx', ['tauri', 'icon', source, '--output', join(work, 'out')], { cwd: root, stdio: 'ignore' });
  for (const name of ['32x32.png', '64x64.png', '128x128.png', '128x128@2x.png', 'icon.png', 'icon.ico', 'icon.icns']) {
    copyFileSync(join(work, 'out', name), join(root, 'src-tauri/icons', name));
    console.log('wrote src-tauri/icons/' + name);
  }
  rmSync(work, { recursive: true, force: true });

  /* Android: legacy square, round, and the adaptive foreground (mark on transparent, inside the 66 dp safe zone) */
  const res = join(root, 'src-tauri/gen/android/app/src/main/res');
  const densities = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
  const legacy = icon();
  const round = icon({ tile: 'circle', scale: 0.86 });
  const foreground = icon({ tile: 'none', scale: 0.7 });
  for (const [density, [launcher, fg]] of Object.entries(densities)) {
    const dir = join(res, `mipmap-${density}`);
    write(join(dir, 'ic_launcher.png'), await r.png(legacy, launcher));
    write(join(dir, 'ic_launcher_round.png'), await r.png(round, launcher));
    write(join(dir, 'ic_launcher_foreground.png'), await r.png(foreground, fg));
  }
} finally {
  await r.close();
}
