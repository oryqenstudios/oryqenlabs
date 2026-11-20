/** Device breakdown data (build plan §7). Shared by the parts list, spec panel, and (phase 3) the 3D stack. */
export type CloseUp =
  | { kind: 'shot'; shot: number; cap: string }
  | { kind: 'pixels' | 'rake'; cap: string };

export interface Layer {
  id: string;
  name: string;
  sub?: string;
  /** One-line story shown in the spec panel. */
  story: string;
  specs: string[];
  /** Thickness label for Dimensions mode (placeholder estimates). */
  mm: string;
  /** Thermal-mode reading in °C (placeholder). */
  temp: number;
  /** Outer shell: hidden in X-ray. */
  shell?: boolean;
  /** Faces the back of the device: inspecting turns the stack round. */
  back?: boolean;
  /** Where heat flows to in Thermal mode. */
  sink?: boolean;
  /** Hover-lens reading for the chip. */
  chip?: string;
  close?: CloseUp;
}

export type DeviceKey = 'phone' | 'tablet';

export const PHONE: Layer[] = [
  { id: 'front', name: 'Front glass', sub: 'Crystalline Shield', story: 'Named for the way pineapple flesh catches the light. It is the only layer your thumb ever touches.', specs: ['Nano-ceramic glass, 0.6 mm', 'Anti-reflective coating, reflectance under 2%', 'Oleophobic coating', 'Rated for 2 m drops onto concrete'], mm: '0.6 mm', temp: 30.2, shell: true },
  { id: 'display', name: 'Solaris display', story: 'Solaris, because it stays readable in full summer sun at up to 3,000 nits.', specs: ['6.5-inch LTPO OLED', '2880 × 1320, 487 ppi', 'Adaptive 1–144 Hz', '3,000 nits outdoor peak, 1,600 nits HDR, 1 nit minimum', '10-bit, P3 wide colour', '1.1 mm borders', '3.2 mm round camera cutout'], mm: '0.9 mm', temp: 33.5, shell: true, close: { kind: 'pixels', cap: 'Solaris display · 487 pixels per inch, each one three subpixels' } },
  { id: 'frame', name: 'Titanium frame', story: 'The rails carry a 0.2 mm diamond texture taken from pineapple rind, so the phone grips the way the fruit does.', specs: ['Grade 5 titanium', 'Diamond rind micro-texture at 0.2 mm pitch', '4 antenna segments hidden in the frame lines', 'Crown Key: pressure-sensitive, two-stage (light press focuses, full press acts)', 'Volume keys'], mm: '7.9 mm', temp: 32.1, shell: true, close: { kind: 'rake', cap: 'Rind texture under raking light · the Crown Key presses in two stages' } },
  { id: 'board', name: 'Logic board', story: 'Nectar is the sweetest part of the fruit. The N7 Pro sits at the centre of everything.', specs: ['Nectar N7 Pro chip, 2 nm process', '6-core CPU (2 performance, 4 efficiency)', '6-core GPU with hardware ray tracing', '32-core neural engine', '12 GB memory', 'Nectar Link 5G modem', 'Double-stacked board'], mm: '1.4 mm', temp: 39.8, chip: 'NECTAR N7 PRO · 41.2°C', close: { kind: 'shot', shot: 7, cap: 'Shot 07 · Chip dive: from the package down into the glowing die' } },
  { id: 'core', name: 'Core cooling chamber', story: 'Named after the pineapple core: the firm, cool centre that runs the length of the fruit.', specs: ['Stainless steel vapour chamber, 0.3 mm thin', 'Runs down the centre like a pineapple core', 'Covers 60% of the board', 'Graphite spreader sheets', 'Sustains peak performance twice as long'], mm: '0.3 mm', temp: 38.6, sink: true },
  { id: 'battery', name: 'Battery', story: 'Silicon-carbon chemistry packs more charge into the same slim cell.', specs: ['5,000 mAh silicon-carbon cell', 'Up to 32 hours video playback', '50 W wired charging, 50% in 20 minutes'], mm: '3.6 mm', temp: 31.4 },
  { id: 'camera', name: 'Prism camera system', story: 'A prism folds the light sideways, so a 120 mm telephoto fits inside a phone 7.9 mm thin.', specs: ['Main: 50 MP, 1/1.12-inch sensor, f/1.6, sensor-shift stabilisation', 'Ultra-wide: 48 MP, f/2.2, 120°, macro from 2 cm', 'Periscope telephoto: 48 MP, 5× optical (120 mm), f/2.8, folded prism, up to 25× digital zoom', 'Front: 24 MP with autofocus', 'Video: 4K at 120 fps, 10-bit HDR and log', 'Sapphire lens covers', 'Time-of-flight depth sensor', 'Scale-shaped plateau, 1.8 mm rise'], mm: '1.8 mm rise', temp: 34.0, back: true, close: { kind: 'shot', shot: 6, cap: 'Shot 06 · Lens fly-in: light folds through the prism onto the sensor' } },
  { id: 'small', name: 'Small parts', story: 'The parts you hear and feel: speakers, microphones, the Pulse haptic engine and the port.', specs: ['Stereo speakers with spatial audio', 'Four microphones', 'Pulse haptic engine (linear actuator)', 'USB-C with USB4 (40 Gb/s) and external display output'], mm: '2.4 mm', temp: 32.6 },
  { id: 'coil', name: 'Wireless charging coil and magnet ring', story: 'A ring of magnets lets cases and the wallet snap on in exactly the right place.', specs: ['25 W wireless, Qi2.2 compatible', '4.5 W reverse charging for accessories', 'Magnet ring for snap-on accessories'], mm: '0.5 mm', temp: 33.1 },
  { id: 'back', name: 'Etched back glass', story: 'Pineapple scales grow in 8 and 13 spirals. The back glass is etched with the same numbers.', specs: ['Frosted colour-infused glass', 'Laser-etched Fibonacci scale pattern (8 and 13 spirals), 20 µm deep', 'Ripen finish: thin-film coating that shifts from green to gold between 0° and 60° viewing angles'], mm: '0.7 mm', temp: 31.0, shell: true, back: true, close: { kind: 'shot', shot: 8, cap: 'Shot 08 · Etched glass sweep: raking light reveals the 8 and 13 spirals' } },
];

