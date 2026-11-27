import { isTouch } from '../lib/tokens';

/**
 * How much 3D this visitor gets (plan §11: "lower-power devices get reduced quality or still renders").
 *
 *   full     desktop: the stage as designed.
 *   reduced  touch devices (and any device that cannot hold the frame rate): pixel ratio capped at 1.5, no
 *            antialiasing on screens of pixel ratio 2 or more, no extra render passes, fewer particles, textures
 *            capped at 1024 px.
 *   stills   no WebGL at all: the page shows its still images.
 *
 * Picked once at load from WebGL support, Save-Data, prefers-reduced-motion, device memory and the kind of screen;
 * then the stage watches its frame rate and drops a tier when it cannot keep up (Stage.tsx), or straight to stills
 * when the GPU context is lost. `?quality=high|reduced|low` forces a tier for testing and turns the watchdog off.
 */
export type Quality = 'full' | 'reduced' | 'stills';
const TIERS: Quality[] = ['full', 'reduced', 'stills'];

const media = (q: string) => typeof matchMedia !== 'undefined' && matchMedia(q).matches;

function detect(): Quality {
  const forced = new URLSearchParams(location.search).get('quality');
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try { const c = document.createElement('canvas'); gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null; } catch { gl = null; }
  if (!gl) return 'stills';
  if (forced === 'low') return 'stills';
  if (forced === 'reduced') return 'reduced';
  if (forced === 'high') return 'full';
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return 'stills';
  // the 3D here is all motion (the logo burst, devices flying in); still images are the calm version
  if (media('(prefers-reduced-motion: reduce)')) return 'stills';
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return 'stills';
  // software rasterisers cannot hold the frame rate
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return 'stills';
  if (isTouch()) return 'reduced';
  return 'full';
}

/** Forced by ?quality= (tests, demos): the runtime watchdog leaves it alone. */
export const qualityForced = new URLSearchParams(location.search).has('quality');
let quality: Quality = detect();
const listeners = new Set<(q: Quality) => void>();
export const getQuality = () => quality;
export function setQuality(q: Quality) { if (q === quality) return; quality = q; listeners.forEach(l => l(q)); }
export function subscribeQuality(l: (q: Quality) => void) { listeners.add(l); return () => { listeners.delete(l); }; }
/** One tier down (full → reduced → stills). */
export function dropQuality() { setQuality(TIERS[Math.min(TIERS.length - 1, TIERS.indexOf(quality) + 1)]); }

export interface Profile {
  /** Canvas pixel ratio range. */
  dpr: [number, number];
  antialias: boolean;
  /** The hover lens needs a stencil buffer and a second render of the scene. */
  lensPass: boolean;
  powerPreference: WebGLPowerPreference;
  /** Reflection map size for the studio lighting. */
  envRes: number;
  /** Longest texture edge, in px. */
  maxTexture: number;
  /** Share of the particles (burst scales, heat flow) to draw. */
  particles: number;
}

/** What each tier draws. `full` is exactly the desktop stage; never change it for the sake of phones. */
export function profile(q: Quality = quality): Profile {
  if (q === 'full') return { dpr: [1, 2], antialias: true, lensPass: true, powerPreference: 'high-performance', envRes: 256, maxTexture: 4096, particles: 1 };
  const ratio = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
  return {
    dpr: [1, Math.min(1.5, Math.max(1, ratio))],
    // on a dense screen the edges are already finer than the eye; multisampling there costs a lot for little
    antialias: ratio < 2,
    lensPass: false, powerPreference: 'default', envRes: 128, maxTexture: 1024, particles: 0.6,
  };
}
