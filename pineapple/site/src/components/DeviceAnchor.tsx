import type { ReactNode } from 'react';
import { useStageAnchor } from '../three/useStageAnchor';
import type { AnchorSpec } from '../three/store';
import { useEffect, useState } from 'react';
import { useLive } from '../three/useLive';
import { stage } from '../three/store';

interface Props { id: string; spec: AnchorSpec; className?: string; label?: string; fallback?: ReactNode; children?: ReactNode }

/**
 * Where the live device sits inside a section. It shows `fallback` (the master stills) as a poster until the 3D stage
 * has loaded, and for good without WebGL (plan §11: still renders for low-power devices).
 */
export function DeviceAnchor({ id, spec, className = '', label, fallback, children }: Props) {
  const ref = useStageAnchor(id, spec);
  const live = useLive();
  const [ready, setReady] = useState(stage.isReady);
  useEffect(() => { let on = true; stage.ready.then(() => { if (on) setReady(true); }); return () => { on = false; }; }, []);
  return (
    <div ref={ref} className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} ${spec.interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      style={{ touchAction: spec.interactive ? 'pan-y' : undefined }}
      role={label ? 'img' : undefined} aria-label={label}>
      {(!live || !ready) && fallback}
      {children}
    </div>
  );
}
