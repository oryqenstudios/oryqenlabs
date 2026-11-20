/**
 * Device breakdown (plan §7) for the live models: explode, pull a layer, inspect, view modes,
 * colour bursts, the hover-lens pass and Build it yourself. The UI owns a BreakdownState; the
 * render loop owns one BreakdownRuntime per model and applies the state to it every frame.
 */
import * as THREE from 'three';
import type { DeviceModel } from './devices3d';
import { clamp, lerp, sm } from '../lib/math';

export type ViewMode = 'normal' | 'xray' | 'thermal' | 'dims';
export type CloseKind = 'shot' | 'pixels' | 'rake';

export interface BreakdownState {
  /** Explode target 0–1 (scroll or slider). */
  explode: number;
  mode: ViewMode;
  selected: number;
  /** Layer under the cursor in 3D (written by the renderer) and the name hovered in the list. */
  hover: number;
  listHover: number;
  /** Hover-lens scanner on, and its position in client px. */
  scanner: boolean;
  lens: { x: number; y: number } | null;
  close: { layer: number; kind: CloseKind } | null;
  /** Visitor zoom (pinch / Ctrl + scroll). */
  zoom: number;
  /** Move the device off-centre (px) and shrink it (fit) while the spec panel is open. */
  shift: { x: number; y: number };
  fit: number;
  build: { active: boolean; next: number };
  /** DOM the renderer writes to each frame (no React re-render per frame). */
  dom: { orbit?: HTMLElement | null; sep?: HTMLElement | null; labels?: HTMLElement | null; lens?: HTMLElement | null; lensText?: HTMLElement | null; stage?: HTMLElement | null };
  onReassembled?: () => void;
  onHoverChange?: (i: number) => void;
}

export function createBreakdownState(): BreakdownState {
  return { explode: 0, mode: 'normal', selected: -1, hover: -1, listHover: -1, scanner: false, lens: null, close: null, zoom: 1, shift: { x: 0, y: 0 }, fit: 1, build: { active: false, next: 0 }, dom: {} };
}

/* ------------------------------------------------------------------ runtime */

interface Snap { color: THREE.Color; emissive: THREE.Color | null; opacity: number; transparent: boolean; map: THREE.Texture | null; metal: number; rough: number; depthWrite: boolean }
interface LayerRT { t: number; pull: THREE.Vector3; pv: THREE.Vector3; fade: number; glow: number; pop: number; scatter: THREE.Vector3; placed: boolean; mats: THREE.Material[]; sprite: THREE.Sprite; edges: THREE.LineSegments[] }

export interface BreakdownRuntime {
  model: DeviceModel;
  layers: LayerRT[];
  exp: number; expV: number;
  mode: ViewMode;
  snaps: Map<THREE.Material, Snap>;
  keyGroup: THREE.Object3D | null;
  chip: THREE.Object3D | null;
  sink: THREE.Object3D | null;
  /** The pull currently being dragged. */
  drag: { i: number; p0: THREE.Vector3; start: THREE.Vector3 } | null;
}

const BURST = ['#f0b53a', '#6fa43f', '#e8873a', '#a6cf6e', '#f6d978', '#4b8a3a', '#e2ad35', '#c9d86b', '#ef8f4f', '#89b35a'];
let glowTex: THREE.Texture | null = null;
function glow() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c); glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

export function createRuntime(model: DeviceModel): BreakdownRuntime {
  const snaps = new Map<THREE.Material, Snap>();
  const burstSize = model.height * 0.68;
  const layers = model.layers.map((L, i): LayerRT => {
    const mats = [...new Set(L.meshes.map(m => m.material as THREE.Material))];
    for (const m of mats) {
      const s = m as THREE.MeshStandardMaterial;
      snaps.set(m, { color: s.color.clone(), emissive: s.emissive ? s.emissive.clone() : null, opacity: s.opacity, transparent: s.transparent, map: s.map ?? null, metal: s.metalness ?? 0, rough: s.roughness ?? 1, depthWrite: s.depthWrite });
    }
    // colour burst behind each layer as it separates (plan §12)
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow(), color: BURST[i % 10], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    sprite.scale.setScalar(burstSize); sprite.position.z = -0.25; sprite.visible = false; L.group.add(sprite);
    // X-ray outlines for the outer shell
    const edges: THREE.LineSegments[] = [];
    if (L.data.shell && L.meshes[0]) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(L.meshes[0].geometry, 30), new THREE.LineBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0, depthWrite: false }));
      e.visible = false; L.meshes[0].add(e); edges.push(e);
    }
    return { t: 0, pull: new THREE.Vector3(), pv: new THREE.Vector3(), fade: 1, glow: 0, pop: 0, scatter: new THREE.Vector3(), placed: true, mats, sprite, edges };
  });
  return {
    model, layers, exp: 0, expV: 0, mode: 'normal', snaps, drag: null,
    keyGroup: model.root.getObjectByName('crown-key') ?? null,
    chip: model.root.getObjectByName('chip') ?? null,
    sink: model.layers.find(l => l.data.sink)?.group ?? null,
  };
}

