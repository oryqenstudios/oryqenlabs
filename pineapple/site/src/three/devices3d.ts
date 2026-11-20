/**
 * Procedural Crown Pro and Slate Pro (plan §9: "built procedurally in code"), one THREE.Group per
 * breakdown layer so phase 3 can explode them. Units: 1 = 10 mm.
 */
import * as THREE from 'three';
import { PHONE, TABLET, type Layer, type DeviceKey } from '../data/devices';
import { FINISHES, ZEST, type FinishKey, type ZestKey } from '../data/finishes';
import { rng, lerp, sm } from '../lib/math';
import { rr, hexShape, ext, normUV, cyl } from './geometry';
import { drawScales, rindTexture, wallpaper, labelTexture, canvasTexture, TEX_LO, TEX_HI } from './textures';

export type AnyFinish = FinishKey | ZestKey;

export interface LayerModel {
  data: Layer;
  index: number;
  group: THREE.Group;
  meshes: THREE.Mesh[];
  /** z when assembled */
  baseZ: number;
  /** what the camera looks at for this layer's close-up */
  focus: THREE.Object3D;
}

export interface DeviceModel {
  key: DeviceKey;
  root: THREE.Group;
  /** Device height in world units, for fitting it into a screen rectangle. */
  height: number;
  width: number;
  /** Layer spacing when fully exploded (phase 3). */
  spacing: number;
  layers: LayerModel[];
  /** Materials whose colour the finish drives (the breakdown leaves their colour alone). */
  tinted: Set<THREE.Material>;
  setFinish(k: AnyFinish, instant?: boolean): void;
  /** Per frame: finish colour blending and the Ripen angle shift. */
  update(dt: number, camera: THREE.Camera): void;
  /** Swap the 512 px textures for 2K/4K ones. */
  upgradeTextures(): void;
}

