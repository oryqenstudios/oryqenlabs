// Single source for the shot prompts. `node prompts/build.js` writes shots.html and SHOT_PROMPTS.md.
const LOCKS = {
  style: {
    title: 'Style lock',
    use: 'Every shot',
    text: 'Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9.',
  },
  crown: {
    title: 'Crown Pro lock',
    use: 'Shots 0–9',
    text: 'The Crown Pro: a slim smartphone, 149.6 × 71.4 × 7.9 mm, flat sides and softly rounded corners. Brushed grade 5 titanium frame with a very fine diamond micro-texture like pineapple rind, crossed by four thin antenna lines. A leaf-blade-shaped Crown Key with a small tactile ridge on the right side; two volume keys on the left. Back: frosted, colour-infused glass, laser-etched with a shallow pattern of small rounded hexagonal scales laid out in interlocking spirals, 8 one way and 13 the other, like the eyes of a pineapple; barely visible head-on, glinting at an angle. Upper-left corner of the back: a raised camera plateau shaped like a single rounded-hexagon pineapple scale, 1.8 mm high, holding three lenses in a triangle (a large round main lens, a smaller round ultra-wide lens and a square periscope telephoto window), plus a small flash and a tiny depth sensor, all under sapphire covers.',
  },
  slate: {
    title: 'Slate Pro lock',
    use: 'Shots 0 and 10',
    text: 'The Slate Pro: a 13-inch tablet, 281.6 × 215.5 × 5.1 mm, flat recycled-aluminium unibody with softly rounded corners and thin even screen borders. Back: anodised in a gradient that runs gold at the bottom to green at the top, laser-etched with the same small hexagonal pineapple-scale spiral pattern. A small scale-shaped camera plateau in one corner with a single lens and a depth sensor. The Quill stylus is slim and white, tapered like a crown leaf, flat on one side where it snaps magnetically to the long edge.',
  },
};

const FINISHES = [
  ['ripen', 'Ripen', 'frosted back glass with a thin-film coating that reads leaf green straight on and shifts to warm gold at steep angles; champagne titanium frame'],
  ['rind', 'Rind', 'frosted back glass in deep olive-bronze; dark bronze titanium frame'],
  ['golden', 'Golden Flesh', 'frosted back glass in warm buttery yellow-gold; pale gold titanium frame'],
  ['green', 'Crown Green', 'frosted back glass in deep leaf green; dark green-grey titanium frame'],
  ['core', 'Core', 'frosted back glass in warm cream; light champagne titanium frame'],
];