const cyan = new THREE.Color(0x7fe3ff), tmp = new THREE.Color(), thermalC = new THREE.Color();
const STOPS: [number, number][] = [[0, 0x2b59ff], [0.3, 0x29d3ff], [0.55, 0x7cff6b], [0.78, 0xffd23f], [1, 0xff4b2b]];
export function thermalColour(t: number, out: THREE.Color) {
  const s = clamp((t - 28) / (42 - 28), 0, 1);
  for (let k = 1; k < STOPS.length; k++) if (s <= STOPS[k][0]) { const a = STOPS[k - 1], b = STOPS[k]; return out.set(a[1]).lerp(tmp.set(b[1]), (s - a[0]) / (b[0] - a[0])); }
  return out.set(0xff4b2b);
}

/**
 * Advance one model. `st` is the breakdown state when this model is showing in the breakdown,
 * otherwise null (everything eases back to assembled and normal). `vis` is the device's
 * on-screen presence, used for the staggered morph between Crown Pro and Slate Pro.
 * Returns true while anything is still moving.
 */
export function stepRuntime(rt: BreakdownRuntime, st: BreakdownState | null, vis: number, dt: number, time: number, accent: THREE.Color, reduced: boolean): boolean {
  const m = rt.model, n = m.layers.length, mid = (n - 1) / 2;
  const mode: ViewMode = st ? st.mode : 'normal';
  let busy = false;

  // explode: slightly underdamped spring, so reassembly lands with a "click"
  const target = st ? st.explode : 0, prev = rt.exp;
  if (reduced) { rt.exp = target; rt.expV = 0; } else { rt.expV += ((target - rt.exp) * 95 - rt.expV * 13.5) * dt; rt.exp += rt.expV * dt; }
  if (Math.abs(target - rt.exp) > 0.001 || Math.abs(rt.expV) > 0.01) busy = true;
  if (st && prev > 0.03 && rt.exp <= 0.003 && target === 0) st.onReassembled?.();

  if (mode !== rt.mode) { // thermal hides texture maps so the heat colours read cleanly
    for (const [mat, s] of rt.snaps) if (s.map) { (mat as THREE.MeshStandardMaterial).map = mode === 'thermal' ? null : s.map; mat.needsUpdate = true; }
    rt.mode = mode;
  }

  const sel = st && !st.build.active ? st.selected : -1;
  for (let i = 0; i < n; i++) {
    const L = m.layers[i], r = rt.layers[i];
    const delay = (1 - Math.abs(i - mid) / mid) * 0.35; // outer layers move first
    r.t = sm(0, 1, (Math.max(0, rt.exp) - delay) / 0.65);
    // pulled layers spring back on release
    if (!rt.drag || rt.drag.i !== i) {
      if (r.pull.lengthSq() > 1e-6 || r.pv.lengthSq() > 1e-6) { r.pv.addScaledVector(r.pull, -140 * dt).multiplyScalar(Math.pow(0.004, dt)); r.pull.addScaledVector(r.pv, dt); busy = true; }
    }
    // the inspected layer comes to the front (or the back, for back-facing parts)
    r.pop += ((i === sel ? 1 : 0) - r.pop) * (1 - Math.pow(0.003, dt));
    let z = L.baseZ + m.spacing * (mid - i) * r.t;
    if (r.pop > 0.001) { const reach = m.spacing * mid * Math.max(rt.exp, 0.6) + m.spacing * 0.9; z = lerp(z, L.data.back ? m.layers[n - 1].baseZ - reach : m.layers[0].baseZ + reach, r.pop); }
    L.group.position.set(r.scatter.x + r.pull.x, r.scatter.y + r.pull.y, z + r.scatter.z + r.pull.z);

    r.fade += ((sel >= 0 ? (i === sel ? 1 : 0.06) : 1) - r.fade) * (1 - Math.pow(0.002, dt));
    r.glow += ((st && (st.hover === i || st.listHover === i) ? 1 : 0) - r.glow) * (1 - Math.pow(0.001, dt));
    const dFade = sm(0, 1, clamp(vis * 1.7 - i * 0.07, 0, 1)); // staggered morph between devices
    L.group.scale.setScalar(lerp(0.82, 1, dFade) * (i === sel ? 1.04 : 1));
    if (Math.abs(r.fade - (sel >= 0 ? (i === sel ? 1 : 0.06) : 1)) > 0.002 || Math.abs((i === sel ? 1 : 0) - r.pop) > 0.002 || Math.abs(r.glow - (st && (st.hover === i || st.listHover === i) ? 1 : 0)) > 0.002) busy = true;

    const sOp = r.t * 0.22 * dFade * r.fade * (mode === 'thermal' ? 0.3 : 1);
    r.sprite.material.opacity = sOp; r.sprite.visible = sOp > 0.003;
    for (const e of r.edges) { const o = mode === 'xray' ? 0.55 * dFade * r.fade : 0; (e.material as THREE.LineBasicMaterial).opacity = o; e.visible = o > 0.003; }

    // materials: fade, view mode, hover glow
    for (const mat of r.mats) {
      const s = rt.snaps.get(mat)!, std = mat as THREE.MeshStandardMaterial;
      let op = s.opacity * r.fade * dFade;
      if ((mat as THREE.MeshBasicMaterial).isMeshBasicMaterial) {
        std.color.copy(s.color);
        if (mode === 'thermal') thermalColour(L.data.temp, std.color).multiplyScalar(0.7);
      } else if (mode === 'thermal') {
        const hot = L.data.chip || L.data.sink;
        thermalColour(L.data.temp, thermalC);
        std.color.setRGB(0.02, 0.02, 0.02); std.emissive.copy(thermalC).multiplyScalar(0.42 + (hot ? 0.12 * (1 + Math.sin(time * 4)) : 0));
        std.metalness = 0; std.roughness = 1; busy = true;
      } else {
        if (!m.tinted.has(mat)) std.color.copy(s.color);
        if (s.emissive) std.emissive.copy(s.emissive);
        std.metalness = s.metal; std.roughness = s.rough;
        if (mode === 'xray') { if (L.data.shell) op *= 0.06; else std.emissive.add(tmp.copy(cyan).multiplyScalar(0.14)); }
        if (r.glow > 0.01 && i !== sel) std.emissive.add(tmp.copy(accent).multiplyScalar(0.14 * r.glow));
      }
      mat.opacity = op;
      const tr = op < 0.995 || s.transparent;
      if (mat.transparent !== tr) { mat.transparent = tr; mat.needsUpdate = true; }
      mat.depthWrite = s.depthWrite && !s.transparent && op > 0.6;
      mat.visible = op > 0.004;
    }
  }

  // Crown Key presses in two stages during the frame close-up
  if (rt.keyGroup) {
    const press = st?.close?.kind === 'rake' ? (() => { const ph = (time % 2.4) / 2.4; return ph < 0.2 ? ph / 0.2 : ph < 0.35 ? 1 : ph < 0.5 ? 1 - (ph - 0.35) / 0.15 : 0; })() : 0;
    rt.keyGroup.position.x = m.width / 2 + 0.05 - press * 0.06;
    if (press) busy = true;
  }
  return busy;
}

