import { useSyncExternalStore } from 'react';
import { FINISHES, PHONE_FINISHES, type FinishKey } from '../data/finishes';
import { setAccent } from './tokens';

/**
 * The finish the visitor chose, shared by every section that shows the phone (hero splash, Finish, droplets).
 * Remembered per browser as a convenience; the page works without storage.
 */
const KEY = 'pineapple.finish';
let current: FinishKey = 'ripen';
const subs = new Set<() => void>();

try {
  const saved = localStorage.getItem(KEY);
  if (saved && (PHONE_FINISHES as string[]).includes(saved)) current = saved as FinishKey;
} catch { /* storage blocked: start on Ripen */ }
if (current !== 'ripen' && typeof document !== 'undefined') setAccent(...FINISHES[current].accent);

export const getFinish = () => current;

export function chooseFinish(k: FinishKey) {
  setAccent(...FINISHES[k].accent);
  if (k === current) return;
  current = k;
  try { localStorage.setItem(KEY, k); } catch { /* not remembered, still applied */ }
  subs.forEach(f => f());
}

export function subscribeFinish(f: () => void) { subs.add(f); return () => { subs.delete(f); }; }

/** Re-renders when the chosen finish changes. */
export function useFinish(): FinishKey {
  return useSyncExternalStore(subscribeFinish, getFinish, getFinish);
}

/** Colours for small effects (droplets, glows) in the chosen finish. */
export function finishPalette(k: FinishKey): string[] {
  const f = FINISHES[k];
  return [...f.stops, ...f.accent];
}
