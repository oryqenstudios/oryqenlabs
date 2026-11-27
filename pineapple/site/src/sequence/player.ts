/**
 * Canvas frame-sequence player (build plan §9 "a canvas-based frame-sequence player that
 * preloads frames and scrubs them with scroll").
 *
 * - Reads public/frames/manifest.json to learn which shots are ready (no 404 probing).
 * - Loads progressively: every 8th frame first, then 4th, 2nd, then the rest, so scrubbing
 *   works at once and sharpens as frames arrive. Always draws the nearest loaded frame.
 * - Phones get frames/mobile/… when the manifest says a shot has them.
 * - Falls back to the placeholder painter for shots without frames.
 */
import { SHOTS, type Shot } from '../data/shots';
import { PAINT, type PaintOpts } from './placeholders';
import { pad } from '../lib/math';
import { isSmallScreen, reducedMotion } from '../lib/tokens';

interface ShotEntry { frames: number; ready: boolean; mobile?: boolean; /** finishes with their own frames, in shot-NN/<finish>/ */ variants?: string[] }
interface Manifest { ext: string; stills: { ready: string[]; mobile?: boolean }; shots: Record<string, ShotEntry> }

const BASE = import.meta.env.BASE_URL;
let manifestP: Promise<Manifest> | null = null;
export function loadManifest(): Promise<Manifest> {
  manifestP ??= fetch(`${BASE}frames/manifest.json`).then(r => (r.ok ? r.json() : Promise.reject(r.status))).catch(() => ({ ext: 'webp', stills: { ready: [] }, shots: {} }));
  return manifestP;
}

const MAX_CONCURRENT = 10;
/** ?reel: footage always fills the frame (for recording vertical reels). */
const REEL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('reel');
const FADE_MS = 520;
export interface HudInfo { shot: Shot; frame: number; real: boolean }

/** Where a frame of natural size iw×ih lands on a w×h canvas: cover, but keep `fit` of the width (tall screens)
 *  and `fitH` of the height (wide screens) in view. Shared with overlays that pin UI to points in the footage. */
export function coverRect(w: number, h: number, iw: number, ih: number, fit?: number, fitH?: number) {
  let sc = Math.max(w / iw, h / ih);
  if (fit) sc = Math.min(sc, w / (iw * fit));
  if (fitH) sc = Math.min(sc, h / (ih * fitH));
  const dw = iw * sc, dh = ih * sc;
  return { x: (w - dw) / 2, y: (h - dh) / 2, w: dw, h: dh, sc };
}

export class SequencePlayer {
  private g: CanvasRenderingContext2D;
  private shots: Shot[];
  private total: number;
  private imgs: Map<string, (HTMLImageElement | null)[]> = new Map();
  /** Per-finish shots: the variant shown now, and the one it is fading from. */
  private variant = new Map<number, string>();
  /** Per shot: the finish being faded away from (a two-shot turntable switches both shots at once). */
  private fades = new Map<number, { from: string; t0: number }>();
  private fadeRaf = 0;
  private manifest: Manifest | null = null;
  private frame = -1;
  private p = 0;
  private queue: [string, number, number][] = [];
  private inflight = 0;
  private started = false;
  private ro: ResizeObserver;
  private disposed = false;
  opts: PaintOpts;

  constructor(private canvas: HTMLCanvasElement, shotIds: number[], opts: PaintOpts = {}, private onFrame?: (i: HudInfo) => void) {
    this.g = canvas.getContext('2d')!;
    this.shots = shotIds.map(i => SHOTS[i]);
    this.total = this.shots.reduce((a, s) => a + s.frames, 0);
    this.opts = opts;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    loadManifest().then(m => { this.manifest = m; this.draw(); });
  }

  dispose() { this.disposed = true; this.ro.disconnect(); this.queue = []; cancelAnimationFrame(this.fadeRaf); cancelAnimationFrame(this.easeRaf); }

  /** Begin downloading frames. Called when the section approaches the viewport. */
  start() {
    if (this.started || !this.manifest) { if (!this.started) loadManifest().then(() => this.start()); return; }
    this.started = true;
    for (const s of this.shots) if (this.isReady(s)) this.enqueue(s);
    this.pump();
  }

