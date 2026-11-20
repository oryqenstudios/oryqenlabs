import { useMemo } from 'react';
import type { FinishKey } from '../data/finishes';
import { ScrubSection } from '../components/ScrubSection';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { LogoButton } from '../components/LogoButton';
import { Droplets } from '../components/Droplets';
import { Chips } from '../components/Chips';
import { FINISHES, PHONE_FINISHES, swatch } from '../data/finishes';
import { chooseFinish } from '../lib/finish';
import { scrollToTarget } from '../lib/scroll';
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
 * 01 · Crown Pro. Shot 1, one take per finish, all five in one scroll: for each finish the whole phone turns from its
 * screen to its back while a splash in that finish's colours floods the screen, the peak holds with a caption, then
 * dissolves into the next finish. The phone holds one size throughout; the title sits beside it (above it on phones) and
 * steps aside as you scroll. Two players take turns so the next finish is loaded before you reach it.
 */
const N = PHONE_FINISHES.length;
const SPIN = 0.8, PEAK = 0.9; // within each finish: the turn and splash, then the held peak, then the dissolve
const VH_PER_FINISH = 165;
const FEATHER = 'radial-gradient(ellipse 34% 52% at 50% 50.5%, #000 62%, transparent 100%)';

export function Hero() {
  return (
    <ScrubSection id="drop" length={`${100 + N * VH_PER_FINISH}vh`} label="Crown Pro">
      {p => <HeroStage p={p} />}
    </ScrubSection>
  );
}

function HeroStage({ p }: { p: number }) {
  const g = p * N, seg = Math.min(N - 1, Math.floor(g)), t = g - seg; // which finish, and how far through it
  const fin = PHONE_FINISHES[seg], name = FINISHES[fin].name;
  const dissolve = seg < N - 1 ? sm(PEAK, 1, t) : 0;
  // player A shows finishes 0, 2, 4 and player B 1, 3; the idle one waits on the next finish's first frame
  const finA = PHONE_FINISHES[seg % 2 === 0 ? seg : Math.min(N - 1, seg + 1)];
  const finB = PHONE_FINISHES[seg % 2 === 1 ? seg : Math.min(N - 1, seg + 1)];
  const optsA = useMemo(() => ({ fin: finA }), [finA]), optsB = useMemo(() => ({ fin: finB }), [finB]);
  const seq = clamp((t - 0.03) / (SPIN - 0.03), 0, 1);
  const title = seg === 0 ? 1 - sm(0.02, 0.12, t) : 0;
  const peak = sm(SPIN, SPIN + 0.06, t) * (1 - dissolve);
  const layer = (key: string, mine: boolean, f: FinishKey, opts: { fin: FinishKey }) => {
    const s = mine ? seq : 0, sc = hold(s);
    return (
      <div key={key} className="absolute inset-0" aria-hidden={!mine} data-finish={f}
        style={{
          transform: `scale(${sc})`, transformOrigin: '50% 50.5%', zIndex: mine ? 0 : 1,
          opacity: mine ? 1 - 0.55 * dissolve : dissolve, visibility: mine || dissolve > 0 ? 'visible' : 'hidden',
          // the incoming phone emerges from the splash: its dark surround is feathered away while it dissolves in
          ...(mine ? {} : { maskImage: FEATHER, WebkitMaskImage: FEATHER }),
        }}>
        <FrameSequence shots={[1]} progress={s} opts={opts} hud={mine} />
        {/* while the footage is drawn slightly smaller than the screen, its edges melt into the page */}
        {mine && <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 12vmin 3vmin #0a0b08', opacity: clamp((1 - sc) / 0.136, 0, 1) }} />}
      </div>
    );
  };
  const jump = (k: FinishKey) => {
    chooseFinish(k);
    const el = document.getElementById('drop'); if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY, span = el.offsetHeight - innerHeight;
    scrollToTarget(top + span * ((PHONE_FINISHES.indexOf(k) + 0.04) / N));
  };
  const even = seg % 2 === 0;
  return (
    <>
      {/* the next finish's player sits on top while it dissolves in; the order never changes, so neither reloads */}
      <div className="absolute inset-0 isolate">{layer('a', even, finA, optsA)}{layer('b', !even, finB, optsB)}</div>
      <Droplets />
      {/* phones: the phone fills the width, so the title gets a scrim */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[52%] md:hidden" style={{ opacity: title, background: 'linear-gradient(180deg, rgba(10,11,8,.9), rgba(10,11,8,.55) 60%, rgba(10,11,8,0))' }} />
      <div className="pointer-events-none absolute inset-0 grid content-start justify-items-center gap-2 text-center [text-shadow:0_2px_24px_rgba(10,11,8,.55)] md:content-center md:justify-items-start md:text-left"
        style={{ paddingTop: 'clamp(62px,8.5vh,96px)', paddingLeft: 'var(--gut-l)', paddingRight: 'var(--gut-r)', opacity: title, transform: `translateY(${-(1 - title) * 24}px)`, visibility: title <= 0 ? 'hidden' : undefined }}>
        <LogoButton id="hero-logo" className="pointer-events-auto h-11 w-11" label="PINEAPPLE logo. Click to burst it; press and hold to charge a bigger burst." />
        <p className="label">01 · Crown Pro</p>
        <h1 className="m-0 text-[clamp(2.6rem,5.6vw,6rem)] font-extrabold leading-[.92] tracking-[-.05em]">PINEAPPLE<br className="max-md:hidden" /> <span className="grad pr-[.04em]">Crown</span></h1>
        <p className="m-0 text-[clamp(1.1rem,1.8vw,1.5rem)] font-semibold tracking-[-.02em]">Designed by <span className="font-serif font-normal italic tracking-normal">nature’s math.</span></p>
        <p className="m-0 text-[.9rem] text-mute">Scroll to spin it through all five finishes.</p>
      </div>
      <div style={{ opacity: seg === 0 ? sm(0.1, 0.18, t) : 1 }}>
        <Readouts className="max-md:!top-auto max-md:bottom-[150px]" items={[['Turn', `${Math.round(540 * sm(0.04, SPIN, t))}°`], ['Finish', `${String(seg + 1).padStart(2, '0')} / 05`]]} />
      </div>
      {/* the peak's caption: beside the phone where the title was, or above the chips on phones */}
      <p aria-hidden="true" className="pointer-events-none absolute top-1/2 m-0 max-w-[30vw] -translate-y-1/2 text-[clamp(1.6rem,3.6vw,3.2rem)] font-bold leading-[1.02] tracking-[-.035em] [text-shadow:0_2px_6px_rgba(10,11,8,.55),0_4px_40px_rgba(10,11,8,.9)] max-md:hidden"
        style={{ left: 'var(--gut-l)', opacity: peak }}>This is <span className="font-serif font-normal italic tracking-normal">{name}</span>.</p>
      <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 m-0 text-center text-[1.6rem] font-bold tracking-[-.03em] [text-shadow:0_2px_6px_rgba(10,11,8,.55),0_4px_40px_rgba(10,11,8,.9)] md:hidden"
        style={{ bottom: 'calc(max(18px, env(safe-area-inset-bottom, 0px)) + 108px)', opacity: peak }}>This is <span className="font-serif font-normal italic tracking-normal">{name}</span>.</p>
      <p className="sr-only" aria-live="polite">{`Finish ${seg + 1} of 5: ${name}`}</p>
      <div className="dock-bottom">
        <Chips label="Finish" value={fin} items={PHONE_FINISHES.map(f => ({ value: f, label: FINISHES[f].name, swatch: swatch(f) }))} onChange={jump} />
      </div>
    </>
  );
}
