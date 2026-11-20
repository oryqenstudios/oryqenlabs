import { useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Chips } from '../components/Chips';
import { FINISHES, PHONE_FINISHES, swatch } from '../data/finishes';
import { chooseFinish, useFinish } from '../lib/finish';
import { pad, sm } from '../lib/math';
import { inspect } from '../lib/events';
import { FinishStills } from '../components/FinishStills';

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

/** 04 · Finish. Photoreal AI master stills (shot 00), one per finish, crossfaded as you pick. */
export function Finish() {
  const fin = useFinish();
  const f = FINISHES[fin];
  return (
    <section id="finish">
      <SectionIntro label="04 · Finish" line1="Five finishes." line2="One ripens." instruction="Pick a finish to see it in the studio." />
      <ScrubSection length="200vh" label="Finish picker">
        {p => (
          <>
            <FinishStills finish={fin} progress={p} />
            {/* phones: the phone fills the frame, so the copy gets a scrim */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[46%] md:hidden" style={{ background: 'linear-gradient(180deg, rgba(10,11,8,.86) 0%, rgba(10,11,8,.55) 55%, rgba(10,11,8,0) 100%)' }} />
            <div className="absolute grid max-w-[340px] gap-3 [text-shadow:0_2px_18px_rgba(10,11,8,.6)] max-md:right-[var(--gut-r)]" style={{ left: 'var(--gut-l)', top: 84 }}>
              <span className="label">Finish {String(PHONE_FINISHES.indexOf(fin) + 1).padStart(2, '0')} / 05</span>
              <span className="text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-none tracking-[-.035em]">{f.name}</span>
              <p className="m-0 text-mute">{f.desc}</p>
            </div>
            <div className="dock-bottom">
              <Chips label="Finish" value={fin} items={PHONE_FINISHES.map(k => ({ value: k, label: FINISHES[k].name, swatch: swatch(k) }))}
                onChange={chooseFinish} />
            </div>
          </>
        )}
      </ScrubSection>
    </section>
  );
}

/** 06 · Camera. Shot 14 starts on the whole phone and glides in to the camera plateau; shot 6 carries on into the
 *  periscope lens, prism and sensor. Then the 0.5×–25× zoom readout. */
export function Camera() {
  const [z, setZ] = useState(185);
  const zoom = 0.5 * Math.pow(50, z / 1000), mm = Math.round(24 * zoom);
  const lens = zoom < 1 ? `Ultra-wide · 48 MP · f/2.2 · ${mm} mm` : zoom < 5 ? `Main · 50 MP · f/1.6 · ${mm} mm` : zoom <= 5.05 ? 'Periscope · 48 MP · f/2.8 · 120 mm optical' : `Periscope + digital · ${mm} mm equivalent`;
  return (
    <section id="camera">
      <SectionIntro label="06 · Camera" line1="A 120 mm lens," line2="folded flat." instruction="Scroll to move in from the whole phone to the sensor. Then drag the zoom from 0.5× to 25×." />
      <ScrubSection length="340vh" label="Lens fly-in">
        {p => (
          <>
            <FrameSequence shots={[14, 6]} progress={p} />
            <Readouts items={p < 0.5 ? [['Distance', `${(0.6 - 0.52 * sm(0, 0.5, p)).toFixed(2)} m`], ['Lens', 'Main · 24 mm']] : [['Prism fold', '90°'], ['Sensor', '48 MP']]} />
            <div className="absolute left-1/2 grid w-[min(560px,calc(100%-32px))] -translate-x-1/2 gap-1.5 rounded-2xl border border-ink-line bg-ink-2/80 px-4 py-3 backdrop-blur-md"
              style={{ bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 50px)' }}>
              <div className="flex items-baseline justify-between gap-3 text-[.82rem] text-mute"><b className="text-[1.6rem] tabular-nums tracking-[-.02em] text-cream">{zoom < 10 ? zoom.toFixed(1) : Math.round(zoom)}×</b><span>{lens}</span></div>
              <input type="range" min={0} max={1000} value={z} onChange={e => setZ(+e.target.value)} aria-label="Zoom, 0.5× to 25×" className="w-full accent-[var(--a2)]" />
              <div className="flex justify-between text-[.72rem] text-mute"><span>0.5×</span><span>1×</span><span>5× optical</span><span>25×</span></div>
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
      <SectionIntro label="08 · Durability" line1="Six metres down." line2="Still on." instruction="Scroll to sink it." />
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
