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
