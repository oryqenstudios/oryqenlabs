# PINEAPPLE — Website Build Plan

Brief for Claude Code. Planned in chat on 20 Nov 2026. PINEAPPLE is a fictional phone and tablet brand; every product name and spec below is a placeholder that can be changed.

---

## 1. Goal

A flagship marketing website for PINEAPPLE that feels very, very expensive.

- **Style reference:** Apple's product pages — layout, typography, product storytelling, scroll-driven reveals, mix of dark and light sections.
- **Push beyond Apple:** bolder, more colourful, photoreal product animation, colour explosions (see References).
- **Must be:** 3D, animated and interactive throughout; 4K-sharp.
- **Must not use:** Apple's logo, product names, trademarks or marketing copy, or the SF Pro font (its licence only covers Apple platforms).

---

## 2. Brand

**Concept: "Designed by nature's math."** Real pineapples grow their scales in Fibonacci spirals (8 one way, 13 the other). That spiral is PINEAPPLE's signature, the way minimalism is Apple's.

- **Logo:** an original pineapple mark — faceted body with a crown of leaves. SVG. Must read clearly at 16 px.
- **Typography:** Inter (free), or a paid grotesque such as Söhne or Neue Haas Grotesk for a more expensive feel. Headlines can mix bold sans with one italic serif word: "Designed by *nature's math*."
- **Voice:** short, confident lines. One idea per screen.
- **Background motif:** a golden-spiral dot pattern (golden angle, 137.5°) that slowly blooms as you scroll.

### Colours

| Name | Use |
| --- | --- |
| Rind | Deep olive-bronze. Crown Pro and Slate Pro finish |
| Golden Flesh | Warm yellow-gold. Crown Pro finish |
| Crown Green | Leaf green. Crown Pro finish |
| Core | Warm cream. Crown Pro and Slate Pro finish |
| Ripen | Green-to-gold gradient. Signature finish and the brand accent gradient |
| Mango, Lime, Guava, Blueberry, Coconut | Zest phone finishes |

### Restraint rules (non-negotiable)

- One typeface family.
- One easing curve for every animation.
- Generous whitespace; one idea per screen.
- Animations are tied to scroll position rather than autoplaying.
- Nothing flashy without a purpose. Colour explosions are punctuation, not wallpaper.

---

## 3. Product lineup

| Product | What it is |
| --- | --- |
| **Crown Pro** | Titanium flagship phone |
| **Zest** | Colourful, playful phone (specs not yet defined) |
| **Slate Pro** | 13-inch tablet, with the **Quill** stylus and **Husk** keyboard case |

Supporting names: **Nectar** chip (N7 Pro in the phone, N7 Max in the tablet), **Solaris** display, **Prism** camera system, **Canopy OS**, **Crown Key** (side button), **Crystalline Shield** glass, **Nectar Link** modem, **Pulse** haptic engine.

---

## 4. Product design language — designed with reference to a pineapple

Rule: *reference, don't replicate.* Each device gets one or two signature pineapple cues, done subtly.

| Pineapple part | Design feature |
| --- | --- |
| Scales (the "eyes") | **Etched back:** fine hexagonal pattern laser-etched into frosted glass, laid out in Fibonacci spirals. Barely visible head-on; catches the light at an angle. Signature across the lineup |
| Single scale | **Camera module:** raised plateau shaped like one rounded-hexagon scale, lenses in a triangle inside it |
| Crown leaves | **Crown Key:** leaf-blade shape with a tactile ridge. **Quill:** slim, tapered like a crown leaf, flat on one side to snap magnetically to the tablet. **Boot animation:** crown leaves unfurl |
| Skin (rind) | **Pro frame:** fine diamond texture on the titanium rails (also improves grip). **Husk case:** woven textile in rind tones |
| Ripening | **Ripen finish:** thin-film coating that shifts from green to gold as the viewing angle changes |
| Whole fruit | **Slate Pro back:** scale pattern fading from gold at the bottom to green at the top |
| Cross-section | Default wallpaper and boot screen use the radial rings of a sliced pineapple |

---

## 5. Page flow (one long page)

**Persistent UI:** sticky nav with logo, section links, a sound toggle (off by default) and a Buy button showing the price.

