import { useLayoutEffect, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { isTouch, reducedMotion } from './tokens';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Smooth scrolling (Lenis) driving GSAP ScrollTrigger. Off for reduced-motion visitors, and on touch devices, which keep
 *  the browser's own scrolling (momentum, overscroll, the address bar) untouched. */
export function initSmoothScroll() {
  if (lenis || reducedMotion() || isTouch()) return;
  lenis = new Lenis({ lerp: 0.075, smoothWheel: true, wheelMultiplier: 0.9 }); // a silkier glide
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToTarget(target: string | HTMLElement | number) {
  if (lenis) lenis.scrollTo(target as never, { duration: 1.4 });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reducedMotion() ? 'auto' : 'smooth' });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
}

/** 0–1 progress of the viewport through a tall pinned section (top hits top → bottom hits bottom). */
export function useScrubProgress(ref: RefObject<HTMLElement>) {
  const [p, setP] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const st = ScrollTrigger.create({ trigger: ref.current, start: 'top top', end: 'bottom bottom', onUpdate: s => setP(s.progress) });
    setP(st.progress);
    return () => st.kill();
  }, [ref]);
  return p;
}

export { gsap, ScrollTrigger };
