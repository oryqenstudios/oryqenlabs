import { useEffect, useRef, useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Chips } from '../components/Chips';
import { mix } from '../sequence/placeholders';
import { coverRect } from '../sequence/player';
import { SHOTS } from '../data/shots';
import { clamp, sm } from '../lib/math';

const INKS = [
  { value: 'ripen', label: 'Ripen', swatch: 'linear-gradient(90deg,#6fa43f,#f0b53a)' },
  { value: '#f0cf6a', label: 'Golden Flesh', swatch: '#f0cf6a' },
  { value: '#5f9a45', label: 'Crown Green', swatch: '#5f9a45' },
  { value: '#efe6c8', label: 'Core', swatch: '#efe6c8' },
  { value: '#ef6f8a', label: 'Guava', swatch: '#ef6f8a' },
];

/** 09 · Slate Pro. Shot 10 (edge turn). Then shot 17 lays the tablet down flat under the camera, and visitors draw on
 *  its screen with the Quill: the drawing surface sits exactly over the screen in the photograph. */
export function Slate() {
  return (
    <section id="slate">
      <SectionIntro label="10 · Slate Pro" line1="Thirteen inches." line2="5.1 mm thin." instruction="Scroll to turn it edge-on and lay it down. Then draw on its screen." />
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

/** The screen of the tablet in shot 17's last frame (0–1 of the frame: left, top, right, bottom). */
const SCREEN = [0.235, 0.108, 0.771, 0.881] as const;
const LIVE = 0.5;

function QuillPad() {
  return (
    <ScrubSection length="260vh" label="Draw on Slate Pro">
      {p => <PadStage p={p} />}
    </ScrubSection>
  );
}

function PadStage({ p }: { p: number }) {
  const c = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState('ripen');
  const [drawn, setDrawn] = useState(false);
  const [size, setSize] = useState({ w: 16, h: 9 });
  const inkRef = useRef(ink); inkRef.current = ink;
  const live = p >= LIVE;
  const liveRef = useRef(live); liveRef.current = live;
  useEffect(() => {
    const el = stage.current!; const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const cv = c.current!, g = cv.getContext('2d')!;
    let last: { x: number; y: number; p: number; tilt: number } | null = null;
    const size = () => { const d = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect(); if (!r.width) return; const img = cv.width ? g.getImageData(0, 0, cv.width, cv.height) : null; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); if (img) g.putImageData(img, 0, 0); };
    const ro = new ResizeObserver(size); ro.observe(cv);
    const pt = (e: PointerEvent) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return { x: (e.clientX - r.left) * d, y: (e.clientY - r.top) * d, p: e.pointerType !== 'mouse' && e.pressure ? e.pressure : 0.5, tilt: Math.hypot(e.tiltX || 0, e.tiltY || 0) }; };
    const down = (e: PointerEvent) => { if (!liveRef.current) return; cv.setPointerCapture(e.pointerId); last = pt(e); setDrawn(true); };
    const move = (e: PointerEvent) => {
      if (!last) return;
      for (const ev of e.getCoalescedEvents?.() ?? [e]) {
        const p = pt(ev), k = inkRef.current;
        g.strokeStyle = k === 'ripen' ? mix('#6fa43f', '#f0b53a', (Math.sin(performance.now() / 600) + 1) / 2) : k;
        g.shadowColor = g.strokeStyle; g.shadowBlur = 4 * Math.min(devicePixelRatio || 1, 2); // ink glows a little on the lit screen
        g.lineWidth = (1.2 + p.p * 9 + p.tilt * 0.06) * Math.min(devicePixelRatio || 1, 2); g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); last = p;
      }
    };
    const up = () => { last = null; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    return () => { ro.disconnect(); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
  }, []);
  const clear = () => { const cv = c.current!; cv.getContext('2d')!.clearRect(0, 0, cv.width, cv.height); setDrawn(false); };
  const s17 = SHOTS[17], r = coverRect(size.w, size.h, 2048, 1152, s17.fit, s17.fitH);
  const box = { left: r.x + SCREEN[0] * r.w, top: r.y + SCREEN[1] * r.h, width: (SCREEN[2] - SCREEN[0]) * r.w, height: (SCREEN[3] - SCREEN[1]) * r.h };
  return (
    <div ref={stage} className="absolute inset-0">
      <FrameSequence shots={[17]} progress={clamp(p / LIVE, 0, 1)} />
      <canvas ref={c} aria-label="Drawing surface on the Slate Pro screen" className="absolute cursor-crosshair touch-none"
        style={{ ...box, borderRadius: Math.max(6, box.width * 0.018), pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : 0, transition: 'opacity .6s' }} />
      <div className="pointer-events-none absolute grid place-items-center px-6 text-center text-[clamp(.85rem,1.4vw,1rem)] text-cream/70 transition-opacity duration-500 ease-brand"
        style={{ ...box, opacity: live && !drawn ? 1 : 0 }}>Draw here with your finger, mouse or pen. Press harder for a heavier line.</div>
      <Readouts items={[['Quill', '4,096 levels'], ['Latency', '9 ms']]} />
      <div className="dock-bottom transition-opacity duration-500" style={{ opacity: live ? 1 : 0, pointerEvents: live ? 'auto' : 'none' }} aria-hidden={!live}>
        <div className="flex flex-wrap justify-center gap-2">
          <Chips label="Ink colour" value={ink} onChange={setInk} items={INKS} />
          <button type="button" className="chip" onClick={clear} tabIndex={live ? 0 : -1}>Clear</button>
        </div>
      </div>
    </div>
  );
}
