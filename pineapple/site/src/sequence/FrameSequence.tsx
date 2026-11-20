import { useEffect, useRef } from 'react';
import { SequencePlayer, type HudInfo } from './player';
import type { PaintOpts } from './placeholders';
import { pad } from '../lib/math';
import { SHOTS } from '../data/shots';

interface Props {
  shots: number[];
  /** Scroll progress through the sequence, 0–1. */
  progress: number;
  opts?: PaintOpts;
  /** CSS filter, used by "Recolour the burst". */
  filter?: string;
  hud?: boolean;
  className?: string;
}

/** Full-bleed canvas that scrubs an AI frame sequence. Text never goes in the canvas (plan §9). */
export function FrameSequence({ shots, progress, opts, filter, hud = true, className = '' }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const player = useRef<SequencePlayer | null>(null);
  const key = shots.join(',');

  useEffect(() => {
    const onFrame = ({ shot, frame, real }: HudInfo) => {
      const el = hudRef.current;
      if (!el) return;
      (el.children[1] as HTMLElement).textContent = `Shot ${pad(shot.id, 2)} · ${shot.title}`;
      (el.children[2] as HTMLElement).textContent = shot.id === 0 ? 'Still' : `Frame ${pad(frame + 1, 3)} / ${shot.frames}`;
      (el.children[0] as HTMLElement).hidden = real;
    };
    const p = new SequencePlayer(canvas.current!, shots, opts, onFrame);
    player.current = p;
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { p.start(); io.disconnect(); } }, { rootMargin: '150% 0px' });
    io.observe(canvas.current!);
    return () => { io.disconnect(); p.dispose(); player.current = null; };
    // opts are pushed separately below; the player is rebuilt only when the shot list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { player.current?.set(progress); }, [progress]);
  useEffect(() => { if (opts) player.current?.setOpts(opts); }, [opts?.fin, opts?.device]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <canvas ref={canvas} className={`absolute inset-0 block h-full w-full transition-[filter] duration-700 ease-brand ${className}`} style={{ filter }} aria-hidden="true" />
      <p className="sr-only">{shots.map(i => SHOTS[i].alt).join(' ')}</p>
      {hud && (
        <div ref={hudRef} className="hud" aria-hidden="true">
          <span className="slot">AI sequence slot</span>
          <span />
          <span className="tabular-nums" />
        </div>
      )}
    </>
  );
}
