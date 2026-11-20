import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { gsap } from '../lib/scroll';
import { EASE_GSAP, reducedMotion } from '../lib/tokens';

interface Props {
  /** "01 · The drop" */
  label: string;
  /** Two lines; the last word of `line2` is set in the Ripen gradient. */
  line1: string;
  line2: string;
  /** One line telling the visitor what to do. */
  instruction: ReactNode;
  tone?: 'dark' | 'light';
}

/** The section pattern (plan §5): numbered mono label, two-line headline with gradient last word, one instruction. */
export function SectionIntro({ label, line1, line2, instruction, tone = 'dark' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = line2.split(' ');
  const last = words.pop();
  useLayoutEffect(() => {
    if (reducedMotion() || !ref.current) return;
    // Tied to scroll position, not autoplay. Movement only: the text is fully legible at every point.
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current!.children, { y: 36 }, { y: 0, ease: EASE_GSAP, stagger: 0.08, scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'top 35%', scrub: true } });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <header ref={ref} className="wrap grid min-h-[72vh] content-center gap-[18px] pb-[12vh] pt-[18vh]">
      <p className="label">{label}</p>
      <h2 className="m-0 text-[clamp(2.6rem,7vw,5.6rem)] font-bold leading-[1.02] tracking-[-.035em] [text-wrap:balance]">
        {line1}<br />{words.join(' ')}{words.length ? ' ' : ''}<span className="grad">{last}</span>
      </h2>
      <p className={`m-0 text-[1.05rem] ${tone === 'light' ? 'text-mute-light' : 'text-mute'}`}>{instruction}</p>
    </header>
  );
}
