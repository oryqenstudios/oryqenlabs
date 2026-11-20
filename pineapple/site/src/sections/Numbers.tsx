const NUMS: [string, string][] = [['6.5″', 'Solaris display, 487 ppi'], ['N7 Pro', 'Nectar chip, 2 nm'], ['5,000', 'mAh silicon-carbon battery'], ['7.9 mm', 'thin, 189 g']];

/** Key numbers in large coloured type (plan §7 "Stat cards"). */
export function Numbers() {
  return (
    <section className="light py-[14vh]" aria-label="Crown Pro in numbers">
      <div className="wrap">
        <p className="label">Crown Pro in numbers</p>
        <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-8 gap-y-7">
          {NUMS.map(([n, d]) => (
            <div key={n} className="grid gap-1 border-t border-paper-line pt-4">
              <b className="grad text-[clamp(2.6rem,5.4vw,4.4rem)] font-[750] leading-none tracking-[-.045em] tabular-nums">{n}</b>
              <span className="text-[.92rem] text-mute-light">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
