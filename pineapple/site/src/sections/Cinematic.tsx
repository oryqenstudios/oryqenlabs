import { useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Chips } from '../components/Chips';
import { FINISHES, PHONE_FINISHES, swatch, type FinishKey } from '../data/finishes';
import { setAccent } from '../lib/tokens';
import { pad, sm } from '../lib/math';
import { inspect } from '../lib/events';
import { DeviceAnchor } from '../components/DeviceAnchor';

/** 02 · Frozen. Shot 3, with "Recolour the burst": a filter on the frames; the page accent follows. */
const PALETTES = [
  { value: 'orig', label: 'Original', swatch: 'linear-gradient(90deg,#6fa43f,#f0b53a)', filter: '', accent: ['#6fa43f', '#f0b53a'] },
  { value: 'rind', label: 'Rind', swatch: '#6b5a36', filter: 'sepia(.55) saturate(1.2) brightness(.82)', accent: FINISHES.rind.accent },
  { value: 'golden', label: 'Golden Flesh', swatch: '#f0cf6a', filter: 'hue-rotate(12deg) saturate(1.45) brightness(1.08)', accent: FINISHES.golden.accent },
  { value: 'green', label: 'Crown Green', swatch: '#3f6b3a', filter: 'hue-rotate(58deg) saturate(1.15)', accent: FINISHES.green.accent },
  { value: 'core', label: 'Core', swatch: '#efe6c8', filter: 'saturate(.3) brightness(1.18)', accent: FINISHES.core.accent },
  { value: 'mono', label: 'Mono', swatch: '#9a9a90', filter: 'grayscale(1)', accent: ['#8b8b82', '#e8e6dc'] },
] as const;
type PaletteKey = (typeof PALETTES)[number]['value'];

export function Frozen() {
  const [pal, setPal] = useState<PaletteKey>('orig');
  const cur = PALETTES.find(x => x.value === pal)!;
  return (
    <section id="frozen">
      <SectionIntro label="02 · Frozen" line1="Time stops" line2="at the peak." instruction="Scroll to circle it. Then repaint it." />
      <ScrubSection length="280vh" label="Frozen orbit">
        {p => (
          <>
            <FrameSequence shots={[3]} progress={p} filter={cur.filter || undefined} />
            <Readouts items={[['Orbit', `${Math.round(p * 359)}°`], ['Shutter', '1/10k s']]} />
            <div className="dock-bottom">
              <Chips label="Recolour the burst" value={pal} items={PALETTES.map(({ value, label, swatch }) => ({ value, label, swatch }))}
                onChange={v => { setPal(v); const a = PALETTES.find(x => x.value === v)!.accent; setAccent(a[0], a[1]); }} />
            </div>
          </>
        )}
      </ScrubSection>
    </section>
  );
}

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
      <DesignLive />
    </section>
  );
}

/** Live 3D: the phone turns through its signature details as you scroll; drag to spin it, and a light follows the cursor. */
const DETAILS = [
  { title: 'One scale, three lenses.', body: 'The camera plateau is a single rounded-hexagon scale, 1.8 mm high, with its lenses set in a triangle.', layer: 'camera' },
  { title: 'A key shaped like a leaf.', body: 'The Crown Key has a tactile ridge and two stages: a light press focuses, a full press acts. The rails carry a 0.2 mm rind texture.', layer: 'frame' },
  { title: 'Rings, like a slice.', body: 'The Solaris display opens on the radial rings of a sliced pineapple, at up to 3,000 nits.', layer: 'display' },
];
function DesignLive() {
  return (
    <ScrubSection length="260vh" label="Design details in 3D" live>
      {p => {
        // Scroll is the timing: hold each view while its caption is up, turn between them.
        // back three-quarter (plateau) → right side (Crown Key, rind rail) → front three-quarter (display)
        const y = Math.PI - 0.5 + sm(0.2, 0.4, p) * (Math.PI / 2 + 0.15) + sm(0.62, 0.8, p) * (Math.PI / 2 + 0.1);
        const i = p < 0.3 ? 0 : p < 0.71 ? 1 : 2, d = DETAILS[i];
        return (
          <>
            <DeviceAnchor id="design" className="absolute inset-x-0 top-[9%] mx-auto h-[56%] max-w-[900px] md:top-[10%] md:h-[78%]" label="Crown Pro in Ripen. Drag to spin it."
              spec={{ device: 'phone', finish: 'ripen', rot: [0.14, y], fill: 0.86, interactive: true, cursorLight: true }}
              fallback={<FrameSequence shots={[0]} progress={0.5} hud={false} />} />
            <div className="pointer-events-none absolute grid max-w-[330px] gap-2 max-md:bottom-[96px] max-md:right-[var(--gut-r)] md:top-1/2 md:-translate-y-1/2" style={{ left: 'var(--gut-l)' }}>
              <span className="label">{['01', '02', '03'][i]} / 03 · Drag to spin</span>
              <p className="m-0 text-[clamp(1.5rem,2.6vw,2.1rem)] font-bold leading-tight tracking-[-.025em]">{d.title}</p>
              <p className="m-0 text-mute">{d.body}</p>
            </div>
            <div className="dock-bottom"><button type="button" className="chip" onClick={() => inspect('phone', d.layer)}>Open this layer in the breakdown</button></div>
          </>
        );
      }}
    </ScrubSection>
  );
}

