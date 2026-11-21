import type { ExploreSource } from '../sections/Teardown';

/** Nectar N7 Pro on the logic board, photographed (frames/chip/board.webp, frames/chip/board/<part>.webp). Part rects are
 *  where each sits in the photo; close-ups are exact crops of them, sharpened. Specs are placeholders. */
export const CHIP: ExploreSource = {
  name: 'Nectar N7 Pro',
  dir: 'chip/board',
  layers: [
    { id: 'chip', name: "Nectar N7 Pro", story: "The chip at the centre of everything, held flat on the board by a polished steel frame.", specs: ["2 nm process", "6-core CPU (2 performance, 4 efficiency)", "6-core GPU with hardware ray tracing", "32-core neural engine", "12 GB unified memory"], mm: "2 nm", temp: 38 },
    { id: 'caps', name: "Polymer capacitors", story: "A bank of capacitors smooths the power the chip draws in microsecond bursts.", specs: ["Aluminium polymer, very low resistance", "Placed millimetres from the chip"], mm: "Power", temp: 38 },
    { id: 'pmic', name: "Power management", story: "Turns the battery's single voltage into the dozens of rails the board needs.", specs: ["Multi-rail power management chip", "Fine-pitch metal leads"], mm: "Power", temp: 38 },
    { id: 'tant', name: "Tantalum capacitors", story: "Stable under heat, they steady the camera and display power.", specs: ["Tantalum polymer", "High capacity in a tiny package"], mm: "Power", temp: 38 },
    { id: 'conn', name: "Board connectors", story: "Where the display, cameras and battery plug in.", specs: ["Board-to-board connectors", "Shielded against interference"], mm: "I/O", temp: 38 },
  ],
  parts: {
    chip: { rect: [0.2784, 0.1662, 0.7416, 0.7838], markers: [{ x: 0.5, y: 0.5, label: "Bare silicon die" }, { x: 0.2, y: 0.18, label: "Steel retention frame" }, { x: 0.5, y: 0.28, label: "Gold contact rows" }, { x: 0.84, y: 0.84, label: "Mounting screw" }] },
    caps: { rect: [0.6233, 0.0094, 0.8567, 0.3206], markers: [{ x: 0.4, y: 0.4, label: "Polymer capacitor" }, { x: 0.6, y: 0.78, label: "Solder fillet" }] },
    pmic: { rect: [0.0288, 0.6822, 0.1612, 0.9178], markers: [{ x: 0.5, y: 0.45, label: "Power-management chip" }, { x: 0.5, y: 0.86, label: "Metal leads" }] },
    tant: { rect: [0.7314, 0.2175, 0.8186, 0.3725], markers: [{ x: 0.5, y: 0.45, label: "Tantalum capacitor" }, { x: 0.5, y: 0.86, label: "Terminal and solder" }] },
    conn: { rect: [0.0, 0.381, 0.1006, 0.699], markers: [{ x: 0.5, y: 0.4, label: "Connector" }, { x: 0.5, y: 0.8, label: "Shield and pins" }] },
  },
};
