import { useEffect, useRef, useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Breakdown } from './Breakdown';
import { sm } from '../lib/math';
import { reducedMotion } from '../lib/tokens';

/**
 * 05 · Inside. Shot 4: the phone separates into its ten layers. Shot 5: they come back together and the phone turns
 * to face you, screen on. Then it is yours to turn: shots 15 and 16 are a full turn (front to back, back to front),
 * scrubbed by dragging. Below, the hands-on breakdown: pull it apart yourself.
 */
const EXPLODE = 0.36, HOLD = 0.44, ASSEMBLED = 0.8;
export function Inside() {
  return (
    <section id="inside">
      <SectionIntro label="05 · Inside" line1="Ten layers." line2="Take it apart." instruction="Scroll to separate it and put it back together. Then turn it 360° yourself." />
      <ScrubSection length="400vh" label="Exploded view">
        {p => {
          const seq = p < EXPLODE ? (p / EXPLODE) * 0.5 : p < HOLD ? 0.5 : 0.5 + Math.min(1, (p - HOLD) / (ASSEMBLED - HOLD)) * 0.5;
          const layers = p < HOLD ? Math.round(sm(0, EXPLODE, p) * 10) : Math.round((1 - sm(HOLD, ASSEMBLED, p)) * 10);
          return <InsideStage seq={seq} live={p >= ASSEMBLED + 0.01} layers={layers} />;
        }}
      </ScrubSection>
      <Breakdown />
    </section>
  );
}

function InsideStage({ seq, live, layers }: { seq: number; live: boolean; layers: number }) {
  const [angle, setAngle] = useState(0);
  const [touched, setTouched] = useState(false);
  const a = useRef(0), v = useRef(0), drag = useRef<{ x: number; t: number } | null>(null), raf = useRef(0);

  const set = (deg: number) => { a.current = ((deg % 360) + 360) % 360; setAngle(a.current); };
  // scrolling back into the animation puts it back to face you
  useEffect(() => { if (!live) { cancelAnimationFrame(raf.current); v.current = 0; set(0); } }, [live]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const coast = () => {
    cancelAnimationFrame(raf.current);
    const step = () => { v.current *= 0.94; if (Math.abs(v.current) < 0.02) return; set(a.current + v.current); raf.current = requestAnimationFrame(step); };
    if (!reducedMotion()) raf.current = requestAnimationFrame(step);
  };
  const down = (e: React.PointerEvent) => {
    if (!live) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    cancelAnimationFrame(raf.current); drag.current = { x: e.clientX, t: performance.now() }; v.current = 0; setTouched(true);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const now = performance.now(), dx = e.clientX - d.x, deg = -dx * 0.45; // drag left, it turns left
    set(a.current + deg); v.current = deg / Math.max(8, now - d.t) * 16; drag.current = { x: e.clientX, t: now };
  };
  const up = () => { if (!drag.current) return; drag.current = null; coast(); };

  return (
    <div className="absolute inset-0" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      style={{ cursor: live ? (drag.current ? 'grabbing' : 'grab') : undefined, touchAction: live ? 'pan-y' : undefined }}>
      <FrameSequence shots={[4, 5]} progress={seq} />
      {/* the turn: mounted early so its frames are in before you reach it */}
      <div className="absolute inset-0" style={{ visibility: live ? 'visible' : 'hidden' }} aria-hidden={!live}>
        <FrameSequence shots={[15, 16]} progress={angle / 360} hud={false} />
      </div>
      <Readouts items={live ? [['Turn', `${Math.round(angle)}°`], ['Layers', '10 in 7.9 mm']] : [['Layers', `${layers}/10`], ['Thickness', '7.9 mm']]} />
      <div className="dock-bottom transition-opacity duration-500" style={{ opacity: live ? 1 : 0, pointerEvents: live ? 'auto' : 'none' }} aria-hidden={!live}>
        <div className="flex items-center gap-3 rounded-full border border-ink-line bg-ink/70 px-3 py-1.5 backdrop-blur-md">
          <button type="button" className="chip !px-3" tabIndex={live ? 0 : -1} onClick={() => { setTouched(true); set(a.current - 30); }} aria-label="Turn left 30°">←</button>
          <input type="range" min={0} max={359} value={Math.round(angle)} tabIndex={live ? 0 : -1} onChange={e => { setTouched(true); set(+e.target.value); }}
            aria-label="Turn the phone, 0 to 359 degrees" className="w-[min(46vw,260px)] accent-[var(--a2)]" />
          <button type="button" className="chip !px-3" tabIndex={live ? 0 : -1} onClick={() => { setTouched(true); set(a.current + 30); }} aria-label="Turn right 30°">→</button>
        </div>
      </div>
      <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 m-0 text-center font-mono text-[.72rem] uppercase tracking-[.14em] text-cream/80 transition-opacity duration-700"
        style={{ bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 100px)', opacity: live && !touched ? 1 : 0 }}>
        ⟵ Drag to turn it 360° ⟶
      </p>
    </div>
  );
}
