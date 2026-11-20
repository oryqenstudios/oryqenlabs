import { useEffect, useRef } from 'react';
import { GOLDEN_ANGLE } from '../lib/math';
import { ScrollTrigger } from '../lib/scroll';

/** Background motif: a golden-angle (137.5°) dot spiral that blooms as you scroll. */
export function SpiralBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, g = c.getContext('2d')!;
    let p = 0, queued = false;
    const draw = () => {
      queued = false;
      const d = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
      if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
      const W = c.width, H = c.height, n = Math.round(120 + p * 900), k = (Math.max(W, H) * 0.62) / Math.sqrt(1020);
      g.clearRect(0, 0, W, H);
      for (let i = 1; i < n; i++) {
        const a = i * GOLDEN_ANGLE + p * 0.6, r = k * Math.sqrt(i), x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r;
        if (x < 0 || x > W || y < 0 || y > H) continue;
        g.fillStyle = i % 13 === 0 ? 'rgba(240,181,58,.22)' : i % 8 === 0 ? 'rgba(111,164,63,.2)' : 'rgba(243,241,230,.06)';
        g.beginPath(); g.arc(x, y, k * 0.08 + 1, 0, Math.PI * 2); g.fill();
      }
    };
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { p = s.progress; if (!queued) { queued = true; requestAnimationFrame(draw); } } });
    addEventListener('resize', draw); draw();
    return () => { st.kill(); removeEventListener('resize', draw); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" aria-hidden="true" />;
}