**Section pattern:** each section opens with a small numbered monospaced label ("01 · THE DROP"), a two-line headline whose last word is in the Ripen gradient, and one line telling the visitor what to do ("Scroll to circle it. Then repaint it.").

| # | Section | What happens |
| --- | --- | --- |
| 0 | Loading screen | The pineapple crown leaves unfurl as the progress indicator |
| 1 | Hero — "PINEAPPLE **Crown**" | A golden juice drop falls onto the scale-shaped camera module while a counter rises, then bursts into the five finish colours (shots 1–2). Colour droplets follow the cursor. Clicking the logo triggers the logo burst |
| 2 | Frozen moment | Time stops at the peak of the burst; scrolling orbits 360° around it ("Orbit 342°" readout). "Recolour the burst" chips repaint the splash, and the page accent follows (shot 3) |
| 3 | Design | Etched-back light sweep, camera module, Crown Key, rind-textured frame. Drag to spin the phone; a light follows the cursor so the etched pattern glints |
| 4 | Finish picker | Pick a finish; the phone's material blends into it and the page lighting/accent changes to match. Ripen visibly shifts green to gold as the phone turns |
| 5 | Device breakdown | Exploded view with colour bursts, exploded orbit, hands-on interactions, spec panel, hover-lens scanner (see §7) |
| 6 | Camera | Fly into the periscope lens; zoom slider 0.5× to 25× |
| 7 | Chip | Dive into the Nectar die as its cores light up; performance numbers count up |
| 8 | Durability | Crown Pro sinks under water, with live readouts: depth 6 m, time 30 min, IP68 |
| 9 | Slate Pro | Tablet turns edge-on to show 5.1 mm; visitors draw on its screen with the Quill |
| 10 | Compare & buy | Lineup comparison (Crown Pro, Zest, Slate Pro); live 3D configurator for model, finish and storage |
| 11 | Footer | Apple-style fine print and links |

---

## 6. Logo burst

Clicking the logo makes it explode in colour — from the pineapple itself, not generic confetti.

- **Breaks into its own scales:** the pineapple bursts into dozens of small glossy 3D hexagonal scales that spin outward and catch the light.
- **Brand colours:** scales scatter in the finish colours (Ripen, Mango, Lime, Guava, Blueberry, Coral). Each click cycles to a different palette.
- **Crown leaves** flutter off separately and drift down more slowly.
- **Starts from the click point.**
- **Page reacts:** background lighting briefly takes on the burst colours.
- **Reassembles:** after about two seconds the scales spiral back along the Fibonacci pattern and rebuild the logo.
- **Extras:** press and hold to charge a bigger burst (logo trembles and glows); five quick clicks gives a rare all-gold burst.
- **Placement:** full burst on the large logo (loading screen, hero, footer). The small nav logo does a tiny burst and still scrolls to top.
- **Implementation:** instanced meshes (one draw call); fewer pieces on phones; a new burst only once the logo is mostly rebuilt; reduce-motion users get a soft colour pulse; sound off by default, a subtle glassy shimmer if on.

---

## 7. Device breakdown

Visitors take each device apart layer by layer, by scrolling or by hand, and every layer opens its full specifications.

### Crown Pro phone (front to back)

