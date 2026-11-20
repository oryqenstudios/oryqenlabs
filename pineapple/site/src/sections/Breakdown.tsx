import { useCallback, useEffect, useRef, useState } from 'react';
import { DEVICES, COUNTERPART, findLayer, type DeviceKey, type CloseUp } from '../data/devices';
import { FINISHES, PHONE_FINISHES, TABLET_FINISHES, swatch, type FinishKey } from '../data/finishes';
import { FrameSequence } from '../sequence/FrameSequence';
import { useStageAnchor } from '../three/useStageAnchor';
import { stage } from '../three/store';
import { useLive } from '../three/useLive';
import { createBreakdownState, type ViewMode } from '../three/breakdown';
import { useScrubProgress, scrollToTarget } from '../lib/scroll';
import { onInspect } from '../lib/events';
import { play } from '../lib/sound';
import { setAccent, reducedMotion } from '../lib/tokens';
import { clamp, pad, sm } from '../lib/math';

const MODES: [ViewMode, string][] = [['normal', 'Normal'], ['xray', 'X-ray'], ['thermal', 'Thermal'], ['dims', 'Dimensions']];
const HOME = (p: number): [number, number] => [0.24, -1.25 + p * 0.5]; // three-quarter, orbiting a little with scroll
/** Scroll → explode: separate, hold, then "keep scrolling" reassembles (plan §7). */
const explodeFor = (p: number) => (p < 0.08 ? 0 : p < 0.45 ? sm(0.08, 0.45, p) : p < 0.82 ? 1 : 1 - sm(0.82, 0.98, p));