const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, ...o });
const phys = (o: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial({ roughness: 0.3, metalness: 0, ...o });
const glass = () => phys({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2, depthWrite: false });

/** Replace a texture's image at a new size: the GPU copy is immutable storage, so free it first. */
function swapImage(t: THREE.Texture, img: HTMLCanvasElement) { t.dispose(); t.image = img; t.needsUpdate = true; }

/** A colour that eases toward a target (one curve: exponential approach ≈ easeOutQuint over ~0.6 s). */
class Tint {
  cur = new THREE.Color(); target = new THREE.Color();
  constructor(public mat: THREE.MeshStandardMaterial) { this.cur.copy(mat.color); this.target.copy(mat.color); }
  set(c: THREE.ColorRepresentation, instant = false) { this.target.set(c); if (instant) this.cur.copy(this.target); }
  step(dt: number) { this.cur.lerp(this.target, 1 - Math.exp(-dt * 7)); this.mat.color.copy(this.cur); }
}

function finishColours(k: AnyFinish) {
  if (k in ZEST) { const c = ZEST[k as ZestKey].c; return { back: c, frame: new THREE.Color(c).lerp(new THREE.Color('#c8c8c0'), 0.45).getStyle(), plateau: c }; }
  const f = FINISHES[k as FinishKey];
  return { back: f.stops[1], frame: f.frame, plateau: k === 'ripen' ? '#b8b048' : f.stops[1] };
}

function makeLayerFactory(root: THREE.Group, data: Layer[], layers: LayerModel[]) {
  return (index: number, baseZ: number, build: (add: (g: THREE.BufferGeometry, m: THREE.Material, parent?: THREE.Object3D) => THREE.Mesh, L: LayerModel) => void) => {
    const L: LayerModel = { data: data[index], index, group: new THREE.Group(), meshes: [], baseZ, focus: null as unknown as THREE.Object3D };
    L.group.name = data[index].id;
    const add = (g: THREE.BufferGeometry, m: THREE.Material, parent?: THREE.Object3D) => {
      const mesh = new THREE.Mesh(g, m);
      (parent ?? L.group).add(mesh); L.meshes.push(mesh); mesh.userData.layer = L;
      return mesh;
    };
    build(add, L);
    L.focus ??= L.group;
    L.group.position.z = baseZ;
    root.add(L.group); layers.push(L);
    return L;
  };
}

/* ------------------------------------------------------------------ Crown Pro */
export function buildPhone(): DeviceModel {
  const W = 7.14, H = 14.96, R = 1.05, D = 0.79, CX = -W / 2 + 1.85, CY = H / 2 - 1.95;
  const root = new THREE.Group(); root.name = 'crown-pro';
  const layers: LayerModel[] = [];
  const layer = makeLayerFactory(root, PHONE, layers);

  const backTex = canvasTexture(drawScales(TEX_LO, 'phone', 'neutral'));
  const bumpTex = canvasTexture(drawScales(TEX_LO, 'phone', 'ripen', true), false);
  const rind = rindTexture();
  const screen = wallpaper(512, 1072);
  const battery = labelTexture(256, 512, '#1a1b18', [['5,000 mAh', 34, '#f0b53a', 220], ['SILICON-CARBON', 14, '#9c9d8d', 250, 500]]);
  const chipTex = labelTexture(256, 256, '#2a2b27', [['NECTAR', 30, '#d9c48a', 118, 700], ['N7 PRO', 22, '#9c9d8d', 152, 500]]);

  // brushed titanium: anisotropic sheen along the rails, rind micro-texture as bump
  const frameMat = phys({ color: 0xb6a065, metalness: 1, roughness: 0.32, anisotropy: 0.7, anisotropyRotation: Math.PI / 2, bumpMap: rind, bumpScale: 0.6 });
  const keyMat = std({ color: 0xb6a065, metalness: 1, roughness: 0.22 });
  const plateauMat = phys({ color: 0xb8b048, roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const backMat = phys({ color: 0xffffff, map: backTex, bumpMap: bumpTex, bumpScale: 0.8, roughness: 0.38, clearcoat: 0.85, clearcoatRoughness: 0.22 });

  // 1 front glass
  layer(0, 0.39, add => { add(ext(rr(W, H, R), 0.03, 0.015), glass()); });
  // 2 Solaris display
  layer(1, 0.31, (add, L) => {
    add(ext(rr(W - 0.08, H - 0.08, R - 0.04), 0.06, 0.01), std({ color: 0x050505, roughness: 0.35 }));
    const s = add(normUV(new THREE.ShapeGeometry(rr(W - 0.3, H - 0.3, R - 0.15), 18), W - 0.3, H - 0.3), new THREE.MeshBasicMaterial({ map: screen }));
    s.position.z = 0.045; L.focus = s;
    const cut = add(new THREE.CircleGeometry(0.16, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); cut.position.set(0, H / 2 - 0.62, 0.05);
  });
  // 3 titanium frame, Crown Key, volume keys
  layer(2, 0, (add, L) => {
    const s = rr(W, H, R); s.holes.push(rr(W - 0.34, H - 0.34, R - 0.17));
    add(ext(s, D, 0.04, 4), frameMat);
    const dark = std({ color: 0x1c1d1a, roughness: 0.6 });
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(new THREE.BoxGeometry(0.4, 0.05, D + 0.03), dark).position.set(sx * (W / 2 - 0.17), sy * 5.9, 0);
    const keyG = new THREE.Group(); keyG.position.set(W / 2 + 0.05, 1.3, 0); L.group.add(keyG); keyG.name = 'crown-key';
    const k = add(ext(rr(1.25, 0.34, 0.16), 0.1, 0.02), keyMat, keyG); k.rotation.set(0, Math.PI / 2, Math.PI / 2); // leaf-blade key
    add(new THREE.BoxGeometry(0.04, 0.9, 0.05), std({ color: 0x8c7b4d, metalness: 1, roughness: 0.4 }), keyG).position.set(0.06, 0, 0); // tactile ridge
    L.focus = keyG;
    for (const y of [3.1, 1.75]) { const v = add(ext(rr(0.95, 0.26, 0.12), 0.1, 0.02), keyMat); v.rotation.set(0, Math.PI / 2, Math.PI / 2); v.position.set(-W / 2 - 0.05, y, 0); }
    const usb = add(ext(rr(0.9, 0.3, 0.14), 0.4, 0), std({ color: 0x0c0c0c })); usb.rotation.x = Math.PI / 2; usb.position.set(0, -H / 2 + 0.02, 0);
  });
  // 4 logic board
  layer(3, 0.16, (add, L) => {
    const bw = W - 1.3, bh = H * 0.42, by = H * 0.2, pcb = std({ color: 0x1f2b22, roughness: 0.55, metalness: 0.2 });
    add(ext(rr(bw, bh, 0.3, 0, by), 0.08, 0.01), pcb).position.z = 0.08;
    add(ext(rr(bw, bh, 0.3, 0, by), 0.08, 0.01), pcb).position.z = -0.08;
    const post = std({ color: 0xb08d57, metalness: 1, roughness: 0.3 });
    for (const [x, y] of [[-2, by - 2.5], [2, by - 2.5], [-2, by + 2.6], [2, by + 2.6]]) add(cyl(0.09, 0.16, 10), post).position.set(x, y, 0);
    const chip = add(new THREE.BoxGeometry(1.3, 1.3, 0.14), std({ color: 0xffffff, map: chipTex, metalness: 0.6, roughness: 0.35 })); chip.position.set(-0.5, by + 0.5, 0.19); L.focus = chip; chip.name = 'chip';
    const R2 = rng(3), comp = std({ color: 0x3a3c36, metalness: 0.4, roughness: 0.5 });
    for (let i = 0; i < 34; i++) { const w = 0.12 + R2() * 0.45, h = 0.12 + R2() * 0.35, x = lerp(-bw / 2 + 0.4, bw / 2 - 0.4, R2()), y = by + lerp(-bh / 2 + 0.4, bh / 2 - 0.4, R2()); if (Math.abs(x + 0.5) < 0.9 && Math.abs(y - by - 0.5) < 0.9) continue; add(new THREE.BoxGeometry(w, h, 0.08), comp).position.set(x, y, 0.16); }
    add(new THREE.BoxGeometry(0.9, 0.7, 0.1), std({ color: 0x2d2f29, metalness: 0.6, roughness: 0.4 })).position.set(1.3, by - 1.2, 0.17);
    add(new THREE.BoxGeometry(1.1, 0.8, 0.1), std({ color: 0x161714, roughness: 0.5 })).position.set(1.2, by + 1.1, 0.17);
  });
  // 5 Core cooling chamber
  layer(4, 0.06, add => {
    const cw = W - 1.6, ch = H * 0.6;
    add(ext(rr(cw, ch, 0.5, 0, H * 0.08), 0.03, 0.012), std({ color: 0xc4c7c9, metalness: 1, roughness: 0.24 }));
    add(ext(rr(cw + 0.4, ch + 0.6, 0.5, 0, H * 0.08), 0.02, 0), std({ color: 0x2b2b2a, roughness: 0.85 })).position.z = -0.05;
    const wick = std({ color: 0x9ea2a5, metalness: 1, roughness: 0.3 });
    for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(0.05, ch * 0.85, 0.015), wick).position.set(-cw / 2 + 0.55 + (i * (cw - 1.1)) / 6, H * 0.08, 0.022);
  });
  // 6 battery
  layer(5, -0.05, add => {
    const bw = W - 1.4, bh = H * 0.44;
    add(normUV(ext(rr(bw, bh, 0.35, 0, -H * 0.2), 0.34, 0.03), bw, bh, 0, -H * 0.2), std({ map: battery, roughness: 0.55, color: 0xffffff }));
    add(new THREE.BoxGeometry(1.2, 0.3, 0.06), std({ color: 0xb08d57, metalness: 1, roughness: 0.3 })).position.set(0, -H * 0.2 + bh / 2 + 0.12, 0);
  });
  // 7 Prism camera system on its scale-shaped plateau
  layer(6, -0.47, (add, L) => {
    add(ext(hexShape(1.55, CX, CY), 0.18, 0.035, 4), plateauMat);
    const ring = std({ color: 0xb9b5a6, metalness: 1, roughness: 0.25 }), lens = phys({ color: 0x07080b, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 }), coat = std({ color: 0x2c3a8c, emissive: 0x101a44, roughness: 0.1, metalness: 0.6 }), body = std({ color: 0x18191a, roughness: 0.6 });
    for (const [x, y, r] of [[-0.5, 0.45, 0.52], [-0.5, -0.62, 0.44]]) {
      add(cyl(r, 0.14), ring).position.set(CX + x, CY + y, -0.13);
      const g = add(new THREE.CircleGeometry(r * 0.86, 40), lens); g.rotation.y = Math.PI; g.position.set(CX + x, CY + y, -0.205);
      const c = add(new THREE.CircleGeometry(r * 0.38, 32), coat); c.rotation.y = Math.PI; c.position.set(CX + x, CY + y, -0.207);
      add(new THREE.BoxGeometry(r * 1.9, r * 1.9, 0.5), body).position.set(CX + x, CY + y, 0.3);
    }
    const per = add(ext(rr(0.86, 0.86, 0.2, CX + 0.62, CY - 0.05), 0.14, 0.02), ring); per.position.z = -0.13; L.focus = per;
    const pw = add(new THREE.PlaneGeometry(0.68, 0.68), lens); pw.rotation.y = Math.PI; pw.position.set(CX + 0.62, CY - 0.05, -0.215);
    add(new THREE.BoxGeometry(0.8, 2.4, 0.55), body).position.set(CX + 0.62, CY - 1.1, 0.3); // folded-prism module
    const fl = add(new THREE.CircleGeometry(0.12, 24), std({ color: 0xfff2c8, emissive: 0x5a4a20, roughness: 0.3 })); fl.rotation.y = Math.PI; fl.position.set(CX + 0.62, CY + 0.85, -0.1);
    const tof = add(new THREE.CircleGeometry(0.1, 24), std({ color: 0x050505, roughness: 0.2 })); tof.rotation.y = Math.PI; tof.position.set(CX + 0.62, CY - 0.95, -0.1);
  });
  // 8 small parts
  layer(7, -0.1, add => {
    const spk = std({ color: 0x26282a, roughness: 0.7 });
    for (const x of [-1.75, 1.75]) add(new THREE.BoxGeometry(1.5, 0.55, 0.3), spk).position.set(x, -H / 2 + 0.95, 0);
    add(new THREE.BoxGeometry(1.3, 0.26, 0.2), spk).position.set(0, H / 2 - 0.36, 0);
    add(new THREE.BoxGeometry(1.75, 0.62, 0.36), std({ color: 0x8f918b, metalness: 0.85, roughness: 0.3 })).position.set(1.45, -H / 2 + 2.05, 0);
    add(ext(rr(1.05, 0.36, 0.17), 0.34, 0.02), std({ color: 0xc8c9c4, metalness: 1, roughness: 0.25 })).position.set(0, -H / 2 + 0.32, 0);
    const mic = std({ color: 0x0f0f0f });
    for (const [x, y] of [[-0.9, -H / 2 + 0.25], [0.9, -H / 2 + 0.25], [1.1, H / 2 - 0.3], [-2.6, H / 2 - 0.5]]) add(cyl(0.07, 0.12, 12), mic).position.set(x, y, 0);
  });
  // 9 wireless coil + magnet ring
  layer(8, -0.3, add => {
    const cu = std({ color: 0xc77b3a, metalness: 1, roughness: 0.35 }), mag = std({ color: 0x55585c, metalness: 0.85, roughness: 0.35 });
    for (let r = 0.72; r < 1.9; r += 0.15) add(new THREE.TorusGeometry(r, 0.045, 8, 72), cu).position.y = -0.6;
    add(new THREE.TorusGeometry(2.2, 0.11, 10, 96), mag).position.y = -0.6;
    add(new THREE.BoxGeometry(0.5, 0.32, 0.12), mag).position.set(0, -3.15, 0);
    add(new THREE.CircleGeometry(2.05, 64), std({ color: 0x161616, roughness: 0.9, side: THREE.DoubleSide })).position.set(0, -0.6, -0.06);
  });
  // 10 etched back glass
  layer(9, -0.37, add => {
    const s = rr(W, H, R); s.holes.push(hexShape(1.6, CX, CY));
    add(normUV(ext(s, 0.035, 0.02), W, H), backMat);
  });

  const back = new Tint(backMat), frame = new Tint(frameMat), key = new Tint(keyMat), plateau = new Tint(plateauMat);
  let fin: AnyFinish = 'ripen', ripenAmt = 1, res = TEX_LO;
  const backLayer = layers[9].group, n = new THREE.Vector3(), v = new THREE.Vector3(), q = new THREE.Quaternion(), wp = new THREE.Vector3();
  const green = new THREE.Color('#76b04a'), gold = new THREE.Color('#f2b43a'), tmp = new THREE.Color();

  return {
    key: 'phone', root, height: H, width: W, spacing: 2.15, layers, tinted: new Set<THREE.Material>([backMat, frameMat, keyMat, plateauMat]),
    setFinish(k, instant = false) {
      fin = k;
      const c = finishColours(k);
      frame.set(c.frame, instant); key.set(c.frame, instant); plateau.set(c.plateau, instant);
      if (k !== 'ripen') back.set(c.back, instant);
      if (instant) ripenAmt = k === 'ripen' ? 1 : 0;
    },
    update(dt, camera) {
      ripenAmt += ((fin === 'ripen' ? 1 : 0) - ripenAmt) * (1 - Math.exp(-dt * 7));
      if (ripenAmt > 0.001) {
        // thin film: green head-on, gold by 60°
        n.set(0, 0, -1).applyQuaternion(backLayer.getWorldQuaternion(q));
        v.copy(camera.position).sub(backLayer.getWorldPosition(wp)).normalize();
        const ang = (Math.acos(Math.min(1, Math.abs(n.dot(v)))) * 180) / Math.PI;
        tmp.copy(green).lerp(gold, sm(0, 60, ang));
        if (fin === 'ripen') back.target.copy(tmp);
      }
      back.step(dt); frame.step(dt); key.step(dt); plateau.step(dt);
    },
    upgradeTextures() {
      if (res === TEX_HI()) return;
      res = TEX_HI();
      swapImage(backTex, drawScales(res, 'phone', 'neutral'));
      swapImage(bumpTex, drawScales(Math.min(res, 2048), 'phone', 'ripen', true));
    },
  };
}

/* ------------------------------------------------------------------ Slate Pro */
export function buildTablet(): DeviceModel {
  const W = 21.55, H = 28.16, R = 1.5, D = 0.51, CX = -W / 2 + 1.9, CY = H / 2 - 1.9;
  const root = new THREE.Group(); root.name = 'slate-pro';
  const layers: LayerModel[] = [];
  const layer = makeLayerFactory(root, TABLET, layers);

  const neutral = canvasTexture(drawScales(TEX_LO, 'tablet', 'neutral'));
  const ripenTex = canvasTexture(drawScales(TEX_LO, 'tablet', 'ripen'));
  const bumpTex = canvasTexture(drawScales(TEX_LO, 'tablet', 'ripen', true), false);
  const screen = wallpaper(820, 1072);
  const cell = labelTexture(256, 512, '#1a1b18', [['21 Wh', 34, '#f0b53a', 240], ['CELL A · B', 14, '#9c9d8d', 270, 500]]);
  const chipTex = labelTexture(256, 256, '#2a2b27', [['NECTAR', 30, '#d9c48a', 118, 700], ['N7 MAX', 22, '#9c9d8d', 152, 500]]);

  const backMat = phys({ color: 0xffffff, map: ripenTex, bumpMap: bumpTex, bumpScale: 0.8, roughness: 0.4, metalness: 0.25, clearcoat: 0.4 });
  const sideMat = std({ color: 0xb6a065, metalness: 0.9, roughness: 0.32 });
  const plateauMat = phys({ color: 0xd8d2b0, roughness: 0.36, clearcoat: 0.7 });

  layer(0, 0.25, add => { add(ext(rr(W, H, R), 0.03, 0.015), glass()); });
  layer(1, 0.19, (add, L) => {
    add(ext(rr(W - 0.1, H - 0.1, R - 0.05), 0.06, 0.01), std({ color: 0x050505, roughness: 0.35 }));
    const s = add(normUV(new THREE.ShapeGeometry(rr(W - 0.6, H - 0.6, R - 0.3), 18), W - 0.6, H - 0.6), new THREE.MeshBasicMaterial({ map: screen })); s.position.z = 0.045; L.focus = s;
  });
  layer(2, 0.05, (add, L) => {
    add(ext(rr(W - 6, H * 0.2, 0.4, 0, H * 0.28), 0.1, 0.01), std({ color: 0x1f2b22, roughness: 0.55, metalness: 0.2 }));
    const chip = add(new THREE.BoxGeometry(2.4, 2.4, 0.16), std({ color: 0xffffff, map: chipTex, metalness: 0.6, roughness: 0.35 })); chip.position.set(0, H * 0.28, 0.13); L.focus = chip; chip.name = 'chip';
    const R2 = rng(9), comp = std({ color: 0x3a3c36, metalness: 0.4, roughness: 0.5 });
    for (let i = 0; i < 26; i++) { const x = lerp(-W / 2 + 3.6, W / 2 - 3.6, R2()); const w = 0.2 + R2() * 0.7, h = 0.2 + R2() * 0.5, y = H * 0.28 + lerp(-2, 2, R2()); if (Math.abs(x) < 1.8) continue; add(new THREE.BoxGeometry(w, h, 0.1), comp).position.set(x, y, 0.1); }
  });
  layer(3, -0.33, (add, L) => {
    add(ext(hexShape(1.35, CX, CY), 0.18, 0.03), plateauMat);
    const ring = add(cyl(0.55, 0.14), std({ color: 0xb9b5a6, metalness: 1, roughness: 0.25 })); ring.position.set(CX, CY + 0.3, -0.13); L.focus = ring;
    const gl = add(new THREE.CircleGeometry(0.47, 40), phys({ color: 0x07080b, roughness: 0.04, clearcoat: 1 })); gl.rotation.y = Math.PI; gl.position.set(CX, CY + 0.3, -0.205);
    const tof = add(new THREE.CircleGeometry(0.14, 24), std({ color: 0x050505 })); tof.rotation.y = Math.PI; tof.position.set(CX, CY - 0.65, -0.1);
    add(new THREE.SphereGeometry(0.22, 24, 16), phys({ color: 0x07080b, roughness: 0.05, clearcoat: 1 })).position.set(W / 2 - 0.55, 0, 0.2); // front camera, landscape edge
  });
  layer(4, -0.05, add => {
    for (const x of [-1, 1]) { const w = W / 2 - 2, h = H * 0.6, cx = x * (W / 4 + 0.2); add(normUV(ext(rr(w, h, 0.4, cx, -H * 0.1), 0.3, 0.03), w, h, cx, -H * 0.1), std({ map: cell, roughness: 0.55 })); }
  });
  layer(5, 0, add => { const spk = std({ color: 0x26282a, roughness: 0.7 }); for (const sx of [-1, 1]) for (const sy of [-1, 1]) add(new THREE.BoxGeometry(2.6, 1.1, 0.3), spk).position.set(sx * (W / 2 - 2), sy * (H / 2 - 1.1), 0); });
  layer(6, 0, (add, L) => {
    add(new THREE.BoxGeometry(0.35, 12, 0.16), std({ color: 0x55585c, metalness: 0.85, roughness: 0.35 })).position.set(W / 2 - 0.35, 0, 0);
    const q = new THREE.Group(); q.position.set(W / 2 + 0.75, 0, 0); L.group.add(q); q.name = 'quill'; L.focus = q;
    const white = phys({ color: 0xf1ede2, roughness: 0.35, clearcoat: 0.6 });
    add(new THREE.CylinderGeometry(0.3, 0.3, 15, 40), white, q);
    const tip = add(new THREE.ConeGeometry(0.3, 1.6, 40), white, q); tip.position.y = -8.3; tip.rotation.x = Math.PI;
    const nib = add(new THREE.ConeGeometry(0.08, 0.4, 16), std({ color: 0x9c9d8d }), q); nib.position.y = -9.25; nib.rotation.x = Math.PI;
  });
  layer(7, 0, add => {
    const gold = std({ color: 0xd6b46a, metalness: 1, roughness: 0.2 });
    for (const y of [-1, 0, 1]) { const c = add(cyl(0.2, 0.2, 24), gold); c.rotation.y = Math.PI / 2; c.position.set(-W / 2 + 0.3, y * 0.8, 0); }
    add(new THREE.BoxGeometry(0.3, 4, 0.14), std({ color: 0x55585c, metalness: 0.85, roughness: 0.35 })).position.set(-W / 2 + 0.6, 0, 0);
  });
  layer(8, -0.24, add => {
    const s = rr(W, H, R); s.holes.push(hexShape(1.4, CX, CY));
    add(normUV(ext(s, 0.04, 0.02), W, H), backMat);
    const wall = rr(W, H, R); wall.holes.push(rr(W - 0.3, H - 0.3, R - 0.15));
    add(ext(wall, D, 0.03), sideMat).position.z = 0.25;
  });

  const back = new Tint(backMat), side = new Tint(sideMat), plateau = new Tint(plateauMat);
  let res = TEX_LO;
  return {
    key: 'tablet', root, height: H, width: W, spacing: 4.3, layers, tinted: new Set<THREE.Material>([backMat, sideMat, plateauMat]),
    setFinish(k, instant = false) {
      const isRipen = k === 'ripen';
      const want = isRipen ? ripenTex : neutral;
      if (backMat.map !== want) { backMat.map = want; backMat.needsUpdate = true; }
      const c = finishColours(k);
      back.set(isRipen ? '#ffffff' : c.back, instant); side.set(c.frame, instant); plateau.set(c.plateau, instant);
    },
    update(dt) { back.step(dt); side.step(dt); plateau.step(dt); },
    upgradeTextures() {
      const hi = Math.min(TEX_HI(), 2048);
      if (res === hi) return; res = hi;
      swapImage(neutral, drawScales(hi, 'tablet', 'neutral'));
      swapImage(ripenTex, drawScales(hi, 'tablet', 'ripen'));
      swapImage(bumpTex, drawScales(Math.min(hi, 1024), 'tablet', 'ripen', true));
    },
  };
}

export function buildDevice(key: DeviceKey) { return key === 'phone' ? buildPhone() : buildTablet(); }
