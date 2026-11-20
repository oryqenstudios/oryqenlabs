import type { DeviceKey } from './devices';

/** A callout on a part's macro photograph, in that photograph's own 0–1 coordinates. */
export interface Marker { x: number; y: number; label: string }
/** Where a layer sits in the exploded photograph (0–1, left/top/right/bottom), and its callouts. Its macro is an
 *  exact crop of that rect, sharpened, so the camera can move in and the macro fades in without a jump. */
export interface Part { rect: [number, number, number, number]; markers: Marker[] }

/** The photographed breakdown: frames/teardown/<device>.webp and frames/teardown/<device>/<layer>.webp. */
export const TEARDOWN: Partial<Record<DeviceKey, { parts: Record<string, Part> }>> = {
  phone: {
    parts: {
      front: { rect: [-0.0088, 0.1102, 0.2446, 0.9097], markers: [{ x: 0.13, y: 0.45, label: "Polished chamfered edge" }, { x: 0.35, y: 0.2, label: "Crystalline Shield, 0.6 mm" }, { x: 0.4, y: 0.85, label: "Anti-reflective + oleophobic coats" }] },
      display: { rect: [0.0713, 0.1146, 0.3247, 0.9149], markers: [{ x: 0.56, y: 0.48, label: "6.5-inch LTPO OLED · 487 ppi" }, { x: 0.31, y: 0.3, label: "1.1 mm border" }, { x: 0.6, y: 0.96, label: "Display flex cable" }] },
      frame: { rect: [0.2002, 0.0851, 0.4658, 0.9253], markers: [{ x: 0.755, y: 0.36, label: "Crown Key, two-stage" }, { x: 0.755, y: 0.5, label: "Volume keys" }, { x: 0.22, y: 0.55, label: "Grade 5 titanium, rind texture" }, { x: 0.62, y: 0.92, label: "Mounting bracket" }] },
      board: { rect: [0.3491, 0.1146, 0.5864, 0.8646], markers: [{ x: 0.42, y: 0.33, label: "Nectar N7 Pro · 2 nm" }, { x: 0.5, y: 0.62, label: "12 GB memory" }, { x: 0.62, y: 0.2, label: "Modem and RF shielding" }, { x: 0.56, y: 0.9, label: "Board-to-board connectors" }] },
      core: { rect: [0.4595, 0.1398, 0.6807, 0.8403], markers: [{ x: 0.45, y: 0.35, label: "Stainless vapour chamber, 0.3 mm" }, { x: 0.5, y: 0.75, label: "Laser-welded seam" }, { x: 0.38, y: 0.1, label: "Mounting tab" }] },
      battery: { rect: [0.6084, 0.4054, 0.7412, 0.8247], markers: [{ x: 0.4, y: 0.45, label: "5,000 mAh silicon-carbon cell" }, { x: 0.15, y: 0.2, label: "Sealed pouch edge" }, { x: 0.72, y: 0.35, label: "Flex connector" }] },
      camera: { rect: [0.5605, 0.0851, 0.7295, 0.3854], markers: [{ x: 0.52, y: 0.4, label: "Main · 50 MP · f/1.6" }, { x: 0.72, y: 0.6, label: "Ultra-wide · 48 MP" }, { x: 0.53, y: 0.76, label: "Periscope · 5× · 120 mm" }, { x: 0.73, y: 0.33, label: "Flash" }, { x: 0.14, y: 0.45, label: "Front camera · 24 MP" }] },
      small: { rect: [0.709, 0.6198, 0.8213, 0.8203], markers: [{ x: 0.73, y: 0.4, label: "Stereo speaker" }, { x: 0.57, y: 0.5, label: "Microphone" }, { x: 0.76, y: 0.76, label: "Pulse haptic engine" }, { x: 0.42, y: 0.82, label: "USB-C · USB4, 40 Gb/s" }] },
      coil: { rect: [0.7407, 0.3446, 0.8633, 0.6354], markers: [{ x: 0.3, y: 0.38, label: "Copper coil · 25 W" }, { x: 0.1, y: 0.55, label: "Magnet ring" }, { x: 0.42, y: 0.87, label: "Flex tail" }] },
      back: { rect: [0.7612, 0.0747, 0.9888, 0.7951], markers: [{ x: 0.42, y: 0.17, label: "Opening for the camera plateau" }, { x: 0.7, y: 0.55, label: "Etched scales, 20 µm deep" }, { x: 0.88, y: 0.88, label: "Green-to-gold thin-film finish" }] },
    },
  },
};
