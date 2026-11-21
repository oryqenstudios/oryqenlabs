import { useEffect, useRef, useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { placeSpatial, setSpatialMode, startSpatial, stopSpatial } from '../lib/spatial';
import { sm } from '../lib/math';

const BASE = import.meta.env.BASE_URL;
const SPECS = [
  'Stereo speakers, top and bottom, tuned as a pair',
  'Spatial audio with head tracking',
  'Bass that stays clean at full volume',
  'Four microphones: spatial recording and wind noise reduction',
  'Voice isolation on calls',
  'USB-C audio, lossless over the cable',
];

/** 08 · Sound. Shot 18: a bass note makes water droplets leap off the glass beside the speakers. Then the camera dives
 *  through the grille into the speaker and watches the bass in action, the grille up close, and a spatial audio demo:
 *  drag the sound around the phone and hear it move around you. */
export function Sound() {
  return (
    <section id="sound">
      <SectionIntro label="08 · Sound" line1="Small phone." line2="Big room." instruction="Scroll to drop the bass. Then put on headphones and move the sound around you." />
      <ScrubSection length="220vh" label="Speaker bass">
        {p => (
          <>
            <FrameSequence shots={[18]} progress={p} />
            <Readouts items={[['Bass', `${Math.round(38 + 22 * Math.sin(sm(0.15, 1, p) * Math.PI * 6) ** 2)} Hz`], ['Speakers', 'Stereo']]} />
          </>
        )}
      </ScrubSection>
      <ScrubSection length="320vh" label="Inside the speaker">
        {p => <SpeakerStage p={p} />}
      </ScrubSection>
      <SpatialDemo />
    </section>
  );
}

/** Shot 19 dives through the grille into the cut-away speaker; then shot 20, the bass in action, plays on with the scroll. */
const INSIDE = 0.55;
function SpeakerStage({ p }: { p: number }) {
  const inside = p >= INSIDE;
  // the bass plays forward with the scroll, once: the air only ever leaves the speaker
  const play = Math.min(1, Math.max(0, (p - INSIDE) / (0.95 - INSIDE)));
  const seq = inside ? 0.5 + 0.5 * play : (p / INSIDE) * 0.5;
  const excursion = inside ? (0.65 * Math.abs(Math.sin(play * Math.PI * 8))).toFixed(2) : '0.00';
  const caption = sm(INSIDE, INSIDE + 0.08, p);
  return (
    <>
      <FrameSequence shots={[19, 20]} progress={seq} />
      <Readouts items={inside ? [['Note', '40 Hz'], ['Diaphragm travel', `±${excursion} mm`]] : [['Into the grille', `${(1.6 * sm(0, INSIDE, p)).toFixed(1)} mm`], ['Hole', '0.4 mm']]} />
      <div className="pointer-events-none absolute grid max-w-[360px] gap-2 rounded-2xl border border-ink-line bg-ink/60 p-5 backdrop-blur-xl max-md:right-[var(--gut-r)]"
        style={{ left: 'var(--gut-l)', bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 40px)', opacity: caption, transform: `translateY(${(1 - caption) * 12}px)` }}>
        <span className="label">Inside the speaker · the bass, in action</span>
        <p className="m-0 text-[clamp(1.4rem,2.4vw,1.9rem)] font-bold leading-tight tracking-[-.025em]">A magnet, a coil and a diaphragm thinner than a hair.</p>
        <p className="m-0 text-mute">A neodymium magnet drives the copper voice coil, and the domed diaphragm pushes air out through the grille: deep notes you can feel.</p>
      </div>
    </>
  );
}

function SpatialDemo() {
  const [on, setOn] = useState(false);
  const [spatial, setSpatial] = useState(true);
  const [deg, setDeg] = useState(-60);
  const pad = useRef<HTMLDivElement>(null), card = useRef<HTMLDivElement>(null), dragging = useRef(false);

  useEffect(() => { placeSpatial(deg); }, [deg, on]);
  useEffect(() => { setSpatialMode(spatial); }, [spatial, on]);
  // leaving the section stops the music
  useEffect(() => {
    const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) { stopSpatial(); setOn(false); } });
    io.observe(card.current!); return () => { io.disconnect(); stopSpatial(); };
  }, []);

  const aim = (e: React.PointerEvent) => {
    const r = pad.current!.getBoundingClientRect();
    setDeg((Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI);
  };
  const toggle = () => { if (on) { stopSpatial(); setOn(false); } else if (startSpatial()) { setOn(true); placeSpatial(deg); setSpatialMode(spatial); } };
  const side = Math.abs(deg) < 15 ? 'Ahead' : Math.abs(deg) > 165 ? 'Behind' : `${deg > 0 ? 'Right' : 'Left'} ${Math.round(Math.abs(deg))}°`;
  const r = 42, x = 50 + Math.sin((deg * Math.PI) / 180) * r, y = 50 - Math.cos((deg * Math.PI) / 180) * r;

  return (
    <div ref={card} className="wrap grid gap-6 pb-[14vh] pt-[8vh] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch">
      <figure className="relative m-0 min-h-[260px] overflow-hidden rounded-[22px] border border-ink-line bg-[#050403]">
        <img src={`${BASE}frames/sound/grille.webp`} alt="The bottom edge of Crown Pro up close: two rows of precision-drilled speaker holes in brushed titanium either side of the USB-C port." loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        <figcaption className="absolute bottom-0 left-0 right-0 grid gap-1 bg-gradient-to-t from-ink/90 to-transparent p-5 pt-16">
          <span className="label">Speaker grille · drilled, not stamped</span>
          <span className="text-[1.3rem] font-bold tracking-[-.02em]">Every hole cut to the same 0.4 mm.</span>
        </figcaption>
      </figure>
      <div className="grid content-start gap-5 rounded-[22px] border border-ink-line bg-ink-2/70 p-6 backdrop-blur-md">
        <div className="grid gap-2">
          <span className="label">Spatial audio · try it</span>
          <h3 className="m-0 text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-[-.03em]">Put the sound <span className="grad">anywhere.</span></h3>
          <p className="m-0 text-mute">Play, then drag the dot around the phone. On headphones it moves around your head.</p>
        </div>
        <div ref={pad} role="slider" tabIndex={0} aria-label="Where the sound comes from" aria-valuemin={-180} aria-valuemax={180} aria-valuenow={Math.round(deg)} aria-valuetext={side}
          onKeyDown={e => { if (e.key === 'ArrowLeft') setDeg(d => d - 15); if (e.key === 'ArrowRight') setDeg(d => d + 15); }}
          onPointerDown={e => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); aim(e); }}
          onPointerMove={e => { if (dragging.current) aim(e); }} onPointerUp={() => { dragging.current = false; }}
          className="relative mx-auto aspect-square w-full max-w-[320px] cursor-grab touch-none rounded-full border border-ink-line bg-[radial-gradient(circle,rgba(243,241,230,.05),transparent_65%)]">
          {[0.28, 0.56, 0.84].map(s => <span key={s} aria-hidden="true" className="absolute rounded-full border border-ink-line" style={{ inset: `${(1 - s) * 50}%` }} />)}
          <img src={`${BASE}frames/sound/phone.webp`} alt="" aria-hidden="true" className="absolute left-1/2 top-1/2 h-[34%] -translate-x-1/2 -translate-y-1/2 rounded-[10%] shadow-[0_10px_30px_rgba(0,0,0,.6)]" />
          <span aria-hidden="true" className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream shadow-[0_0_0_6px_rgba(240,181,58,.18),0_0_24px_var(--a2)]"
            style={{ left: `${x}%`, top: `${y}%`, background: 'var(--a2)', animation: on ? 'pulse 1.2s ease-in-out infinite' : undefined }} />
          <span aria-hidden="true" className="absolute left-1/2 top-2 -translate-x-1/2 font-mono text-[.6rem] uppercase tracking-[.14em] text-mute">Ahead</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={toggle} aria-pressed={on} className="rounded-full px-5 py-2.5 font-semibold text-char" style={{ background: 'var(--grad)' }}>{on ? 'Pause' : 'Play'}</button>
          <span className="font-mono text-[.78rem] text-mute" aria-live="polite">{side}</span>
          <div className="chips flex gap-2" role="group" aria-label="Mix">
            <button type="button" className="chip" aria-pressed={spatial} onClick={() => setSpatial(true)}>Spatial</button>
            <button type="button" className="chip" aria-pressed={!spatial} onClick={() => setSpatial(false)}>Plain</button>
          </div>
        </div>
        <ul className="m-0 grid list-none gap-2 p-0 text-[.9rem]">{SPECS.map(s => <li key={s} className="border-t border-ink-line pt-2">{s}</li>)}</ul>
      </div>
    </div>
  );
}
