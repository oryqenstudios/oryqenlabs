import { ScrubSection } from '../components/ScrubSection';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { LogoButton } from '../components/LogoButton';
import { Droplets } from '../components/Droplets';
import { sm } from '../lib/math';

/** 01 · The drop. Shots 1–2: a juice drop hits the camera plateau while the counter rises, then erupts. */
export function Hero() {
  return (
    <ScrubSection id="drop" length="250vh" label="Crown Pro">
      {p => (
        <>
          <FrameSequence shots={[1, 2]} progress={p} />
          <Droplets />
          <div className="pointer-events-none absolute inset-0 grid content-start justify-items-center gap-2.5 text-center"
            style={{ paddingTop: 'clamp(70px,13vh,140px)', paddingLeft: 'var(--gut-l)', paddingRight: 'var(--gut-r)' }}>
            <LogoButton id="hero-logo" className="pointer-events-auto h-16 w-16" label="PINEAPPLE logo. Click to burst it; press and hold to charge a bigger burst." />
            <p className="label">01 · The drop</p>
            <h1 className="m-0 text-[clamp(3rem,10.5vw,8.6rem)] font-extrabold leading-[.92] tracking-[-.05em]">PINEAPPLE <span className="grad pr-[.04em]">Crown</span></h1>
            <p className="m-0 mt-1.5 text-[clamp(1.25rem,2.6vw,1.9rem)] font-semibold tracking-[-.02em]">Designed by <span className="font-serif font-normal italic tracking-normal">nature’s math.</span></p>
            <p className="m-0 text-[.95rem] text-mute">Scroll to drop the juice.</p>
          </div>
          <Readouts className="max-md:!top-auto max-md:bottom-[84px]" items={[['Sugar', `${(14.2 * sm(0, 0.45, p)).toFixed(1)} °Bx`]]} />
        </>
      )}
    </ScrubSection>
  );
}
