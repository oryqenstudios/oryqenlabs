import { useEffect, useState } from 'react';
import { LogoButton } from './LogoButton';
import { scrollToTarget } from '../lib/scroll';
import { sound } from '../lib/sound';

export const NAV_LINKS: [string, string][] = [
  ['drop', 'Crown Pro'], ['reveal', 'Design'], ['finish', 'Finishes'], ['inside', 'Inside'], ['camera', 'Camera'],
  ['chip', 'Chip'], ['water', 'Durability'], ['slate', 'Slate Pro'], ['compare', 'Compare'],
];
export const FROM_PRICE = '$1,199'; // placeholder, see Compare

export function Nav() {
  const [active, setActive] = useState('drop');
  const [on, setOn] = useState(sound.on);
  useEffect(() => sound.subscribe(setOn), []);
  useEffect(() => {
    const els = NAV_LINKS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: '-50% 0px -50% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  const go = (e: React.MouseEvent, id: string) => { e.preventDefault(); scrollToTarget(`#${id}`); };
  return (
    <nav aria-label="Main" className="sticky z-50 border-b border-ink-line bg-ink/70 backdrop-blur-xl backdrop-saturate-150" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
      <div className="wrap flex h-[52px] items-center gap-5">
        <LogoButton small label="PINEAPPLE, back to top" onActivate={() => scrollToTarget(0)} className="flex items-center gap-2 text-[.82rem] font-bold tracking-[.08em]">
          PINEAPPLE
        </LogoButton>
        <div className="ml-auto hidden min-w-0 gap-[18px] overflow-x-auto text-[.8rem] [scrollbar-width:none] md:flex">
          {NAV_LINKS.map(([id, name]) => (
            <a key={id} href={`#${id}`} onClick={e => go(e, id)} aria-current={active === id ? 'true' : undefined}
              className={`whitespace-nowrap transition-colors duration-500 ease-brand ${active === id ? 'grad' : 'text-mute hover:text-cream'}`}>{name}</a>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2.5 md:ml-0">
          <button type="button" onClick={() => sound.set(!on)} aria-pressed={on} aria-label={on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'}
            className="grid h-8 w-8 place-items-center rounded-full border border-ink-line">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-4 w-4" aria-hidden="true">
              <path d="M2 6h2.5L8 3v10L4.5 10H2z" />
              {on ? <path d="M11 5.5c1 .8 1 4.2 0 5M13 4c2 1.8 2 6.2 0 8" /> : <path d="M11 6l3.5 4M14.5 6L11 10" />}
            </svg>
          </button>
          <button type="button" onClick={() => scrollToTarget('#compare')} className="whitespace-nowrap rounded-full px-3.5 py-1.5 text-[.8rem] font-semibold text-char" style={{ background: 'var(--grad)' }}>
            Buy · from {FROM_PRICE}
          </button>
        </div>
      </div>
    </nav>
  );
}