| # | Layer | Specifications |
| --- | --- | --- |
| 1 | Front glass (Crystalline Shield) | Nano-ceramic glass, 0.6 mm · anti-reflective coating, reflectance under 2% · oleophobic coating · rated for 2 m drops onto concrete |
| 2 | Solaris display | 6.5-inch LTPO OLED · 2880 × 1320, 487 ppi · adaptive 1–144 Hz · 3,000 nits outdoor peak, 1,600 nits HDR, 1 nit minimum · 10-bit, P3 wide colour · 1.1 mm borders · 3.2 mm round camera cutout |
| 3 | Titanium frame | Grade 5 titanium · diamond rind micro-texture at 0.2 mm pitch · 4 antenna segments hidden in the frame lines · Crown Key: pressure-sensitive, two-stage (light press focuses, full press acts) · volume keys |
| 4 | Logic board | Nectar N7 Pro chip, 2 nm process · 6-core CPU (2 performance, 4 efficiency) · 6-core GPU with hardware ray tracing · 32-core neural engine · 12 GB memory · Nectar Link 5G modem · double-stacked board |
| 5 | "Core" cooling chamber | Stainless steel vapour chamber, 0.3 mm thin, running down the centre like a pineapple core · covers 60% of the board · graphite spreader sheets · sustains peak performance twice as long |
| 6 | Battery | 5,000 mAh silicon-carbon cell · up to 32 hours video playback · 50 W wired charging, 50% in 20 minutes |
| 7 | Prism camera system | Main: 50 MP, 1/1.12-inch sensor, f/1.6, sensor-shift stabilisation · Ultra-wide: 48 MP, f/2.2, 120°, macro from 2 cm · Periscope telephoto: 48 MP, 5× optical (120 mm), f/2.8, folded prism, up to 25× digital zoom · Front: 24 MP with autofocus · Video: 4K at 120 fps, 10-bit HDR and log · sapphire lens covers · time-of-flight depth sensor · scale-shaped plateau, 1.8 mm rise |
| 8 | Small parts | Stereo speakers with spatial audio · four microphones · Pulse haptic engine (linear actuator) · USB-C with USB4 (40 Gb/s) and external display output |
| 9 | Wireless charging coil and magnet ring | 25 W wireless, Qi2.2 compatible · 4.5 W reverse charging for accessories · magnet ring for snap-on accessories |
| 10 | Etched back glass | Frosted colour-infused glass · laser-etched Fibonacci scale pattern (8 and 13 spirals), 20 µm deep · Ripen finish: thin-film coating that shifts from green to gold between 0° and 60° viewing angles |

### Slate Pro tablet (front to back)

| # | Layer | Specifications |
| --- | --- | --- |
| 1 | Front glass | Crystalline Shield glass · anti-reflective coating · optional nano-texture matte finish |
| 2 | OLED display | 13-inch tandem OLED · 2800 × 2100, 269 ppi · adaptive 1–144 Hz · 1,200 nits full-screen, 1,800 nits HDR peak · 10-bit, P3 wide colour |
| 3 | Logic board | Nectar N7 Max chip, 2 nm process · 10-core CPU (4 performance, 6 efficiency) · 12-core GPU with hardware ray tracing · 32-core neural engine · 16 GB memory (24 GB with 1 TB and 2 TB) · USB-C with USB4 (40 Gb/s) |
| 4 | Camera module | Back: 12 MP wide, f/1.8, 4K at 60 fps · time-of-flight depth sensor · Front: 12 MP ultra-wide on the landscape edge, with subject tracking |
| 5 | Split battery cells | Two cells, 42 Wh total · up to 12 hours web browsing · 45 W fast charging |
| 6 | Four speakers | Four-speaker array with spatial audio · five microphones |
| 7 | Quill charging strip | Magnetic strip on the long edge · pairs and charges the Quill wirelessly · Quill: 4,096 pressure levels, tilt sensing, 9 ms latency, squeeze gesture, haptic feedback, 14 hours battery, 16 g |
| 8 | Keyboard connector | Three-contact magnetic connector for the Husk keyboard case · powers the keyboard with no pairing |
| 9 | Back panel | Recycled aluminium unibody · laser-etched scale pattern · gradient anodising; the Ripen finish runs gold at the bottom to green at the top |

### How visitors interact with it

