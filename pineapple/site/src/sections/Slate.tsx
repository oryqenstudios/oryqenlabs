import { useEffect, useRef, useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Chips } from '../components/Chips';
import { mix } from '../sequence/placeholders';
import { sm } from '../lib/math';

const INKS = [
  { value: 'ripen', label: 'Ripen', swatch: 'linear-gradient(90deg,#6fa43f,#f0b53a)' },
  { value: '#f0cf6a', label: 'Golden Flesh', swatch: '#f0cf6a' },
  { value: '#5f9a45', label: 'Crown Green', swatch: '#5f9a45' },
  { value: '#efe6c8', label: 'Core', swatch: '#efe6c8' },
  { value: '#ef6f8a', label: 'Guava', swatch: '#ef6f8a' },
];

/** 09 · Slate Pro. Shot 10 (edge turn), then visitors draw on the screen with the Quill. */
export function Slate() {
  return (
    <section id="slate">
      <SectionIntro label="09 · Slate Pro" line1="Thirteen inches." line2="5.1 mm thin." instruction="Scroll to turn it edge-on. Then draw on it with the Quill." />
      <ScrubSection length="220vh" label="Slate Pro edge turn">
        {p => (
          <>
            <FrameSequence shots={[10]} progress={p} />
            <Readouts items={[['Profile', `${Math.max(5.1, 215.5 * Math.cos(sm(0, 0.75, p) * Math.PI / 2)).toFixed(1)} mm`]]} />
          </>
        )}
      </ScrubSection>
      <QuillPad />
    </section>
  );
}

function QuillPad() {
  const c = useRef<HTMLCanvasElement>(null);
  const [ink, setInk] = useState('ripen');
  const [drawn, setDrawn] = useState(false);
  const inkRef = useRef(ink); inkRef.current = ink;
  useEffect(() => {
    const cv = c.current!, g = cv.getContext('2d')!;
    let last: { x: number; y: number; p: number; tilt: number } | null = null;
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect(); if (!r.width) return; const img = cv.width ? g.getImageData(0, 0, cv.width, cv.height) : null; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); if (img) g.putImageData(img, 0, 0); };
    const ro = new ResizeObserver(size); ro.observe(cv);
    const pt = (e: PointerEvent) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return { x: (e.clientX - r.left) * d, y: (e.clientY - r.top) * d, p: e.pointerType !== 'mouse' && e.pressure ? e.pressure : 0.5, tilt: Math.hypot(e.tiltX || 0, e.tiltY || 0) }; };
    const down = (e: PointerEvent) => { cv.setPointerCapture(e.pointerId); last = pt(e); setDrawn(true); };
    const move = (e: PointerEvent) => {
      if (!last) return;
      for (const ev of e.getCoalescedEvents?.() ?? [e]) {
        const p = pt(ev), k = inkRef.current;
        g.strokeStyle = k === 'ripen' ? mix('#6fa43f', '#f0b53a', (Math.sin(performance.now() / 600) + 1) / 2) : k;
        g.lineWidth = (1.2 + p.p * 9 + p.tilt * 0.06) * Math.min(devicePixelRatio || 1, 2); g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); last = p;
      }
    };
    const up = () => { last = null; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    return () => { ro.disconnect(); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
  }, []);
  const clear = () => { const cv = c.current!; cv.getContext('2d')!.clearRect(0, 0, cv.width, cv.height); setDrawn(false); };
  return (
    <div className="wrap pb-[16vh] pt-[6vh]">
      <div className="relative mx-auto aspect-[281.6/215.5] max-w-[900px] touch-none overflow-hidden rounded-[28px] border-[10px] border-[#22251d] bg-[#050605] shadow-[0_40px_90px_rgba(0,0,0,.55)]">
        <canvas ref={c} className="absolute inset-0 h-full w-full cursor-crosshair" aria-label="Drawing surface" />
        <div className={`pointer-events-none absolute inset-0 grid place-items-center text-[.95rem] text-mute transition-opacity duration-500 ease-brand ${drawn ? 'opacity-0' : ''}`}>Draw here. Press harder for a heavier line.</div>
      </div>
      <div className="mt-[18px] flex flex-wrap justify-center gap-2">
        <Chips label="Ink colour" value={ink} onChange={setInk} items={INKS} />
        <button type="button" className="chip" onClick={clear}>Clear</button>
      </div>
    </div>
  );
}
