/**
 * Stand-in art for AI sequences that have not been generated yet. Each painter draws one frame
 * of its shot at progress t (0–1), so scroll scrubbing, counters and timing can be judged now.
 * Delete a painter once its shot's frames are in public/frames and marked ready in the manifest.
 */
import { FINISHES, ZEST, ERUPTION, type FinishKey, type ZestKey } from '../data/finishes';
import { clamp, lerp, sm, rng, TAU, GOLDEN_ANGLE as GA } from '../lib/math';
import { ease } from '../lib/tokens';

type G = CanvasRenderingContext2D;
export type PaintOpts = { fin?: FinishKey | ZestKey; device?: 'phone' | 'tablet' };

export function rrPath(g: G, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/** One rounded-hexagon pineapple scale. */
export function hexPath(g: G, x: number, y: number, r: number, rot = 0, round = 0.22) {
  const pts: [number, number][] = [];
  for (let k = 0; k < 6; k++) { const a = rot + Math.PI / 2 + (k * Math.PI) / 3; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.08]); }
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    const p = pts[k], q = pts[(k + 1) % 6], n = pts[(k + 2) % 6];
    const a = [lerp(p[0], q[0], 1 - round), lerp(p[1], q[1], 1 - round)], b = [lerp(q[0], n[0], round), lerp(q[1], n[1], round)];
    if (k === 0) g.moveTo(a[0], a[1]); else g.lineTo(a[0], a[1]);
    g.quadraticCurveTo(q[0], q[1], b[0], b[1]);
  }
  g.closePath();
}
const hex2rgb = (h: string) => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
export const mix = (a: string, b: string, t: number) => { const A = hex2rgb(a), B = hex2rgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };

function finGrad(g: G, y0: number, y1: number, fin: FinishKey | ZestKey, shift = 0) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  if (fin === 'ripen') { const a = sm(0, 1, shift); gr.addColorStop(0, mix('#78a947', '#f1b93f', a * 0.85)); gr.addColorStop(1, mix('#8fb145', '#f3c24a', Math.min(1, a + 0.25))); }
  else if (fin in FINISHES) FINISHES[fin as FinishKey].stops.forEach((c, i, s) => gr.addColorStop(i / (s.length - 1), c));
  else { const c = ZEST[fin as ZestKey].c; gr.addColorStop(0, c); gr.addColorStop(1, c); }
  return gr;
}

/** Crown Pro seen from the back (front when turned past 90°). */
export function phone2D(g: G, cx: number, cy: number, h: number, fin: FinishKey | ZestKey = 'ripen', o: { ang?: number; tilt?: number; shift?: number } = {}) {
  const c = Math.cos(o.ang || 0), W = h * 0.477, R = W * 0.16;
  g.save(); g.translate(cx, cy); g.rotate(o.tilt || 0); g.scale(Math.max(Math.abs(c), 0.035), 1);
  rrPath(g, -W / 2, -h / 2, W, h, R); g.fillStyle = fin in FINISHES ? FINISHES[fin as FinishKey].frame : '#bfbfbf'; g.fill();
  rrPath(g, -W / 2 + h * 0.006, -h / 2 + h * 0.006, W - h * 0.012, h - h * 0.012, R * 0.94);
  if (c >= 0) {
    g.fillStyle = finGrad(g, -h / 2, h / 2, fin, o.shift || 0); g.fill(); g.save(); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = Math.max(0.6, h * 0.0016);
    const N = 300, cR = (h * 0.62) / Math.sqrt(N);
    for (let i = 1; i < N; i++) { const a = i * GA, r = cR * Math.sqrt(i); hexPath(g, Math.cos(a) * r, h * 0.06 + Math.sin(a) * r, cR * 0.42, a); g.stroke(); }
    g.restore();
    const px = -W / 2 + W * 0.3, py = -h / 2 + W * 0.3, pr = W * 0.23;
    hexPath(g, px, py, pr, 0, 0.28); g.fillStyle = 'rgba(0,0,0,.18)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = h * 0.004; g.stroke();
    const lenses: [number, number, number, boolean][] = [[px - pr * 0.32, py - pr * 0.3, pr * 0.33, false], [px - pr * 0.32, py + pr * 0.42, pr * 0.28, false], [px + pr * 0.42, py + 0.05 * pr, pr * 0.27, true]];
    for (const [x, y, r, sq] of lenses) {
      g.fillStyle = '#0b0d10'; if (sq) rrPath(g, x - r, y - r, 2 * r, 2 * r, r * 0.3); else { g.beginPath(); g.arc(x, y, r, 0, TAU); }
      g.fill(); g.strokeStyle = 'rgba(220,220,210,.55)'; g.lineWidth = h * 0.004; g.stroke();
      g.fillStyle = 'rgba(90,110,200,.35)'; g.beginPath(); g.arc(x - r * 0.2, y - r * 0.2, r * 0.32, 0, TAU); g.fill();
    }
  } else {
    g.fillStyle = '#050605'; g.fill(); g.save(); g.clip();
    for (let k = 9; k > 0; k--) { g.beginPath(); g.arc(0, h * 0.12, k * W * 0.09, 0, TAU); g.fillStyle = k % 2 ? mix('#3a5a24', '#b88a22', k / 9) : '#0c0d09'; g.globalAlpha = 0.55; g.fill(); }
    g.globalAlpha = 1; g.restore();
  }
  g.restore();
}

