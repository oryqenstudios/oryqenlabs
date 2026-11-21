import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, Environment, Lightformer } from '@react-three/drei';
import { buildPhone, buildTablet, type DeviceModel, type AnyFinish } from './devices3d';
import { Burst } from './Burst';
import { createRuntime, stepRuntime, setLensPass, scatter, type BreakdownRuntime, type BreakdownState } from './breakdown';
import { stage } from './store';
import { ScrollTrigger } from '../lib/scroll';
import { reducedMotion, currentAccent } from '../lib/tokens';
import { setQuality, qualityForced } from './quality';
import { GOLDEN_ANGLE } from '../lib/math';
import type { DeviceKey } from '../data/devices';

const FOV = 30, CAM_Z = 60;
const VIEW_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180); // world height visible at z = 0
const LENS_R = () => (innerWidth < 760 ? 70 : 96);

/**
 * One persistent canvas over the page (plan §9). It draws only where sections place anchors,
 * renders on demand, and sleeps when no anchor is on screen.
 */
export function Stage() {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 1, far: 200 }}
      gl={{ antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Studio />
      <Director />
      <Burst />
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  );
}

/** Procedural studio: soft boxes for reflections (stand-in for the 4K HDRI), key and rim lights. */
function Studio() {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#0b0c09']} />
        <Lightformer form="rect" intensity={5} position={[-30, 32, 30]} scale={[46, 22, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={3} color="#fff0d2" position={[44, 4, -6]} scale={[14, 44, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} color="#e8f1ff" position={[0, -42, 18]} scale={[70, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.8} color="#dfffcf" position={[-46, -4, -30]} scale={[10, 34, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.2} color="#ffe2a8" position={[0, 10, -48]} scale={[30, 30, 1]} target={[0, 0, 0]} />
      </Environment>
      <hemisphereLight args={['#4a5240', '#050505', 0.6]} />
      <directionalLight position={[-8, 12, 14]} intensity={2} />
      <directionalLight position={[9, 5, -12]} intensity={1.6} color="#ffe2b0" />
    </>
  );
}

interface Slot {
  model: DeviceModel; rt: BreakdownRuntime; place: THREE.Group; pivot: THREE.Group;
  vis: number; rot: THREE.Euler; finish: AnyFinish | null;
  bd: BreakdownState | null; zoom: number; center: number; shift: THREE.Vector2;
  /** Last layer the view centred on, kept while the centring eases out. */
  focusI: number; focusClose: boolean;
  shadow: THREE.Mesh;
}
interface Acc { w: number; pres: number; cx: number; cy: number; size: number; rx: number; ry: number; finish: AnyFinish | null; best: number; bd: BreakdownState | null; shadow: boolean }

const HEAT = 70;

function Director() {
  const { camera, invalidate, performance, scene } = useThree();
  const slots = useMemo(() => {
    const make = (model: DeviceModel): Slot => {
      const place = new THREE.Group(), pivot = new THREE.Group();
      pivot.add(model.root); place.add(pivot); place.visible = false;
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTexture(), color: 0xffffff, transparent: true, depthWrite: false, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending }));
      shadow.visible = false; shadow.renderOrder = -1;
      return { shadow, model, rt: createRuntime(model), place, pivot, vis: 0, rot: new THREE.Euler(0.2, Math.PI - 0.5, 0), finish: null, bd: null, zoom: 1, center: 0, shift: new THREE.Vector2(), focusI: -1, focusClose: false };
    };
    return { phone: make(buildPhone()), tablet: make(buildTablet()) } as Record<DeviceKey, Slot>;
  }, []);
  const cursor = useRef<THREE.PointLight>(null), rake = useRef<THREE.PointLight>(null);
  const upgraded = useRef(false);
  const lensAt = useRef<{ x: number; y: number; slot: Slot } | null>(null);
  const perf = useRef({ t: 0, n: 0, strikes: 0, continuous: false });
  const accentC = useMemo(() => new THREE.Color(), []);
  const time = useRef(0);

  const heat = useMemo(() => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HEAT * 3), 3));
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const p = new THREE.Points(g, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), color: 0xff8a3a, size: 0.5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    p.visible = false; p.frustumCulled = false;
    return p;
  }, []);

  const lens = useMemo(() => {
    const s = new THREE.Scene(), cam = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: 0x03100f, depthTest: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp, toneMapped: false }));
    s.add(disc);
    return { scene: s, cam, disc };
  }, []);

  /* ---------- picking and pulling for the breakdown ---------- */
  useEffect(() => {
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3();
    const bdSlot = () => (slots.phone.bd ? slots.phone : slots.tablet.bd ? slots.tablet : null);
    const aim = (x: number, y: number) => { ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); };
    const toScreen = (v: THREE.Vector3) => { v.project(camera); return [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight]; };
    stage.bd = {
      pick(x, y, inner) {
        const s = bdSlot(); if (!s) return -1;
        aim(x, y);
        const sel = s.bd!.selected, list: THREE.Object3D[] = [];
        s.model.layers.forEach((L, i) => { if (s.rt.layers[i].fade < 0.35 && i !== sel) return; if (inner && L.data.shell) return; list.push(...L.meshes.filter(m => (m.material as THREE.Material).visible)); });
        const h = ray.intersectObjects(list, false)[0];
        return h ? (h.object.userData.layer.index as number) : -1;
      },
      pullStart(i, x, y) {
        const s = bdSlot(); if (!s) return;
        const L = s.model.layers[i];
        plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, -1), L.group.getWorldPosition(new THREE.Vector3()));
        aim(x, y); const p0 = ray.ray.intersectPlane(plane, new THREE.Vector3()); if (!p0) return;
        s.rt.drag = { i, p0, start: s.rt.layers[i].pull.clone() }; s.rt.layers[i].pv.set(0, 0, 0);
        invalidate();
      },
      pullMove(x, y) {
        const s = bdSlot(); const d = s?.rt.drag; if (!s || !d) return;
        aim(x, y); if (!ray.ray.intersectPlane(plane, hit)) return;
        const a = s.model.root.worldToLocal(d.p0.clone()), b = s.model.root.worldToLocal(hit.clone());
        s.rt.layers[d.i].pull.copy(d.start).add(b.sub(a));
        invalidate();
      },
      pullEnd() {
        const s = bdSlot(); const d = s?.rt.drag; if (!s || !d) return null;
        s.rt.drag = null;
        const L = s.model.layers[d.i], r = s.rt.layers[d.i];
        const home = s.model.root.localToWorld(L.group.position.clone().sub(r.scatter).sub(r.pull));
        const cur = L.group.getWorldPosition(new THREE.Vector3());
        const [ax, ay] = toScreen(home), [bx, by] = toScreen(cur);
        invalidate();
        return { i: d.i, near: Math.hypot(ax - bx, ay - by) < Math.min(140, innerWidth * 0.18) };
      },
      scatter(on) { const s = bdSlot(); if (s) { scatter(s.rt, on); invalidate(); } },
      place(i) { const s = bdSlot(); if (!s) return; const r = s.rt.layers[i]; r.placed = true; r.pull.add(r.scatter); r.scatter.set(0, 0, 0); invalidate(); },
    };
    return () => { stage.bd = null; };
  }, [camera, invalidate, slots]);

  const gl = useThree(s => s.gl);
  useEffect(() => {
    // a lost GPU context (driver reset, memory pressure) falls back to still renders
    const lost = (e: Event) => { e.preventDefault(); setQuality('stills'); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl]);

  useEffect(() => {
    stage.wake = () => invalidate();
    stage.markReady();
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: () => invalidate() });
    const onResize = () => invalidate();
    addEventListener('resize', onResize);
    return () => { st.kill(); removeEventListener('resize', onResize); stage.wake = () => {}; };
  }, [invalidate]);

  /* ---------- logic ---------- */
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), vw = innerWidth, vh = innerHeight, wpp = VIEW_H / vh;
    const rm = reducedMotion();
    time.current += dt;
    let busy = false, lightOn = false;
    const lp = new THREE.Vector3();
    const accent = accentC.set(currentAccent());
    // watchdog: if continuous rendering stays under ~22 fps, fall back to still renders
    const pw = perf.current;
    if (!qualityForced && dtRaw < 0.25 && pw.continuous) { pw.t += dtRaw; pw.n++; if (pw.t >= 2) { pw.strikes = pw.n / pw.t < 22 ? pw.strikes + 1 : Math.max(0, pw.strikes - 1); pw.t = pw.n = 0; if (pw.strikes >= 3) setQuality('stills'); } }

    const acc = {} as Record<DeviceKey, Acc>;
    for (const k of ['phone', 'tablet'] as DeviceKey[]) acc[k] = { w: 0, pres: 0, cx: 0, cy: 0, size: 0, rx: 0, ry: 0, finish: null, best: 0, bd: null, shadow: true };
    for (const a of stage.anchors.values()) {
      const r = a.el.getBoundingClientRect();
      if (r.height < 1 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      const pres = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.min(r.height, vh);
      const w = pres * pres, d = acc[a.spec.device];
      const u = a.user;
      if (!u.dragging && (Math.abs(u.vy) > 1e-4 || Math.abs(u.vx) > 1e-4)) { const k = Math.pow(0.06, dt); u.vy *= k; u.vx *= k; u.y += u.vy * 60 * dt; u.x = Math.max(-1.2, Math.min(1.2, u.x + u.vx * 60 * dt)); busy = true; }
      if (u.dragging) { busy = true; performance.regress(); }
      d.w += w; d.pres = Math.max(d.pres, pres);
      d.cx += (r.left + r.width / 2) * w; d.cy += (r.top + r.height / 2) * w;
      d.size += r.height * (a.spec.fill ?? 0.8) * w;
      d.rx += (a.spec.rot[0] + u.x) * w; d.ry += (a.spec.rot[1] + u.y) * w;
      if (w > d.best) { d.best = w; d.finish = a.spec.finish; d.bd = a.spec.breakdown ?? null; d.shadow = a.spec.shadow ?? true; }
      if (a.spec.cursorLight && a.pointer.inside) { lightOn = true; lp.set((r.left + a.pointer.x * r.width - vw / 2) * wpp, -(r.top + a.pointer.y * r.height - vh / 2) * wpp, 9); }
    }

    lensAt.current = null;
    heat.visible = false;
    let rakeOn = false;
    for (const key of ['phone', 'tablet'] as DeviceKey[]) {
      const s = slots[key], d = acc[key];
      const target = d.w > 0 ? THREE.MathUtils.smoothstep(d.pres, 0, 0.35) : 0;
      s.vis = rm ? target : s.vis + (target - s.vis) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - s.vis) > 0.002) busy = true;
      s.bd = d.w > 0 ? d.bd : null;
      const bd = s.bd;

      // breakdown runs every frame so a model leaving the breakdown eases back to assembled
      busy = stepRuntime(s.rt, s.place.visible || target > 0 ? bd : null, s.vis, dt, time.current, accent, rm) || busy;
      s.place.visible = s.vis > 0.003;
      s.shadow.visible = false;
      if (!s.place.visible) continue;

      if (d.w > 0) {
        const k = rm ? 1 : 1 - Math.exp(-dt * 9);
        const tx = d.rx / d.w, ty = d.ry / d.w;
        s.rot.x += (tx - s.rot.x) * k; s.rot.y += (ty - s.rot.y) * k;
        if (Math.abs(tx - s.rot.x) + Math.abs(ty - s.rot.y) > 0.001) busy = true;
        // zoom: visitor pinch, or the close-up fly-in
        const zT = bd ? (bd.close ? (bd.close.kind === 'rake' ? 3 : key === 'phone' ? 4.2 : 3) : bd.zoom * bd.fit) : 1;
        s.zoom += (zT - s.zoom) * k; if (Math.abs(zT - s.zoom) > 0.002) busy = true;
        const cT = bd && (bd.close || (bd.selected >= 0 && !bd.build.active)) ? 1 : 0;
        if (cT && bd) { s.focusI = bd.close ? bd.close.layer : bd.selected; s.focusClose = !!bd.close; }
        s.center += (cT - s.center) * k; if (Math.abs(cT - s.center) > 0.002) busy = true;
        s.shift.lerp(bd ? new THREE.Vector2(bd.shift.x, bd.shift.y) : new THREE.Vector2(), k);

        const cx = d.cx / d.w + s.shift.x, cy = d.cy / d.w + s.shift.y, size = d.size / d.w;
        const ax = (cx - vw / 2) * wpp, ay = -(cy - vh / 2) * wpp;
        const explodeFit = bd ? 1 - 0.34 * Math.max(0, s.rt.exp) : 1;
        s.place.position.set(ax, ay, 0);
        s.place.scale.setScalar(((size * wpp) / s.model.height) * (0.82 + 0.18 * s.vis) * explodeFit * s.zoom);
        s.pivot.rotation.set(s.rot.x, s.rot.y + (1 - s.vis) * 1.2, 0);
        // centre the inspected layer or the close-up part in the anchor
        if (s.center > 0.001 && s.focusI >= 0 && s.focusI < s.model.layers.length) {
          const L = s.model.layers[s.focusI];
          const focus = s.focusClose ? L.focus : L.group;
          s.place.updateMatrixWorld(true);
          const f = focus.getWorldPosition(new THREE.Vector3());
          s.place.position.x += (ax - f.x) * s.center; s.place.position.y += (ay - f.y) * s.center;
        }
        if (d.finish && d.finish !== s.finish) { s.model.setFinish(d.finish, s.finish === null); s.finish = d.finish; busy = true; }
        // on a black studio a shadow cannot show, so the device sits in a faint pool of light in the accent colour;
        // it fades as the device explodes or flies in close
        const sc = s.place.scale.x, sOp = d.shadow ? 0.16 * s.vis * Math.max(0, 1 - s.rt.exp * 1.6) * (1 - s.center) : 0;
        if (sOp > 0.01) {
          s.shadow.visible = true; const sm = s.shadow.material as THREE.MeshBasicMaterial; sm.opacity = sOp; sm.color.copy(accent);
          const w = (key === 'phone' ? s.model.width * 1.7 : s.model.width * 1.25) * sc;
          s.shadow.scale.set(w, w * 0.16, 1);
          s.shadow.position.set(s.place.position.x, s.place.position.y - s.model.height * sc * 0.5 * Math.abs(Math.cos(s.rot.x)) - w * 0.05, -s.model.height * sc * 0.2);
        }
      } else s.pivot.rotation.set(s.rot.x, s.rot.y + (1 - s.vis) * 1.2, 0);

      s.model.update(dt, camera);
      busy ||= s.vis > 0.003;
      if (!bd) continue;

      s.place.updateMatrixWorld(true);
      // readouts
      if (bd.dom.orbit) bd.dom.orbit.textContent = `${Math.round((((s.rot.y * 180) / Math.PI) % 360 + 360) % 360)}°`;
      if (bd.dom.sep) bd.dom.sep.textContent = `${s.rt.layers.filter(l => l.t > 0.5).length}/${s.rt.layers.length}`;
      // Dimensions: thickness labels beside each layer
      const labels = bd.dom.labels, stageRect = bd.dom.stage?.getBoundingClientRect();
      if (labels && stageRect) {
        labels.hidden = bd.mode !== 'dims';
        if (bd.mode === 'dims') s.model.layers.forEach((L, i) => {
          const el = labels.children[i] as HTMLElement | undefined; if (!el) return;
          const v = L.group.localToWorld(new THREE.Vector3(s.model.width / 2 + 0.6, (i % 2 ? -1 : 1) * 1.2, 0)).project(camera);
          const show = v.z < 1 && s.rt.layers[i].fade > 0.3;
          el.style.display = show ? '' : 'none';
          el.style.transform = `translate(${((v.x + 1) / 2) * vw - stageRect.left}px,${((1 - v.y) / 2) * vh - stageRect.top}px) translate(6px,-50%)`;
        });
      }
      // Thermal: heat flows from the chip into the cooling chamber (or the tablet's back panel)
      if (bd.mode === 'thermal' && s.rt.chip && s.rt.sink) {
        heat.visible = true; busy = true;
        const from = s.rt.chip.getWorldPosition(new THREE.Vector3()), to = s.rt.sink.getWorldPosition(new THREE.Vector3());
        const pos = heat.geometry.attributes.position as THREE.BufferAttribute, sc = s.place.scale.x;
        for (let k = 0; k < HEAT; k++) { const t = (time.current * 0.35 + k / HEAT) % 1, a = k * GOLDEN_ANGLE, r = t * 1.6 * sc * (key === 'tablet' ? 2 : 1); pos.setXYZ(k, THREE.MathUtils.lerp(from.x, to.x, t) + Math.cos(a) * r, THREE.MathUtils.lerp(from.y, to.y, t) + Math.sin(a) * r, THREE.MathUtils.lerp(from.z, to.z, t)); }
        pos.needsUpdate = true;
        const m = heat.material as THREE.PointsMaterial; m.size = 0.5 * sc * (key === 'tablet' ? 2 : 1); m.opacity = 0.9;
      }
      // Titanium frame close-up: a raking light crosses the rail
      if (bd.close?.kind === 'rake' && rake.current) {
        rakeOn = true; busy = true;
        const fw = s.model.layers[2].group.getWorldPosition(new THREE.Vector3()), sc = s.place.scale.x * 10;
        rake.current.position.set(fw.x + 0.5 * sc, fw.y + THREE.MathUtils.lerp(-0.8, 0.8, (Math.sin(time.current * 0.8) + 1) / 2) * sc, fw.z + 0.2 * sc);
      }
      // hover-lens scanner
      if (bd.scanner && bd.lens && bd.mode !== 'xray' && !bd.close && !bd.build.active) {
        lensAt.current = { x: bd.lens.x, y: bd.lens.y, slot: s };
        const el = bd.dom.lens, txt = bd.dom.lensText;
        if (el && stageRect) {
          el.hidden = false; const R = LENS_R();
          el.style.width = el.style.height = `${R * 2}px`;
          el.style.transform = `translate(${bd.lens.x - stageRect.left - R}px,${bd.lens.y - stageRect.top - R}px)`;
          const i = stage.bd?.pick(bd.lens.x, bd.lens.y, true) ?? -1, L = i >= 0 ? s.model.layers[i].data : null;
          if (txt) txt.textContent = L ? (L.chip ?? `${L.name.toUpperCase()} · ${L.temp.toFixed(1)}°C`) : 'SCANNING';
        }
      } else if (bd.dom.lens) bd.dom.lens.hidden = true;
    }
    if (!heat.visible) (heat.material as THREE.PointsMaterial).opacity = 0;
    if (rake.current) rake.current.intensity += ((rakeOn ? 600 : 0) - rake.current.intensity) * (1 - Math.exp(-dt * 6));

    if (cursor.current) {
      cursor.current.intensity += ((lightOn ? 140 : 0) - cursor.current.intensity) * (1 - Math.exp(-dt * 10));
      if (lightOn) cursor.current.position.lerp(lp, 1 - Math.exp(-dt * 14));
    }
    if (!upgraded.current && (slots.phone.vis > 0.5 || slots.tablet.vis > 0.5)) {
      upgraded.current = true;
      // progressive: 512 px textures first, 2K/4K once the device has settled on screen
      setTimeout(() => { slots.phone.model.upgradeTextures(); slots.tablet.model.upgradeTextures(); invalidate(); }, 1200);
    }
    perf.current.continuous = busy;
    if (busy) invalidate();
  });

  /* ---------- render (takes over from R3F so the lens can use the stencil buffer) ---------- */
  useFrame(({ gl, size }) => {
    gl.autoClear = false;
    gl.clear(true, true, true);
    gl.render(scene, camera);
    const L = lensAt.current;
    if (!L) return;
    const { cam, disc } = lens;
    cam.left = 0; cam.right = size.width; cam.top = size.height; cam.bottom = 0; cam.updateProjectionMatrix();
    disc.position.set(L.x, size.height - L.y, 0); disc.scale.setScalar(LENS_R());
    gl.clearStencil(); gl.render(lens.scene, cam); gl.clearDepth();
    const other = L.slot === slots.phone ? slots.tablet : slots.phone, ov = other.place.visible, hv = heat.visible;
    other.place.visible = false; heat.visible = false;
    setLensPass(L.slot.rt, true);
    gl.render(scene, camera);
    setLensPass(L.slot.rt, false);
    other.place.visible = ov; heat.visible = hv;
  }, 1);

  return (
    <>
      <primitive object={slots.phone.shadow} />
      <primitive object={slots.tablet.shadow} />
      <primitive object={slots.phone.place} />
      <primitive object={slots.tablet.place} />
      <primitive object={heat} />
      <pointLight ref={cursor} intensity={0} distance={40} decay={2} color="#fff3d6" />
      <pointLight ref={rake} intensity={0} distance={60} decay={2} color="#fff1d0" />
    </>
  );
}

/** A soft elliptical floor shadow (radial falloff), drawn once. */
let shadowTex: THREE.Texture | null = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(128, 32, 0, 128, 32, 128); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.setTransform(1, 0, 0, 0.25, 0, 24); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}
