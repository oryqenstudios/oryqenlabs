import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { coverRect } from '../sequence/player';
import { SHOTS } from '../data/shots';
import { clamp, sm } from '../lib/math';
import { reducedMotion } from '../lib/tokens';

/**
 * 02 · Crown. Shots 3 and 11: in darkness a shaft of light finds the camera, the view glides into the lens, then pulls
 * back to the whole phone standing in front of the CROWN letters. Once the animation is over the stage is yours: a
 * light follows the cursor across the metal, and each detail opens with a real camera move (shots 11 reversed, 12, 13),
 * played forward to zoom in and backward to zoom out.
 */
type Detail = 'camera' | 'scales' | 'key';
const DETAILS: Record<Detail, { label: string; shot: number; reverse?: boolean; at: [number, number]; mm: number; focus: string; title: string; body: string }> = {
  camera: { label: 'Camera plateau', shot: 11, reverse: true, at: [0.435, 0.155], mm: 120, focus: '0.18 m', title: 'One scale, three lenses.',
    body: 'The camera plateau is a single rounded-hexagon scale, 1.8 mm high, with its three lenses set in a triangle.' },
  key: { label: 'Crown Key', shot: 13, at: [0.368, 0.39], mm: 100, focus: '0.22 m', title: 'A key shaped like a leaf.',
    body: 'A tactile ridge and two stages: a light press focuses, a full press acts. The rails carry a 0.2 mm rind texture.' },
  scales: { label: 'Etched scales', shot: 12, at: [0.49, 0.71], mm: 90, focus: '0.25 m', title: 'Etched into the glass.',
    body: 'Rows of scales etched 20 µm into frosted glass, in the spiral counts of the fruit: 8 and 13.' },
};
const ORDER: Detail[] = ['camera', 'key', 'scales'];
const END = 0.72; // share of the scroll the animation takes; the rest is the interactive hold
const IN_MS = 2600, OUT_MS = 1900;
/** A camera move: slow to start, glides, settles. */
const glide = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function Reveal() {
  return (
    <section id="reveal">
      <SectionIntro label="02 · Crown" line1="Light finds" line2="the lens." instruction="Scroll to follow the light in. Then zoom in on the details." />
      <ScrubSection length="420vh" label="Crown reveal">
        {p => <RevealStage p={p} />}
      </ScrubSection>
    </section>
  );
}

