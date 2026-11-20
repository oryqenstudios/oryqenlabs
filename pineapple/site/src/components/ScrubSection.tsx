import { useRef, type ReactNode } from 'react';
import { useScrubProgress } from '../lib/scroll';

interface Props {
  id?: string;
  /** Scroll length of the section, e.g. "250vh". The stage stays pinned for (length − 100vh). */
  length: string;
  label: string;
  className?: string;
  /** Hosts the live 3D device: UI renders above the canvas, the background below it. */
  live?: boolean;
  children: (progress: number) => ReactNode;
}

/** A tall section with a sticky full-screen stage; children get the 0–1 scroll progress. */
export function ScrubSection({ id, length, label, className = '', live = false, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const p = useScrubProgress(ref);
  return (
    <section ref={ref} id={id} className={`scrub ${className}`} style={{ height: length }} aria-label={label}>
      {live ? <><div className="pin" aria-hidden="true" /><div className="pin-over">{children(p)}</div></> : <div className="pin">{children(p)}</div>}
    </section>
  );
}
