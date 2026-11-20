# Higgsfield originals

Source files for the site's AI shots, kept here because Higgsfield deletes outputs after 7 days.
Site-ready frames are made from these with `site/scripts/ingest.mjs`.

## Shot 00 · Master still (locked)

`shot-00-master-crown-pro-ripen.png` · 2048×1152 · Qwen Image 3 text-to-image (`alibaba/qwen-image-3/text-to-image`),
resolution 2k, 16:9, seed 37, prompt enhancement off. Request `01a1f9ce-e4a0-7a1c-9745-a70fe354f480`.
Chosen from four candidates (option C). Every clip starts from this image.

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. The Crown Pro: a slim smartphone, 149.6 × 71.4 × 7.9 mm, flat sides and softly rounded corners. Brushed grade 5 titanium frame with a very fine diamond micro-texture like pineapple rind, crossed by four thin antenna lines. A leaf-blade-shaped Crown Key with a small tactile ridge on the right side; two volume keys on the left. Back: frosted, colour-infused glass, laser-etched with a shallow pattern of small rounded hexagonal scales laid out in interlocking spirals, 8 one way and 13 the other, like the eyes of a pineapple; barely visible head-on, glinting at an angle. Upper-left corner of the back: a raised camera plateau shaped like a single rounded-hexagon pineapple scale, 1.8 mm high, holding three lenses in a triangle (a large round main lens, a smaller round ultra-wide lens and a square periscope telephoto window), plus a small flash and a tiny depth sensor, all under sapphire covers. Product hero still of the Crown Pro in the Ripen finish (frosted back glass with a thin-film coating that reads leaf green straight on and shifts to warm gold at steep angles; champagne titanium frame). Three-quarter back view: rotated 35° to the right and tilted 8° toward the camera, camera plateau nearest the lens. The phone stands upright, centred, filling about 70% of the frame height, on the black studio void. Crisp focus across the whole device.

Negative prompt:

> Extra lenses, lenses outside the plateau, a round or square plateau, visible logos, text on the screen, reflections of a studio or a photographer.

## Shot 01 · Juice drop (take 2, live)

`shot-01-end-frame.png` · 2048×1152 · Qwen Image 3 edit of the master, seed 202: the drop lands squarely on the camera
plateau, with a crown splash on the main lens. The edit also moves the camera in about 2×, which Kling plays as a push-in.
Request `01a1f9d8-45ed-77b0-82c4-823ef4331aa2`.

`shot-01-juice-drop.mp4` · 1920×1080, 24 fps, 5 s · Kling 3.0 Pro image-to-video, first frame = master, last frame = the
end frame above, sound off, cfg_scale 0.5. Request `01a1f9d9-29fa-7c46-91c8-0b31d08421d0`. Ingested as 120 frames.

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Steady camera that pushes in smoothly toward the camera plateau over the whole shot. The Crown Pro stands upright in the Ripen finish, three-quarter back view, camera plateau nearest the lens. A single thick drop of golden pineapple juice forms at the top of the frame, stretches on a thin glossy thread, lets go, and falls in slow motion straight onto the top of the camera plateau. The juice is translucent amber-gold with internal caustics and a few suspended pulp fibres. End on the exact moment of contact: the drop flattening against the plateau, a thin crown of liquid just starting to lift. The phone does not move. Avoid: Splashes before impact, liquid on the lenses before contact, the phone tilting or turning, camera shake, extra lenses, any change to the plateau shape.

Take 1 (`*-take1.*`): same set-up with an earlier end frame where the drop landed on the top edge beside the plateau.
Kept for reference.

## Shot 02 · Colour eruption