const SHOTS = [
  {
    id: 0, title: 'Master stills', used: 'Every shot below; finish picker (section 04)', frames: '4K stills', clip: 'Image model, not video', camera: 'Locked studio angles',
    start: 'None', end: 'None', device: 'crown',
    prompt: 'Product hero still of the Crown Pro in the {FINISH} finish ({FINISH_DESC}). {VIEW} The phone stands upright, centred, filling about 70% of the frame height, on the black studio void. Crisp focus across the whole device.',
    views: [
      ['three-quarter back (the master)', 'Three-quarter back view: rotated 35° to the right and tilted 8° toward the camera, camera plateau nearest the lens.'],
      ['back', 'Straight-on back view.'],
      ['front', 'Straight-on front view, screen on, showing a wallpaper of concentric gold and green rings like a sliced pineapple, with no text or clock.'],
    ],
    avoid: 'Extra lenses, lenses outside the plateau, a round or square plateau, visible logos, text on the screen, reflections of a studio or a photographer.',
    notes: [
      'Generate the Ripen three-quarter back first. Pick one image and lock it: this is the master every video shot starts and ends from.',
      'Make the other four finishes by editing the master ("change only the colour of the back glass, plateau and frame to …"), not by generating from scratch, so the camera plateau and scale pattern stay identical.',
      'Upscale each still to 3840 × 2160. Save as frames/shot-00/ripen.webp, rind.webp, golden.webp, green.webp and core.webp; the prototype’s finish picker loads exactly these names.',
      'Repeat for Slate Pro (Slate Pro lock) in Ripen, Rind and Core, front and back, saved as frames/shot-00/slate-ripen.webp and so on.',
    ],
  },
  {
    id: 1, title: 'Juice drop', used: 'Hero (01)', frames: 120, clip: '5 s', camera: 'Locked, very slow push-in',
    start: 'Master three-quarter back (Ripen)', end: 'Moment of impact (make this still first: edit the master to add a drop flattening on the plateau)', device: 'crown',
    prompt: 'Locked camera with a very slow push-in. The Crown Pro stands upright in the Ripen finish, three-quarter back view, camera plateau nearest the lens. A single thick drop of golden pineapple juice forms at the top of the frame, stretches on a thin glossy thread, lets go, and falls in slow motion straight onto the top of the camera plateau. The juice is translucent amber-gold with internal caustics and a few suspended pulp fibres. End on the exact moment of contact: the drop flattening against the plateau, a thin crown of liquid just starting to lift. The phone does not move.',
    avoid: 'Splashes before impact, liquid on the lenses before contact, the phone tilting or turning, camera shake, extra lenses, any change to the plateau shape.',
    notes: ['The rising sugar counter (0 → 14.2 °Bx) is HTML on top of these frames. Leave the upper-right of the frame clear.'],
  },
  {
    id: 2, title: 'Colour eruption', used: 'Hero (01)', frames: 150, clip: '6 s', camera: 'Locked, then a slow 10° rise',
    start: 'Last frame of shot 1', end: 'Peak of the splash (generate this still first and reuse it as the start of shot 3)', device: 'crown',
    prompt: 'Continuous from the moment the drop hits the camera plateau. The impact throws a high-speed eruption of thick, glossy liquid in five colours: deep olive-bronze, warm yellow-gold, leaf green, warm cream, and a green-to-gold gradient. Ribbons, crowns and droplets rise up and around the phone in a loose spiral. Each colour stays a separate, clean stream and never muddies into the others. The camera holds still for the first second, then rises slowly by about 10°. End at the peak: the liquid at its highest point, every droplet sharp and suspended, the phone clean apart from the plateau.',
    avoid: 'Brown or muddy colour mixing, liquid covering the phone, motion blur smearing the droplets, the phone moving, confetti or paint-powder look.',
    notes: ['These five colours are the finish palette; the logo burst on the page reuses them.'],
  },
  {
    id: 3, title: 'Frozen orbit', used: 'Frozen (02), with “Recolour the burst”', frames: '180 (2° per frame)', clip: '7.5 s', camera: '360° orbit at eye level, constant speed',
    start: 'Peak-of-splash still (end of shot 2)', end: 'The same frame, so it loops', device: 'crown',
    prompt: 'Time is completely frozen at the peak of the splash: every droplet, ribbon and crown of coloured liquid hangs motionless in the air around the Crown Pro. The camera makes one smooth, constant-speed 360° orbit at eye level around the phone and the splash, and finishes exactly where it started. Nothing moves except the camera. Reflections slide naturally across the titanium frame and the frosted back glass, and the etched scale pattern glints as the angle changes.',
    avoid: 'Liquid moving or dripping, the phone spinning instead of the camera, speed changes or easing, the splash changing shape on the far side, a different phone appearing from behind.',
    notes: [
      'Most tools cannot hold a full 360° in one generation. Make it as two 180° halves: first create a still of the same frozen scene seen from directly behind (image edit), then use it as the end frame of half one and the start frame of half two.',
      '“Recolour the burst” applies a hue/saturation/greyscale filter to these frames, which also tints the phone. If that shows, render a second pass with the splash removed and composite the untinted phone on top.',
    ],
  },
  {
    id: 4, title: 'Exploded view', used: 'Inside (05), cinematic intro', frames: 150, clip: '6 s', camera: 'Three-quarter view, slow rise',
    start: 'Assembled master (three-quarter)', end: 'Fully exploded still', device: 'crown',
    prompt: 'Three-quarter view of the Crown Pro, camera rising slowly. The phone separates layer by layer along its depth axis into ten evenly spaced layers, the outer layers first and the inner layers last. From front to back: clear front glass; the display panel, screen on with concentric gold and green rings; the titanium frame; a dark green double-stacked logic board with one square chip; a thin stainless-steel vapour chamber; a flat black battery cell; the camera system with its scale-shaped plateau, three lenses and a folded periscope module; two small speakers, a haptic motor and the USB-C port; a copper wireless-charging coil inside a grey magnet ring; and the etched back glass. As each layer separates, a soft bloom of coloured light opens behind it, each in its own shade of gold, green or amber. End fully exploded, all ten layers floating in one straight line.',
    avoid: 'Layers flying off in different directions, extra or missing layers, parts merging, screws scattering, liquid, labels or text.',
    notes: ['For the end frame, screenshot the live 3D model in section 05 with Explode at 100% and use it as the composition guide in an image-to-image edit of the master. The real layer order is then guaranteed.'],
  },
  {
    id: 5, title: 'Exploded orbit', used: 'Inside (05), cinematic intro', frames: '180 (2° per frame)', clip: '7.5 s', camera: '360° orbit, constant speed',
    start: 'Last frame of shot 4', end: 'The same frame, so it loops', device: 'crown',
    prompt: 'The ten layers of the exploded Crown Pro hang perfectly still in a straight line, each with its soft coloured glow behind it. The camera makes one smooth, constant-speed 360° orbit around the stack at eye level and returns exactly to the starting composition. Nothing moves except the camera.',
    avoid: 'Layers drifting or swapping order, glows flickering, speed changes, layers changing design on the far side.',
    notes: ['Use the same two-halves method as shot 3. The “Orbit 342°” and “Layers 10/10” readouts are HTML.'],
  },
  {
    id: 6, title: 'Lens fly-in', used: 'Camera (06); “Look closer” on the camera layer', frames: 150, clip: '6 s', camera: 'Push-in along the lens axis',
    start: 'Camera module close-up (crop and upscale from the master, then edit to macro)', end: 'Glowing sensor still', device: 'crown',
    prompt: 'Extreme macro. Start on the scale-shaped camera plateau of the Crown Pro, centred on the square periscope telephoto window. The camera pushes straight in along the lens axis, through the sapphire cover and into the dark lens barrel. Inside, a 45° glass prism is revealed. A beam of warm white light enters through the window, strikes the prism and folds 90° sideways, travels through a row of five precise lens elements, and lands on an image sensor that lights up green-gold. End on the glowing sensor, edge to edge.',
    avoid: 'Fantasy circuitry, glitch effects, the beam bending more than once, lens flares, text.',
    notes: ['The 0.5×–25× zoom slider is HTML over the last frame; leave the lower third calm.'],
  },
  {
    id: 7, title: 'Chip dive', used: 'Chip (07); “Look closer” on the logic board', frames: 150, clip: '6 s', camera: 'Top-down descent',
    start: 'Logic board, top-down (crop from the exploded still)', end: 'Glowing die still', device: 'crown',
    prompt: 'Top-down descent onto a dark green double-stacked logic board. The camera drops toward a square chip package with a plain brushed-metal lid, passes through the lid, and reveals the silicon die beneath. As the view settles on the die, its regions light up in sequence: two large performance cores in gold, four efficiency cores in green, six graphics clusters in pale blue, then a grid of 32 small neural-engine cores in amber. Fine, realistic silicon detail glowing from within. End on the fully lit die.',
    avoid: 'Sci-fi city-of-lights clichés, holograms, random glyphs, any text on the chip.',
    notes: ['Keep the lid blank: video models garble lettering. “NECTAR N7 PRO” and the counting core numbers are HTML.'],
  },
  {
    id: 8, title: 'Etched glass sweep', used: 'Design (03); “Look closer” on the back glass', frames: 120, clip: '5 s', camera: 'Locked macro; only the light moves',
    start: 'Back glass in shadow', end: 'Back glass fully lit', device: 'crown',
    prompt: 'Locked macro shot of the frosted back glass of the Crown Pro in the Ripen finish, filling the frame. Only the light moves. A narrow, low raking light sweeps slowly from left to right across the glass. Where it passes, it reveals a shallow laser-etched pattern of small rounded hexagonal scales arranged in interlocking spirals, 8 turning one way and 13 the other, like the eyes of a pineapple. The etching is very fine, almost invisible head-on, glinting only where the light grazes it. The thin-film coating shifts from leaf green to warm gold as the light angle changes. End with the whole back softly lit and the pattern visible across it.',
    avoid: 'Camera movement, deep or embossed bumps, the pattern changing between frames, scratches, fingerprints, logos.',
    notes: [],
  },
  {
    id: 9, title: 'Underwater', used: 'Durability (08)', frames: 150, clip: '6 s', camera: 'Follows the phone down',
    start: 'Phone just above a calm, clear water surface', end: 'Phone resting at depth', device: 'crown',
    prompt: 'The Crown Pro, screen on with a calm wallpaper of concentric gold and green rings, drops through the surface of clear, deep-blue water, trailing fine silver bubbles. The camera follows it down. Rippling caustic light from the surface slides across the titanium frame and the glass. The phone sinks slowly, turning a little so its lit screen faces the camera, and comes to rest on smooth pale sand. The screen stays on throughout. End with the phone resting at depth, a few bubbles still rising.',
    avoid: 'Cracks, water inside the phone, the screen switching off, murky water, fish, divers, text.',
    notes: ['The depth (6 m), time (30 min) and IP68 readouts are HTML and count up with scroll.'],
  },
  {
    id: 10, title: 'Slate Pro edge turn', used: 'Slate Pro (09); “Look closer” on the Quill strip and back panel', frames: 150, clip: '6 s', camera: 'Slow orbit to a side view',
    start: 'Master tablet front', end: 'Edge-on with the Quill touching the glass', device: 'slate',
    prompt: 'Start face-on to the Slate Pro, screen on with concentric gold and green rings. The camera orbits slowly to the side until the tablet is exactly edge-on, its 5.1 mm profile a thin bright line of aluminium. Then the Quill enters from the upper right and its fine tip touches the glass; a soft ring of light ripples out from the point of contact. End edge-on with the Quill tip touching the screen.',
    avoid: 'The tablet bending or warping, a keyboard appearing, hands, the stylus looking like a pencil or a pen with a clip.',
    notes: ['After this shot the page hands over to live HTML: visitors draw on the screen with the Quill.'],
  },
];