  /** Queue a shot's frames (its current variant), coarse to fine so scrubbing works at once. */
  private enqueue(s: Shot, first = 0) {
    const key = this.key(s);
    if (this.imgs.has(key)) return;
    this.imgs.set(key, new Array(s.frames).fill(null));
    const seen = new Set<number>(), add = (i: number) => { if (!seen.has(i)) { seen.add(i); this.queue.push([key, s.id, i]); } };
    add(Math.min(s.frames - 1, Math.max(0, first)));
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < s.frames; i += step) add(i);
  }

  setOpts(o: PaintOpts) {
    this.opts = { ...this.opts, ...o };
    // a per-finish shot switches to the new finish's frames, fading over once they arrive
    for (const s of this.shots) {
      const was = this.variant.get(s.id), now = this.pickVariant(s);
      if (now === undefined || now === was) continue;
      this.variant.set(s.id, now);
      // switching again mid-fade: drop the frames of the finish two choices back
      const prev = this.fades.get(s.id);
      if (prev && prev.from !== `${s.id}/${now}`) this.imgs.delete(prev.from);
      if (was !== undefined) this.fades.set(s.id, { from: `${s.id}/${was}`, t0: 0 });
      if (this.started) {
        this.queue = this.queue.filter(([k]) => !was || k !== `${s.id}/${was}`); // stop loading the old finish
        const { s: cur, i } = this.locate(Math.max(0, this.frame));
        this.enqueue(s, cur.id === s.id ? i : 0);
        this.pump();
      }
    }
    this.draw();
  }

  /** The finish whose frames a per-finish shot shows: the chosen one if generated, else the first available. */
  private pickVariant(s: Shot): string | undefined {
    const v = this.manifest?.shots[s.id]?.variants;
    if (!v?.length) return undefined;
    const want = this.opts.fin ?? 'ripen';
    return v.includes(want) ? want : v[0];
  }
  private key(s: Shot) {
    if (!this.variant.has(s.id)) { const v = this.pickVariant(s); if (v) this.variant.set(s.id, v); }
    const v = this.variant.get(s.id);
    return v ? `${s.id}/${v}` : String(s.id);
  }

  /** Scroll sets a target; the shown position eases towards it and draws between frames (cross-blending the two
   *  nearest), so even a long scroll over a short clip moves continuously rather than in steps. */
  set(p: number) {
    this.target = Math.min(1, Math.max(0, p));
    if (reducedMotion() || this.frame < 0) { this.p = this.target; this.show(); return; }
    if (!this.easeRaf) this.easeRaf = requestAnimationFrame(this.ease);
  }
  private target = 0;
  private frac = 0;
  private easeRaf = 0;
  private ease = () => {
    const d = this.target - this.p;
    this.p = Math.abs(d) < 0.0004 ? this.target : this.p + d * 0.32;
    this.show();
    this.easeRaf = this.p === this.target ? 0 : requestAnimationFrame(this.ease);
  };
  private show() {
    const pos = this.p * (this.total - 1), f = Math.floor(pos + 1e-6), frac = pos - f;
    if (f !== this.frame || Math.abs(frac - this.frac) > 0.015) { this.frame = f; this.frac = frac; this.draw(); }
  }

  private isReady(s: Shot) {
    if (!this.manifest) return false;
    if (s.id === 0) return this.manifest.stills.ready.includes(`${this.opts.device === 'tablet' ? 'slate-' : ''}${this.opts.fin ?? 'ripen'}`);
    return !!this.manifest.shots[s.id]?.ready;
  }
  private url(s: Shot, i: number) {
    const m = this.manifest!;
    if (s.id === 0) return `${BASE}frames/${m.stills.mobile && isSmallScreen() ? 'mobile/' : ''}shot-00/${this.opts.device === 'tablet' ? 'slate-' : ''}${this.opts.fin ?? 'ripen'}.webp`; // stills stay WebP
    const mobile = m.shots[s.id]?.mobile && isSmallScreen();
    const v = this.variant.get(s.id);
    return `${BASE}frames/${mobile ? 'mobile/' : ''}shot-${pad(s.id, 2)}/${v ? `${v}/` : ''}${pad(i + 1, 4)}.${m.ext}`;
  }
  private urlFor(key: string, id: number, i: number) {
    const m = this.manifest!, mobile = m.shots[id]?.mobile && isSmallScreen(), v = key.split('/')[1];
    return `${BASE}frames/${mobile ? 'mobile/' : ''}shot-${pad(id, 2)}/${v ? `${v}/` : ''}${pad(i + 1, 4)}.${m.ext}`;
  }
  private pump() {
    while (!this.disposed && this.inflight < MAX_CONCURRENT && this.queue.length) {
      // nearest-first: whatever is closest to where the visitor is now (a little ahead preferred) loads next
      const cur = this.locate(Math.max(0, this.frame));
      let best = 0, bestScore = Infinity;
      for (let n = 0; n < this.queue.length; n++) {
        const [, qid, qi] = this.queue[n];
        const score = qid === cur.s.id ? Math.abs(qi - cur.i) - (qi >= cur.i ? 0.5 : 0) : 1000 + qi;
        if (score < bestScore) { bestScore = score; best = n; if (score < 0.5) break; }
      }
      const [key, id, i] = this.queue.splice(best, 1)[0];
      const im = new Image();
      im.decoding = 'async';
      this.inflight++;
      // decode off the critical path before the frame is ever drawn, so scrubbing never stalls on a decode
      const ready = () => { this.inflight--; const arr = this.imgs.get(key); if (arr) arr[i] = im; if (this.locate(Math.max(0, this.frame)).s.id === id) this.draw(); this.pump(); };
      im.onload = () => { if (im.decode) im.decode().then(ready, ready); else ready(); };
      im.onerror = () => { this.inflight--; this.pump(); };
      im.src = this.urlFor(key, id, i);
    }
  }
  private locate(f: number) {
    let i = f;
    for (const s of this.shots) { if (i < s.frames) return { s, i }; i -= s.frames; }
    const s = this.shots[this.shots.length - 1];
    return { s, i: s.frames - 1 };
  }
  /** The loaded frame closest to `i`, at most `within` frames away. */
  private nearest(key: string, i: number, within = Infinity) {
    const arr = this.imgs.get(key);
    if (!arr) return null;
    for (let d = 0; d < Math.min(arr.length, within + 1); d++) { const a = arr[i - d], b = arr[i + d]; if (a) return a; if (b) return b; }
    return null;
  }
  private resize() {
    const d = Math.min(window.devicePixelRatio || 1, 2), w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.canvas.width = Math.round(w * d); this.canvas.height = Math.round(h * d);
    this.draw();
  }
  draw() {
    const { g } = this, w = this.canvas.width, h = this.canvas.height;
    if (!w || this.disposed) return;
    const { s, i } = this.locate(Math.max(0, this.frame));
    // Only frames of the same angle are ever laid over each other. While the frame for this spot is still loading the
    // nearest one stands in, on its own: blending it with a neighbour several frames away would draw two phones.
    const key = this.key(s), arr = s.id === 0 ? undefined : this.imgs.get(key);
    let im = s.id === 0 ? null : this.nearest(key, i);
    // switching finish: keep the old frames on screen until the new finish has this angle, then cross-fade
    const fade = s.id !== 0 ? this.fades.get(s.id) ?? null : null;
    const old = fade ? this.nearest(fade.from, i, 1) : null;
    let mix = 1;
    if (fade) {
      const close = this.nearest(key, i, 1);
      if (!close) im = old ?? im ?? this.nearest(fade.from, i);
      else {
        im = close;
        if (old) { fade.t0 ||= performance.now(); mix = Math.min(1, (performance.now() - fade.t0) / FADE_MS); }
        if (mix < 1) { cancelAnimationFrame(this.fadeRaf); this.fadeRaf = requestAnimationFrame(() => this.draw()); }
        else { this.imgs.delete(fade.from); this.fades.delete(s.id); }
      }
    }
    const real = !!im || (s.id === 0 && this.isReady(s));
    if (s.id === 0 && real) {
      const still = this.still ??= new Image();
      const u = this.url(s, 0);
      if (still.dataset.src !== u) { still.dataset.src = u; still.onload = () => this.draw(); still.src = u; }
      if (still.complete && still.naturalWidth) this.cover(still); else PAINT[0](g, w, h, 0.5, this.opts);
    } else if (im) {
      if (old && mix < 1 && old !== im) { this.cover(old, s.fit, s.fitH); g.globalAlpha = mix * mix * (3 - 2 * mix); this.cover(im, s.fit, s.fitH); g.globalAlpha = 1; }
      else {
        this.cover(im, s.fit, s.fitH);
        // between frames: blend in the next one by how far we are towards it (only over the exact frame, see above)
        const nx = this.frac > 0.02 && i + 1 < s.frames && arr?.[i] === im ? arr?.[i + 1] : null;
        if (nx) { g.globalAlpha = this.frac; this.cover(nx, s.fit, s.fitH); g.globalAlpha = 1; }
      }
    }
    else { g.save(); PAINT[s.id](g, w, h, s.frames > 1 ? i / (s.frames - 1) : 0, this.opts); g.restore(); }
    this.onFrame?.({ shot: s, frame: i, real });
  }
  private still?: HTMLImageElement;
  private cover(im: HTMLImageElement, fit?: number, fitH?: number) {
    const { g } = this, w = this.canvas.width, h = this.canvas.height;
    // tall screens keep `fit` of the width, wide screens `fitH` of the height, instead of cropping the subject
    const { x, y, w: iw, h: ih } = coverRect(w, h, im.naturalWidth, im.naturalHeight, REEL ? undefined : fit, REEL ? undefined : fitH);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (ih < h - 1 || iw < w - 1) { g.fillStyle = '#050505'; g.fillRect(0, 0, w, h); }
    g.drawImage(im, x, y, iw, ih);
    const e0 = 90 * (window.devicePixelRatio || 1);
    if (ih < h - 1) { // soften the top and bottom edges into the studio black
      const e = Math.min(ih * 0.18, e0);
      for (const [y0, y1] of [[y, y + e], [y + ih, y + ih - e]]) {
        const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(5,5,5,1)'); gr.addColorStop(1, 'rgba(5,5,5,0)');
        g.fillStyle = gr; g.fillRect(0, Math.min(y0, y1), w, e);
      }
    }
    if (iw < w - 1) { // and the side edges
      const e = Math.min(iw * 0.12, e0);
      for (const [x0, x1] of [[x, x + e], [x + iw, x + iw - e]]) {
        const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(5,5,5,1)'); gr.addColorStop(1, 'rgba(5,5,5,0)');
        g.fillStyle = gr; g.fillRect(Math.min(x0, x1), 0, e, h);
      }
    }
  }
}
