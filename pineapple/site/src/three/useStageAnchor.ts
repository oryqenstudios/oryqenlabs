import { useCallback, useEffect, useRef } from 'react';
import { stage, type Anchor, type AnchorSpec } from './store';

/**
 * Marks a DOM element as a place the live device should occupy. The element stays in the page
 * flow (so the device rides with scroll, or stays put inside a pinned stage) and receives the
 * drag and cursor-light pointer events; the canvas itself never takes pointer events.
 */
export function useStageAnchor(id: string, spec: AnchorSpec) {
  const anchor = useRef<Anchor | null>(null);
  if (anchor.current) anchor.current.spec = spec; // latest spec every render
  useEffect(() => { stage.wake(); }, [spec.device, spec.finish, spec.rot[0], spec.rot[1]]);

  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) { if (anchor.current) stage.anchors.delete(id); anchor.current = null; return; }
    const a: Anchor = { id, el, spec, user: { x: 0, y: 0, vx: 0, vy: 0, dragging: false }, pointer: { x: 0.5, y: 0.5, inside: false } };
    anchor.current = a;
    stage.anchors.set(id, a);
    let last: { x: number; y: number; touch: boolean } | null = null;
    const local = (e: PointerEvent) => { const r = el.getBoundingClientRect(); a.pointer.x = (e.clientX - r.left) / r.width; a.pointer.y = (e.clientY - r.top) / r.height; };
    el.addEventListener('pointerdown', e => {
      if (!a.spec.interactive) return;
      el.setPointerCapture(e.pointerId); last = { x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse' };
      a.user.dragging = true; a.user.vx = a.user.vy = 0; stage.wake();
    });
    el.addEventListener('pointermove', e => {
      local(e); a.pointer.inside = true;
      if (last && a.user.dragging) {
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        a.user.vy = dx * 0.008; a.user.y += a.user.vy;
        if (!last.touch) { a.user.vx = dy * 0.006; a.user.x = Math.max(-1.2, Math.min(1.2, a.user.x + a.user.vx)); } // one-finger drag turns, vertical swipes still scroll
        last.x = e.clientX; last.y = e.clientY;
      }
      stage.wake();
    });
    const end = () => { last = null; a.user.dragging = false; stage.wake(); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') a.pointer.inside = false; stage.wake(); });
    stage.wake();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}
