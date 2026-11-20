/** Sound is off by default (plan §11). Only plays after the visitor turns it on. */
let on = false;
let ctx: AudioContext | null = null;
const listeners = new Set<(v: boolean) => void>();
export const sound = {
  get on() { return on; },
  set(v: boolean) { on = v; listeners.forEach(l => l(v)); if (v) play('shimmer'); },
  subscribe(l: (v: boolean) => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};
export function play(kind: 'click' | 'shimmer') {
  if (!on) return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime;
    if (kind === 'click') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.09);
      g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.15);
    } else {
      [1320, 1760, 2217, 2637].forEach((f, i) => {
        const o = ctx!.createOscillator(), g = ctx!.createGain(), s = t + i * 0.04;
        o.frequency.value = f; g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.05, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, s + 0.9);
        o.connect(g).connect(ctx!.destination); o.start(s); o.stop(s + 1);
      });
    }
  } catch { /* audio unavailable */ }
}