`shot-02-colour-eruption.mp4` · 1920×1080, 24 fps, 6 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9e2-eec5-7604-9e3c-b989b72d3dfa`.
First frame: the shot 01 end frame. Last frame: still `s2-end` (Qwen Image 3, request `01a1f9e0-6539-746d-9370-e0a13119eced`).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Continuous from the moment the drop hits the camera plateau. The impact throws a high-speed eruption of thick, glossy liquid in five colours: deep olive-bronze, warm yellow-gold, leaf green, warm cream, and a green-to-gold gradient. Ribbons, crowns and droplets rise up and around the phone in a loose spiral. Each colour stays a separate, clean stream and never muddies into the others. The camera holds still for the first second, then rises slowly by about 10°. End at the peak: the liquid at its highest point, every droplet sharp and suspended, the phone clean apart from the plateau. Avoid: Brown or muddy colour mixing, liquid covering the phone, motion blur smearing the droplets, the phone moving, confetti or paint-powder look.

Still `s2-end` prompt:

> The juice drop's impact has erupted into a high-speed burst of thick glossy liquid in five separate colours: deep olive-bronze, warm yellow-gold, leaf green, warm cream, and a green-to-gold gradient. Ribbons, crowns and droplets rise up and around the top of the phone in a loose spiral, each colour a clean separate stream that never muddies. Frozen at its peak, every droplet sharp. Keep the phone, its design, position and framing, the lighting and the black background exactly the same; the phone stays clean apart from the camera plateau.

## Shot 03 · Frozen orbit

`shot-03-frozen-orbit.mp4` · 1920×1080, 24 fps, 8 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9e2-ee97-7fa8-ada0-98d98bebbcb6`.
First frame: still `s2-end` (Qwen Image 3, request `01a1f9e0-6539-746d-9370-e0a13119eced`). Last frame: still `s2-end` (Qwen Image 3, request `01a1f9e0-6539-746d-9370-e0a13119eced`).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Time is completely frozen at the peak of the splash: every droplet, ribbon and crown of coloured liquid hangs motionless in the air around the Crown Pro. The camera makes one smooth, constant-speed 360° orbit at eye level around the phone and the splash, and finishes exactly where it started. Nothing moves except the camera. Reflections slide naturally across the titanium frame and the frosted back glass, and the etched scale pattern glints as the angle changes. Avoid: Liquid moving or dripping, the phone spinning instead of the camera, speed changes or easing, the splash changing shape on the far side, a different phone appearing from behind.

## Shot 04 · Exploded view

`shot-04-exploded-view.mp4` · 1920×1080, 24 fps, 6 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9e2-ee87-7ceb-9d59-b4161afb0679`.
First frame: the master. Last frame: still `s4-end` (Qwen Image 3, request `01a1f9e0-65ad-7ed3-843d-be07d66107b8`).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Three-quarter view of the Crown Pro, camera rising slowly. The phone separates layer by layer along its depth axis into ten evenly spaced layers, the outer layers first and the inner layers last. From front to back: clear front glass; the display panel, screen on with concentric gold and green rings; the titanium frame; a dark green double-stacked logic board with one square chip; a thin stainless-steel vapour chamber; a flat black battery cell; the camera system with its scale-shaped plateau, three lenses and a folded periscope module; two small speakers, a haptic motor and the USB-C port; a copper wireless-charging coil inside a grey magnet ring; and the etched back glass. As each layer separates, a soft bloom of coloured light opens behind it, each in its own shade of gold, green or amber. End fully exploded, all ten layers floating in one straight line. Avoid: Layers flying off in different directions, extra or missing layers, parts merging, screws scattering, liquid, labels or text.

Still `s4-end` prompt:

> Show this exact phone (first image) disassembled into its ten internal layers floating apart in one straight line along its depth axis, laid out like the second image: clear front glass, the display, the titanium frame, a dark green logic board with one square chip, a thin steel vapour chamber, a flat black battery, the camera module with its hexagonal plateau and lenses, small speakers and a haptic motor, a copper wireless-charging coil in a grey magnet ring, and the etched green-to-gold back glass. A soft glow of gold, green or amber light behind each layer. Three-quarter view. Keep the phone's design, finish, camera plateau and lenses exactly as in the reference image. Photoreal, matte black studio background unless stated, no text, no logos, no watermark.

## Shot 05 · Exploded orbit (take 2, live)

`shot-05-exploded-orbit.mp4` · 1920×1080, 24 fps, 8 s · Kling 3.0 Pro image-to-video, first frame = still `s4-end` (the
exploded view), no last frame so the camera is free to move; about half an orbit. Request `01a1f9f3-32dd-7a86-93cd-8790d52d52a8`.

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. The ten layers of the exploded Crown Pro hang perfectly still in a straight line, each with its soft coloured glow behind it. The camera orbits steadily around the floating stack at eye level, travelling a long way round it so the layers sweep past and are seen from the side and from behind, at a constant speed. Only the camera moves; the layers never drift, merge or change order. Avoid: layers drifting or swapping order, glows flickering, speed changes, layers changing design.

Take 1 (`shot-05-exploded-orbit-take1.mp4`) used the same still as first and last frame; Kling held the stack almost still.

## Shot 06 · Lens fly-in

`shot-06-lens-fly-in.mp4` · 1920×1080, 24 fps, 6 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9e7-92a6-7af6-ae69-0055dbc53561`.
First frame: still `s6-start` (Qwen Image 3, request `01a1f9e0-65c8-7781-a6dc-e616a3820498`). Last frame: still `s6-end` (Qwen Image 3, request `01a1f9e0-65b1-78f8-9241-d5288276988d`).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Extreme macro. Start on the scale-shaped camera plateau of the Crown Pro, centred on the square periscope telephoto window. The camera pushes straight in along the lens axis, through the sapphire cover and into the dark lens barrel. Inside, a 45° glass prism is revealed. A beam of warm white light enters through the window, strikes the prism and folds 90° sideways, travels through a row of five precise lens elements, and lands on an image sensor that lights up green-gold. End on the glowing sensor, edge to edge. Avoid: Fantasy circuitry, glitch effects, the beam bending more than once, lens flares, text.