/** 05 · The hands-on breakdown: a pinned stage around the live 3D stack. */
export function Breakdown() {
  const section = useRef<HTMLElement>(null);
  const p = useScrubProgress(section);
  const st = useRef(createBreakdownState()).current;
  const live = useLive();
  const [device, setDevice] = useState<DeviceKey>('phone');
  const [finish, setFinish] = useState<FinishKey>('ripen');
  const [sel, setSel] = useState(-1);
  const [hover, setHover] = useState(-1);
  const [mode, setModeS] = useState<ViewMode>('normal');
  const [scanner, setScanner] = useState(() => matchMedia('(pointer: fine)').matches);
  const [explodeUI, setExplodeUI] = useState(0);
  const [compare, setCompare] = useState(false);
  const [rot, setRot] = useState<[number, number]>(HOME(0));
  const [close, setClose] = useState<{ layer: number; c: CloseUp; ready: boolean } | null>(null);
  const [cuP, setCuP] = useState(0);
  const [toast, setToast] = useState<{ msg: string; bad?: boolean; build?: boolean } | null>(null);
  const [build, setBuild] = useState(false);
  const [wide, setWide] = useState(() => innerWidth >= 900);
  const backBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => { if (close) backBtn.current?.focus(); }, [!!close]); // eslint-disable-line react-hooks/exhaustive-deps
  const layers = DEVICES[device].layers;
  const L = sel >= 0 ? layers[sel] : null;
  const other = L && COUNTERPART[L.id] ? findLayer(COUNTERPART[L.id]) : undefined;

  st.scanner = scanner;
  st.mode = mode;
  const anchorRef = useStageAnchor('breakdown', { device, finish, rot, fill: 0.86, breakdown: st });
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const setAnchor = useCallback((el: HTMLDivElement | null) => { anchorEl.current = el; anchorRef(el); }, [anchorRef]);
  const user = () => stage.anchors.get('breakdown')?.user;
  const wake = () => stage.wake();

  useEffect(() => { const r = () => setWide(innerWidth >= 900); addEventListener('resize', r); return () => removeEventListener('resize', r); }, []);
  useEffect(() => { st.onReassembled = () => play('click'); st.onHoverChange = setHover; }, [st]);

  // scroll drives explode and a slow orbit, unless the visitor is building or inspecting
  useEffect(() => {
    if (st.build.active) return;
    const e = explodeFor(p); st.explode = e; setExplodeUI(e);
    if (st.selected < 0 && !st.close) setRot(HOME(p));
    wake();
  }, [p]); // eslint-disable-line react-hooks/exhaustive-deps

  // panel open → move the stack aside
  useEffect(() => {
    const open = sel >= 0 && !close;
    // desktop: slide left of the panel; phones: shrink into the space above the bottom sheet
    st.shift = open ? (wide ? { x: -190, y: 0 } : { x: 0, y: -innerHeight * 0.17 }) : { x: 0, y: 0 };
    st.fit = open && !wide ? 0.5 : 1;
    wake();
  }, [sel, close, wide]); // eslint-disable-line react-hooks/exhaustive-deps

  const inspect = (i: number) => {
    if (st.build.active) return;
    if (st.close) exitClose(false);
    st.selected = i; setSel(i); setCompare(false);
    const u = user(); if (u) { u.x = u.y = u.vx = u.vy = 0; }
    setRot([0.12, DEVICES[device].layers[i].back ? Math.PI : 0]);
    if (st.explode < 0.55) { st.explode = 0.8; setExplodeUI(0.8); }
    wake();
  };
  const closeInspect = () => { st.selected = -1; setSel(-1); setCompare(false); setRot(HOME(p)); wake(); };
  const step = (d: number) => { const n = layers.length; inspect(sel < 0 ? (d > 0 ? 0 : n - 1) : (sel + d + n) % n); };

  // Look closer: the camera flies in, the background blurs, then the close-up plays
  const lookCloser = (i: number, c: CloseUp) => {
    returnFocus.current = document.activeElement as HTMLElement;
    st.close = { layer: i, kind: c.kind }; setClose({ layer: i, c, ready: false }); setCuP(0);
    setRot(c.kind === 'rake' ? [0.18, -Math.PI / 2 + 0.5] : DEVICES[device].layers[i].back ? [0.1, Math.PI] : [0.05, 0]);
    const u = user(); if (u) { u.x = u.y = 0; }
    setTimeout(() => setClose(cur => (cur && cur.layer === i ? { ...cur, ready: true } : cur)), reducedMotion() ? 50 : 1100);
    wake();
  };
  const exitClose = (restorePanel = true) => {
    st.close = null; setClose(null);
    // the panel is inert until it re-renders open, so return focus just after
    const back = returnFocus.current; returnFocus.current = null;
    setTimeout(() => back?.focus?.(), 60);
    if (restorePanel && st.selected >= 0) setRot([0.12, DEVICES[device].layers[st.selected].back ? Math.PI : 0]);
    else setRot(HOME(p));
    wake();
  };

  const setMode = (m: ViewMode) => { setModeS(m); st.mode = m; wake(); };
  const switchDevice = (k: DeviceKey) => {
    if (k === device) return;
    if (st.build.active) endBuild(false);
    if (st.close) exitClose(false);
    closeInspect(); setDevice(k);
    if (k === 'tablet' && !TABLET_FINISHES.includes(finish)) setFinish('ripen');
  };

  // Build it yourself (hidden extra)
  const showHint = (next: number) => setToast({ msg: `Build it yourself · drag the ${DEVICES[device].layers[next].name.toLowerCase()} into the stack`, build: true });
  const startBuild = () => {
    if (st.close) exitClose(false); closeInspect();
    st.build = { active: true, next: layers.length - 1 }; setBuild(true);
    st.explode = 1; setExplodeUI(1); setRot(HOME(0.3));
    stage.bd?.scatter(true); showHint(layers.length - 1); wake();
  };
  const endBuild = (done: boolean) => {
    stage.bd?.scatter(false); st.build = { active: false, next: 0 }; setBuild(false);
    if (done) {
      setToast({ msg: `Built. That is a ${DEVICES[device].name}.` });
      setTimeout(() => { st.explode = 0; setExplodeUI(0); wake(); }, 500);
      setTimeout(() => window.dispatchEvent(new CustomEvent('pineapple:burst', { detail: { x: innerWidth / 2, y: innerHeight / 2 } })), 1200);
      setTimeout(() => setToast(null), 2600);
    } else setToast(null);
  };

  // parts list ↔ 3D hover, and the Design section's "open this layer"
  useEffect(() => { st.listHover = -1; }, [device]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onInspect(({ device: dv, layerId }) => {
    if (dv !== device) setDevice(dv);
    const i = DEVICES[dv].layers.findIndex(l => l.id === layerId);
    const el = section.current;
    if (el) scrollToTarget(el.offsetTop + (el.offsetHeight - innerHeight) * 0.6);
    setTimeout(() => { if (i >= 0) inspect(i); }, 450);
  }), [device]); // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard: ↑ ↓ step, Esc backs out one level (bound once; reads the latest handlers)
  const kbActive = useRef(false);
  const latest = useRef({ step, exitClose, endBuild, closeInspect });
  latest.current = { step, exitClose, endBuild, closeInspect };
  useEffect(() => {
    const el = section.current!;
    const io = new IntersectionObserver(([e]) => { kbActive.current = e.isIntersecting && el.getBoundingClientRect().top <= 1 && el.getBoundingClientRect().bottom >= innerHeight - 1; }, { threshold: [0, 0.2, 0.5, 0.8, 1] });
    io.observe(el);
    const onScroll = () => { const r = el.getBoundingClientRect(); kbActive.current = r.top <= 1 && r.bottom >= innerHeight - 1; };
    addEventListener('scroll', onScroll, { passive: true });
    const key = (e: KeyboardEvent) => {
      if (!kbActive.current || (document.activeElement as HTMLElement)?.tagName === 'INPUT') return;
      const h = latest.current;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (st.close) h.exitClose(); h.step(e.key === 'ArrowDown' ? 1 : -1); }
      else if (e.key === 'Escape') { if (st.close) h.exitClose(); else if (st.build.active) h.endBuild(false); else h.closeInspect(); }
    };
    addEventListener('keydown', key);
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); removeEventListener('keydown', key); };
  }, [st]);

  /* ---------- pointer: pull, inspect, rotate, pinch, scanner ---------- */
  const drag = useRef<null | { type: 'pending' | 'pull' | 'rotate' | 'pinch' | 'lens'; i?: number; x0: number; y0: number; x: number; y: number; touch: boolean; d0?: number; z0?: number }>(null);
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const lp = useRef<number>();
  const hoverAt = (x: number, y: number) => {
    const i = stage.bd?.pick(x, y) ?? -1;
    if (i !== st.hover) { st.hover = i; setHover(i); }
    st.lens = st.scanner && (i >= 0 || drag.current?.type === 'lens') ? { x, y } : null;
    if (anchorEl.current) anchorEl.current.style.cursor = i >= 0 ? 'grab' : '';
    wake();
  };
  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const touch = e.pointerType !== 'mouse';
    if (ptrs.current.size === 2) {
      clearTimeout(lp.current); if (drag.current?.type === 'pull') stage.bd?.pullEnd();
      const [a, b] = [...ptrs.current.values()]; drag.current = { type: 'pinch', x0: 0, y0: 0, x: 0, y: 0, touch, d0: Math.hypot(a.x - b.x, a.y - b.y), z0: st.zoom }; return;
    }
    if (touch && st.scanner) { drag.current = { type: 'lens', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, touch }; hoverAt(e.clientX, e.clientY); return; }
    const i = stage.bd?.pick(e.clientX, e.clientY) ?? -1;
    const u = user(); if (u) { u.vx = u.vy = 0; }
    if (i >= 0 && !(st.build.active && placed.current[i])) {
      drag.current = { type: 'pending', i, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, touch };
      if (touch) lp.current = window.setTimeout(() => { const d = drag.current; if (d?.type === 'pending') { stage.bd?.pullStart(d.i!, d.x0, d.y0); d.type = 'pull'; navigator.vibrate?.(8); } }, 380);
    } else drag.current = { type: 'rotate', x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, touch };
    wake();
  };
  const onMove = (e: React.PointerEvent) => {
    if (ptrs.current.has(e.pointerId)) ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current;
    if (!d) { if (e.pointerType === 'mouse') hoverAt(e.clientX, e.clientY); return; }
    if (d.type === 'pinch') { const [a, b] = [...ptrs.current.values()]; if (a && b) st.zoom = clamp(d.z0! * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(10, d.d0!), 0.6, 3); wake(); return; }
    if (d.type === 'lens') { hoverAt(e.clientX, e.clientY); return; }
    const moved = Math.hypot(e.clientX - d.x0, e.clientY - d.y0);
    if (d.type === 'pending') {
      if (d.touch) { if (moved > 8) { clearTimeout(lp.current); d.type = 'rotate'; } else return; }
      else if (moved > 4) { stage.bd?.pullStart(d.i!, d.x0, d.y0); d.type = 'pull'; } else return;
    }
    if (d.type === 'pull') { stage.bd?.pullMove(e.clientX, e.clientY); return; }
    if (d.type === 'rotate') {
      const u = user(); if (!u) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      u.vy = dx * 0.0075; u.y += u.vy;
      if (!d.touch) { u.vx = dy * 0.006; u.x = clamp(u.x + u.vx, -1.3, 1.3); }
      u.dragging = true; wake();
    }
  };
  const onUp = (e: React.PointerEvent) => {
    ptrs.current.delete(e.pointerId); clearTimeout(lp.current);
    const d = drag.current; if (!d) return;
    const u = user(); if (u) u.dragging = false;
    if (d.type === 'pending' && e.type === 'pointerup' && !st.build.active) inspect(d.i!);
    else if (d.type === 'pull') {
      const r = stage.bd?.pullEnd();
      if (st.build.active && r && !placed.current[r.i]) {
        if (r.near && r.i === st.build.next) { stage.bd?.place(r.i); placed.current[r.i] = true; play('click'); st.build.next--; if (st.build.next < 0) endBuild(true); else showHint(st.build.next); }
        else if (r.near) { setToast({ msg: `Not yet. Next is the ${layers[st.build.next].name.toLowerCase()}.`, bad: true }); setTimeout(() => st.build.active && showHint(st.build.next), 1600); }
      }
    } else if (d.type === 'rotate' && e.type === 'pointerup' && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 3 && st.selected >= 0 && !st.close) closeInspect();
    else if (d.type === 'lens') { st.lens = null; }
    drag.current = null;
    wake();
  };
  const placed = useRef<boolean[]>([]);
  useEffect(() => { placed.current = layers.map(() => !build); }, [build, layers]);
  // pulling, pinching and scanning must not scroll the page; plain swipes still do
  useEffect(() => {
    const el = anchorEl.current; if (!el) return;
    const tm = (e: TouchEvent) => { const t = drag.current?.type; if (t === 'pull' || t === 'pinch' || t === 'lens') e.preventDefault(); };
    const wh = (e: WheelEvent) => { if (!e.ctrlKey) return; e.preventDefault(); st.zoom = clamp(st.zoom * Math.exp(-e.deltaY * 0.01), 0.6, 3); wake(); };
    el.addEventListener('touchmove', tm, { passive: false }); el.addEventListener('wheel', wh, { passive: false });
    return () => { el.removeEventListener('touchmove', tm); el.removeEventListener('wheel', wh); };
  }, [st]);

  const finishes = device === 'phone' ? PHONE_FINISHES : TABLET_FINISHES;
  const panelOpen = sel >= 0 && !close;

  return (
    <section ref={section} id="breakdown" className="scrub" style={{ height: '340vh' }} aria-label="Take it apart">
      <div className="pin" aria-hidden="true" style={{ background: 'radial-gradient(120% 90% at 50% 40%,#171a12 0%,var(--ink) 70%)' }} />
      <div className="pin-over" ref={el => { st.dom.stage = el; }}>
        {/* the device sits here; this element takes the pointer */}
        <div ref={setAnchor} className="absolute inset-x-0 bottom-[17%] top-[13%] max-lg:bottom-[30%] max-lg:top-[16%]" style={{ touchAction: 'pan-y' }}
          role="img" aria-label={`${DEVICES[device].name}. Drag a layer to pull it out, drag empty space to turn it, click a layer to read its specs.`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          onPointerLeave={e => { if (e.pointerType === 'mouse' && !drag.current) { st.hover = -1; setHover(-1); st.lens = null; wake(); } }}>
          {!live && <FrameSequence shots={[4]} progress={1} hud={false} />}
        </div>
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-[900ms] ease-brand ${close ? 'opacity-100' : 'opacity-0'}`}
          style={{ backdropFilter: 'blur(9px)', WebkitBackdropFilter: 'blur(9px)', maskImage: 'radial-gradient(circle at 50% 50%,transparent 18%,#000 62%)', WebkitMaskImage: 'radial-gradient(circle at 50% 50%,transparent 18%,#000 62%)', zIndex: 21 }} />
        <div ref={el => { st.dom.labels = el; }} hidden className="pointer-events-none absolute inset-0 z-[22]" aria-hidden="true">
          {layers.map(l => <div key={l.id} className="absolute left-0 top-0 whitespace-nowrap rounded border border-ink-line bg-ink/75 px-1.5 py-0.5 font-mono text-[.68rem] tabular-nums text-cream before:absolute before:right-full before:top-1/2 before:w-[18px] before:border-t before:border-cream/50 before:content-['']">{l.mm}{l.id === 'frame' ? ' · total depth' : ''}</div>)}
        </div>
        <div ref={el => { st.dom.lens = el; }} hidden className="pointer-events-none absolute left-0 top-0 z-[22] rounded-full border-[1.5px] border-[#7fe3ffd9] shadow-[0_0_30px_rgba(127,227,255,.25)]" aria-hidden="true">
          <span ref={el => { st.dom.lensText = el; }} className="absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded border border-[#7fe3ff66] bg-ink/85 px-2 py-0.5 font-mono text-[.68rem] tracking-[.08em] text-[#bdf1ff]" />
        </div>

        <header className="pointer-events-none absolute z-[23] max-w-[420px]" style={{ left: 'var(--gut-l)', top: 76 }}>
          <p className="label">05 · Take it apart · {DEVICES[device].name}</p>
          <p className="m-0 mt-1.5 text-xl font-semibold tracking-[-.02em]">Ten layers, every spec.</p>
          <p className="m-0 text-[.85rem] text-mute max-lg:hidden">Scroll to separate. Drag a layer to pull it out. Click one to read it. Ctrl + scroll or pinch to zoom. ↑ ↓ to step, Esc to back out.</p>
        </header>
        <div className="readouts z-[23] max-lg:!top-auto max-lg:bottom-[calc(max(14px,env(safe-area-inset-bottom,0px))+150px)]">
          <div className="card"><span>Orbit</span><b ref={el => { st.dom.orbit = el; }}>0°</b></div>
          <div className="card"><span>Layers separated</span><b ref={el => { st.dom.sep = el; }}>0/{layers.length}</b></div>
        </div>

        <nav aria-label="Parts list" className="absolute z-[23] lg:top-1/2 lg:w-[230px] lg:-translate-y-[46%] max-lg:inset-x-0 max-lg:overflow-x-auto max-lg:px-4"
          style={{ left: wide ? 'var(--gut-l)' : undefined, bottom: wide ? undefined : 'calc(max(14px, env(safe-area-inset-bottom, 0px)) + 104px)' }}>
          <ol className="m-0 flex w-max list-none gap-1.5 p-0 lg:grid lg:w-auto lg:gap-0.5">
            {layers.map((l, i) => (
              <li key={l.id} className="shrink-0">
                <button type="button" onClick={() => inspect(i)} aria-current={i === sel}
                  onMouseEnter={() => { st.listHover = i; wake(); }} onMouseLeave={() => { st.listHover = -1; wake(); }}
                  onFocus={() => { st.listHover = i; wake(); }} onBlur={() => { st.listHover = -1; wake(); }}
                  className={`flex w-full items-baseline gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-[.84rem] transition-colors duration-300 ease-brand max-lg:rounded-full max-lg:border max-lg:border-ink-line max-lg:bg-ink-2/80 lg:whitespace-normal ${i === sel ? 'text-char' : i === hover ? 'bg-cream/10 text-cream' : 'text-mute hover:bg-cream/10 hover:text-cream'}`}
                  style={i === sel ? { background: 'var(--grad)' } : undefined}>
                  <span className="font-mono text-[.68rem] tabular-nums opacity-70">{pad(i + 1, 2)}</span>{l.name}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={build ? () => endBuild(false) : startBuild} className="mt-2.5 w-full rounded-lg border border-dashed border-ink-line px-2.5 py-1.5 text-[.75rem] text-mute max-lg:hidden">{build ? 'Stop building' : 'Build it yourself'}</button>
        </nav>

        {/* spec panel */}
        <section aria-label="Layer specifications" ref={el => { if (el) el.inert = !panelOpen; }}
          className={`absolute z-[24] flex flex-col gap-3 overflow-auto border border-ink-line bg-ink-2/90 p-5 backdrop-blur-xl transition-transform duration-[800ms] ease-brand lg:bottom-[86px] lg:top-16 lg:w-[360px] lg:rounded-[18px] max-lg:inset-x-0 max-lg:bottom-0 max-lg:max-h-[58%] max-lg:rounded-t-[18px] ${panelOpen ? '' : 'max-lg:translate-y-[calc(100%+20px)] lg:translate-x-[calc(100%+40px)]'}`}
          style={{ right: wide ? 'var(--gut-r)' : undefined, touchAction: 'pan-y', paddingBottom: wide ? undefined : 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          onPointerDown={e => { if (e.pointerType !== 'mouse') (e.currentTarget as HTMLElement).dataset.sx = String(e.clientX); }}
          onPointerUp={e => { const el = e.currentTarget as HTMLElement; if (!el.dataset.sx) return; const dx = e.clientX - +el.dataset.sx; delete el.dataset.sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }}>
          {L && <>
            <div className="flex items-center justify-between"><span className="label">Layer {pad(sel + 1, 2)} / {layers.length}</span>
              <button type="button" onClick={closeInspect} aria-label="Close specifications" className="h-[30px] w-[30px] rounded-full border border-ink-line">×</button></div>
            <h3 className="m-0 text-[1.6rem] font-bold leading-tight tracking-[-.025em] [text-wrap:balance]">{L.name}</h3>
            {L.sub && <div className="-mt-1.5 text-[.85rem] text-mute">{L.sub}</div>}
            <p className="m-0 font-serif text-[1.22rem] italic leading-snug text-[#e9e6d4]">{L.story}</p>
            <ul className="m-0 list-none border-t border-ink-line p-0">{L.specs.map(s => <li key={s} className="border-b border-ink-line py-2 text-[.86rem] leading-snug">{s}</li>)}</ul>
            {compare && other && (
              <div className="rounded-xl border border-ink-line bg-cream/5 p-3">
                <h4 className="label m-0 mb-1.5 font-normal">{device === 'phone' ? 'Slate Pro' : 'Crown Pro'} · {other.name}</h4>
                <ul className="m-0 list-none p-0">{other.specs.map(s => <li key={s} className="border-b border-ink-line py-1.5 text-[.8rem]">{s}</li>)}</ul>
              </div>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              {L.close && <button type="button" className="pill primary" onClick={() => lookCloser(sel, L.close!)}>Look closer</button>}
              {other && <button type="button" className="pill" aria-pressed={compare} onClick={() => setCompare(c => !c)}>Compare with {device === 'phone' ? 'Slate Pro' : 'Crown Pro'}</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="pill" onClick={() => step(-1)}>↑ Previous</button>
              <button type="button" className="pill" onClick={() => step(1)}>Next ↓</button>
            </div>
          </>}
        </section>

        {/* dock */}
        <div className="absolute z-[23] flex items-center gap-2 max-lg:inset-x-0 max-lg:overflow-x-auto max-lg:px-4 max-lg:[scrollbar-width:none] lg:left-[var(--gut-l)] lg:right-[var(--gut-r)] lg:flex-wrap lg:justify-center"
          style={{ bottom: 'max(14px, env(safe-area-inset-bottom, 0px))' }}>
          <div className="seg shrink-0" role="group" aria-label="Device">
            {(Object.keys(DEVICES) as DeviceKey[]).map(k => <button key={k} type="button" aria-pressed={device === k} onClick={() => switchDevice(k)}>{DEVICES[k].name}</button>)}
          </div>
          <label className="flex shrink-0 items-center gap-2.5 rounded-full border border-ink-line bg-ink-2/80 px-3.5 py-1.5 text-[.78rem] text-mute">
            Explode
            <input type="range" min={0} max={100} value={Math.round(explodeUI * 100)} className="w-[110px] accent-[var(--a2)] lg:w-[140px]"
              onChange={e => { const v = +e.target.value / 100; st.explode = v; setExplodeUI(v); wake(); }} />
          </label>
          <div className="seg shrink-0" role="group" aria-label="View mode">
            {MODES.map(([m, n]) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>{n}</button>)}
          </div>
          <button type="button" className="pill shrink-0" aria-pressed={scanner} onClick={() => { setScanner(s => !s); st.lens = null; wake(); }}
            style={scanner ? { borderColor: 'rgba(127,227,255,.6)', color: '#bdf1ff' } : undefined}>Scanner</button>
          <div className="flex shrink-0 gap-1.5 rounded-full border border-ink-line bg-ink-2/80 px-2 py-[5px]" role="group" aria-label="Finish">
            {finishes.map(k => <button key={k} type="button" title={FINISHES[k].name} aria-label={`${FINISHES[k].name} finish`} aria-pressed={finish === k}
              onClick={() => { setFinish(k); setAccent(...FINISHES[k].accent); wake(); }}
              className={`h-[22px] w-[22px] rounded-full border-2 ${finish === k ? 'border-cream' : 'border-transparent'}`} style={{ background: swatch(k) }} />)}
          </div>
          <button type="button" className="pill primary shrink-0" onClick={() => { if (st.build.active) endBuild(false); if (st.close) exitClose(false); closeInspect(); st.explode = 0; setExplodeUI(0); wake(); }}>Reassemble</button>
        </div>

        <p className="sr-only" aria-live="polite">{L ? `Layer ${sel + 1} of ${layers.length}: ${L.name}` : ''}{close?.ready ? `. Close-up: ${close.c.cap}` : ''}</p>
        {toast && (
          <div role="status" className={`absolute left-1/2 top-[76px] z-[25] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full border bg-ink-2/90 px-4 py-2 text-[.84rem] ${toast.bad ? 'border-[#d9714f]' : 'border-ink-line'}`}>
            {toast.msg}
            {toast.build && <button type="button" onClick={() => endBuild(false)} aria-label="Stop building" className="h-6 w-6 rounded-full border border-ink-line">×</button>}
          </div>
        )}

        {/* close-ups */}
        {close && (
          <div className={`absolute inset-0 z-[26] grid place-items-center ${close.ready && close.c.kind === 'shot' ? 'bg-ink/55' : 'pointer-events-none'}`}>
            {close.ready && close.c.kind === 'shot' && (
              <div className="relative aspect-video max-h-[calc(100%-160px)] w-[min(920px,calc(100%-32px))] touch-none overflow-hidden rounded-2xl border border-ink-line bg-ink"
                onWheel={e => setCuP(v => clamp(v + e.deltaY * 0.0012, 0, 1))}
                onPointerDown={e => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); (e.currentTarget as HTMLElement).dataset.sx = `${e.clientX},${cuP}`; }}
                onPointerMove={e => { const d = (e.currentTarget as HTMLElement).dataset.sx; if (!d) return; const [x0, p0] = d.split(',').map(Number); setCuP(clamp(p0 + (e.clientX - x0) / (e.currentTarget as HTMLElement).clientWidth, 0, 1)); }}
                onPointerUp={e => { delete (e.currentTarget as HTMLElement).dataset.sx; }}>
                <FrameSequence shots={[close.c.shot]} progress={cuP} />
              </div>
            )}
            {close.ready && close.c.kind === 'pixels' && (
              <div className="absolute left-1/2 top-1/2 -ml-[110px] -mt-[110px] h-[220px] w-[220px] rounded-full border-2 border-cream bg-black shadow-[0_20px_60px_rgba(0,0,0,.6)]" aria-hidden="true"
                style={{ backgroundImage: 'linear-gradient(90deg,#ff3b2f 0 30%,transparent 30% 33%,#39e05b 33% 63%,transparent 63% 66%,#3b6dff 66% 96%,transparent 96%),linear-gradient(0deg,transparent 0 8%,#000 8% 12%,transparent 12%)', backgroundSize: '22px 22px' }} />
            )}
            <p hidden={!close.ready} className="absolute inset-x-0 m-0 px-4 text-center text-[.9rem]" style={{ bottom: 'calc(max(14px, env(safe-area-inset-bottom, 0px)) + 110px)' }}>
              {close.c.cap}{close.c.kind === 'shot' ? ' · scroll or drag to play' : ''}
            </p>
            <button ref={backBtn} type="button" className="pill pointer-events-auto absolute left-1/2 -translate-x-1/2" style={{ bottom: 'calc(max(14px, env(safe-area-inset-bottom, 0px)) + 62px)' }} onClick={() => exitClose()}>Back to the stack</button>
          </div>
        )}
      </div>
    </section>
  );
}