export const TABLET: Layer[] = [
  { id: 't-front', name: 'Front glass', sub: 'Crystalline Shield', story: 'The same Crystalline Shield glass as Crown Pro, with an optional matte nano-texture for drawing.', specs: ['Crystalline Shield glass', 'Anti-reflective coating', 'Optional nano-texture matte finish'], mm: '0.5 mm', temp: 29.4, shell: true },
  { id: 't-oled', name: 'OLED display', story: 'Two OLED layers stacked in tandem hold 1,200 nits across all 13 inches.', specs: ['13-inch tandem OLED', '2800 × 2100, 269 ppi', 'Adaptive 1–144 Hz', '1,200 nits full-screen, 1,800 nits HDR peak', '10-bit, P3 wide colour'], mm: '0.8 mm', temp: 31.8, shell: true, close: { kind: 'pixels', cap: 'Tandem OLED · 269 pixels per inch' } },
  { id: 't-board', name: 'Logic board', story: 'N7 Max: the same Nectar design with more cores, and a bigger body to keep them cool.', specs: ['Nectar N7 Max chip, 2 nm process', '10-core CPU (4 performance, 6 efficiency)', '12-core GPU with hardware ray tracing', '32-core neural engine', '16 GB memory (24 GB with 1 TB and 2 TB)', 'USB-C with USB4 (40 Gb/s)'], mm: '1.2 mm', temp: 38.9, chip: 'NECTAR N7 MAX · 38.9°C', close: { kind: 'shot', shot: 7, cap: 'Shot 07 · Chip dive (generated for N7 Pro; reused as a stand-in)' } },
  { id: 't-camera', name: 'Camera module', story: 'The front camera sits on the long edge, where your face is during a landscape call.', specs: ['Back: 12 MP wide, f/1.8, 4K at 60 fps', 'Time-of-flight depth sensor', 'Front: 12 MP ultra-wide on the landscape edge, with subject tracking'], mm: '1.6 mm', temp: 31.2, back: true },
  { id: 't-battery', name: 'Split battery cells', story: 'One cell either side of the board keeps the weight balanced in your hands.', specs: ['Two cells, 42 Wh total', 'Up to 12 hours web browsing', '45 W fast charging'], mm: '2.6 mm', temp: 30.6 },
  { id: 't-speakers', name: 'Four speakers', story: 'One speaker in each corner. Turn it any way and the sound turns with it.', specs: ['Four-speaker array with spatial audio', 'Five microphones'], mm: '2.2 mm', temp: 30.1 },
  { id: 't-quill', name: 'Quill charging strip', story: 'Snap the Quill to the long edge, shaped like a crown leaf, and it pairs and charges itself.', specs: ['Magnetic strip on the long edge', 'Pairs and charges the Quill wirelessly', 'Quill: 4,096 pressure levels, tilt sensing, 9 ms latency, squeeze gesture, haptic feedback, 14 hours battery, 16 g'], mm: '0.8 mm', temp: 29.8, close: { kind: 'shot', shot: 10, cap: 'Shot 10 · Edge turn: 5.1 mm, then the Quill tip touches the glass' } },
  { id: 't-keyboard', name: 'Keyboard connector', story: 'Three contacts power the Husk keyboard case directly, with no pairing.', specs: ['Three-contact magnetic connector for the Husk keyboard case', 'Powers the keyboard with no pairing'], mm: '0.6 mm', temp: 29.5 },
  { id: 't-back', name: 'Back panel', story: 'Like a whole pineapple, the back ripens from gold at the bottom to green at the top.', specs: ['Recycled aluminium unibody', 'Laser-etched scale pattern', 'Gradient anodising; the Ripen finish runs gold at the bottom to green at the top'], mm: '0.9 mm', temp: 33.4, shell: true, back: true, sink: true, close: { kind: 'shot', shot: 10, cap: 'Shot 10 · Slate Pro edge turn' } },
];

export const DEVICES: Record<DeviceKey, { name: string; layers: Layer[] }> = {
  phone: { name: 'Crown Pro', layers: PHONE },
  tablet: { name: 'Slate Pro', layers: TABLET },
};

/** Parts both devices share, for "Compare with …". */
const PAIRS: [string, string][] = [['front', 't-front'], ['display', 't-oled'], ['board', 't-board'], ['battery', 't-battery'], ['camera', 't-camera'], ['small', 't-speakers'], ['back', 't-back']];
export const COUNTERPART: Record<string, string> = Object.fromEntries(PAIRS.flatMap(([a, b]) => [[a, b], [b, a]]));
export const findLayer = (id: string) => [...PHONE, ...TABLET].find(l => l.id === id);