Still `s6-start` prompt:

> Extreme macro close-up of the raised hexagonal camera plateau on the back of this phone, filling the frame, centred on the square periscope telephoto window, sapphire lens covers with subtle blue-green coating reflections, shallow depth of field, studio light. Keep the phone's design, finish, camera plateau and lenses exactly as in the reference image. Photoreal, matte black studio background unless stated, no text, no logos, no watermark.

Still `s6-end` prompt:

> Inside a smartphone periscope camera, extreme macro: a beam of warm white light enters, strikes a 45-degree glass prism and folds 90 degrees sideways through a row of five precise lens elements onto a small image sensor that glows warm green-gold. Dark interior, glints on glass and metal, cinematic, shallow depth of field. Photoreal product photography, matte black studio void, one large soft key light from the upper left, a thin warm rim light from behind on the right, 16:9, no text, no logos, no watermark.

## Shot 07 · Chip dive

`shot-07-chip-dive.mp4` · 1920×1080, 24 fps, 6 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9e7-e15a-786a-b7e1-4975cd6fe81d`.
First frame: still `s7-start` (Qwen Image 3, request `01a1f9e0-66eb-73ae-b870-21181c0413d0`). Last frame: still `s7-end` (Qwen Image 3, request `01a1f9e0-b16a-77d2-8ecb-1d3c701c7be7`).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Top-down descent onto a dark green double-stacked logic board. The camera drops toward a square chip package with a plain brushed-metal lid, passes through the lid, and reveals the silicon die beneath. As the view settles on the die, its regions light up in sequence: two large performance cores in gold, four efficiency cores in green, six graphics clusters in pale blue, then a grid of 32 small neural-engine cores in amber. Fine, realistic silicon detail glowing from within. End on the fully lit die. Avoid: Sci-fi city-of-lights clichés, holograms, random glyphs, any text on the chip.

Still `s7-start` prompt:

> Top-down macro photograph of a dark green double-stacked smartphone logic board with a single square chip package with a plain brushed-metal lid in the centre, tiny components and gold contacts around it, no markings or text on any part. Photoreal product photography, matte black studio void, one large soft key light from the upper left, a thin warm rim light from behind on the right, 16:9, no text, no logos, no watermark.

Still `s7-end` prompt:

> Extreme top-down macro of a bare silicon chip die glowing from within: two large performance cores glowing gold, four efficiency cores glowing green, six graphics clusters glowing pale blue, and a grid of 32 small neural-engine cores glowing amber, with fine realistic silicon circuitry between them. No text. Photoreal product photography, matte black studio void, one large soft key light from the upper left, a thin warm rim light from behind on the right, 16:9, no text, no logos, no watermark.

## Shot 08 · Etched glass sweep

`shot-08-etched-glass-sweep.mp4` · 1920×1080, 24 fps, 5 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9eb-8d7c-73af-bd7e-4254d048c8d9`.
First frame: still `s8-start` (Qwen Image 3, request `01a1f9e0-b46f-784d-ae84-5a100b98c241`). Last frame: none (prompt-driven).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Locked macro shot of the frosted back glass of the Crown Pro in the Ripen finish, filling the frame. Only the light moves. A narrow, low raking light sweeps slowly from left to right across the glass. Where it passes, it reveals a shallow laser-etched pattern of small rounded hexagonal scales arranged in interlocking spirals, 8 turning one way and 13 the other, like the eyes of a pineapple. The etching is very fine, almost invisible head-on, glinting only where the light grazes it. The thin-film coating shifts from leaf green to warm gold as the light angle changes. End with the whole back softly lit and the pattern visible across it. Avoid: Camera movement, deep or embossed bumps, the pattern changing between frames, scratches, fingerprints, logos.

