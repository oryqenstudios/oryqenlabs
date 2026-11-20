import { FINISHES, PHONE_FINISHES, type FinishKey } from '../data/finishes';

const BASE = import.meta.env.BASE_URL;

/**
 * Photoreal master stills (AI shot 00), one per finish, stacked and crossfaded when a finish is picked.
 * Scroll adds a slow push-in. Phones load the 1080p copies.
 */
export function FinishStills({ finish, progress }: { finish: FinishKey; progress: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" style={{ transform: `scale(${1 + progress * 0.06})`, transformOrigin: '50% 45%' }}>
      {PHONE_FINISHES.map(k => (
        <picture key={k}>
          <source media="(max-width: 760px)" srcSet={`${BASE}frames/mobile/shot-00/${k}.webp`} />
          <img src={`${BASE}frames/shot-00/${k}.webp`} alt={k === finish ? `Crown Pro in ${FINISHES[k].name}` : ''} aria-hidden={k !== finish}
            loading={k === finish ? 'eager' : 'lazy'} decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-brand"
            style={{ opacity: k === finish ? 1 : 0 }} />
        </picture>
      ))}
    </div>
  );
}
