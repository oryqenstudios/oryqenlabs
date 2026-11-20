/** Original pineapple mark: faceted body, crown of three leaves. Colours follow the page accent. */
export function Logo({ className = '', title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id="lg-body" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--a2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--a1)' }} />
        </linearGradient>
        <clipPath id="cp-body"><path d={BODY} /></clipPath>
      </defs>
      {LEAVES.map((d, i) => <path key={i} className="leaf" d={d} style={{ fill: 'var(--a1)' }} />)}
      <path d={BODY} fill="url(#lg-body)" />
      <g clipPath="url(#cp-body)" stroke="#13140f" strokeOpacity=".38" strokeWidth="1.6" fill="none">
        <path d="M14 34l26 26M14 22l38 38M24 20l30 30M36 20l20 20M50 34L24 60M50 22L12 60M40 20L10 50M28 20L8 40" />
      </g>
    </svg>
  );
}
export const BODY = 'M32 23c9.6 0 15 7.6 15 17.2C47 50.6 40.6 59 32 59s-15-8.4-15-18.8C17 30.6 22.4 23 32 23z';
export const LEAVES = [
  'M32 24c-2.4-6.4-2-13.6 0-21 2 7.4 2.4 14.6 0 21z',
  'M30.6 25C25 21.4 21 15.6 18.6 9.4c5.6 3 10 8.4 12 15.6z',
  'M33.4 25c5.6-3.6 9.6-9.4 12-15.6-5.6 3-10 8.4-12 15.6z',
];
