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
import { isSmallScreen } from '../lib/tokens';

interface ShotEntry { frames: number; ready: boolean; mobile?: boolean }
interface Manifest { ext: string; stills: { ready: string[]; mobile?: boolean }; shots: Record<string, ShotEntry> }

const BASE = import.meta.env.BASE_URL;
let manifestP: Promise<Manifest> | null = null;
export function loadManifest(): Promise<Manifest> {
  manifestP ??= fetch(`${BASE}frames/manifest.json`).then(r => (r.ok ? r.json() : Promise.reject(r.status))).catch(() => ({ ext: 'webp', stills: { ready: [] }, shots: {} }));
  return manifestP;
}

const MAX_CONCURRENT = 6;
export interface HudInfo { shot: Shot; frame: number; real: boolean }

export class SequencePlayer {
  private g: CanvasRenderingContext2D;
  private shots: Shot[];
  private total: number;
  private imgs: Map<number, (HTMLImageElement | null)[]> = new Map();
  private manifest: Manifest | null = null;
  private frame = -1;
  private p = 0;
  private queue: [number, number][] = [];
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

  dispose() { this.disposed = true; this.ro.disconnect(); this.queue = []; }

  /** Begin downloading frames. Called when the section approaches the viewport. */
  start() {
    if (this.started || !this.manifest) { if (!this.started) loadManifest().then(() => this.start()); return; }
    this.started = true;
    for (const s of this.shots) {
      if (!this.isReady(s)) continue;
      this.imgs.set(s.id, new Array(s.frames).fill(null));
      for (const step of [8, 4, 2, 1]) for (let i = 0; i < s.frames; i += step) if (!this.queue.some(([a, b]) => a === s.id && b === i)) this.queue.push([s.id, i]);
    }
    this.pump();
  }

  setOpts(o: PaintOpts) { this.opts = { ...this.opts, ...o }; this.draw(); }

  set(p: number) {
    this.p = Math.min(1, Math.max(0, p));
    const f = Math.round(this.p * (this.total - 1));
    if (f !== this.frame) { this.frame = f; this.draw(); }
  }

  private isReady(s: Shot) {
    if (!this.manifest) return false;
    if (s.id === 0) return this.manifest.stills.ready.includes(`${this.opts.device === 'tablet' ? 'slate-' : ''}${this.opts.fin ?? 'ripen'}`);
    return !!this.manifest.shots[s.id]?.ready;
  }
  private url(s: Shot, i: number) {
    const m = this.manifest!;
    if (s.id === 0) return `${BASE}frames/${m.stills.mobile && isSmallScreen() ? 'mobile/' : ''}shot-00/${this.opts.device === 'tablet' ? 'slate-' : ''}${this.opts.fin ?? 'ripen'}.${m.ext}`;
    const mobile = m.shots[s.id]?.mobile && isSmallScreen();
    return `${BASE}frames/${mobile ? 'mobile/' : ''}shot-${pad(s.id, 2)}/${pad(i + 1, 4)}.${m.ext}`;
  }
  private pump() {
    while (!this.disposed && this.inflight < MAX_CONCURRENT && this.queue.length) {
      const [id, i] = this.queue.shift()!;
      const s = SHOTS[id];
      const im = new Image();
      im.decoding = 'async';
      this.inflight++;
      im.onload = () => { this.inflight--; this.imgs.get(id)![i] = im; if (this.locate(Math.max(0, this.frame)).s.id === id) this.draw(); this.pump(); };
      im.onerror = () => { this.inflight--; this.pump(); };
      im.src = this.url(s, i);
    }
  }
  private locate(f: number) {
    let i = f;
    for (const s of this.shots) { if (i < s.frames) return { s, i }; i -= s.frames; }
    const s = this.shots[this.shots.length - 1];
    return { s, i: s.frames - 1 };
  }
  private nearest(id: number, i: number) {
    const arr = this.imgs.get(id);
    if (!arr) return null;
    for (let d = 0; d < arr.length; d++) { const a = arr[i - d], b = arr[i + d]; if (a) return a; if (b) return b; }
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
    const im = s.id === 0 ? null : this.nearest(s.id, i);
    const real = !!im || (s.id === 0 && this.isReady(s));
    if (s.id === 0 && real) {
      const still = this.still ??= new Image();
      const u = this.url(s, 0);
      if (still.dataset.src !== u) { still.dataset.src = u; still.onload = () => this.draw(); still.src = u; }
      if (still.complete && still.naturalWidth) this.cover(still); else PAINT[0](g, w, h, 0.5, this.opts);
    } else if (im) this.cover(im);
    else { g.save(); PAINT[s.id](g, w, h, s.frames > 1 ? i / (s.frames - 1) : 0, this.opts); g.restore(); }
    this.onFrame?.({ shot: s, frame: i, real });
  }
  private still?: HTMLImageElement;
  private cover(im: HTMLImageElement) {
    const w = this.canvas.width, h = this.canvas.height, sc = Math.max(w / im.naturalWidth, h / im.naturalHeight);
    const iw = im.naturalWidth * sc, ih = im.naturalHeight * sc;
    this.g.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih);
  }
}
