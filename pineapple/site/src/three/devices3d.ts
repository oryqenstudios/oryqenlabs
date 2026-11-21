/**
 * Procedural Crown Pro and Slate Pro (plan §9: "built procedurally in code"), one THREE.Group per
 * breakdown layer so phase 3 can explode them. Units: 1 = 10 mm.
 */
import * as THREE from 'three';
import { PHONE, TABLET, type Layer, type DeviceKey } from '../data/devices';
import { FINISHES, ZEST, type FinishKey, type ZestKey } from '../data/finishes';
import { sm } from '../lib/math';
import { rr, hexShape, ext, normUV, cyl } from './geometry';
import { drawScales, rindTexture, canvasTexture, photoTexture, TEX_LO, TEX_HI } from './textures';

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

  // photographed parts: the real screen, board, battery, vapour chamber and etched back glass (frames/parts/)
  const backTex = photoTexture('back');
  const bumpTex = photoTexture('back', false);
  const rind = rindTexture();
  const screen = photoTexture('screen');
  const boardTex = photoTexture('board'), batteryTex = photoTexture('battery'), coolTex = photoTexture('cooling');
  const smallTex = photoTexture('small'), coilTex = photoTexture('coil');
  const photo = (map: THREE.Texture, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => std({ map, color: 0xffffff, transparent: true, alphaTest: 0.4, roughness: 0.5, ...extra });

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
  // 4 logic board: the photographed board over a thin double-stacked PCB body
  layer(3, 0.16, (add, L) => {
    const bh = H * 0.42, bw = bh * 0.776, by = H * 0.2, pcb = std({ color: 0x14201a, roughness: 0.55, metalness: 0.2 });
    add(ext(rr(bw * 0.96, bh * 0.96, 0.3, 0, by), 0.08, 0.01), pcb).position.z = 0.04;
    add(ext(rr(bw * 0.96, bh * 0.96, 0.3, 0, by), 0.08, 0.01), pcb).position.z = -0.12;
    const post = std({ color: 0xb08d57, metalness: 1, roughness: 0.3 });
    for (const [x, y] of [[-1.8, by - 2.5], [1.8, by - 2.5], [-1.8, by + 2.6], [1.8, by + 2.6]]) add(cyl(0.09, 0.16, 10), post).position.set(x, y, -0.04);
    const top = add(new THREE.PlaneGeometry(bw, bh), photo(boardTex, { roughness: 0.45, metalness: 0.15 })); top.position.set(0, by, 0.125);
    // the processor's polished lid, where it sits in the photo: the breakdown's focus and chip reading
    const chip = add(new THREE.BoxGeometry(bw * 0.33, bw * 0.33, 0.06), std({ color: 0xc9ccce, metalness: 1, roughness: 0.22 }));
    chip.position.set(-bw * 0.03, by + bh * 0.08, 0.16); L.focus = chip; chip.name = 'chip';
  });
  // 5 Core cooling chamber: the photographed steel plate over a graphite sheet
  layer(4, 0.06, add => {
    const ch = H * 0.6, cw = ch * 0.592;
    add(ext(rr(cw * 0.94, ch * 0.96, 0.5, 0, H * 0.08), 0.02, 0), std({ color: 0x2b2b2a, roughness: 0.85 })).position.z = -0.04;
    const plate = add(new THREE.PlaneGeometry(cw, ch), photo(coolTex, { metalness: 0.75, roughness: 0.3 })); plate.position.set(0, H * 0.08, 0.02);
  });
  // 6 battery: the photographed cell on a slab of its own thickness
  layer(5, -0.05, add => {
    const bh = H * 0.44, bw = bh * 0.62, by = -H * 0.2;
    add(ext(rr(bw * 0.9, bh * 0.9, 0.3, 0, by - bh * 0.03), 0.34, 0.03), std({ color: 0x121311, roughness: 0.7 }));
    const top = add(new THREE.PlaneGeometry(bw, bh), photo(batteryTex, { roughness: 0.6 })); top.position.set(0, by, 0.2);
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
  // 8 small parts: the earpiece and mics, and the photographed bottom row (speakers, haptic motor, mics, USB-C)
  layer(7, -0.1, add => {
    const spk = std({ color: 0x26282a, roughness: 0.7 });
    add(new THREE.BoxGeometry(1.3, 0.26, 0.2), spk).position.set(0, H / 2 - 0.36, 0);
    const mic = std({ color: 0x0f0f0f });
    for (const [x, y] of [[1.1, H / 2 - 0.3], [-2.6, H / 2 - 0.5]]) add(cyl(0.07, 0.12, 12), mic).position.set(x, y, 0);
    const row = add(new THREE.PlaneGeometry(6.2, 6.2 / 5.48), photo(smallTex, { side: THREE.DoubleSide, roughness: 0.45, metalness: 0.3 })); row.position.set(0, -H / 2 + 1.1, 0);
  });
  // 9 wireless coil + magnet ring: photographed, its ring centred where the coil sits
  layer(8, -0.3, add => {
    const w = 4.6, h = w / 0.752;
    const coil = add(new THREE.PlaneGeometry(w, h), photo(coilTex, { side: THREE.DoubleSide, roughness: 0.35, metalness: 0.6 })); coil.position.set(0, -0.6 - (0.5 - 0.376) * h, 0);
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
      // the back glass is a photograph now; nothing to redraw
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
  const screen = photoTexture('slate-screen'); // the real screen, from the studio photo
  // photographed parts: the board (turned to lie along the tablet) and the battery cells
  const tBoard = photoTexture('board'); tBoard.center.set(0.5, 0.5); tBoard.rotation = Math.PI / 2;
  const tCell = photoTexture('battery');

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
    const top = add(new THREE.PlaneGeometry(W - 6.2, H * 0.19), std({ map: tBoard, color: 0xffffff, transparent: true, alphaTest: 0.4, roughness: 0.45, metalness: 0.15 })); top.position.set(0, H * 0.28, 0.065);
    const chip = add(new THREE.BoxGeometry(1.6, 1.6, 0.08), std({ color: 0xc9ccce, metalness: 1, roughness: 0.22 })); chip.position.set(0, H * 0.28, 0.1); L.focus = chip; chip.name = 'chip';
  });
  layer(3, -0.33, (add, L) => {
    add(ext(hexShape(1.35, CX, CY), 0.18, 0.03), plateauMat);
    const ring = add(cyl(0.55, 0.14), std({ color: 0xb9b5a6, metalness: 1, roughness: 0.25 })); ring.position.set(CX, CY + 0.3, -0.13); L.focus = ring;
    const gl = add(new THREE.CircleGeometry(0.47, 40), phys({ color: 0x07080b, roughness: 0.04, clearcoat: 1 })); gl.rotation.y = Math.PI; gl.position.set(CX, CY + 0.3, -0.205);
    const tof = add(new THREE.CircleGeometry(0.14, 24), std({ color: 0x050505 })); tof.rotation.y = Math.PI; tof.position.set(CX, CY - 0.65, -0.1);
    add(new THREE.SphereGeometry(0.22, 24, 16), phys({ color: 0x07080b, roughness: 0.05, clearcoat: 1 })).position.set(W / 2 - 0.55, 0, 0.2); // front camera, landscape edge
  });
  layer(4, -0.05, add => {
    for (const x of [-1, 1]) { const w = W / 2 - 2, h = H * 0.6, cx = x * (W / 4 + 0.2); add(normUV(ext(rr(w, h, 0.4, cx, -H * 0.1), 0.3, 0.03), w, h, cx, -H * 0.1), std({ map: tCell, color: 0xffffff, transparent: true, alphaTest: 0.4, roughness: 0.6 })); }
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
