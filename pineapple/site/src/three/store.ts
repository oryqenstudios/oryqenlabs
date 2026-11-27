import type { DeviceKey } from '../data/devices';
import type { AnyFinish } from './devices3d';
import type { BreakdownState } from './breakdown';
import { getQuality } from './quality';

/** What a page section asks the 3D stage to show inside its anchor element. */
export interface AnchorSpec {
  device: DeviceKey;
  finish: AnyFinish;
  /** Base rotation in radians [x, y]; the visitor's drag adds to it. */
  rot: [number, number];
  /** Fraction of the anchor's height the device should fill. */
  fill?: number;
  /** Drag to rotate (with inertia). */
  interactive?: boolean;
  /** A light follows the cursor so the etched pattern glints. */
  cursorLight?: boolean;
  /** This anchor hosts the hands-on breakdown. */
  breakdown?: BreakdownState;
  /** Soft floor glow under the device (default on). */
  shadow?: boolean;
}

export interface Anchor {
  id: string;
  el: HTMLElement;
  spec: AnchorSpec;
  /** Visitor rotation offset and its velocity (inertia after release). */
  user: { x: number; y: number; vx: number; vy: number; dragging: boolean };
  /** Cursor position inside the anchor, 0–1. */
  pointer: { x: number; y: number; inside: boolean };
  /** In or near the viewport (kept by an IntersectionObserver), so scrolling only wakes the stage when it matters. */
  onScreen: boolean;
}

/** Mutable singleton shared by DOM anchors and the render loop (no React re-renders per frame). */
let resolveReady = () => {};
const readyPromise = new Promise<void>(r => { resolveReady = r; });

export const stage = {
  anchors: new Map<string, Anchor>(),
  /** Wakes the render loop; set by the Canvas once it mounts. */
  wake: () => {},
  /** Picking and pulling for the breakdown; set by the renderer. */
  bd: null as null | BreakdownApi,
  /** Logo burst; set by the renderer once it mounts. */
  burst: null as null | ((spec: BurstSpec) => void),
  /** 0 while a burst is flying, rising to 1 as the logo rebuilds; 1 when idle. */
  burstProgress: () => 1,
  /** Resolves when the 3D stage has mounted (the desktop loader waits for it). */
  ready: readyPromise,
  /** True once the 3D stage has mounted: device anchors keep their still poster until then. */
  isReady: false,
  markReady: () => { stage.isReady = true; resolveReady(); },
  /** Live 3D is on (see quality.ts). */
  get webgl() { return getQuality() !== 'stills'; },
};

export interface BreakdownApi {
  /** Layer index under a client point (`inner` skips the outer shell, for the lens reading), or -1. */
  pick(x: number, y: number, inner?: boolean): number;
  pullStart(i: number, x: number, y: number): void;
  pullMove(x: number, y: number): void;
  /** Ends a pull; `near` is true when the layer was dropped over its slot (Build it yourself). */
  pullEnd(): { i: number; near: boolean } | null;
  /** Build it yourself: scatter the layers, or gather them back. */
  scatter(on: boolean): void;
  /** Lock a layer into its slot (correct drop in Build it yourself). */
  place(i: number): void;
}

/** A logo burst, in client (CSS px) coordinates. */
export interface BurstSpec {
  /** Where the click landed; pieces fly away from it. */
  from: { x: number; y: number };
  /** The logo the pieces start from (defaults to `home`). */
  start?: { left: number; top: number; width: number };
  /** The logo the pieces rebuild into; read every frame so it can move with scroll. */
  home: () => { left: number; top: number; width: number };
  palette: string[];
  leaf: string;
  power: number;
  small: boolean;
  /** No DOM logo waits at `home`: the rebuilt pieces fade out. */
  fadeAtEnd: boolean;
  onDone: () => void;
}
