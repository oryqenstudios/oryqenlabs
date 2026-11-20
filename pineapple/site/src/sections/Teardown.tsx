import { useCallback, useEffect, useRef, useState } from 'react';
import { DEVICES, type DeviceKey } from '../data/devices';
import { TEARDOWN, type Marker } from '../data/teardown';
import { onInspect } from '../lib/events';
import { scrollToTarget } from '../lib/scroll';
import { isSmallScreen, reducedMotion } from '../lib/tokens';
import { pad, sm } from '../lib/math';

const BASE = import.meta.env.BASE_URL;
const IN_MS = 1500, OUT_MS = 1100;
/** A camera move: slow to start, glides, settles. */
const glide = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Devices whose breakdown has been photographed. */
const SHOT = (Object.keys(TEARDOWN) as DeviceKey[]);
const img = (device: DeviceKey, id?: string) =>
  `${BASE}frames/${isSmallScreen() ? 'mobile/' : ''}teardown/${device}${id ? `/${id}` : ''}.webp`;

/**
 * The hands-on breakdown, photographed. Every layer of the exploded view is a real photograph: pick one and the
 * camera glides in until it fills the stage, a sharper macro of that exact part fades in, and numbered callouts
 * mark its small parts. The panel lists every spec. Design's detail chips open layers here too.
 */