/** Lens pass: hide the outer shell, tint the insides, and draw only where the stencil disc is. */
export function setLensPass(rt: BreakdownRuntime, on: boolean) {
  for (let i = 0; i < rt.layers.length; i++) {
    const shell = !!rt.model.layers[i].data.shell;
    for (const mat of rt.layers[i].mats) {
      mat.stencilWrite = on; mat.stencilRef = 1; mat.stencilFunc = on ? THREE.EqualStencilFunc : THREE.AlwaysStencilFunc;
      if (shell) mat.visible = on ? false : rt.snaps.get(mat)!.opacity * rt.layers[i].fade > 0.004;
    }
    rt.layers[i].sprite.visible = on ? false : rt.layers[i].sprite.material.opacity > 0.003;
  }
}

/** Scatter the layers for Build it yourself (device-local units). */
export function scatter(rt: BreakdownRuntime, on: boolean) {
  const s = rt.model.height / 14.96, R = mulberry(Date.now() & 1023);
  rt.layers.forEach(r => {
    if (on) { const side = R() < 0.5 ? -1 : 1; r.scatter.set(side * (9 + R() * 5) * s, (R() - 0.5) * 12 * s, (R() - 0.5) * 6 * s); r.placed = false; }
    else { r.pull.add(r.scatter); r.scatter.set(0, 0, 0); r.placed = true; }
  });
}
function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