export function tablet2D(g: G, cx: number, cy: number, h: number, fin: FinishKey = 'ripen', o: { ang?: number; back?: boolean } = {}) {
  const c = Math.cos(o.ang || 0), W = h * 0.765;
  g.save(); g.translate(cx, cy); g.scale(Math.max(Math.abs(c), 0.024), 1);
  rrPath(g, -W / 2, -h / 2, W, h, h * 0.05);
  if (o.back) {
    const gr = g.createLinearGradient(0, -h / 2, 0, h / 2);
    if (fin === 'ripen') { gr.addColorStop(0, '#78a947'); gr.addColorStop(1, '#f1b93f'); } else FINISHES[fin].stops.forEach((s, i) => gr.addColorStop(i / 2, s));
    g.fillStyle = gr; g.fill();
  } else {
    g.fillStyle = '#050605'; g.fill();
    rrPath(g, -W / 2 + h * 0.025, -h / 2 + h * 0.025, W - h * 0.05, h - h * 0.05, h * 0.03);
    const gr = g.createRadialGradient(0, h * 0.1, 0, 0, h * 0.1, h * 0.6); gr.addColorStop(0, '#c99a2a'); gr.addColorStop(0.5, '#3e6026'); gr.addColorStop(1, '#0b0c09');
    g.fillStyle = gr; g.fill();
  }
  g.restore();
}

function vignette(g: G, w: number, h: number, base = '#0a0b08') {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const v = g.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.7);
  v.addColorStop(0, 'rgba(40,46,30,.55)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
}
function splash(g: G, cx: number, cy: number, r: number, t: number) {
  const R = rng(7);
  for (let k = 0; k < 5; k++) {
    const col = ERUPTION[k]; g.fillStyle = col;
    for (let j = 0; j < 16; j++) { const a = R() * TAU, d = r * (0.35 + R() * 0.9) * t, s = r * (0.025 + R() * 0.06) * (1 - t * 0.3); g.beginPath(); g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8 - t * r * 0.15, s, s * 1.5, a, 0, TAU); g.fill(); }
    g.strokeStyle = col; g.lineWidth = r * 0.035; g.lineCap = 'round'; g.beginPath(); const a0 = (k / 5) * TAU + R() * 0.6; g.arc(cx, cy, r * t * (0.55 + k * 0.08), a0, a0 + 0.9 + R() * 0.6); g.stroke();
  }
}
const BURST = ['#f0b53a', '#6fa43f', '#e8873a', '#a6cf6e', '#f6d978', '#4b8a3a', '#e2ad35', '#c9d86b', '#ef8f4f', '#89b35a'];
function exploded(g: G, w: number, h: number, e: number, ang: number) {
  const H = h * 0.36, cx = w * 0.5, cy = h * 0.52, ca = Math.cos(ang), sa = Math.sin(ang);
  const items = Array.from({ length: 10 }, (_, i) => { const z = (4.5 - i) * e * h * 0.06; return { i, x: cx + sa * z * 1.4, y: cy - ca * z * 0.35 - z * 0.15, z: ca * z }; }).sort((a, b) => a.z - b.z);
  for (const it of items) {
    const W = H * 0.477 * Math.max(0.12, Math.abs(ca)); g.save(); g.translate(it.x, it.y);
    const gl = g.createRadialGradient(0, 0, 0, 0, 0, H * 0.55); gl.addColorStop(0, BURST[it.i] + '66'); gl.addColorStop(1, BURST[it.i] + '00'); g.fillStyle = gl; g.fillRect(-H, -H, 2 * H, 2 * H);
    rrPath(g, -W / 2, -H / 2, W, H, W * 0.15); g.fillStyle = it.i === 9 ? '#a4ac4c' : it.i === 0 ? 'rgba(200,220,230,.2)' : `hsl(${70 + it.i * 6},${12 + it.i * 2}%,${16 + it.i * 2}%)`; g.fill();
    g.strokeStyle = 'rgba(243,241,230,.35)'; g.lineWidth = 1; g.stroke(); g.restore();
  }
}

