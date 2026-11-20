/**
 * Logo burst, DOM side (plan §6): palette cycling, the five-click gold burst, the page tint,
 * sound and the reduced-motion pulse. The pieces themselves are drawn by three/Burst.tsx.
 */
import { stage } from '../three/store';
import { play } from './sound';
import { reducedMotion } from './tokens';

const PALETTES = [
  ['#6fa43f', '#a6b542', '#f0b53a', '#e8c75a', '#89b35a'], // Ripen
  ['#f6a12e', '#a7d13b', '#ef6f8a', '#4c5fc4', '#ff7a5c'], // Mango, Lime, Guava, Blueberry, Coral
  ['#665632', '#f0cf6a', '#3f6b3a', '#efe6c8', '#b4b246'], // Rind, Golden Flesh, Crown Green, Core, Ripen
];
const GOLD = ['#f6d978', '#f0b53a', '#e2ad35', '#fff1b8', '#c99a2a'];
let paletteIndex = 0;
let clicks: number[] = [];

type Rect = { left: number; top: number; width: number };
export interface BurstOptions {
  x: number; y: number;
  /** The logo element that bursts and is rebuilt (hidden while the pieces fly). */
  el?: Element | null;
  /** Start from a different logo than the one that gets rebuilt (loader → hero). */
  start?: Rect;
  /** Rebuild somewhere with no DOM logo (pieces fade at the end). */
  at?: Rect;
  power?: number;
  small?: boolean;
}

export function burst(o: BurstOptions) {
  const now = performance.now();
  clicks = clicks.filter(t => now - t < 1600);
  clicks.push(now);
  const gold = clicks.length >= 5;
  if (gold) clicks = [];
  // a new burst only once the logo is mostly rebuilt (gold may interrupt)
  if (!gold && stage.burstProgress() < 0.8) return;

  const palette = gold ? GOLD : PALETTES[paletteIndex++ % PALETTES.length];
  tint(palette);
  play('shimmer');
  if (reducedMotion() || !stage.burst) return; // soft colour pulse only

  const el = o.el as HTMLElement | SVGElement | null | undefined;
  const home = o.at ? () => o.at! : () => el!.getBoundingClientRect();
  el?.classList.add('burst-hidden');
  stage.burst({
    from: { x: o.x, y: o.y }, start: o.start, home, palette, leaf: gold ? '#e2ad35' : '#5f9a45',
    power: (o.power ?? 1) * (gold ? 1.3 : 1), small: !!o.small,
    fadeAtEnd: !el, onDone: () => el?.classList.remove('burst-hidden'),
  });
}

/** The page lighting briefly takes on the burst colours. */
let tintEl: HTMLDivElement | null = null;
function tint(p: string[]) {
  if (!tintEl) {
    tintEl = document.createElement('div');
    tintEl.setAttribute('aria-hidden', 'true');
    tintEl.className = 'burst-tint';
    document.body.appendChild(tintEl);
  }
  const t = tintEl;
  t.style.background = `radial-gradient(60% 50% at 30% 30%,${p[0]}55,transparent 70%),radial-gradient(60% 50% at 70% 70%,${p[2]}55,transparent 70%)`;
  // a fade, not motion: kept for reduced-motion visitors (their soft colour pulse), with the one easing curve
  t.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }], { duration: reducedMotion() ? 1600 : 1500, easing: 'cubic-bezier(.22,1,.36,1)' });
}
