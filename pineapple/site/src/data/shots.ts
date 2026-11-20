/** AI-generated sequences (build plan §13). Frame counts must match the generated exports. */
export interface Shot {
  id: number; title: string; frames: number; alt: string;
  /** On screens taller than the footage, show at least this share of the frame's width (1 = all of it) instead of
   *  cropping to fill. For wide compositions whose subject would be cut off; omit to fill (close-ups). */
  fit?: number;
  /** Keep at least this share of the frame's height in view on wide screens. Above 1 it leaves a margin, so a subject
   *  that fills the frame clears the nav bar; shots that cut together share the same value so nothing jumps. */
  fitH?: number;
  /** Generated once per finish: frames live in shot-NN/<finish>/ and follow the chosen finish (see manifest `variants`). */
  variants?: boolean;
}
export const SHOTS: Record<number, Shot> = {
  0: { id: 0, title: 'Master stills', frames: 1, alt: 'Crown Pro seen from the back: frosted glass etched with spiral scales, and a raised scale-shaped camera plateau with three lenses.' },
  1: { id: 1, title: 'Spin and splash', frames: 120, variants: true, alt: 'The whole Crown Pro turns from its glowing screen to its etched back while a splash in the colours of its finish erupts and fills the screen.' },
  2: { id: 2, title: 'Colour eruption', frames: 150, alt: 'The drop erupts into ribbons of the five finish colours around the phone.' },
  3: { id: 3, title: 'Light finds the lens', frames: 120, fit: 0.55, fitH: 1.1, alt: 'In darkness, a shaft of warm light falls on the camera plateau and the view glides into the main lens.' },
  4: { id: 4, title: 'Exploded view', frames: 120, fit: 0.7, fitH: 1.1, alt: 'The phone, seen from the back, separates into its ten layers, which glide apart into a row: front glass, display, frame, logic board, cooling plate, battery, camera, small parts, charging coil and back glass.' },
  5: { id: 5, title: 'Back together', frames: 120, fit: 0.7, fitH: 1.1, alt: 'The ten layers glide back together and the phone turns to face you, its screen on.' },
  6: { id: 6, title: 'Lens fly-in', frames: 150, fit: 0.85, fitH: 1.1, alt: 'The view flies into the periscope lens, where a beam of light folds through a prism onto the sensor.' },
  7: { id: 7, title: 'Chip dive', frames: 150, alt: 'The view descends onto the Nectar chip on the logic board; its metal lid lifts away to reveal the bare, iridescent silicon die.' },
  8: { id: 8, title: 'Etched glass sweep', frames: 120, alt: 'A raking light sweeps across the back glass and reveals the etched spiral pattern.' },
  9: { id: 9, title: 'Underwater', frames: 150, alt: 'The phone enters clear water screen first, turns over as it sinks and comes to rest standing on the sand six metres down.' },
  11: { id: 11, title: 'Pull back to the crown', frames: 120, fit: 0.55, fitH: 1.1, alt: 'The view pulls back out of the lens to the whole phone standing in front of giant brushed-gold letters spelling CROWN.' },
  12: { id: 12, title: 'Into the scales', frames: 96, fit: 0.55, fitH: 1.1, alt: 'The camera glides in on the etched scales of the back glass.' },
  13: { id: 13, title: 'Into the Crown Key', frames: 96, fit: 0.55, fitH: 1.1, alt: 'The camera glides in on the titanium side keys.' },
  14: { id: 14, title: 'Approach', frames: 144, fit: 0.85, fitH: 1.1, alt: 'The view starts on the whole phone and glides slowly in towards the camera plateau.' },
  15: { id: 15, title: 'Turn, front to back', frames: 108, fit: 0.7, fitH: 1.1, alt: 'The phone turns from its screen to its back.' },
  16: { id: 16, title: 'Turn, back to front', frames: 120, fit: 0.7, fitH: 1.1, alt: 'The phone turns from its back to its screen.' },
  17: { id: 17, title: 'Lay it down', frames: 120, fit: 0.6, fitH: 1.05, alt: 'Slate Pro tips back and lies flat on a dark stone desk under the camera, its screen a blank drawing canvas, the Quill beside it.' },
  18: { id: 18, title: 'Bass drop', frames: 120, fit: 0.8, alt: 'A deep bass note plays from the speakers on the bottom edge of the phone and water droplets on the black glass beside them leap into the air.' },
  10: { id: 10, title: 'Slate Pro edge turn', frames: 150, fit: 0.95, alt: 'Slate Pro turns edge-on to show its 5.1 mm profile, then the Quill touches the screen.' },
};
