/**
 * Live 3D or still renders (plan §11: "lower-power devices get reduced quality or still renders").
 * Decided once at load from the device, then revised at runtime: the stage drops to stills if the
 * frame rate stays low or the GPU context is lost. `?quality=low|high` forces either, for testing.
 */
export type Quality = 'live' | 'stills';

function detect(): Quality {
  const forced = new URLSearchParams(location.search).get('quality');
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  try { const c = document.createElement('canvas'); gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null; } catch { gl = null; }
  if (!gl) return 'stills';
  if (forced === 'low') return 'stills';
  if (forced === 'high') return 'live';
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return 'stills';
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return 'stills';
  // software rasterisers cannot hold the frame rate
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return 'stills';
  return 'live';
}

/** Forced by ?quality= (tests, demos): the runtime watchdog leaves it alone. */
export const qualityForced = new URLSearchParams(location.search).has('quality');
let quality: Quality = detect();
const listeners = new Set<(q: Quality) => void>();
export const getQuality = () => quality;
export function setQuality(q: Quality) { if (q === quality) return; quality = q; listeners.forEach(l => l(q)); }
export function subscribeQuality(l: (q: Quality) => void) { listeners.add(l); return () => { listeners.delete(l); }; }
