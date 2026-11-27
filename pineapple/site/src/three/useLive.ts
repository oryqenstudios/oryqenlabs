import { useEffect, useState } from 'react';
import { getQuality, subscribeQuality, type Quality } from './quality';

/** The current quality tier; re-renders when the stage drops a tier. */
export function useQuality() {
  const [q, setQ] = useState<Quality>(getQuality());
  useEffect(() => { setQ(getQuality()); return subscribeQuality(setQ); }, []);
  return q;
}

/** True while the page shows live 3D (full or reduced); false when it has fallen back to still renders. */
export function useLive() {
  return useQuality() !== 'stills';
}