/** 04 · Finish. Master stills (shot 0) per finish; Ripen turns from green to gold as you scroll. */
export function Finish() {
  const [fin, setFin] = useState<FinishKey>('ripen');
  const f = FINISHES[fin];
  return (
    <section id="finish">
      <SectionIntro label="04 · Finish" line1="Five finishes." line2="One ripens." instruction="Pick a finish. Scroll to tilt it, and watch Ripen turn from green to gold." />
      <ScrubSection length="220vh" label="Finish picker" live>
        {p => (
          <>
            <DeviceAnchor id="finish" className="absolute inset-x-0 top-[30%] mx-auto h-[54%] max-w-[700px] md:top-[12%] md:h-[70%]" label={`Crown Pro in ${f.name}`}
              spec={{ device: 'phone', finish: fin, rot: [0.08, Math.PI + p * (Math.PI / 3)], fill: 0.9 }}
              fallback={<FrameSequence shots={[0]} progress={p} opts={{ fin }} hud={false} />} />
            <div className="absolute grid max-w-[340px] gap-3 max-md:right-[var(--gut-r)]" style={{ left: 'var(--gut-l)', top: 84 }}>
              <span className="label">Viewing angle {Math.round(p * 60)}°</span>
              <span className="text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-none tracking-[-.035em]">{f.name}</span>
              <p className="m-0 text-mute">{f.desc}</p>
            </div>
            <div className="dock-bottom">
              <Chips label="Finish" value={fin} items={PHONE_FINISHES.map(k => ({ value: k, label: FINISHES[k].name, swatch: swatch(k) }))}
                onChange={k => { setFin(k); setAccent(...FINISHES[k].accent); }} />
            </div>
          </>
        )}
      </ScrubSection>
    </section>
  );
}

/** 06 · Camera. Shot 6, then the 0.5×–25× zoom readout. */
export function Camera() {
  const [z, setZ] = useState(185);
  const zoom = 0.5 * Math.pow(50, z / 1000), mm = Math.round(24 * zoom);
  const lens = zoom < 1 ? `Ultra-wide · 48 MP · f/2.2 · ${mm} mm` : zoom < 5 ? `Main · 50 MP · f/1.6 · ${mm} mm` : zoom <= 5.05 ? 'Periscope · 48 MP · f/2.8 · 120 mm optical' : `Periscope + digital · ${mm} mm equivalent`;
  return (
    <section id="camera">
      <SectionIntro label="06 · Camera" line1="A 120 mm lens," line2="folded flat." instruction="Scroll to fly into the lens. Then drag the zoom from 0.5× to 25×." />
      <ScrubSection length="220vh" label="Lens fly-in">
        {p => (
          <>
            <FrameSequence shots={[6]} progress={p} />
            <Readouts items={[['Prism fold', '90°'], ['Sensor', '48 MP']]} />
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
