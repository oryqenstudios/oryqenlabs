import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { setQuality } from './three/quality';
import { Nav } from './components/Nav';
import { Loader } from './components/Loader';
import { SpiralBackground } from './components/SpiralBackground';
import { Hero } from './sections/Hero';
import { Design, Finish, Camera, Chip, Durability } from './sections/Cinematic';
import { Reveal } from './sections/Reveal';
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

// The 3D stage loads in its own chunk so the page and the cinematic sections never wait for it.
const Stage = lazy(() => import('./three/Stage').then(m => ({ default: m.Stage })));

export default function App() {
  const [ready, setReady] = useState(false);
  const live = useLive();
  useEffect(() => {
    initSmoothScroll();
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const timeout = new Promise(r => setTimeout(r, 3500)); // never hold the page hostage to a slow font
    Promise.race([Promise.all([fonts, loadManifest(), stage.ready]), timeout]).then(() => { setReady(true); ScrollTrigger.refresh(); });
    // Build it yourself ends with the logo burst, rebuilt where the device was
    const onBurst = (e: Event) => { const { x, y } = (e as CustomEvent).detail; burst({ x, y, at: { left: x - 60, top: y - 60, width: 120 }, power: 1.6 }); };
    addEventListener('pineapple:burst', onBurst);
    return () => removeEventListener('pineapple:burst', onBurst);
  }, []);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-char">Skip to content</a>
      <Loader ready={ready} />
      <SpiralBackground />
      {live && <StageBoundary><Suspense fallback={null}><Stage /></Suspense></StageBoundary>}
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