Still `s8-start` prompt:

> Extreme close-up of the frosted back glass of this phone filling the whole frame, showing a shallow laser-etched pattern of small rounded scales in interlocking spirals; the scene is almost dark, with only a faint narrow raking light at the far left edge so the pattern is barely visible. Same green-to-gold finish. Keep the phone's design, finish, camera plateau and lenses exactly as in the reference image. Photoreal, matte black studio background unless stated, no text, no logos, no watermark.

## Shot 09 · Underwater

`shot-09-underwater.mp4` · 1920×1080, 24 fps, 6 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9eb-8c4b-7fc2-a774-9d27aa20613d`.
First frame: still `s9-start` (Qwen Image 3, request `01a1f9e0-da51-7417-8fa8-0b0804c65e70`). Last frame: still `s9-end` (Qwen Image 3, request `01a1f9e0-dcdf-7074-aee2-3edd636f0690`).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. The Crown Pro drops through the surface of clear, deep-blue water, trailing fine silver bubbles. The camera follows it down. Rippling caustic light from the surface slides across the titanium frame and the glass. The phone sinks slowly with its etched back toward the camera and comes to rest on smooth pale sand. End with the phone resting at depth, a few bubbles still rising. Avoid: Cracks, water inside the phone, the screen switching off, murky water, fish, divers, text.

Still `s9-start` prompt:

> This exact phone, back facing the camera, falling into clear deep-blue water, just breaking the surface, trailing fine silver bubbles, with rippling caustic light across its titanium frame and frosted back; underwater view looking slightly up toward the bright surface. Keep the phone's design, finish, camera plateau and lenses exactly as in the reference image. Photoreal, no text, no logos, no watermark.

Still `s9-end` prompt:

> This exact phone, back facing up, resting on smooth pale sand at the bottom of clear deep-blue water six metres down, a few small bubbles rising, soft caustic light patterns rippling across the phone and the sand. Keep the phone's design, finish, camera plateau and lenses exactly as in the reference image. Photoreal, no text, no logos, no watermark.

## Shot 10 · Slate Pro edge turn

`shot-10-slate-pro-edge-turn.mp4` · 1920×1080, 24 fps, 6 s · Kling 3.0 Pro image-to-video, sound off, cfg_scale 0.5. Request `01a1f9ec-30e7-706d-abe7-801b402d7b35`.
First frame: still `s10-master` (Qwen Image 3, request `01a1f9e1-2c39-7682-9250-ff4787da7d20`). Last frame: none (prompt-driven).

Prompt:

> Photoreal product cinematography. Matte black studio void (#0A0B08). One large soft key light from the upper left, a thin warm rim light from behind on the right, controlled specular highlights, no lens flare. 100 mm macro lens look with shallow depth of field. No people, no hands, no on-screen text, no logos, no watermarks. 16:9. Start face-on to the Slate Pro, screen on with concentric gold and green rings. The camera orbits slowly to the side until the tablet is exactly edge-on, its 5.1 mm profile a thin bright line of aluminium. Then the Quill enters from the upper right and its fine tip touches the glass; a soft ring of light ripples out from the point of contact. End edge-on with the Quill tip touching the screen. Avoid: The tablet bending or warping, a keyboard appearing, hands, the stylus looking like a pencil or a pen with a clip.
