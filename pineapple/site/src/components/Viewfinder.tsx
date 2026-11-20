import { useEffect, useRef } from 'react';
import { isSmallScreen } from '../lib/tokens';

const BASE = import.meta.env.BASE_URL;
/** One photo per lens: the zoom it starts at, and the point it zooms towards (0–1 of the photo). As on a phone, the view
 *  zooms digitally within a lens and cross-fades to the next lens at 1×, 5× and the 25× limit. */
const SOURCES: { z: number; focus: [number, number] }[] = [
  { z: 0.5, focus: [0.48, 0.35] }, // ultra-wide: the plantation, towards the farmhouse
  { z: 1, focus: [0.6, 0.22] }, // main: the farmhouse, towards its porch
  { z: 5, focus: [0.18, 0.75] }, // periscope: the porch, towards the basket
  { z: 22, focus: [0.5, 0.5] }, // the 25× limit: the basket of pineapples
];
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * What the camera sees at a zoom from 0.5× to 25×: four photographs of one farm, one per lens, each zooming digitally
 * towards its subject and handing over to the next lens as you pass 1×, 5× and 25×.
 */
export function Viewfinder({ zoom, lens, className = '' }: { zoom: number; lens: string; className?: string }) {
  const c = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const zRef = useRef(zoom); zRef.current = zoom;
  const draw = useRef(() => {});

  useEffect(() => {
    const cv = c.current!, g = cv.getContext('2d')!;
    draw.current = () => {
      const w = cv.width, h = cv.height; if (!w) return;
      g.fillStyle = '#050403'; g.fillRect(0, 0, w, h);
      const z = zRef.current;
      SOURCES.forEach((src, j) => {
        const im = imgs.current[j]; if (!im) return;
        const next = SOURCES[j + 1];
        if (next && z >= next.z * 0.99 && imgs.current[j + 1]) return; // the next lens has taken over
        const alpha = j === 0 ? 1 : j === SOURCES.length - 1 ? smooth(20, 24.6, z) : smooth(src.z * 0.84, src.z * 0.99, z); // hand over just before each lens, so 1×, 5× and 25× are clean
        if (alpha <= 0) return;
        const iw = (im as HTMLImageElement).naturalWidth, ih = (im as HTMLImageElement).naturalHeight;
        const k = Math.max(1, j === SOURCES.length - 1 ? 1 : z / src.z), base = Math.max(w / iw, h / ih), sc = base * k;
        // the window drifts towards the subject as it narrows, never past the photo's edge
        const half = 0.5 / k, cx = Math.min(1 - half, Math.max(half, src.focus[0])), cy = Math.min(1 - half, Math.max(half, src.focus[1]));
        const fx = 0.5 + (cx - 0.5) * Math.min(1, (k - 1) * 2), fy = 0.5 + (cy - 0.5) * Math.min(1, (k - 1) * 2);
        g.globalAlpha = alpha;
        g.drawImage(im, w / 2 - fx * iw * sc, h / 2 - fy * ih * sc, iw * sc, ih * sc);
      });
      g.globalAlpha = 1;
    };
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(cv.clientWidth * d); cv.height = Math.round(cv.clientHeight * d); draw.current(); };
    const ro = new ResizeObserver(size); ro.observe(cv);
    const dir = isSmallScreen() ? 'mobile/' : '';
    SOURCES.forEach((_, j) => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => { imgs.current[j] = im; draw.current(); };
      im.src = `${BASE}frames/${dir}camera/zoom-${j}.webp`;
    });
    return () => ro.disconnect();
  }, []);
  useEffect(() => { draw.current(); }, [zoom]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      <canvas ref={c} className="absolute inset-0 h-full w-full" role="img" aria-label={`The camera's view at ${zoom.toFixed(1)}×: a pineapple farm at golden hour.`} />
      {/* viewfinder marks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-[clamp(18px,5vmin,56px)] [&>i]:absolute [&>i]:h-7 [&>i]:w-7 [&>i]:border-cream/80">
        <i className="left-0 top-0 border-l-2 border-t-2" /><i className="right-0 top-0 border-r-2 border-t-2" />
        <i className="bottom-0 left-0 border-b-2 border-l-2" /><i className="bottom-0 right-0 border-b-2 border-r-2" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 border border-[#f0c64e]/90" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[clamp(64px,10vh,96px)] -translate-x-1/2 rounded-full bg-ink/60 px-3 py-1 font-mono text-[.7rem] uppercase tracking-[.14em] text-cream backdrop-blur-md">
        {lens}
      </div>
    </div>
  );
}
