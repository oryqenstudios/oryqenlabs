import { useMemo, useRef, useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Chips } from '../components/Chips';
import { FINISHES, PHONE_FINISHES, swatch, type FinishKey } from '../data/finishes';
import { chooseFinish, useFinish } from '../lib/finish';
import { pad, sm } from '../lib/math';
import { inspect } from '../lib/events';
import { Viewfinder } from '../components/Viewfinder';

/** 03 · Design. Shot 8: raking light across the etched back. Details open in the live breakdown. */
export function Design() {
  const go = (layer: string) => inspect('phone', layer);
  return (
    <section id="design">
      <SectionIntro label="03 · Design" line1="Every scale," line2="etched by hand." instruction="Scroll to sweep the light across the back." />
      <ScrubSection length="220vh" label="Etched back">
        {p => (
          <>
            <FrameSequence shots={[8]} progress={p} />
            <Readouts items={[['Spirals', '8 · 13'], ['Etch depth', '20 µm']]} />
            <div className="dock-bottom">
              <div className="chips flex flex-wrap gap-2">
                <button type="button" className="chip" onClick={() => go('frame')}><i style={{ background: '#9b8f6b' }} />Rind-textured frame</button>
                <button type="button" className="chip" onClick={() => go('frame')}><i style={{ background: '#c9b98a' }} />Crown Key</button>
                <button type="button" className="chip" onClick={() => go('camera')}><i style={{ background: 'var(--a1)' }} />Camera plateau</button>
              </div>
            </div>
          </>
        )}
      </ScrubSection>
    </section>
  );
}

/** 04 · Finish. The phone in the chosen finish on a turntable (shots 15 and 16, one take per finish): scroll turns it a
 *  full 360° and dragging turns it further. Picking a finish sweeps its colour across the stage. */
