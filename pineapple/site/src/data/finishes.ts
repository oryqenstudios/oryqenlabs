export type FinishKey = 'ripen' | 'rind' | 'golden' | 'green' | 'core';
export type ZestKey = 'mango' | 'lime' | 'guava' | 'blueberry' | 'coconut';

export interface Finish { key: FinishKey; name: string; stops: [string, string, string]; frame: string; accent: [string, string]; desc: string }

export const FINISHES: Record<FinishKey, Finish> = {
  ripen: { key: 'ripen', name: 'Ripen', stops: ['#78a947', '#b4b246', '#f1b93f'], frame: '#b6a065', accent: ['#6fa43f', '#f0b53a'], desc: 'A thin-film coating that shifts from green to gold between 0° and 60°.' },
  rind: { key: 'rind', name: 'Rind', stops: ['#665632', '#5a4b2d', '#4b3f27'], frame: '#4d4433', accent: ['#9f8248', '#d6b46a'], desc: 'Deep olive-bronze, the colour of the skin, over a rind-textured titanium frame.' },
  golden: { key: 'golden', name: 'Golden Flesh', stops: ['#f4da82', '#eccb60', '#e0b746'], frame: '#cbb06d', accent: ['#e2ad35', '#f6d978'], desc: 'Warm yellow-gold, cut straight from the middle of the fruit.' },
  green: { key: 'green', name: 'Crown Green', stops: ['#4b773f', '#3d6536', '#30532c'], frame: '#37492f', accent: ['#4b8a3a', '#a6cf6e'], desc: 'Leaf green, taken from the crown.' },
  core: { key: 'core', name: 'Core', stops: ['#f2ecd6', '#e9e0c3', '#ddd2b2'], frame: '#c9c1a6', accent: ['#b8a676', '#efe2b8'], desc: 'Warm cream, pale as the centre of the fruit.' },
};

export const ZEST: Record<ZestKey, { name: string; c: string }> = {
  mango: { name: 'Mango', c: '#f6a12e' },
  lime: { name: 'Lime', c: '#a7d13b' },
  guava: { name: 'Guava', c: '#ef6f8a' },
  blueberry: { name: 'Blueberry', c: '#4c5fc4' },
  coconut: { name: 'Coconut', c: '#f1ede2' },
};

export const PHONE_FINISHES: FinishKey[] = ['ripen', 'rind', 'golden', 'green', 'core'];
export const TABLET_FINISHES: FinishKey[] = ['ripen', 'rind', 'core'];
/** The five eruption colours (shot 2) and the burst palette. */
export const ERUPTION = ['#4b3f27', '#f0c64e', '#3f6b35', '#efe6c8', '#a6b542'];
export const swatch = (k: FinishKey | ZestKey) =>
  k in FINISHES ? `linear-gradient(180deg,${FINISHES[k as FinishKey].stops[0]},${FINISHES[k as FinishKey].stops[2]})` : ZEST[k as ZestKey].c;
