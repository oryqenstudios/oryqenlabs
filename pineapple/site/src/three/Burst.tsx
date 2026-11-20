import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { stage, type BurstSpec } from './store';
import { hexShape, ext } from './geometry';
import { ease, isSmallScreen } from '../lib/tokens';
import { GOLDEN_ANGLE } from '../lib/math';

/**
 * The logo burst (plan §6): the pineapple breaks into its own glossy hexagonal scales, which
 * spin outward from the click point, while the three crown leaves flutter down more slowly.
 * After about two seconds the scales spiral back along the Fibonacci pattern and rebuild the
 * logo. Two instanced meshes, so the whole burst is two draw calls.
 */
const MAX = 120;
const RET = 1.9, END = 3.1; // seconds: fly, then rebuild
const FOV = 30, CAM_Z = 60, VIEW_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
// leaf centroids and resting tilt in the logo's 64-unit viewBox
const LEAVES: [number, number, number][] = [[32, 13, 0], [25, 17, 0.62], [39, 17, -0.62]];

interface Piece {
  hx: number; hy: number; // home, in logo viewBox units
  sx: number; sy: number; // start, client px
  vx: number; vy: number; vz: number; // px/s, px/s, world/s
  axis: THREE.Vector3; spin: number; size: number; ph: number;
  lx: number; ly: number; lz: number; lq: THREE.Quaternion; ls: number; // where (and how big) the rebuild starts from
}

export function Burst() {
  const { invalidate } = useThree();
  const { scales, leaves } = useMemo(() => {
    const hex = ext(hexShape(1, 0, 0, 0.3), 0.32, 0.12, 3);
    const scales = new THREE.InstancedMesh(hex, new THREE.MeshPhysicalMaterial({ roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }), MAX);
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, -1); leafShape.quadraticCurveTo(0.42, 0, 0, 1); leafShape.quadraticCurveTo(-0.42, 0, 0, -1);
    const leaves = new THREE.InstancedMesh(ext(leafShape, 0.08, 0.04, 2), new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide }), 3);
    for (const m of [scales, leaves]) { m.frustumCulled = false; m.visible = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.renderOrder = 10; }
    scales.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
    return { scales, leaves };
  }, []);

  const run = useRef<{ spec: BurstSpec; t: number; pieces: Piece[]; leaves: Piece[] } | null>(null);

  useEffect(() => {
    stage.burst = spec => {
      const st = spec.start ?? spec.home(), S = st.width / 64;
      const n = Math.min(MAX, spec.small ? 18 : isSmallScreen() ? 46 : 84);
      const mk = (hx: number, hy: number, leaf: boolean): Piece => {
        const sx = st.left + hx * S, sy = st.top + hy * S;
        const dir = Math.atan2(sy - spec.from.y, sx - spec.from.x) + (Math.random() - 0.5) * 0.6;
        const speed = (spec.small ? 140 : leaf ? 160 : 240 + Math.random() * 420) * spec.power;
        return {
          hx, hy, sx, sy, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed - (spec.small ? 60 : 180) * spec.power, vz: (Math.random() - 0.5) * 16,
          axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(), spin: (leaf ? 2 : 4) + Math.random() * 8,
          size: (spec.small ? 2.2 : Math.max(3, S * 2.1)) * (0.8 + Math.random() * 0.5), ph: Math.random() * Math.PI * 2,
          lx: 0, ly: 0, lz: 0, lq: new THREE.Quaternion(), ls: 0,
        };
      };
      const pieces: Piece[] = [];
      for (let i = 0; i < n; i++) { const a = i * GOLDEN_ANGLE, r = Math.sqrt(i / n); pieces.push(mk(32 + Math.cos(a) * r * 13, 41 + Math.sin(a) * r * 16, false)); }
      const c = new THREE.Color();
      for (let i = 0; i < MAX; i++) { c.set(spec.palette[i % spec.palette.length]); scales.setColorAt(i, c); }
      scales.instanceColor!.needsUpdate = true;
      scales.count = n;
      (leaves.material as THREE.MeshPhysicalMaterial).color.set(spec.leaf);
      run.current = { spec, t: 0, pieces, leaves: LEAVES.map(([x, y]) => mk(x, y, true)) };
      scales.visible = leaves.visible = true;
      invalidate();
    };
    stage.burstProgress = () => { const r = run.current; return r ? Math.max(0, (r.t - RET) / (END - RET)) : 1; };
    return () => { stage.burst = null; stage.burstProgress = () => 1; };
  }, [invalidate, scales, leaves]);

  const m4 = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), qi = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []), sc = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dtRaw) => {
    const r = run.current; if (!r) return;
    r.t += Math.min(dtRaw, 0.05);
    const t = r.t, vw = innerWidth, vh = innerHeight, wpp = VIEW_H / vh;
    const home = r.spec.home(), S = home.width / 64;
    const toWorld = (x: number, y: number, z: number) => v.set((x - vw / 2) * wpp, -(y - vh / 2) * wpp, z);
    const place = (mesh: THREE.InstancedMesh, list: Piece[], leaf: boolean) => {
      list.forEach((p, i) => {
        let x: number, y: number, z: number, size = p.size;
        if (t < RET) {
          x = p.sx + p.vx * t * (1 - t * 0.22) + (leaf ? Math.sin(t * 5 + p.ph) * 18 : 0);
          y = p.sy + p.vy * t + (leaf ? 240 : 900) * 0.5 * t * t;
          z = p.vz * t;
          q.setFromAxisAngle(p.axis, p.spin * t);
          if (!leaf && !r.spec.small) size *= 1 + 2.4 * Math.sin(Math.PI * Math.min(1, t / (RET * 1.1)) * 0.5);
          if (leaf) q.multiply(qi.setFromAxisAngle(new THREE.Vector3(0, 0, 1), LEAVES[i][2]));
          p.lx = x; p.ly = y; p.lz = z; p.lq.copy(q); p.ls = size;
        } else {
          // spiral back along the golden angle and rebuild the logo where it is now
          const u = ease((t - RET) / (END - RET)), hx = home.left + p.hx * S, hy = home.top + p.hy * S;
          const ang = (1 - u) * 2.4, dx = p.lx - hx, dy = p.ly - hy;
          x = hx + (dx * Math.cos(ang) - dy * Math.sin(ang)) * (1 - u);
          y = hy + (dx * Math.sin(ang) + dy * Math.cos(ang)) * (1 - u);
          z = p.lz * (1 - u);
          q.copy(p.lq).slerp(leaf ? qi.setFromAxisAngle(new THREE.Vector3(0, 0, 1), LEAVES[i][2]) : qi.identity(), u);
          size = p.ls + (Math.max(2, S * 2.1) - p.ls) * u;
          if (r.spec.fadeAtEnd && t > END - 0.35) size *= Math.max(0, (END - t) / 0.35);
        }
        const k = size * wpp * (leaf ? 2 : 1);
        m4.compose(toWorld(x, y, z), q, sc.set(leaf ? k * 0.45 : k, k, k));
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    place(scales, r.pieces, false);
    place(leaves, r.leaves, true);
    if (t >= END - 0.12 && !r.spec.fadeAtEnd) r.spec.onDone(); // DOM logo fades back in under the last frames
    if (t >= END) { scales.visible = leaves.visible = false; r.spec.onDone(); run.current = null; }
    invalidate();
  });

  return <><primitive object={scales} /><primitive object={leaves} /></>;
}
