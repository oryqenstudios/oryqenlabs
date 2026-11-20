import type { ReactNode } from 'react';

/** Corner stat cards (plan: "Layers separated 7/10", "Orbit 342°"). */
export function Readouts({ items, className = '' }: { items: [string, ReactNode][]; className?: string }) {
  return (
    <div className={`readouts ${className}`} aria-live="off">
      {items.map(([k, v]) => <div className="card" key={k}><span>{k}</span><b>{v}</b></div>)}
    </div>
  );
}