const WORKFLOW = [
  'Make shot 0 first and lock one master image. Every video shot starts, and where possible ends, on a frame derived from it, so the camera plateau and the etched back cannot drift.',
  'For each video shot, paste the full prompt (style lock, device lock, shot prompt and avoid line), upload the start frame, and upload the end frame if the tool accepts one.',
  'If the tool takes only a start frame, generate three or four takes and keep the one whose last frame is closest to the planned end still.',
  'Reject any take where the plateau shape, lens count or scale pattern changes. Small drift is very obvious when scrubbed frame by frame.',
  'Check the tool’s native output resolution. Frames are planned at 2560 × 1440 (1440p); upscale before export if the tool outputs 1080p. 1440p versus 2160p is still an open decision.',
  'Export each clip to frames with the command below, named so the prototype picks them up automatically: frames/shot-01/0001.webp and so on. Export a 4K still at each point where the scroll pauses.',
];

const EXPORT = `# frames ÷ clip seconds = fps (e.g. 120 frames from a 5 s clip → fps=24)
mkdir -p frames/shot-01
ffmpeg -i shot-01.mp4 -vf "fps=120/5,scale=2560:1440:flags=lanczos" -c:v libwebp -quality 82 frames/shot-01/%04d.webp`;

module.exports = { LOCKS, FINISHES, SHOTS, WORKFLOW, EXPORT };
