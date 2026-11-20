import { useEffect, useRef } from 'react';
import { reducedMotion } from '../lib/tokens';
import { finishPalette, getFinish } from '../lib/finish';

const pick = (a: string[]) => a[(Math.random() * a.length) | 0];

/** Hero: droplets in the chosen finish's colours follow the cursor and fall away (plan §5). Mouse only; off for reduced motion. */
export function Droplets() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!, host = c.parentElement!;
    if (reducedMotion()) return;
    type D = { x: number; y: number; vx: number; vy: number; r: number; c: string; t0: number };
    let drops: D[] = [], raf = 0, last = 0;
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); c.width = Math.round(c.clientWidth * d); c.height = Math.round(c.clientHeight * d); };
    const ro = new ResizeObserver(size); ro.observe(c);
    const loop = () => {
      const d = Math.min(devicePixelRatio || 1, 2), now = performance.now();
      g.clearRect(0, 0, c.width, c.height);
      drops = drops.filter(p => now - p.t0 < 1100);
      for (const p of drops) {
        const a = (now - p.t0) / 1100; p.vy += 0.35; p.x += p.vx; p.y += p.vy;
        g.globalAlpha = 1 - a; g.fillStyle = p.c; g.beginPath();
        g.ellipse(p.x * d, p.y * d, p.r * d * (1 - a * 0.5), p.r * d * 1.35 * (1 - a * 0.5), 0, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      raf = drops.length ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now(); if (now - last < 18) return; last = now;
      const r = c.getBoundingClientRect();
      drops.push({ x: e.clientX - r.left, y: e.clientY - r.top, vx: (Math.random() - 0.5) * 1.6, vy: -1 - Math.random() * 1.5, r: 3 + Math.random() * 5, c: pick(finishPalette(getFinish())), t0: now });
      if (!raf) raf = requestAnimationFrame(loop);
    };
    host.addEventListener('pointermove', move);
    return () => { ro.disconnect(); host.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
