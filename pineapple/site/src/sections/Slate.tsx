import { useEffect, useRef, useState } from 'react';
import { ScrubSection } from '../components/ScrubSection';
import { SectionIntro } from '../components/SectionIntro';
import { FrameSequence } from '../sequence/FrameSequence';
import { Readouts } from '../components/Readouts';
import { Chips } from '../components/Chips';
import { mix } from '../sequence/placeholders';
import { coverRect } from '../sequence/player';
import { sm } from '../lib/math';
import { isSmallScreen } from '../lib/tokens';

/** Inks that read on the paper page. */
const INKS = [
  { value: 'ripen', label: 'Ripen', swatch: 'linear-gradient(90deg,#6fa43f,#f0b53a)' },
  { value: '#d29a1e', label: 'Golden Flesh', swatch: '#d29a1e' },
  { value: '#3f7a35', label: 'Crown Green', swatch: '#3f7a35' },
  { value: '#5a4b2d', label: 'Rind', swatch: '#5a4b2d' },
  { value: '#d9506f', label: 'Guava', swatch: '#d9506f' },
  { value: '#1c1d1a', label: 'Charcoal', swatch: '#1c1d1a' },
];
const BASE = import.meta.env.BASE_URL;

/** 10 · Slate Pro. Shot 10 (edge turn). Then the screen turns into a paper drawing page and visitors draw on it with
 *  the Quill: the drawing surface sits exactly over the screen in the photograph. */
export function Slate() {
  return (
    <section id="slate">
      <SectionIntro label="10 · Slate Pro" line1="Thirteen inches." line2="5.1 mm thin." instruction="Scroll to turn it edge-on. Then its screen becomes a page: draw on it." />
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

/** The tablet's screen in the two stills (0–1 of the frame: left, top, right, bottom); the stills differ only there. */
const SCREEN = [0.2344, 0.1076, 0.7715, 0.8819] as const;
const FIT = 0.6, FIT_H = 1.05;
const TURN = [0.22, 0.42] as const, LIVE = 0.44; // the wallpaper turns into the page, then you draw
/** Where the Quill rests beside the tablet (0–1 of the frame); it is a cut-out so you can pick it up. */
const QUILL = [0.7861, 0.1962, 0.8027, 0.8247] as const;
const HAND = 28; // degrees the Quill leans in the hand

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
  // the Quill: at rest beside the tablet, or picked up with its tip at your pointer
  const [pen, setPen] = useState<{ mode: 'rest' | 'hover' | 'down'; x: number; y: number; t: number }>({ mode: 'rest', x: 0, y: 0, t: 0 });
  const idle = useRef(0);
  const penTo = (e: React.PointerEvent, mode: 'hover' | 'down') => {
    if (!liveRef.current) return;
    const r = stage.current!.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    setPen(q => ({ mode, x, y, t: q.mode === mode ? q.t : performance.now() }));
    clearTimeout(idle.current); idle.current = window.setTimeout(() => setPen(q => ({ ...q, mode: 'rest', t: performance.now() })), 2200);
  };
  const penRest = () => { clearTimeout(idle.current); setPen(q => ({ ...q, mode: 'rest', t: performance.now() })); };
  useEffect(() => { if (!live) penRest(); }, [live]);
  useEffect(() => () => clearTimeout(idle.current), []);
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
        g.lineWidth = (1.2 + p.p * 9 + p.tilt * 0.06) * Math.min(devicePixelRatio || 1, 2); g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); last = p;
      }
    };
    const up = () => { last = null; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    return () => { ro.disconnect(); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
  }, []);
  const clear = () => { const cv = c.current!; cv.getContext('2d')!.clearRect(0, 0, cv.width, cv.height); setDrawn(false); };
  const r = coverRect(size.w, size.h, 2048, 1152, FIT, FIT_H);
  const turn = sm(TURN[0], TURN[1], p);
  // the page spreads from the Quill's tip, beside the screen's lower right
  const ox = r.x + 0.775 * r.w, oy = r.y + 0.8 * r.h, reach = Math.hypot(size.w, size.h);
  const pic = (n: string) => `${BASE}frames/${isSmallScreen() ? 'mobile/' : ''}slate/${n}.webp`;
  const qb = { left: r.x + QUILL[0] * r.w, top: r.y + QUILL[1] * r.h, width: (QUILL[2] - QUILL[0]) * r.w, height: (QUILL[3] - QUILL[1]) * r.h };
  const held = pen.mode !== 'rest', lift = pen.mode === 'hover' ? 10 : 0;
  const penT = held ? `translate(${pen.x - (qb.left + qb.width / 2)}px, ${pen.y - lift - (qb.top + qb.height)}px) rotate(${HAND}deg)` : 'none';
  const settling = performance.now() - pen.t < 450;
  const box = { left: r.x + SCREEN[0] * r.w, top: r.y + SCREEN[1] * r.h, width: (SCREEN[2] - SCREEN[0]) * r.w, height: (SCREEN[3] - SCREEN[1]) * r.h };
  return (
    <div ref={stage} className="absolute inset-0">
      <img src={pic('front')} alt="Slate Pro, its screen showing a wallpaper of gold and green rings, the Quill beside it." className="absolute max-w-none" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} decoding="async" />
      <img src={pic('page-nopen')} alt="" aria-hidden="true" className="absolute max-w-none" decoding="async"
        style={{ left: r.x, top: r.y, width: r.w, height: r.h, clipPath: `circle(${turn * reach}px at ${ox - r.x}px ${oy - r.y}px)`, visibility: turn > 0 ? 'visible' : 'hidden' }} />
      <canvas ref={c} aria-label="Drawing surface on the Slate Pro screen" className={`absolute touch-none mix-blend-multiply ${held ? 'cursor-none' : 'cursor-crosshair'}`}
        onPointerEnter={e => penTo(e, e.buttons ? 'down' : 'hover')} onPointerMove={e => penTo(e, e.buttons ? 'down' : 'hover')}
        onPointerDown={e => penTo(e, 'down')} onPointerUp={e => penTo(e, 'hover')} onPointerLeave={penRest}
        style={{ ...box, borderRadius: Math.max(6, box.width * 0.018), pointerEvents: live ? 'auto' : 'none', opacity: live ? 1 : 0, transition: 'opacity .6s' }} />
      <img src={pic('quill')} alt="" aria-hidden="true" className="pointer-events-none absolute z-[1] max-w-none" decoding="async"
        style={{ ...qb, transform: penT, transformOrigin: '50% 100%', transition: held && !settling ? 'transform 70ms linear, filter .3s' : 'transform .5s cubic-bezier(.22,1,.36,1), filter .3s',
          filter: held ? `drop-shadow(${8 + lift}px ${14 + lift * 1.5}px ${10 + lift}px rgba(0,0,0,.55))` : 'none' }} />
      <div className="pointer-events-none absolute grid place-items-center px-6 text-center text-[clamp(.85rem,1.4vw,1rem)] transition-opacity duration-500 ease-brand"
        style={{ ...box, opacity: live && !drawn ? 1 : 0, color: 'rgba(28,29,26,.55)' }}>Pick up the Quill: move onto the page and draw. Press harder for a heavier line.</div>
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
