import { useEffect, useRef, useState } from 'react';
import { BODY, LEAVES } from './Logo';
import { ease, reducedMotion } from '../lib/tokens';
import { burst } from '../lib/burst';
import { clamp, lerp, pad } from '../lib/math';

/** Section 0: the crown leaves unfurl as the progress indicator. */
export function Loader({ ready }: { ready: boolean }) {
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setP(v => (ready ? Math.min(1, v + 0.12) : Math.min(0.85, v + 0.05))), 80);
    return () => clearInterval(id);
  }, [ready]);
  const mark = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (p < 1) return;
    const t = setTimeout(() => {
      // the loading logo bursts and its scales rebuild as the hero logo
      const hero = document.querySelector('#hero-logo svg'), r = mark.current?.getBoundingClientRect();
      if (hero && r && !reducedMotion()) burst({ el: hero, start: { left: r.left, top: r.top, width: r.width }, x: r.left + r.width / 2, y: r.top + r.height * 0.7, power: 0.8 });
      setDone(true);
    }, 420);
    return () => clearTimeout(t);
  }, [p]);
  const rots = [0, 38, -38];
  return (
    <div role="status" aria-label="Loading" aria-hidden={done}
      className={`fixed inset-0 z-[90] grid place-items-center bg-ink transition-[opacity,visibility] duration-[900ms] ease-brand ${done ? 'invisible opacity-0' : ''}`}>
      <div className="grid justify-items-center gap-3.5">
        <svg ref={mark} viewBox="0 0 64 64" className="h-[92px] w-[92px] overflow-visible" aria-hidden="true">
          {LEAVES.map((d, i) => {
            const u = ease(clamp(p * 1.3 - i * 0.12, 0, 1));
            return <path key={i} d={d} fill="#6fa43f" style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `rotate(${rots[i] * (1 - u)}deg) scaleY(${lerp(0.15, 1, u)})` }} />;
          })}
          <path d={BODY} fill="#e2b13b" />
        </svg>
        <div className="font-mono text-[.7rem] tabular-nums tracking-[.14em] text-mute">{pad(Math.round(p * 100), 3)}%</div>
      </div>
    </div>
  );
}