| Interaction | Desktop | Touch | What happens |
| --- | --- | --- | --- |
| Explode | Scroll, or drag the explode slider | Swipe up, or drag the slider | Layers separate in a staggered order, each in its own colour burst; the slider lets visitors stop at any point |
| Rotate | Drag empty space | One-finger drag | The whole stack turns to any angle and keeps turning briefly after release |
| Zoom | Pinch on trackpad, or Ctrl + scroll | Pinch | The camera moves closer, within set limits |
| Pull a layer | Drag a layer out of the stack | Long-press, then drag | The layer follows the pointer and springs back into place on release |
| Inspect | Click a layer, or its name in the parts list | Tap | Other layers fade, the chosen layer turns to face the viewer, and the spec panel slides in |
| Parts list | Hover a name | Tap a name | The matching layer glows in 3D; hovering a layer highlights its name in the list |
| Step through | Up and Down arrow keys; Esc to exit | Swipe left or right on the spec panel | Moves to the next or previous layer and its specs |
| Hover-lens scanner | Move the cursor over the device | Drag a finger over it | A circular lens shows the insides, with a live reading such as "NECTAR N7 PRO · 41.2°C" |
| View modes | Toggle buttons | Toggle buttons | X-ray (outer shell see-through), Thermal (heat flows from the chip into the Core cooling chamber), Dimensions (each layer's thickness labelled in mm) |
| Finish | Pick a colour swatch | Tap a swatch | Back and frame recolour live, even while exploded |
| Switch device | Crown Pro / Slate Pro toggle | Same toggle | The phone stack morphs into the tablet stack; the parts list and specs update |
| Look closer | Button in the spec panel | Same button | The camera flies into that part's close-up |
| Reassemble | Reassemble button, or keep scrolling | Same | Layers snap back together with a satisfying click |
| Build it yourself (hidden extra) | Drag shuffled layers back into the stack | Drag with one finger | Getting the order right completes the device and triggers the logo burst |

**Spec panel.** Opening a layer shows its name, a one-line story (for example, why the cooling chamber is called Core) and its specifications from the tables above. Buttons: Look closer, Compare with Slate Pro (for parts both devices share), next and previous layer.

**Stat cards.** Corner readouts such as "Layers separated 7/10", plus key numbers (6.5", N7 Pro, 5,000 mAh) in large coloured type.

### Overall specifications

| Spec | Crown Pro | Slate Pro |
| --- | --- | --- |
| Dimensions | 149.6 × 71.4 × 7.9 mm | 281.6 × 215.5 × 5.1 mm |
| Weight | 189 g | 579 g |
| Water and dust | IP68, 6 m for 30 minutes | Not water-rated |
| Connectivity | 5G (sub-6 GHz and mmWave), Wi-Fi 7, Bluetooth 6.0, ultra-wideband, NFC, satellite messaging | Wi-Fi 7, Bluetooth 6.0, optional 5G |
| Storage | 256 GB, 512 GB, 1 TB, 2 TB | 256 GB, 512 GB, 1 TB, 2 TB |
| Operating system | Canopy OS 3 | Canopy OS 3 |
| Finishes | Rind, Golden Flesh, Crown Green, Core, Ripen | Ripen, Rind, Core |
| Accessories | Snap-on magnetic cases and wallet | Quill stylus, Husk keyboard case |

---

## 8. Close-ups

Each signature detail gets a camera fly-in with shallow depth of field, so the background blurs like macro photography.

| Detail | What the visitor sees |
| --- | --- |
| Etched back | A sweep of light across the glass reveals the Fibonacci scale pattern |
| Camera module | The view flies into the periscope lens and an animated beam of light folds through the prism |
| Display | The view zooms into the screen until individual pixels show, proving 4K-level sharpness |
| Nectar chip | The view zooms from the chip package down into the glowing die |
| Crown Key | The key presses in, showing its tactile ridge |
| Titanium frame | The rind texture under raking light |
| Tablet edge | The tablet turns edge-on to show it is 5.1 mm thin, then the Quill tip touches the glass |

---

## 9. Build approach and tech stack

### Hybrid build

- **AI-generated frame sequences** carry the cinematic, photoreal moments: hero drop and eruption, frozen orbit, exploded view and orbit, fly-ins, underwater scene, tablet edge turn. Scroll plays them forward or backward. See the shot list (§13).
- **Live real-time 3D** only where visitors interact freely: drag-to-rotate, pulling out a layer, live finish recolouring, phone/tablet switch, configurator, logo burst, Quill drawing.
- **Interactive HTML overlays** on top: counters, stat cards, hover-lens scanner, cursor-following droplets, palette chips.
- **Recolouring:** a colour filter (hue/saturation/greyscale) on the frames is fine for paint splashes, but not for the device — it would tint the screen, lenses and metal. Device finishes need one render per finish, or the live 3D configurator.

### Stack

- Next.js or Vite + React
- React Three Fiber + drei (live 3D)
- GSAP ScrollTrigger (scroll animation) + Lenis (smooth scrolling)
- Theatre.js (visual timeline for choreographing camera and device moves)
- Tailwind CSS
- A canvas-based frame-sequence player that preloads frames and scrubs them with scroll

### 3D realism

- One persistent 3D canvas behind the page; the device never leaves the screen — it flies, turns, explodes and recolours between sections.
- Physically based materials: clearcoat on glass, metalness/roughness on titanium, anisotropic brushed sheen on the frame.
- 4K studio HDRI environment for believable reflections.
- Soft contact shadows, subtle bloom on highlights, filmic tone mapping.
- Etched scale pattern via normal map or shader; camera module as simple geometry.
- Models as GLB with Draco or meshopt compression; textures as KTX2.
- Custom model required (off-the-shelf phone models won't have the pineapple features): either modelled in Blender, or built procedurally in code.

### Text

All text is real HTML on top of the canvas — never drawn inside it — so it stays readable, searchable and accessible.

---

## 10. 4K specification

Every asset is specified for 4K sharpness, but loaded progressively and scaled to each device so the site stays fast.

| Asset | 4K specification |
| --- | --- |
| Textures on hero parts | 4096 × 4096 for the back glass, frame and camera; 2K for less visible parts |
| Lighting environment | 4K studio HDRI, for crisp reflections |
| 3D models | High detail with real bevels, so edges stay smooth in extreme close-up |
| Rendering | Native screen resolution on 4K and Retina displays |
| Still images and fallbacks | 3840 × 2160 renders in AVIF or WebP |
| Scroll frame sequences | 1440p proposed (see open decisions), with a 4K still at each scroll pause point |
| Any video | 2160p, with a 1080p fallback |
| Logo, icons, text | Vector (SVG and HTML), sharp at any size |

### Delivery rules

- **Load progressively.** Lighter versions load first, then 4K textures swap in as the visitor approaches each close-up.
- **Scale assets to the device.** Phones get 2K textures (phone screens can't show 4K textures, and mobile browsers have tight graphics-memory limits).
- **Adapt during motion.** On desktop, the renderer drops resolution slightly during fast motion and returns to full sharpness when it settles.

---

## 11. Performance and accessibility

- Target 60 fps on desktop, at least 30 fps on phones.
- Lower-power devices get reduced quality or still renders instead of live 3D.
- Respect `prefers-reduced-motion`: animations simplify, the logo burst becomes a soft colour pulse.
- Stop rendering when the 3D canvas isn't visible.
- First-view 3D budget: under 5 MB.
- Keyboard support for the breakdown (arrow keys, Esc); the parts list and specs are real HTML for screen readers.
- Sound off by default.

---

## 12. References

Two screen recordings of the **CYMA One** speaker site (from a Claude Code + Higgsfield prompt pack; the first recording also shows a **Croissant Pro** site) set the visual bar. Their photoreal moments are AI-generated videos turned into scroll-scrubbed frame sequences, with interactive HTML on top.

| In the reference | PINEAPPLE version | Where |
| --- | --- | --- |
| Paint is drawn up in one column while a counter rises, then erupts | A golden juice drop falls onto the camera module while a counter rises, then bursts into the five finish colours; the logo burst reuses this moment | Hero |
| Big wordmark with one word in a gradient ("CYMA **One**") | "PINEAPPLE **Crown**", with "Crown" in the Ripen gradient | Hero |
| Exploded speaker with a colour burst behind each part | Exploded phone, each layer separating in its own colour burst | Device breakdown |
| Frozen splash; scrolling orbits it 360°, with "Orbit 342°" and "Shutter 1/10k s" readouts | Phone frozen mid-explosion; scrolling orbits it, with "Orbit 342°" and "Layers 10/10" readouts | Device breakdown |
| Hover-lens scanner with an X-ray/Thermal toggle and a live reading | Cursor lens over the phone shows its insides, with a reading such as "NECTAR N7 PRO · 41.2°C" | Device breakdown |
| Corner stat cards and large coloured spec numbers | "Layers separated 7/10"; 6.5", N7 Pro and 5,000 mAh in large coloured type | Throughout |
| "Recolour the drop" chips; the page's accent follows the palette | "Recolour the burst" finish chips; the logo, nav highlight and headline gradient follow | Frozen moment, finish picker |
| Camera flies into the croissant's crumb; "Now fly into the sound" | Fly into the periscope lens, or down into the Nectar chip | Camera, Chip |
| Croissant in an oven with a live readout | Crown Pro under water, with depth 6 m, time 30 min and IP68 | Durability |
| Numbered monospaced label, two-line headline with gradient last word, one instruction line | "01 · THE DROP", "02 · FROZEN", "03 · INSIDE THE CHIP" | Every section |
| Headlines mixing bold sans with an italic serif word | "Designed by *nature's math*." | Typography |
| Sound toggle and a Buy button showing the price | Same, with sound off by default | Navigation |

---

## 13. Shot list for AI-generated sequences

Generated outside Claude Code (in Higgsfield or a similar AI video tool), from **one locked master product image** used as the start and end frame of every generation, so the camera module and etched back don't drift between shots. Each sequence exports as 120–180 frames in AVIF or WebP, with a 4K still at each scroll pause point.

| # | Shot | What happens | Camera | Start → end frame | Frames | Used in |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Master stills | Crown Pro front, back and three-quarter views in every finish on black; Slate Pro the same | Locked studio angles | Single images | 4K stills | Every shot below; finish picker |
| 1 | Juice drop | A golden drop stretches down from above and falls onto the camera module | Locked, slow push-in | Master three-quarter back → moment of impact | 120 | Hero |
| 2 | Colour eruption | The impact throws bursts of the five finish colours up and around the phone | Locked, then a slow rise | Impact → peak of the splash | 150 | Hero |
| 3 | Frozen orbit | Time stops at the peak while the camera circles the phone and splash | 360° orbit at eye level | Peak → the same frame, so it loops | 180 (2° per frame) | Frozen moment |
| 4 | Exploded view | The phone separates into its 10 layers, each with its own colour burst | Three-quarter view, slow rise | Assembled master → fully exploded | 150 | Device breakdown |
| 5 | Exploded orbit | The exploded stack hangs frozen while the camera circles it | 360° orbit | Last frame of shot 4 → the same frame | 180 (2° per frame) | Device breakdown |
| 6 | Lens fly-in | The camera pushes through the periscope lens and a beam of light folds through the prism onto the sensor | Push-in along the lens axis | Camera module close-up → glowing sensor | 150 | Camera |
| 7 | Chip dive | The view descends from the logic board into the Nectar die as its cores light up | Top-down descent | Logic board → die | 150 | Chip |
| 8 | Etched glass sweep | A raking light sweeps across the back and reveals the Fibonacci scale pattern | Locked macro; only the light moves | Back glass in shadow → fully lit | 120 | Design |
| 9 | Underwater | The phone sinks into clear water with bubbles and rippling light, screen on | Follows the phone down | Water surface → resting at depth | 150 | Durability |
| 10 | Slate Pro edge turn | The tablet turns from face-on to edge-on to show its 5.1 mm profile, then the Quill tip touches the glass | Slow orbit to a side view | Master tablet front → edge-on with the Quill | 150 | Slate Pro |

**Built in code, not generated:** the logo burst, drag-to-rotate, pulling out a layer, live finish recolouring, the phone/tablet switch, the configurator and Quill drawing.

---

## 14. Build phases for Claude Code

1. **Foundation:** project scaffold, design tokens (colours, type, spacing, easing), sticky nav, every section in place with headlines and copy, placeholder frames where AI sequences will go.
2. **Live 3D:** Crown Pro and Slate Pro models (procedural or GLB), physically based materials, studio lighting, drag-to-rotate, finish picker, configurator.
3. **Device breakdown:** explode/reassemble, pull-a-layer, parts list, spec panel, view modes, hover-lens scanner, device switch.
4. **Frame-sequence player:** scroll-scrubbed canvas player wired to placeholder sequences, with counters and stat cards. Swap in the real shots when generated.
5. **Signature moments:** logo burst, loading screen, cursor-following droplets, "Recolour the burst" chips with page accent theming, Quill drawing, sound.
6. **Polish:** progressive 4K loading, device-scaled assets, reduced-motion and low-power fallbacks, accessibility, frame-rate testing on target devices.

---

## 15. Open decisions

- 2K or full 4K textures on phones?
- 1440p or 2160p for scroll frame sequences?
- Pineapple references quietly present, or unmistakable at first glance?
- Which logos get the full colour burst — loading screen, hero and footer only, or the nav logo too?
- Concept/portfolio piece or real launch? (A real launch needs a trademark check on "Pineapple".)
- Which AI video tool and model? Check its native output resolution and whether it accepts both start and end frames.
- Custom Blender model, or procedural model built in code?
- Zest phone specs, prices and currency.
