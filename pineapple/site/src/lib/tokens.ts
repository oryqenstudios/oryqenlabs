import { clamp } from './math';

/** The one easing curve (restraint rule): easeOutQuint. Same curve in CSS, GSAP and hand-written JS. */
export const EASE_CSS = 'cubic-bezier(.22,1,.36,1)';
export const EASE_GSAP = 'power4.out';
export const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isSmallScreen = () => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 760px)').matches;
/** A finger is the main pointer: phones and tablets (a laptop with a touchscreen still has a mouse first). */
export const isTouch = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

/** The page accent follows the chosen finish or palette (logo, nav highlight, headline gradient). */
let accentNow = '#f0b53a';
/** Current accent (cheap to read every frame). */
export const currentAccent = () => accentNow;
export function setAccent(a1: string, a2: string) {
  accentNow = a2;
  const r = document.documentElement.style;
  r.setProperty('--a1', a1);
  r.setProperty('--a2', a2);
}
