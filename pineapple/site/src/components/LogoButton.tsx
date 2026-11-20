import { useRef } from 'react';
import { Logo } from './Logo';
import { burst } from '../lib/burst';

interface Props { id?: string; className?: string; small?: boolean; label: string; onActivate?: () => void; children?: React.ReactNode }

/**
 * A logo you can burst (plan §6). Click bursts from the click point; press and hold to charge
 * a bigger burst (the logo trembles and glows); five quick clicks give the rare all-gold burst.
 * The small nav logo does a tiny burst and still runs `onActivate` (scroll to top).
 */
export function LogoButton({ id, className = '', small = false, label, onActivate, children }: Props) {
  const svg = useRef<SVGSVGElement | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const t0 = useRef(0), timer = useRef<number>();
  const fire = (x: number, y: number) => {
    const held = t0.current ? (performance.now() - t0.current) / 1000 : 0;
    t0.current = 0; clearTimeout(timer.current); btn.current?.classList.remove('charging');
    burst({ el: svg.current, x, y, small, power: small ? 0.5 : 1 + Math.min(held, 1.4) * 1.4 });
    onActivate?.();
  };
  return (
    <button ref={btn} id={id} type="button" aria-label={label} className={`logo-btn ${className}`}
      onPointerDown={() => { if (small) return; t0.current = performance.now(); timer.current = window.setTimeout(() => btn.current?.classList.add('charging'), 220); }}
      onPointerLeave={() => { clearTimeout(timer.current); btn.current?.classList.remove('charging'); t0.current = 0; }}
      onClick={e => {
        const r = btn.current!.getBoundingClientRect();
        // keyboard activation has no pointer position: burst from the centre
        fire(e.detail === 0 ? r.left + r.width / 2 : e.clientX, e.detail === 0 ? r.top + r.height / 2 : e.clientY);
      }}>
      <span ref={el => { svg.current = (el?.firstElementChild as SVGSVGElement) ?? null; }} className="contents"><Logo className={small ? 'h-[22px] w-[22px]' : 'h-full w-full'} /></span>
      {children}
    </button>
  );
}
