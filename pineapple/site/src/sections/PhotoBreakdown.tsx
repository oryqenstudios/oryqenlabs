import { useEffect, useRef, useState } from 'react';
import { DEVICES } from '../data/devices';
import { TEARDOWN } from '../data/teardown';
import { pad } from '../lib/math';
import { isTouch } from '../lib/tokens';

/** On touch screens the stage fills the screen, so a swipe must still scroll the page: a layer is picked up by holding
 *  it still for a moment, and only then does the page stop scrolling under the finger. */
const TOUCH = isTouch(), HOLD_MS = 260;

const BASE = import.meta.env.BASE_URL;

/**
 * The hands-on breakdown, photographed. Every layer of the exploded photo is its own cut-out, laid exactly where it
 * sits in the photo: drag any layer out (it lifts, casts a shadow and follows your hand), let go and it glides back.
 * Click a layer to read its specs. The cut-outs are rectangles with see-through corners that overlap, so what you grab
 * is decided by each layer's own pixels (a small alpha mask per layer), never by its rectangle.
 */
export function PhotoBreakdown() {
  const layers = DEVICES.phone.layers, parts = TEARDOWN.phone!.parts;
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ x: 0, y: 0, w: 16, h: 9 });
  const [drag, setDrag] = useState<{ i: number; dx: number; dy: number; moved: boolean } | null>(null);
  const [back, setBack] = useState(-1); // the layer gliding home
  const [hover, setHover] = useState(-1);
  const [sel, setSel] = useState(-1);
  const start = useRef({ x: 0, y: 0 });
  const masks = useRef<({ w: number; h: number; a: Uint8ClampedArray } | undefined)[]>([]);

  useEffect(() => {
    let live = true;
    layers.forEach((l, i) => {
      const im = new Image(); im.src = `${BASE}frames/breakdown/${l.id}.webp`;
      im.decode().then(() => {
        if (!live) return;
        const w = 160, h = Math.max(1, Math.round((w * im.naturalHeight) / im.naturalWidth)), c = document.createElement('canvas');
        c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); if (!x) return;
        x.drawImage(im, 0, 0, w, h); masks.current[i] = { w, h, a: x.getImageData(0, 0, w, h).data };
      }).catch(() => {});
    });
    return () => { live = false; };
  }, [layers]);

  /** The topmost layer with solid pixels under the pointer, or -1. */
  const hit = (cx: number, cy: number) => {
    const r = stage.current!.getBoundingClientRect(), px = cx - r.left, py = cy - r.top;
    const order = layers.map((_, i) => i).sort((a, b) => (b === sel ? 1 : 0) - (a === sel ? 1 : 0) || a - b); // same order as zIndex
    for (const i of order) {
      const q = parts[layers[i].id]?.rect; if (!q) continue;
      const u = (px - box.x - q[0] * box.w) / ((q[2] - q[0]) * box.w), v = (py - box.y - q[1] * box.h) / ((q[3] - q[1]) * box.h);
      if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
      const m = masks.current[i]; if (!m) return i; // mask not in yet: the rectangle will do
      if (m.a[(Math.floor(v * m.h) * m.w + Math.floor(u * m.w)) * 4 + 3] > 48) return i;
    }
    return -1;
  };

  useEffect(() => {
    const el = stage.current!;
    const ro = new ResizeObserver(() => {
      const W = el.clientWidth, H = el.clientHeight, w = Math.min(W * 0.96, (H * 0.9 * 16) / 9), h = (w * 9) / 16;
      setBox({ x: (W - w) / 2, y: (H - h) / 2, w, h });
    });
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(-1); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);

  const hold = useRef<{ i: number; x: number; y: number; timer: number } | null>(null);
  const holding = useRef(false); // a layer is in hand: the page must not scroll
  useEffect(() => {
    const el = stage.current!, block = (e: TouchEvent) => { if (holding.current) e.preventDefault(); };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  const down = (e: React.PointerEvent) => {
    const i = hit(e.clientX, e.clientY); if (i < 0) return;
    if (e.pointerType === 'touch') {
      const x = e.clientX, y = e.clientY;
      hold.current = { i, x, y, timer: window.setTimeout(() => {
        hold.current = null; holding.current = true; start.current = { x, y };
        setDrag({ i, dx: 0, dy: 0, moved: true }); setBack(-1); navigator.vibrate?.(8);
      }, HOLD_MS) };
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ i, dx: 0, dy: 0, moved: false }); setBack(-1);
  };
  const move = (e: React.PointerEvent) => {
    const h = hold.current; // moving before the hold completes is a scroll or a swipe, not a pick-up
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 8) { clearTimeout(h.timer); hold.current = null; }
    if (!drag) { if (e.pointerType === 'mouse') { const i = hit(e.clientX, e.clientY); if (i !== hover) setHover(i); } return; }
    const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y;
    setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 6 });
  };
  const up = (e: React.PointerEvent) => {
    const h = hold.current;
    if (h) { clearTimeout(h.timer); hold.current = null; if (e.type === 'pointerup') setSel(h.i); return; } // a quick tap reads it
    holding.current = false;
    if (!drag) return;
    if (!drag.moved) setSel(drag.i); else setBack(drag.i);
    setDrag(null);
  };
  const L = sel >= 0 ? layers[sel] : null;

  return (
    <section id="breakdown" aria-label="Take it apart" className="relative overflow-x-clip">
      <div className="wrap grid gap-2 pt-[clamp(48px,8vh,96px)]">
        <span className="label">05 · Take it apart · photographed</span>
        <h2 className="m-0 text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[.98] tracking-[-.04em]">Pull it apart <span className="grad">yourself.</span></h2>
        <p className="m-0 max-w-[560px] text-mute">{TOUCH ? 'Every layer is a real photograph. Hold any layer, then drag it out; let go and it glides home. Tap a layer to read it.' : 'Every layer is a real photograph. Drag any layer out; let go and it glides home. Click a layer to read it.'}</p>
      </div>
      <div ref={stage} className="relative h-[100svh] w-full select-none bg-[#050505]" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onPointerLeave={() => { if (!drag) setHover(-1); }} style={{ cursor: drag?.moved ? 'grabbing' : hover >= 0 ? 'grab' : undefined, touchAction: TOUCH ? 'pan-y' : 'none' }}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 45% at 50% 70%, rgba(240,181,58,.07), transparent 70%)' }} />
        {layers.map((l, i) => {
          const r = parts[l.id]?.rect; if (!r) return null;
          const held = drag?.i === i, lift = held && drag!.moved ? 1 : hover === i ? 0.35 : 0;
          const t = held ? `translate(${drag!.dx}px, ${drag!.dy}px) scale(${1 + 0.05 * lift})` : `translateY(${-6 * lift}px) scale(${1 + 0.05 * lift})`;
          return (
            <img key={l.id} src={`${BASE}frames/breakdown/${l.id}.webp`} alt={l.name} draggable={false} decoding="async"
              className="pointer-events-none absolute max-w-none"
              style={{
                left: box.x + r[0] * box.w, top: box.y + r[1] * box.h, width: (r[2] - r[0]) * box.w, height: (r[3] - r[1]) * box.h,
                zIndex: held ? 40 : sel === i ? 30 : 20 - i, transform: t,
                transition: held ? 'filter .3s' : back === i ? 'transform .8s cubic-bezier(.22,1,.36,1), filter .5s' : 'transform .35s cubic-bezier(.22,1,.36,1), filter .35s',
                filter: lift > 0 ? `drop-shadow(0 ${18 * lift}px ${28 * lift}px rgba(0,0,0,.7)) brightness(${1 + 0.08 * lift})` : sel === i ? 'brightness(1.12)' : 'none',
              }} />
          );
        })}
        {hover >= 0 && !drag && (() => { const r = parts[layers[hover].id].rect; return (
          <span className="pointer-events-none absolute z-50 -translate-x-1/2 whitespace-nowrap rounded-full border border-ink-line bg-ink/80 px-3 py-1 text-[.78rem] backdrop-blur-md"
            style={{ left: box.x + ((r[0] + r[2]) / 2) * box.w, top: box.y + r[3] * box.h - 28 }}>{pad(hover + 1, 2)} · {layers[hover].name}</span>); })()}
        <p className="pointer-events-none absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom,0px))] z-50 m-0 text-center font-mono text-[.7rem] uppercase tracking-[.14em] text-cream/70">{TOUCH ? 'Hold a layer to pick it up · tap to read it' : 'Drag any layer out · click to read it'}</p>
        {L && (
          <aside className="absolute right-[var(--gut-r)] top-6 z-50 grid max-h-[calc(100svh-48px)] w-[min(360px,calc(100%-32px))] content-start gap-3 overflow-auto rounded-[22px] border border-ink-line bg-ink-2/80 p-5 backdrop-blur-xl" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <span className="label">Layer {pad(sel + 1, 2)} of {layers.length} · {L.mm}</span>
              <button type="button" className="chip !px-2.5 !py-0.5" onClick={() => setSel(-1)} aria-label="Close">×</button>
            </div>
            <h3 className="m-0 text-[1.6rem] font-bold leading-tight tracking-[-.03em]">{L.name}{L.sub && <span className="block text-[1rem] font-semibold text-mute">{L.sub}</span>}</h3>
            <p className="m-0 text-mute">{L.story}</p>
            <ul className="m-0 grid list-none gap-2 p-0 text-[.9rem]">{L.specs.map(sp => <li key={sp} className="border-t border-ink-line pt-2">{sp}</li>)}</ul>
            <div className="flex justify-between gap-2">
              <button type="button" className="chip" onClick={() => setSel((sel - 1 + layers.length) % layers.length)}>← Previous</button>
              <button type="button" className="chip" onClick={() => setSel((sel + 1) % layers.length)}>Next →</button>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
