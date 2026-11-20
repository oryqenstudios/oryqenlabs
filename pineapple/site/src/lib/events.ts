import type { DeviceKey } from '../data/devices';

/** Ask the breakdown to open a layer (from Design's detail chips, and later the 3D close-ups). */
export function inspect(device: DeviceKey, layerId: string) {
  window.dispatchEvent(new CustomEvent('pineapple:inspect', { detail: { device, layerId } }));
}
export function onInspect(fn: (d: { device: DeviceKey; layerId: string }) => void) {
  const h = (e: Event) => fn((e as CustomEvent).detail);
  window.addEventListener('pineapple:inspect', h);
  return () => window.removeEventListener('pineapple:inspect', h);
}
