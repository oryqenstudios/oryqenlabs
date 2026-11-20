import type { ReactNode } from 'react';
import { useStageAnchor } from '../three/useStageAnchor';
import type { AnchorSpec } from '../three/store';
import { useLive } from '../three/useLive';

interface Props { id: string; spec: AnchorSpec; className?: string; label?: string; fallback?: ReactNode; children?: ReactNode }

/**
 * Where the live device sits inside a section. Without WebGL it shows `fallback`
 * (the master stills) instead (plan §11: still renders for low-power devices).
 */
export function DeviceAnchor({ id, spec, className = '', label, fallback, children }: Props) {
  const ref = useStageAnchor(id, spec);
  const live = useLive();
  return (
    <div ref={ref} className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} ${spec.interactive ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      style={{ touchAction: spec.interactive ? 'pan-y' : undefined }}
      role={label ? 'img' : undefined} aria-label={label}>
      {!live && fallback}
      {children}
    </div>
  );
}
