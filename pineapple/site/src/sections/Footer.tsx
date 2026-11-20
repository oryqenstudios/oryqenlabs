import { LogoButton } from '../components/LogoButton';

const COLS: [string, [string, string][]][] = [
  ['Shop', [['Crown Pro', '#compare'], ['Zest', '#compare'], ['Slate Pro', '#slate'], ['Quill', '#slate'], ['Husk keyboard case', '#compare']]],
  ['Explore', [['Design', '#design'], ['Inside', '#inside'], ['Camera', '#camera'], ['Nectar chip', '#chip']]],
  ['Canopy OS', [['Canopy OS 3', '#compare'], ['Privacy', '#compare']]],
  ['Support', [['Repair', '#compare'], ['Trade in', '#compare'], ['Contact', '#compare']]],
];

export function Footer() {
  return (
    <footer className="border-t border-ink-line pb-[8vh] pt-[12vh]">
      <div className="wrap">
        <LogoButton className="mb-7 block h-[72px] w-[72px]" label="PINEAPPLE logo. Click to burst it; press and hold to charge a bigger burst." />
        <div className="my-10 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6 text-[.8rem]">
          {COLS.map(([h, links]) => (
            <div key={h} className="grid content-start gap-1.5"><b className="text-[.78rem] font-semibold">{h}</b>{links.map(([n, href]) => <a key={n} href={href} className="text-mute no-underline hover:text-cream">{n}</a>)}</div>
          ))}
        </div>
        <div className="grid max-w-[820px] gap-2.5 text-[.74rem] leading-relaxed text-mute">
          <p className="m-0">PINEAPPLE is a concept brand. Every product name, specification, price and finish on this page is a proposed placeholder and will be adjusted before launch.</p>
          <p className="m-0">Battery life, charging times and thermal figures are design targets, not measurements. Water resistance: IP68 to a maximum depth of 6 metres for up to 30 minutes, under controlled laboratory conditions; resistance may decrease as a result of normal wear.</p>
          <p className="m-0">© 2026 PINEAPPLE. Designed by nature’s math.</p>
        </div>
      </div>
    </footer>
  );
}