/** The Rind take was framed a little smaller; this keeps every finish the same size on screen. */
const FIN_SCALE: Partial<Record<FinishKey, number>> = { rind: 1.17 };
export function Finish() {
  const fin = useFinish();
  const f = FINISHES[fin];
  const opts = useMemo(() => ({ fin }), [fin]);
  const [spin, setSpin] = useState(0);
  const drag = useRef<number | null>(null);
  return (
    <section id="finish">
      <SectionIntro label="04 · Finish" line1="Five finishes." line2="One ripens." instruction="Pick a finish. Scroll to turn it, or drag it round yourself." />
      <ScrubSection length="300vh" label="Finish picker">
        {p => {
          const deg = (((p * 360 + spin) % 360) + 360) % 360;
          return (
            <div className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
              onPointerDown={e => { drag.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
              onPointerMove={e => { if (drag.current === null) return; setSpin(v => v - (e.clientX - drag.current!) * 0.45); drag.current = e.clientX; }}
              onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
              {/* a glow in the finish's colour behind the phone */}
              <div aria-hidden="true" className="absolute inset-0 transition-[background] duration-1000 ease-brand"
                style={{ background: `radial-gradient(38% 52% at 50% 52%, ${f.accent[0]}38, ${f.accent[1]}14 55%, transparent 75%)` }} />
              <div className="absolute inset-0" style={{ transform: `scale(${FIN_SCALE[fin] ?? 1})`, transformOrigin: '50% 50%', mixBlendMode: 'lighten' }}>
                <FrameSequence shots={[15, 16]} progress={deg / 360} opts={opts} hud={false} />
              </div>
              {/* switching finish: a wash of the new colour sweeps out from the phone */}
              <div key={fin} aria-hidden="true" className="finish-wash pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(circle at 50% 52%, ${f.accent[1]}cc, ${f.accent[0]}88 30%, transparent 62%)` }} />
              <div className="pointer-events-none absolute grid max-w-[360px] gap-3 [text-shadow:0_2px_18px_rgba(10,11,8,.6)] max-md:right-[var(--gut-r)]" style={{ left: 'var(--gut-l)', top: 84 }}>
                <span className="label">Finish {String(PHONE_FINISHES.indexOf(fin) + 1).padStart(2, '0')} / 05</span>
                <span key={fin} className="finish-name text-[clamp(2.4rem,5.6vw,4.4rem)] font-bold leading-none tracking-[-.04em]" aria-label={f.name}>
                  {f.name.split(' ').map((w, wi, all) => (
                    <span key={wi} aria-hidden="true" className="inline-block whitespace-nowrap">
                      {w.split('').map((ch, i) => <span key={i} style={{ animationDelay: `${(all.slice(0, wi).join(' ').length + i) * 28}ms` }}>{ch}</span>)}{wi < all.length - 1 ? '\u00a0' : ''}
                    </span>
                  ))}
                </span>
                <span aria-hidden="true" className="h-[3px] w-24 rounded-full transition-[background] duration-700" style={{ background: `linear-gradient(90deg, ${f.stops[0]}, ${f.stops[2]})` }} />
                <p className="m-0 text-mute">{f.desc}</p>
              </div>
              <Readouts items={[['Turn', `${Math.round(deg)}°`], ['Finish', f.name]]} />
              <div className="dock-bottom" onPointerDown={e => e.stopPropagation()}>
                <Chips label="Finish" value={fin} items={PHONE_FINISHES.map(k => ({ value: k, label: FINISHES[k].name, swatch: swatch(k) }))}
                  onChange={chooseFinish} />
              </div>
            </div>
          );
        }}
      </ScrubSection>
    </section>
  );
}

/** 06 · Camera. Shot 14 starts on the whole phone and glides in to the camera plateau; shot 6 carries on into the
 *  periscope lens, prism and sensor. Then you see through it: a viewfinder you zoom from 0.5× to 25×. */
export function Camera() {
  const [z, setZ] = useState(185);
  const zoom = 0.5 * Math.pow(50, z / 1000), mm = Math.round(24 * zoom);
  const lens = zoom < 1 ? `Ultra-wide · 48 MP · f/2.2 · ${mm} mm` : zoom < 5 ? `Main · 50 MP · f/1.6 · ${mm} mm` : zoom <= 5.05 ? 'Periscope · 48 MP · f/2.8 · 120 mm optical' : `Periscope + digital · ${mm} mm equivalent`;
  return (
    <section id="camera">
      <SectionIntro label="06 · Camera" line1="A 120 mm lens," line2="folded flat." instruction="Scroll to move in from the whole phone to the sensor. Then look through it and zoom from 0.5× to 25×." />
      <ScrubSection length="340vh" label="Lens fly-in">
        {p => (
          <>
            <FrameSequence shots={[14, 6]} progress={Math.min(1, p / 0.84)} />
            {/* then the sensor's view: the zoom control drives it */}
            <div className="absolute inset-0" style={{ opacity: sm(0.84, 0.92, p), visibility: p > 0.84 ? 'visible' : 'hidden' }}>
              <Viewfinder zoom={zoom} lens={lens} />
            </div>
            <Readouts items={p < 0.42 ? [['Distance', `${(0.6 - 0.52 * sm(0, 0.42, p)).toFixed(2)} m`], ['Lens', 'Main · 24 mm']] : p < 0.84 ? [['Prism fold', '90°'], ['Sensor', '48 MP']] : [['Equivalent', `${mm} mm`], ['Sensor', zoom < 1 ? '48 MP' : zoom < 5 ? '50 MP' : '48 MP']]} />
            <div className="absolute left-1/2 grid w-[min(560px,calc(100%-32px))] -translate-x-1/2 gap-1.5 rounded-2xl border border-ink-line bg-ink-2/80 px-4 py-3 backdrop-blur-md transition-opacity duration-500"
              style={{ bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 50px)', opacity: p > 0.86 ? 1 : 0, pointerEvents: p > 0.86 ? 'auto' : 'none' }} aria-hidden={p <= 0.86}>
              <div className="flex items-baseline justify-between gap-3 text-[.82rem] text-mute"><b className="text-[1.6rem] tabular-nums tracking-[-.02em] text-cream">{zoom < 10 ? zoom.toFixed(1) : Math.round(zoom)}×</b><span>{lens}</span></div>
              <input type="range" min={0} max={1000} value={z} onChange={e => setZ(+e.target.value)} tabIndex={p > 0.86 ? 0 : -1} aria-label="Zoom, 0.5× to 25×" className="w-full accent-[var(--a2)]" />
              <div className="flex justify-between text-[.72rem] text-mute">
                {[['0.5×', 0], ['1×', 178], ['5×', 590], ['25×', 1000]].map(([l, v]) => <button key={l} type="button" tabIndex={p > 0.86 ? 0 : -1} className="hover:text-cream" onClick={() => setZ(v as number)}>{l}{l === '5×' ? ' optical' : ''}</button>)}
              </div>
            </div>
          </>
        )}
      </ScrubSection>
    </section>
  );
}

/** 07 · Inside the chip. Shot 7; performance numbers count up with scroll. */
export function Chip() {
  return (
    <section id="chip">
      <SectionIntro label="07 · Inside the chip" line1="Two nanometres" line2="of Nectar." instruction="Scroll down into the die." />
      <ScrubSection length="240vh" label="Chip dive">
        {p => {
          const n = (to: number) => Math.round(to * sm(0.25, 0.85, p));
          return (
            <>
              <FrameSequence shots={[7]} progress={p} />
              <Readouts items={[['CPU cores', n(6)], ['GPU cores', n(6)], ['Neural engine', n(32)], ['Memory', `${n(12)} GB`]]} />
            </>
          );
        }}
      </ScrubSection>
    </section>
  );
}

/** 08 · Durability. Shot 9 with live depth and time readouts. */
export function Durability() {
  return (
    <section id="water">
      <SectionIntro label="09 · Durability" line1="Six metres down." line2="Still on." instruction="Scroll to sink it." />
      <ScrubSection length="240vh" label="Underwater">
        {p => (
          <>
            <FrameSequence shots={[9]} progress={p} />
            <Readouts items={[['Depth', `${(6 * sm(0.15, 1, p)).toFixed(1)} m`], ['Time', `${pad(Math.round(30 * sm(0.2, 1, p)), 2)} min`], ['Rating', 'IP68']]} />
          </>
        )}
      </ScrubSection>
    </section>
  );
}
