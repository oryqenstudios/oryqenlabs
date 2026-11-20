import { useState } from 'react';
import { Chips } from '../components/Chips';
import { FINISHES, ZEST, PHONE_FINISHES, TABLET_FINISHES, swatch, type FinishKey, type ZestKey } from '../data/finishes';

type Model = 'crown' | 'zest' | 'slate';
/** Placeholder prices in USD; Zest specs, prices and currency are open decisions (plan §15). */
const MODELS: Record<Model, { name: string; fins: (FinishKey | ZestKey)[]; base: number }> = {
  crown: { name: 'Crown Pro', fins: PHONE_FINISHES, base: 1199 },
  zest: { name: 'Zest', fins: Object.keys(ZEST) as ZestKey[], base: 799 },
  slate: { name: 'Slate Pro', fins: TABLET_FINISHES, base: 1499 },
};
const STORAGE: Record<string, number> = { '256': 0, '512': 200, '1024': 400, '2048': 800 };
const ROWS: [string, string, string, string][] = [
  ['Dimensions', '149.6 × 71.4 × 7.9 mm', '', '281.6 × 215.5 × 5.1 mm'],
  ['Weight', '189 g', '', '579 g'],
  ['Display', '6.5-inch Solaris LTPO OLED, 1–144 Hz', '', '13-inch tandem OLED, 1–144 Hz'],
  ['Chip', 'Nectar N7 Pro', '', 'Nectar N7 Max'],
  ['Water and dust', 'IP68, 6 m for 30 minutes', '', 'Not water-rated'],
  ['Connectivity', '5G (sub-6 GHz and mmWave), Wi-Fi 7, Bluetooth 6.0, ultra-wideband, NFC, satellite messaging', '', 'Wi-Fi 7, Bluetooth 6.0, optional 5G'],
  ['Storage', '256 GB, 512 GB, 1 TB, 2 TB', '', '256 GB, 512 GB, 1 TB, 2 TB'],
  ['Operating system', 'Canopy OS 3', 'Canopy OS 3', 'Canopy OS 3'],
  ['Finishes', 'Rind, Golden Flesh, Crown Green, Core, Ripen', 'Mango, Lime, Guava, Blueberry, Coconut', 'Ripen, Rind, Core'],
  ['Accessories', 'Snap-on magnetic cases and wallet', '', 'Quill stylus, Husk keyboard case'],
];
const finName = (k: FinishKey | ZestKey) => (k in FINISHES ? FINISHES[k as FinishKey].name : ZEST[k as ZestKey].name);

const BASE = import.meta.env.BASE_URL;
const FINS_OF = (m: Model) => MODELS[m].fins;

/** 10 · Compare & buy. The configurator shows a studio photograph of each model and colour, front and back. */
export function Compare() {
  const [model, setModel] = useState<Model>('crown');
  const [fin, setFin] = useState<FinishKey | ZestKey>('ripen');
  const [sto, setSto] = useState('256');
  const M = MODELS[model];
  const f = M.fins.includes(fin) ? fin : M.fins[0];
  return (
    <section id="compare" className="light py-[16vh]">
      <div className="wrap">
        <p className="label">11 · Compare</p>
        <h2 className="mb-2.5 mt-3.5 text-[clamp(2.4rem,6vw,4.6rem)] font-bold leading-[1.02] tracking-[-.035em]">Pick your<br /><span className="grad">pineapple.</span></h2>
        <p className="m-0 text-mute-light">Choose a model, finish and storage.</p>

        <div className="mt-9 overflow-x-auto border-t border-paper-line">
          <table className="w-full min-w-[640px] border-collapse text-[.92rem]">
            <thead><tr>{['', 'Crown Pro', 'Zest', 'Slate Pro'].map(h => <th key={h} scope="col" className="border-b border-paper-line py-3.5 pr-3 text-left text-[1.15rem] font-semibold">{h || <span className="sr-only">Specification</span>}</th>)}</tr></thead>
            <tbody>
              {ROWS.map(([k, ...v]) => (
                <tr key={k}>
                  <th scope="row" className="w-[18%] border-b border-paper-line py-3.5 pr-3 text-left align-top font-medium text-mute-light">{k}</th>
                  {v.map((c, i) => <td key={i} className={`border-b border-paper-line py-3.5 pr-3 align-top ${c ? '' : 'italic text-mute-light'}`}>{c || 'To be defined'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-20 grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="relative aspect-[4/5] max-w-full overflow-hidden rounded-3xl bg-[#040302] md:aspect-[16/10]">
            {(Object.keys(MODELS) as Model[]).flatMap(m => FINS_OF(m).map(k => {
              const on = m === model && k === f;
              return (
                <picture key={`${m}-${k}`}>
                  <source media="(max-width: 760px)" srcSet={`${BASE}frames/mobile/compare/${m}-${k}.webp`} />
                  <img src={`${BASE}frames/compare/${m}-${k}.webp`} alt={on ? `${MODELS[m].name} in ${finName(k)}, front and back.` : ''} aria-hidden={!on}
                    loading={on ? 'eager' : 'lazy'} decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-brand max-md:object-contain"
                    style={{ opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(1.025)' }} />
                </picture>
              );
            }))}
          </div>
          <div className="grid gap-[22px]">
            <h3 className="m-0 text-[2rem] tracking-[-.03em]">{M.name}</h3>
            <div className="grid gap-2"><span className="label">Model</span>
              <Chips label="Model" value={model} onChange={setModel} items={(Object.keys(MODELS) as Model[]).map(k => ({ value: k, label: MODELS[k].name }))} /></div>
            <div className="grid gap-2"><span className="label">Finish · {finName(f)}</span>
              <Chips label="Finish" value={f} onChange={setFin} items={M.fins.map(k => ({ value: k, label: finName(k), swatch: swatch(k) }))} /></div>
            <div className="grid gap-2"><span className="label">Storage</span>
              <Chips label="Storage" value={sto} onChange={setSto} items={Object.keys(STORAGE).map(k => ({ value: k, label: +k >= 1024 ? `${+k / 1024} TB` : `${k} GB` }))} /></div>
            <div className="text-[1.4rem] font-[650] tabular-nums">${(M.base + STORAGE[sto]).toLocaleString('en-US')}</div>
            <p className="m-0 text-[.8rem] text-mute-light">Placeholder prices in USD. Zest pricing, specs and currency are still open decisions.</p>
            <button type="button" className="justify-self-start rounded-full bg-char px-[22px] py-3 font-semibold text-paper">Buy</button>
          </div>
        </div>
      </div>
    </section>
  );
}
