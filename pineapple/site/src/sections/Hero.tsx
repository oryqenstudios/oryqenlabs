import { useMemo } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { LogoButton } from '../components/LogoButton';
import { Droplets } from '../components/Droplets';
import { Chips } from '../components/Chips';
import { FINISHES, PHONE_FINISHES, swatch } from '../data/finishes';
import { chooseFinish, useFinish } from '../lib/finish';
import { clamp, sm } from '../lib/math';

/** The footage eases back as the splash grows (the phone goes from 81% to 60% of the frame's height, measured across
 *  the five takes). Counter-scaling by this curve keeps the phone one size from the first frame to the last. */
const HOLD: [number, number][] = [[0, 0.864], [0.4, 0.959], [0.55, 1], [0.65, 1.05], [0.75, 1.08], [0.85, 1.129], [1, 1.167]];
function hold(t: number) {
  for (let i = 1; i < HOLD.length; i++) {
    const [t1, s1] = HOLD[i], [t0, s0] = HOLD[i - 1];
    if (t <= t1) return s0 + ((t - t0) / (t1 - t0)) * (s1 - s0);
  }
  return HOLD[HOLD.length - 1][1];
}

/**
 * 01 · Crown Pro. Shot 1, one take per finish: the whole phone turns from its screen to its back while a splash in
 * the colours of the chosen finish erupts and floods the screen. The phone holds one size throughout; the title sits
 * beside it (above it on phones) and steps aside as you scroll; the peak holds with a caption. The finish chosen here
 * carries through the page.
 */
export function Hero() {
  const fin = useFinish();
  const opts = useMemo(() => ({ fin }), [fin]);
  const name = FINISHES[fin].name;
  return (
    <ScrubSection id="drop" length="300vh" label="Crown Pro">
      {p => {
        const seq = clamp((p - 0.03) / 0.79, 0, 1); // the turn and the splash
        const sc = hold(seq);
        const title = 1 - sm(0.02, 0.12, p);
        const peak = sm(0.8, 0.9, p);
        return (
          <>
            <div className="absolute inset-0" style={{ transform: `scale(${sc})`, transformOrigin: '50% 50.5%' }}>
              <FrameSequence shots={[1]} progress={seq} opts={opts} />
              {/* while the footage is drawn slightly smaller than the screen, its edges melt into the page */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 12vmin 3vmin #0a0b08', opacity: clamp((1 - sc) / 0.136, 0, 1) }} />
            </div>
            <Droplets />
            {/* phones: the phone fills the width, so the title gets a scrim */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[52%] md:hidden" style={{ opacity: title, background: 'linear-gradient(180deg, rgba(10,11,8,.9), rgba(10,11,8,.55) 60%, rgba(10,11,8,0))' }} />
            <div className="pointer-events-none absolute inset-0 grid content-start justify-items-center gap-2 text-center [text-shadow:0_2px_24px_rgba(10,11,8,.55)] md:content-center md:justify-items-start md:text-left"
              style={{ paddingTop: 'clamp(62px,8.5vh,96px)', paddingLeft: 'var(--gut-l)', paddingRight: 'var(--gut-r)', opacity: title, transform: `translateY(${-(1 - title) * 24}px)`, visibility: title <= 0 ? 'hidden' : undefined }}>
              <LogoButton id="hero-logo" className="pointer-events-auto h-11 w-11" label="PINEAPPLE logo. Click to burst it; press and hold to charge a bigger burst." />
              <p className="label">01 · Crown Pro</p>
              <h1 className="m-0 text-[clamp(2.6rem,5.6vw,6rem)] font-extrabold leading-[.92] tracking-[-.05em]">PINEAPPLE<br className="max-md:hidden" /> <span className="grad pr-[.04em]">Crown</span></h1>
              <p className="m-0 text-[clamp(1.1rem,1.8vw,1.5rem)] font-semibold tracking-[-.02em]">Designed by <span className="font-serif font-normal italic tracking-normal">nature’s math.</span></p>
              <p className="m-0 text-[.9rem] text-mute">Pick a finish. Then scroll to spin it.</p>
            </div>
            <div style={{ opacity: sm(0.1, 0.18, p) }}>
              <Readouts className="max-md:!top-auto max-md:bottom-[150px]" items={[['Turn', `${Math.round(540 * sm(0.04, 0.8, p))}°`], ['Finish', `${String(PHONE_FINISHES.indexOf(fin) + 1).padStart(2, '0')} / 05`]]} />
            </div>
            {/* the peak's caption: beside the phone where the title was, or above the chips on phones */}
            <p aria-hidden="true" className="pointer-events-none absolute top-1/2 m-0 max-w-[30vw] -translate-y-1/2 text-[clamp(1.6rem,3.6vw,3.2rem)] font-bold leading-[1.02] tracking-[-.035em] [text-shadow:0_2px_6px_rgba(10,11,8,.55),0_4px_40px_rgba(10,11,8,.9)] max-md:hidden"
              style={{ left: 'var(--gut-l)', opacity: peak }}>This is <span className="font-serif font-normal italic tracking-normal">{name}</span>.</p>
            <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 m-0 text-center text-[1.6rem] font-bold tracking-[-.03em] [text-shadow:0_2px_6px_rgba(10,11,8,.55),0_4px_40px_rgba(10,11,8,.9)] md:hidden"
              style={{ bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 108px)', opacity: peak }}>This is <span className="font-serif font-normal italic tracking-normal">{name}</span>.</p>
            <div className="dock-bottom">
              <Chips label="Finish" value={fin} items={PHONE_FINISHES.map(f => ({ value: f, label: FINISHES[f].name, swatch: swatch(f) }))} onChange={chooseFinish} />
            </div>
          </>
        );
      }}
    </ScrubSection>
  );
}
