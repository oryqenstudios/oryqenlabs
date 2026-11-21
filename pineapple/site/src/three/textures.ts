import * as THREE from 'three';
import { FINISHES, ZEST, type FinishKey, type ZestKey } from '../data/finishes';
import { GOLDEN_ANGLE, TAU } from '../lib/math';
import { hexPath, mix } from '../sequence/placeholders';
import { isSmallScreen } from '../lib/tokens';

/** Phones get 2K textures, desktop 4K on the long edge (plan §10). Everything starts at 512 and upgrades. */
export const TEX_HI = () => (isSmallScreen() ? 2048 : 4096);
export const TEX_LO = 512;

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function canvasTexture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export type BackKind = 'phone' | 'tablet';
const ASPECT: Record<BackKind, number> = { phone: 0.5, tablet: 0.765 };

/**
 * The etched back: rounded-hexagon scales on golden-angle spirals (8 and 13 parastichies appear
 * by themselves). `bump` draws the same pattern white-on-black for the bump map.
 */
/** `fin: 'neutral'` draws a pale lattice that the material colour tints, so finishes can blend smoothly. */
export function drawScales(res: number, kind: BackKind, fin: FinishKey | ZestKey | 'neutral', bump = false) {
  const c = canvas(Math.round(res * ASPECT[kind]), res), g = c.getContext('2d')!, w = c.width, h = c.height;
  if (bump) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
  else if (fin === 'neutral') { g.fillStyle = '#f6f4ec'; g.fillRect(0, 0, w, h); }
  else if (fin in ZEST) { g.fillStyle = ZEST[fin as ZestKey].c; g.fillRect(0, 0, w, h); }
  else {
    const gr = g.createLinearGradient(0, 0, 0, h);
    if (kind === 'tablet' && fin === 'ripen') { gr.addColorStop(0, '#78a947'); gr.addColorStop(0.5, '#b4b246'); gr.addColorStop(1, '#f1b93f'); }
    else FINISHES[fin as FinishKey].stops.forEach((s, i) => gr.addColorStop(i / 2, s));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  const N = kind === 'phone' ? 1300 : 2000, cR = (Math.hypot(w, h) * 0.56) / Math.sqrt(N);
  g.lineWidth = Math.max(1, cR * 0.07);
  g.strokeStyle = bump ? '#fff' : 'rgba(255,255,255,.13)';
  g.fillStyle = bump ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.035)';
  for (let i = 1; i < N; i++) {
    const a = i * GOLDEN_ANGLE, r = cR * Math.sqrt(i), x = w * 0.5 + Math.cos(a) * r, y = h * 0.55 + Math.sin(a) * r;
    if (x < -cR || x > w + cR || y < -cR || y > h + cR) continue;
    hexPath(g, x, y, cR * 0.44, a); g.fill(); g.stroke();
  }
  return c;
}

/** Diamond rind micro-texture for the titanium rails (bump only, tiled). */
export function rindTexture() {
  const c = canvas(128, 128), g = c.getContext('2d')!;
  g.fillStyle = '#808080'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#fff'; g.lineWidth = 6;
  for (let k = -128; k <= 256; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 128, 128); g.stroke(); g.beginPath(); g.moveTo(k, 128); g.lineTo(k + 128, 0); g.stroke(); }
  const t = canvasTexture(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6);
  return t;
}

/** Default wallpaper: the radial rings of a sliced pineapple (plan §4). No text: text lives in HTML. */
export function wallpaper(w: number, h: number) {
  const c = canvas(w, h), g = c.getContext('2d')!, cx = w / 2, cy = h * 0.58, R = Math.max(w, h) * 0.7;
  g.fillStyle = '#060705'; g.fillRect(0, 0, w, h);
  for (let k = 14; k > 0; k--) { g.beginPath(); g.arc(cx, cy, (R * k) / 14, 0, TAU); g.fillStyle = k > 11 ? '#0c0f08' : k % 2 ? mix('#1e2f14', '#6a5218', k / 14) : '#0a0c07'; g.fill(); }
  g.strokeStyle = 'rgba(255,226,140,.10)'; g.lineWidth = w * 0.004;
  for (let k = 0; k < 24; k++) { const a = (k / 24) * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.12, cy + Math.sin(a) * R * 0.12); g.lineTo(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6); g.stroke(); }
  g.beginPath(); g.arc(cx, cy, R * 0.1, 0, TAU); g.fillStyle = '#8c7a3e'; g.fill();
  return canvasTexture(c);
}

/** Printed labels on internal parts (battery, chip). Part markings, not page copy. */
export function labelTexture(w: number, h: number, bg: string, lines: [string, number, string, number, number?][]) {
  const c = canvas(w, h), g = c.getContext('2d')!;
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.textAlign = 'center';
  for (const [t, s, col, y, wt] of lines) { g.fillStyle = col; g.font = `${wt ?? 600} ${s}px Inter, sans-serif`; g.fillText(t, w / 2, y); }
  return canvasTexture(c);
}

/** A photographed part (frames/parts/<name>.webp) as a texture. Shows a neutral tone until the photo arrives, then
 *  wakes the stage so it redraws. */
export function photoTexture(name: string, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = 2;
  const g = c.getContext('2d')!; g.fillStyle = '#1a1b18'; g.fillRect(0, 0, 2, 2);
  const t = new THREE.Texture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true;
  const im = new Image(); im.decoding = 'async';
  im.onload = () => { t.dispose(); t.image = im; t.needsUpdate = true; import('./store').then(m => m.stage.wake()); };
  im.src = `${import.meta.env.BASE_URL}frames/parts/${name}.webp`;
  return t;
}
