interface Item<T extends string> { value: T; label: string; swatch?: string }
interface Props<T extends string> { items: Item<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string }

/** Single-choice chip group (finishes, palettes, storage). */
export function Chips<T extends string>({ items, value, onChange, label, className = '' }: Props<T>) {
  return (
    <div className={`chips flex flex-wrap gap-2 ${className}`} role="group" aria-label={label}>
      {items.map(it => (
        <button key={it.value} type="button" className="chip" aria-pressed={it.value === value} onClick={() => onChange(it.value)}>
          {it.swatch && <i style={{ background: it.swatch }} />}{it.label}
        </button>
      ))}
    </div>
  );
}
