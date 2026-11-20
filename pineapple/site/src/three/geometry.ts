import * as THREE from 'three';
import { lerp } from '../lib/math';

/** Rounded rectangle centred on (cx, cy). */
export function rr(w: number, h: number, r: number, cx = 0, cy = 0) {
  const s = new THREE.Shape(), x = cx - w / 2, y = cy - h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** One rounded-hexagon pineapple scale: the camera plateau outline. */
export function hexShape(r: number, cx = 0, cy = 0, round = 0.26) {
  const P: [number, number][] = [];
  for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + (k * Math.PI) / 3; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.08]); }
  const s = new THREE.Shape();
  for (let k = 0; k < 6; k++) {
    const p = P[k], q = P[(k + 1) % 6], n = P[(k + 2) % 6];
    const a: [number, number] = [lerp(p[0], q[0], 1 - round), lerp(p[1], q[1], 1 - round)];
    const b: [number, number] = [lerp(q[0], n[0], round), lerp(q[1], n[1], round)];
    if (k === 0) s.moveTo(...a); else s.lineTo(...a);
    s.quadraticCurveTo(q[0], q[1], b[0], b[1]);
  }
  return s;
}

/** Extrude with real bevels (plan §10: edges stay smooth in extreme close-up), centred on z. */
export function ext(shape: THREE.Shape, depth: number, bevel = 0.02, seg = 3) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 18 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Map UVs 0–1 across a w×h footprint, so one texture spans the whole part. */
export function normUV<T extends THREE.BufferGeometry>(g: T, w: number, h: number, cx = 0, cy = 0): T {
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - cx + w / 2) / w, (p.getY(i) - cy + h / 2) / h);
  uv.needsUpdate = true;
  return g;
}

/** Cylinder whose axis runs along z (lenses, posts). */
export function cyl(r: number, h: number, seg = 40) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.rotateX(Math.PI / 2);
  return g;
}