export const PAINT: Record<number, (g: G, w: number, h: number, t: number, o: PaintOpts) => void> = {
  0(g, w, h, t, o) {
    vignette(g, w, h); const tall = h > w;
    if (o.device === 'tablet') tablet2D(g, w * 0.5, h * 0.52, h * (tall ? 0.5 : 0.7), (o.fin as FinishKey) || 'ripen', { back: true });
    else phone2D(g, w * 0.5, h * (tall ? 0.6 : 0.53), h * (tall ? 0.5 : 0.66), o.fin || 'ripen', { ang: lerp(-0.55, 0.55, t), shift: t });
  },
  1(g, w, h, t) {
    vignette(g, w, h); const H = h * 0.5, cx = w * 0.5, cy = h * 0.8 + (1 - ease(t)) * h * 0.04;
    phone2D(g, cx, cy, H * (1 + t * 0.06), 'ripen', { tilt: -0.12 });
    const tx = cx - H * 0.477 * 0.2, ty = cy - H * 0.38, y = lerp(-h * 0.05, ty, t * t);
    if (t < 0.35) { g.strokeStyle = 'rgba(242,182,58,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx, 0); g.lineTo(tx, y); g.stroke(); }
    const s = h * 0.022; g.fillStyle = '#f2b63a'; g.beginPath(); g.moveTo(tx, y - s * 2.4); g.quadraticCurveTo(tx + s * 1.2, y - s * 0.3, tx, y + s); g.quadraticCurveTo(tx - s * 1.2, y - s * 0.3, tx, y - s * 2.4); g.fill();
  },
  2(g, w, h, t) { vignette(g, w, h); phone2D(g, w * 0.5, h * (0.8 - t * 0.04), h * 0.5, 'ripen', { tilt: -0.12 }); splash(g, w * 0.46, h * 0.62, Math.min(w, h) * 0.55, ease(t)); },
  3(g, w, h, t) {
    vignette(g, w, h); const a = t * TAU;
    const drops = (front: boolean) => { const R = rng(11); for (let k = 0; k < 70; k++) { const ang = R() * TAU, rad = 0.22 + R() * 0.55, y = (R() - 0.5) * h * 0.8, s = 5 + R() * 10; const x = Math.sin(ang + a) * rad * w * 0.5, z = Math.cos(ang + a); if ((z >= 0) === front) { g.globalAlpha = front ? 1 : 0.5; g.fillStyle = ERUPTION[k % 5]; g.beginPath(); g.arc(w / 2 + x, h * 0.5 + y, s * (front ? 1 + z * 0.4 : 1), 0, TAU); g.fill(); } } g.globalAlpha = 1; };
    drops(false); phone2D(g, w * 0.5, h * 0.52, h * 0.6, 'ripen', { ang: a }); drops(true);
  },
  4(g, w, h, t) { vignette(g, w, h); exploded(g, w, h, ease(t), -0.5); },
  5(g, w, h, t) { vignette(g, w, h); exploded(g, w, h, 1, -0.5 + t * TAU); },
  6(g, w, h, t) {
    vignette(g, w, h, '#050505'); const cx = w / 2, cy = h / 2, z = Math.exp(t * 3.2);
    for (let k = 8; k > 0; k--) { g.beginPath(); g.arc(cx, cy, k * h * 0.03 * z, 0, TAU); g.strokeStyle = `rgba(150,170,255,${0.08 + k * 0.02})`; g.lineWidth = 2; g.stroke(); }
    if (t > 0.45) {
      const u = (t - 0.45) / 0.55; g.strokeStyle = '#ffe7a6'; g.lineWidth = 6; g.shadowColor = '#ffcf5a'; g.shadowBlur = 24;
      g.beginPath(); g.moveTo(cx - w * 0.4, cy - h * 0.2); g.lineTo(cx, cy - h * 0.2); if (u > 0.3) g.lineTo(cx, lerp(cy - h * 0.2, cy + h * 0.25, clamp((u - 0.3) / 0.5, 0, 1))); g.stroke(); g.shadowBlur = 0;
      if (u > 0.8) { g.fillStyle = `rgba(241,185,63,${(u - 0.8) * 5})`; g.fillRect(cx - 60, cy + h * 0.25, 120, 16); }
    }
  },
  7(g, w, h, t) {
    g.fillStyle = '#121a13'; g.fillRect(0, 0, w, h); const z = 1 + ease(t) * 0.7, cx = w / 2, cy = h / 2, s = Math.min(w, h) * 0.5 * z;
    g.fillStyle = '#2a2c26'; g.fillRect(cx - s / 2, cy - s / 2, s, s);
    const cells: [number, string][] = [[2, '#f0b53a'], [4, '#a6cf6e'], [6, '#7fe3ff'], [32, '#e8873a']]; let row = 0;
    cells.forEach(([n, c], ci) => {
      const cols = ci === 3 ? 8 : n, rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) {
        const x = cx - s * 0.42 + (i % cols) * ((s * 0.84) / cols), y = cy - s * 0.4 + (row + Math.floor(i / cols)) * ((s * 0.8) / 7);
        const on = t > 0.25 + ci * 0.15 + i * 0.002; g.fillStyle = on ? c : 'rgba(255,255,255,.06)'; g.globalAlpha = on ? 0.38 : 1;
        g.fillRect(x + 2, y + 2, (s * 0.84) / cols - 4, (s * 0.8) / 7 - 4);
      }
      row += rows;
    });
    g.globalAlpha = 1;
  },
  8(g, w, h, t) {
    g.fillStyle = '#050605'; g.fillRect(0, 0, w, h); const lx = lerp(-w * 0.2, w * 1.2, ease(t)), N = 900, cR = (Math.max(w, h) * 0.75) / Math.sqrt(N);
    for (let i = 1; i < N; i++) {
      const a = i * GA, r = cR * Math.sqrt(i), x = w * 0.5 + Math.cos(a) * r, y = h * 0.5 + Math.sin(a) * r; const lit = Math.exp(-Math.pow((x - lx) / (w * 0.12), 2)); if (lit < 0.02) continue;
      hexPath(g, x, y, cR * 0.44, a); g.strokeStyle = `rgba(${Math.round(lerp(120, 241, lit))},${Math.round(lerp(170, 195, lit))},80,${lit * 0.9})`; g.lineWidth = 1.4; g.stroke();
    }
  },
  9(g, w, h, t) {
    const surf = lerp(h * 0.35, -h * 0.6, ease(t)); g.fillStyle = '#0a0b08'; g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0e2a33'); gr.addColorStop(1, '#04090b'); g.fillStyle = gr; g.fillRect(0, Math.max(0, surf), w, h);
    g.strokeStyle = 'rgba(160,230,255,.4)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= w; x += 12) g.lineTo(x, surf + Math.sin(x * 0.02 + t * 20) * 4); g.stroke();
    const py = lerp(h * 0.12, h * 0.58, ease(t)); phone2D(g, w * 0.5, py, h * 0.5, 'ripen', { ang: Math.PI, tilt: 0.1 + t * 0.1 });
    const R = rng(4); for (let k = 0; k < 40; k++) { const bx = w * 0.5 + (R() - 0.5) * h * 0.4, by = py - ((R() * h * 0.6 + t * h * 2) % (h * 0.8)); if (by > surf) { g.strokeStyle = 'rgba(200,240,255,.55)'; g.beginPath(); g.arc(bx, by, 2 + R() * 5, 0, TAU); g.stroke(); } }
    if (t > 0.8) { g.fillStyle = '#cdbf96'; g.fillRect(0, h * 0.86, w, h * 0.14); }
  },
  10(g, w, h, t) {
    vignette(g, w, h); tablet2D(g, w * 0.5, h * 0.52, h * 0.64, 'ripen', { ang: ease(Math.min(1, t / 0.75)) * (Math.PI / 2) });
    if (t > 0.7) {
      const u = (t - 0.7) / 0.3, tipx = w * 0.5 + lerp(h * 0.4, h * 0.012, ease(u)), tipy = h * 0.4;
      g.strokeStyle = '#efe9d8'; g.lineWidth = h * 0.022; g.lineCap = 'round'; g.beginPath(); g.moveTo(tipx + h * 0.3, tipy - h * 0.25); g.lineTo(tipx, tipy); g.stroke();
    }
  },
};
// Section 02's camera moves and the Camera approach reuse the nearest painters until their frames are in
PAINT[11] = (g, w, h, t, o) => PAINT[0](g, w, h, 1 - t * 0.5, o);
PAINT[12] = (g, w, h, t, o) => PAINT[0](g, w, h, 0.5 + t * 0.2, o);
PAINT[13] = (g, w, h, t, o) => PAINT[0](g, w, h, 0.5 - t * 0.2, o);
PAINT[14] = (g, w, h, t, o) => PAINT[0](g, w, h, 0.5 + t * 0.3, o);
