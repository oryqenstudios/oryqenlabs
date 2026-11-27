import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { getQuality, setQuality } from './three/quality';
import { Nav } from './components/Nav';
import { Loader } from './components/Loader';
import { Hero } from './sections/Hero';
import { Design, Finish, Camera, Chip, Durability } from './sections/Cinematic';
import { Reveal } from './sections/Reveal';
import { Sound } from './sections/Sound';
import { Inside } from './sections/Inside';
import { Numbers } from './sections/Numbers';
import { Slate } from './sections/Slate';
import { Compare } from './sections/Compare';
import { Footer } from './sections/Footer';
import { initSmoothScroll, ScrollTrigger } from './lib/scroll';
import { loadManifest } from './sequence/player';
import { stage } from './three/store';
import { useLive } from './three/useLive';
import { burst } from './lib/burst';
import { isTouch } from './lib/tokens';

// The 3D stage loads in its own chunk so the page and the cinematic sections never wait for it.
const Stage = lazy(() => import('./three/Stage').then(m => ({ default: m.Stage })));
// Touch devices skip the loader: the hero's text and opening frame come first, and the 3D code follows once the page
// has gone quiet. Desktop keeps its loader, which waits for the 3D stage so the loading logo can burst into the hero.
const TOUCH = isTouch();

export default function App() {
  const [ready, setReady] = useState(false);
  const live = useLive();
  const [want3d, setWant3d] = useState(() => !TOUCH);
  useEffect(() => {
    if (want3d || !live) return;
    // a moment after first paint, at the next idle moment (Safari has no requestIdleCallback: a short timer instead)
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idle = -1, later = -1;
    const t = window.setTimeout(() => {
      if (w.requestIdleCallback) idle = w.requestIdleCallback(() => setWant3d(true), { timeout: 3000 });
      else later = window.setTimeout(() => setWant3d(true), 600);
    }, 1200);
    return () => { clearTimeout(t); if (idle >= 0) w.cancelIdleCallback?.(idle); if (later >= 0) clearTimeout(later); };
  }, [want3d, live]);
  useEffect(() => {
    initSmoothScroll();
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const timeout = new Promise(r => setTimeout(r, 3500)); // never hold the page hostage to a slow font
    const wait3d = !TOUCH && getQuality() === 'full' ? [stage.ready] : []; // nothing to wait for without a 3D stage
    Promise.race([Promise.all([fonts, loadManifest(), ...wait3d]), timeout]).then(() => { setReady(true); ScrollTrigger.refresh(); });
    // Build it yourself ends with the logo burst, rebuilt where the device was
    const onBurst = (e: Event) => { const { x, y } = (e as CustomEvent).detail; burst({ x, y, at: { left: x - 60, top: y - 60, width: 120 }, power: 1.6 }); };
    addEventListener('pineapple:burst', onBurst);
    return () => removeEventListener('pineapple:burst', onBurst);
  }, []);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-char">Skip to content</a>
      {!TOUCH && <Loader ready={ready} />}
      {live && want3d && <StageBoundary><Suspense fallback={null}><Stage /></Suspense></StageBoundary>}
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Reveal />
        <Design />
        <Finish />
        <Inside />
        <Numbers />
        <Camera />
        <Chip />
        <Sound />
        <Durability />
        <Slate />
        <Compare />
      </main>
      <Footer />
    </>
  );
}

/** If the 3D stage ever throws, the page carries on with still renders instead of a blank space. */
class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn('3D stage failed; showing still renders.', err); setQuality('stills'); }
  render() { return this.state.failed ? null : this.props.children; }
}
