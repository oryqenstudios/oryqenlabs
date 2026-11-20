/**
 * The Sound section's spatial audio demo: a short generative loop (warm chord pad, a soft pentatonic arpeggio and a
 * bass pulse) played through an HRTF panner, so on headphones it sits where you put it around your head.
 * Starts only on a click (browsers require it) and stops when asked.
 */
type Engine = { ctx: AudioContext; panner: PannerNode; mono: GainNode; spatial: GainNode; out: GainNode; timer: number };
let eng: Engine | null = null;

const NOTES = [0, 3, 5, 7, 10, 12, 15]; // minor pentatonic, two octaves
const hz = (semi: number, base = 220) => base * Math.pow(2, semi / 12);

function voice(ctx: AudioContext, dest: AudioNode, f: number, t: number, len: number, type: OscillatorType, peak: number, cutoff = 2400) {
  const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
  o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cutoff;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + Math.min(0.02, len / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(lp).connect(g).connect(dest); o.start(t); o.stop(t + len + 0.05);
}

export function startSpatial(): boolean {
  if (eng) return true;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  const ctx = new AC();
  const out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
  out.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.6);
  const panner = new PannerNode(ctx, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1, positionX: 0, positionY: 0, positionZ: -1.2 });
  const spatial = ctx.createGain(), mono = ctx.createGain(); mono.gain.value = 0;
  const bus = ctx.createGain(); bus.gain.value = 0.5;
  bus.connect(panner).connect(spatial).connect(out); bus.connect(mono).connect(out);
  let step = 0, next = ctx.currentTime + 0.1;
  const beat = 0.24; // seconds per arpeggio step
  const tick = () => {
    while (next < ctx.currentTime + 0.4) {
      const bar = Math.floor(step / 16), chord = [0, -4, -7, -2][bar % 4];
      if (step % 16 === 0) { // pad and bass each bar
        for (const iv of [0, 7, 10, 15]) voice(ctx, bus, hz(chord + iv, 110), next, beat * 16, 'sawtooth', 0.035, 900);
        voice(ctx, bus, hz(chord, 55), next, beat * 3, 'sine', 0.5, 400);
      }
      if (step % 8 === 4) voice(ctx, bus, hz(chord, 55), next, beat * 2, 'sine', 0.35, 400);
      if (step % 2 === 0) voice(ctx, bus, hz(chord + NOTES[(step * 3 + bar) % NOTES.length], 440), next, beat * 2.2, 'triangle', 0.12);
      next += beat; step++;
    }
  };
  tick();
  const timer = window.setInterval(tick, 100);
  eng = { ctx, panner, mono, spatial, out, timer };
  return true;
}

export function stopSpatial() {
  if (!eng) return;
  const e = eng; eng = null;
  clearInterval(e.timer);
  e.out.gain.cancelScheduledValues(e.ctx.currentTime); e.out.gain.setTargetAtTime(0, e.ctx.currentTime, 0.12);
  setTimeout(() => e.ctx.close(), 600);
}

/** Put the sound at an angle around the listener (0° ahead, 90° right) and a distance (1 = arm's length). */
export function placeSpatial(deg: number, dist = 1.2) {
  if (!eng) return;
  const r = (deg * Math.PI) / 180, t = eng.ctx.currentTime;
  eng.panner.positionX.setTargetAtTime(Math.sin(r) * dist, t, 0.05);
  eng.panner.positionZ.setTargetAtTime(-Math.cos(r) * dist, t, 0.05);
}

/** Spatial on, or a plain centred mix to compare against. */
export function setSpatialMode(on: boolean) {
  if (!eng) return;
  const t = eng.ctx.currentTime;
  eng.spatial.gain.setTargetAtTime(on ? 1 : 0, t, 0.08); eng.mono.gain.setTargetAtTime(on ? 0 : 1, t, 0.08);
}