function RevealStage({ p }: { p: number }) {
  const anim = clamp(p / END, 0, 1);
  const live = p >= END + 0.015;
  const stage = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<Detail | null>(null);
  const [q, setQ] = useState(0); // 0 = the whole phone, 1 = arrived at the detail
  const qRef = useRef(0), raf = useRef(0), queued = useRef<Detail | null>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [light, setLight] = useState({ x: 0.5, y: 0.35, user: false });

  useEffect(() => {
    const el = stage.current!; const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const tween = useCallback((to: number, then?: () => void) => {
    cancelAnimationFrame(raf.current);
    const from = qRef.current, dur = reducedMotion() ? 0 : (to > from ? IN_MS : OUT_MS) * Math.abs(to - from), t0 = performance.now();
    const step = () => {
      const t = dur ? Math.min(1, (performance.now() - t0) / dur) : 1;
      qRef.current = from + (to - from) * glide(t); setQ(qRef.current);
      if (t < 1) raf.current = requestAnimationFrame(step); else then?.();
    };
    step();
  }, []);

  const zoomTo = useCallback((d: Detail | null) => {
    if (d === null) { queued.current = null; tween(0, () => setTarget(null)); return; }
    if (qRef.current > 0.001 && target && target !== d) { queued.current = d; tween(0, () => { setTarget(queued.current); tween(1); }); return; }
    setTarget(d); tween(1);
  }, [target, tween]);

  // scrolling back into the animation, or away, puts the camera back
  useEffect(() => { if (!live && qRef.current > 0) { cancelAnimationFrame(raf.current); qRef.current = 0; setQ(0); setTarget(null); } }, [live]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    if (!target) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') zoomTo(null); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [target, zoomTo]);

  // until the visitor moves the pointer, the light drifts across the letters by itself
  useEffect(() => {
    if (!live || light.user || reducedMotion()) return;
    let id = 0; const t0 = performance.now();
    const drift = () => { const t = (performance.now() - t0) / 1000; setLight(l => (l.user ? l : { x: 0.5 + Math.sin(t * 0.45) * 0.38, y: 0.32 + Math.sin(t * 0.7) * 0.12, user: false })); id = requestAnimationFrame(drift); };
    id = requestAnimationFrame(drift); return () => cancelAnimationFrame(id);
  }, [live, light.user]);

  const onMove = (e: React.PointerEvent) => {
    if (!live || e.pointerType !== 'mouse') return;
    const r = stage.current!.getBoundingClientRect();
    setLight({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, user: true });
  };

  const d = target ? DETAILS[target] : null;
  const zoomed = q > 0.001;
  const s3 = SHOTS[3];
  const rect = coverRect(size.w, size.h, 2048, 1152, s3.fit, s3.fitH);
  const tilt = live && !zoomed && light.user ? { x: (light.y - 0.5) * -1.4, y: (light.x - 0.5) * 2 } : { x: 0, y: 0 };
  const hint = live && !zoomed ? 1 : 0;

  return (
    <div ref={stage} className="absolute inset-0 overflow-hidden" onPointerMove={onMove}>
      <div className="absolute inset-0 transition-transform duration-700 ease-brand"
        style={{ transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${live && !zoomed ? 1.02 : 1})` }}>
        <FrameSequence shots={[3, 11]} progress={anim} />
        {/* the camera moves; each mounts early so its frames are loaded before it is asked for */}
        {ORDER.map(k => {
          const z = DETAILS[k], on = target === k && zoomed;
          return (
            <div key={k} className="absolute inset-0" style={{ visibility: on ? 'visible' : 'hidden' }} aria-hidden={!on}>
              <FrameSequence shots={[z.shot]} progress={on ? (z.reverse ? 1 - q : q) : z.reverse ? 1 : 0} hud={false} />
            </div>
          );
        })}
        {/* a warm light follows the cursor; soft-light leaves the black studio black and lifts the metal */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{ opacity: live && !zoomed ? 1 : 0, mixBlendMode: 'soft-light', background: `radial-gradient(circle at ${light.x * 100}% ${light.y * 100}%, rgba(255,236,196,.95), rgba(255,226,170,.35) 16%, rgba(0,0,0,0) 34%)` }} />
      </div>

      {/* cinema bars and a lens readout while the camera moves in */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 bg-ink" style={{ height: `${q * 7}vh` }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink" style={{ height: `${q * 7}vh` }} />
      <div style={{ opacity: zoomed ? 1 : sm(0.3, 0.6, anim) * (1 - sm(0.9, 1, anim)) }}>
        <Readouts items={d ? [['Focal length', `${Math.round(24 + (d.mm - 24) * q)} mm`], ['Focus', q > 0.98 ? d.focus : '∞ → ' + d.focus]] : [['Light', 'f/1.6'], ['Shutter', '1/250 s']]} />
      </div>

      {/* hotspots, pinned to points in the footage */}
      {ORDER.map(k => {
        const z = DETAILS[k], x = rect.x + z.at[0] * rect.w, y = rect.y + z.at[1] * rect.h;
        return (
          <button key={k} type="button" tabIndex={hint ? 0 : -1} aria-hidden={!hint} onClick={() => zoomTo(k)}
            className="group absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-opacity duration-500 max-md:hidden"
            style={{ left: x, top: y, opacity: hint, pointerEvents: hint ? 'auto' : 'none' }} aria-label={`Zoom in on the ${z.label}`}>
            <span className="absolute inset-[6px] animate-ping rounded-full border-2 border-cream/70 [animation-duration:2.4s]" />
            <span className="relative grid h-[28px] w-[28px] place-items-center rounded-full border border-cream bg-ink/55 text-[17px] leading-none text-cream shadow-[0_0_0_4px_rgba(243,241,230,.12),0_4px_18px_rgba(5,5,5,.6)] backdrop-blur-md">+</span>
            <span className="pointer-events-none absolute left-full top-1/2 ml-1 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink/70 px-2.5 py-1 text-[.74rem] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{z.label}</span>
          </button>
        );
      })}

      {/* the detail's caption once the camera has arrived */}
      {d && (
        <div className="pointer-events-none absolute grid max-w-[360px] gap-2 rounded-2xl border border-ink-line bg-ink/70 p-5 backdrop-blur-xl max-md:right-[var(--gut-r)]"
          style={{ left: 'var(--gut-l)', bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 120px)', opacity: sm(0.75, 1, q), transform: `translateY(${(1 - sm(0.75, 1, q)) * 12}px)` }}>
          <span className="label">{d.label}</span>
          <p className="m-0 text-[clamp(1.5rem,2.6vw,2.1rem)] font-bold leading-tight tracking-[-.025em]">{d.title}</p>
          <p className="m-0 text-mute">{d.body}</p>
        </div>
      )}

      <div className="dock-bottom transition-opacity duration-500" style={{ opacity: live ? 1 : 0, pointerEvents: live ? 'auto' : 'none' }} aria-hidden={!live}>
        <div className="chips flex flex-wrap gap-2" role="group" aria-label="Zoom in on a detail">
          {zoomed && <button type="button" className="chip" tabIndex={live ? 0 : -1} onClick={() => zoomTo(null)}>← Whole phone</button>}
          {ORDER.map(k => (
            <button key={k} type="button" className="chip" tabIndex={live ? 0 : -1} aria-pressed={target === k && zoomed} onClick={() => zoomTo(k)}>{DETAILS[k].label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