export function Teardown() {
  const [device, setDevice] = useState<DeviceKey>('phone');
  const [sel, setSel] = useState(-1);
  const [q, setQ] = useState(0);
  const qRef = useRef(0), raf = useRef(0), stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 16, h: 9 });
  const layers = DEVICES[device].layers, data = TEARDOWN[device]!;
  const [shown, setShown] = useState(-1); // the layer the camera is on (lags `sel` while it moves between layers)
  const [pan, setPan] = useState(0); // 0 = top of the part, 1 = bottom; the camera drifts down it, or follows the pointer
  const steer = useRef(0); // until this time the pointer steers the pan instead of the drift

  useEffect(() => {
    const el = stage.current!; const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tween = useCallback((to: number, then?: () => void) => {
    cancelAnimationFrame(raf.current);
    const from = qRef.current, dur = reducedMotion() ? 0 : (to > from ? IN_MS : OUT_MS) * Math.abs(to - from), t0 = performance.now();
    const step = () => {
      const t = dur ? Math.min(1, (performance.now() - t0) / dur) : 1;
      qRef.current = from + (to - from) * glide(t); setQ(qRef.current);
      if (t < 1) raf.current = requestAnimationFrame(step); else then?.();
    };
    step();
  }, []);

  const open = useCallback((i: number) => {
    setSel(i);
    if (i < 0) { tween(0, () => setShown(-1)); return; }
    if (qRef.current > 0.01 && shown >= 0 && shown !== i) { tween(0, () => { setShown(i); tween(1); }); return; }
    setShown(i); tween(1);
  }, [shown, tween]);

  const switchDevice = (d: DeviceKey) => { cancelAnimationFrame(raf.current); qRef.current = 0; setQ(0); setSel(-1); setShown(-1); setDevice(d); };

  // Design's chips (and anything else) can ask for a layer
  useEffect(() => onInspect(({ device: d, layerId }) => {
    if (!TEARDOWN[d]) return;
    const i = DEVICES[d].layers.findIndex(l => l.id === layerId);
    if (d !== device) switchDevice(d);
    scrollToTarget('#breakdown');
    setTimeout(() => open(i), d !== device ? 700 : 500);
  }), [device, open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sel < 0) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open(-1);
      else if (e.key === 'ArrowRight') open((sel + 1) % layers.length);
      else if (e.key === 'ArrowLeft') open((sel - 1 + layers.length) % layers.length);
    };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [sel, layers.length, open]);

  // once arrived, the camera drifts slowly down the part and back, so every detail passes by close
  const arrivedNow = q > 0.999 && shown === sel && sel >= 0;
  useEffect(() => {
    if (!arrivedNow || reducedMotion()) return;
    let id = 0; const t0 = performance.now();
    const drift = () => {
      if (performance.now() > steer.current) setPan(p => p + (0.5 - 0.5 * Math.cos(((performance.now() - t0) / 11000) * Math.PI * 2) - p) * 0.04);
      id = requestAnimationFrame(drift);
    };
    id = requestAnimationFrame(drift); return () => cancelAnimationFrame(id);
  }, [arrivedNow]);
  useEffect(() => { setPan(0); }, [shown]);
  const steerTo = (clientY: number) => {
    if (!arrivedNow) return;
    const r = stage.current!.getBoundingClientRect(); steer.current = performance.now() + 2500;
    setPan(Math.min(1, Math.max(0, (clientY - r.top) / r.height * 1.2 - 0.1)));
  };

  // the camera: move in until the part is large (60% of its height fills the stage), then pan along it
  const part = shown >= 0 ? data.parts[layers[shown].id] : null;
  let s = 1, cx = 0.5, cy = 0.5;
  if (part) {
    const [x0, y0, x1, y1] = part.rect, g = qRef.current;
    const sT = Math.min(0.92 / (x1 - x0), 1 / (0.6 * (y1 - y0)));
    const seen = Math.min(1, 1 / (sT * (y1 - y0))); // share of the part's height in view
    const cyT = y0 + (y1 - y0) * (seen >= 1 ? 0.5 : seen / 2 + (1 - seen) * pan);
    s = Math.exp(Math.log(sT) * g); cx = 0.5 + ((x0 + x1) / 2 - 0.5) * g; cy = 0.5 + (cyT - 0.5) * g;
  }
  const tx = size.w * 0.5 - s * cx * size.w, ty = size.h * 0.5 - s * cy * size.h;
  const toScreen = (x: number, y: number) => ({ left: tx + s * x * size.w, top: ty + s * y * size.h });
  const arrived = sm(0.8, 1, q);
  const L = sel >= 0 ? layers[sel] : null;

  return (
    <section id="breakdown" aria-label="Take it apart" className="relative py-[clamp(48px,8vh,96px)]">
      <div className="wrap grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <span className="label">Hands-on · every part photographed</span>
            <h2 className="m-0 text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[.98] tracking-[-.04em]">Every part, <span className="grad">up close.</span></h2>
            <p className="m-0 max-w-[560px] text-mute">Pick a layer and the camera moves in and travels along it. Move over the photo to steer. Numbers mark the small parts; the panel lists every spec.</p>
          </div>
          {SHOT.length > 1 && <div className="chips flex gap-2" role="group" aria-label="Device">
            {SHOT.map(d => (
              <button key={d} type="button" className="chip" aria-pressed={device === d} onClick={() => switchDevice(d)}>{DEVICES[d].name}</button>
            ))}
          </div>}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div ref={stage} className="relative aspect-[16/9] w-full overflow-hidden rounded-[22px] border border-ink-line bg-[#050403]"
            onPointerMove={e => { if (e.pointerType === 'mouse' || e.buttons) steerTo(e.clientY); }} style={{ touchAction: arrivedNow ? 'pan-x' : undefined }}>
            <div className="absolute left-0 top-0 h-full w-full origin-top-left will-change-transform" style={{ transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
              <img src={img(device)} alt={`${DEVICES[device].name}, exploded into its ${layers.length} layers.`} className="absolute inset-0 h-full w-full object-cover" decoding="async" />
              {layers.map((l, i) => {
                const r = data.parts[l.id]?.rect; if (!r) return null;
                return (
                  <img key={l.id} src={img(device, l.id)} alt="" aria-hidden="true" loading="lazy" decoding="async"
                    className="absolute object-cover" style={{ left: `${r[0] * 100}%`, top: `${r[1] * 100}%`, width: `${(r[2] - r[0]) * 100}%`, height: `${(r[3] - r[1]) * 100}%`, opacity: i === shown ? sm(0.55, 1, q) : 0 }} />
                );
              })}
            </div>
            {/* vignette deepens as the camera moves in */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 ${8 + 10 * q}vmin rgba(5,4,3,${0.4 + 0.45 * q})` }} />

            {/* a numbered hotspot on every layer */}
            {layers.map((l, i) => {
              const r = data.parts[l.id]?.rect; if (!r) return null;
              const at = toScreen((r[0] + r[2]) / 2, r[1] + (r[3] - r[1]) * 0.08);
              const vis = 1 - sm(0, 0.25, q);
              return (
                <button key={l.id} type="button" onClick={() => open(i)} tabIndex={vis > 0.5 ? 0 : -1} aria-label={`Open layer ${i + 1}: ${l.name}`}
                  className="group absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                  style={{ ...at, opacity: vis, pointerEvents: vis > 0.5 ? 'auto' : 'none' }}>
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-cream/80 bg-ink/60 font-mono text-[.66rem] text-cream shadow-[0_2px_14px_rgba(5,4,3,.7)] backdrop-blur-md transition-transform group-hover:scale-110">{pad(i + 1, 2)}</span>
                  <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/80 px-2.5 py-1 text-[.72rem] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{l.name}</span>
                </button>
              );
            })}

            {/* callouts on the part, once the camera has arrived */}
            {part && shown === sel && part.markers.map((m: Marker, j: number) => {
              const [x0, y0, x1, y1] = part.rect;
              const at = toScreen(x0 + m.x * (x1 - x0), y0 + m.y * (y1 - y0));
              const right = at.left < size.w * 0.62;
              const inView = sm(0, size.h * 0.08, at.top) * (1 - sm(size.h * 0.9, size.h, at.top));
              return (
                <div key={j} className="pointer-events-none absolute" style={{ ...at, opacity: arrived * inView, transform: `translateY(${(1 - arrived) * 6}px)` }}>
                  <span className="absolute -left-[5px] -top-[5px] h-[10px] w-[10px] rounded-full border-2 border-cream bg-[var(--a2)] shadow-[0_0_0_3px_rgba(5,4,3,.45)]" />
                  <span className={`absolute top-0 h-px w-[clamp(18px,3vw,44px)] bg-cream/70 ${right ? 'left-[6px]' : 'right-[6px]'}`} />
                  <span className={`absolute -top-[11px] whitespace-nowrap rounded-full border border-ink-line bg-ink/80 px-2.5 py-[3px] text-[clamp(.62rem,1vw,.76rem)] backdrop-blur-md ${right ? 'left-[calc(clamp(18px,3vw,44px)+8px)]' : 'right-[calc(clamp(18px,3vw,44px)+8px)]'}`}>
                    <b className="mr-1.5 font-mono text-[var(--a2)]">{j + 1}</b>{m.label}
                  </span>
                </div>
              );
            })}

            {sel >= 0 && (
              <button type="button" onClick={() => open(-1)} className="chip absolute left-3 top-3 !bg-ink/70 backdrop-blur-md">← All layers</button>
            )}
            <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-[.62rem] uppercase tracking-[.14em] text-mute">
              {L ? `${pad(sel + 1, 2)} / ${layers.length} · ${L.mm}` : `${layers.length} layers · tap one`}
            </span>
          </div>

          {/* the details */}
          <aside className="grid content-start gap-3 rounded-[22px] border border-ink-line bg-ink-2/70 p-5 backdrop-blur-md" aria-live="polite">
            {L ? (
              <>
                <span className="label">Layer {pad(sel + 1, 2)} of {layers.length}</span>
                <h3 className="m-0 text-[1.7rem] font-bold leading-tight tracking-[-.03em]">{L.name}{L.sub && <span className="block text-[1rem] font-semibold text-mute">{L.sub}</span>}</h3>
                <p className="m-0 text-mute">{L.story}</p>
                <ul className="m-0 grid list-none gap-2 p-0 text-[.92rem]">
                  {L.specs.map(sp => <li key={sp} className="border-t border-ink-line pt-2">{sp}</li>)}
                </ul>
                {part && part.markers.length > 0 && (
                  <ol className="m-0 grid list-none gap-1 p-0 text-[.82rem] text-mute">
                    {part.markers.map((m: Marker, j: number) => <li key={j}><b className="mr-2 font-mono text-[var(--a2)]">{j + 1}</b>{m.label}</li>)}
                  </ol>
                )}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <button type="button" className="chip" onClick={() => open((sel - 1 + layers.length) % layers.length)}>← Previous</button>
                  <span className="font-mono text-[.7rem] text-mute">{L.mm}</span>
                  <button type="button" className="chip" onClick={() => open((sel + 1) % layers.length)}>Next →</button>
                </div>
              </>
            ) : (
              <>
                <span className="label">{DEVICES[device].name} · {layers.length} layers</span>
                <ol className="m-0 grid list-none gap-1 p-0">
                  {layers.map((l, i) => (
                    <li key={l.id}>
                      <button type="button" onClick={() => open(i)} className="flex w-full items-baseline gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-ink-line/60">
                        <span className="font-mono text-[.72rem] text-mute">{pad(i + 1, 2)}</span>
                        <span className="flex-1">{l.name}</span>
                        <span className="font-mono text-[.68rem] text-mute">{l.mm}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
