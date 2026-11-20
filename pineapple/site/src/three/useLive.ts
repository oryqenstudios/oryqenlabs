import { useEffect, useState } from 'react';
import { getQuality, subscribeQuality } from './quality';

/** True while the page shows live 3D; false when it has fallen back to still renders. */
export function useLive() {
  const [live, setLive] = useState(getQuality() === 'live');
  useEffect(() => subscribeQuality(q => setLive(q === 'live')), []);
  return live;
}
