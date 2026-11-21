# PINEAPPLE site

Production build of the PINEAPPLE marketing site (see `../PINEAPPLE_PLAN.md` for the brief). Phases 1–3 and 5 done, phase 6 mostly done; phase 4 waits for the AI frames.

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/
```

## Deployment

### Vercel

`vercel.json` holds the build (Vite, `npm run build`, output `dist`) and the cache headers: hashed `assets/` are cached
for a year, frame images for a day (they keep their names when re-rendered), and `index.html` and
`frames/manifest.json` always revalidate.

One-time setup on vercel.com: **Add New → Project → Import** the `oryqenstudios/oryqenlabs` repository (allow the Vercel
GitHub app access to it), set **Root Directory** to `pineapple/site`, and deploy. `pineapple-site` is the repository's
default branch, so it is the production branch; other branches get preview deployments. Deploy through the Git import,
not the CLI: the site is about 680 MB and the CLI's upload cap is far below that.

Domain: in the project, **Settings → Domains → Add** `pineappleconcept.com` (and `www`), then replace the GitHub Pages
DNS records below with the records Vercel shows. Once it serves from Vercel, turn off the Pages workflow.

### GitHub Pages

Every push to `pineapple-site` (or `main`) that touches `pineapple/site/` builds the site and publishes it to GitHub Pages
(`.github/workflows/pineapple-pages.yml`). `public/CNAME` sets the custom domain, pineappleconcept.com.

One-time setup in GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**, then enter
`pineappleconcept.com` under **Custom domain** and tick **Enforce HTTPS** once the certificate is issued.

DNS at the domain registrar:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153 (one record each) |
| CNAME | www | oryqenstudios.github.io |

AI frames: GitHub Pages serves up to 1 GB. When the frame sequences arrive, either commit them (remove the
`public/frames/shot-*/` lines from `.gitignore`) or host them on a CDN and point the player at it.

## Stack

Vite 5 · React 18 · TypeScript 5 · Tailwind CSS 3 · GSAP ScrollTrigger · Lenis · three.js r169 · React Three Fiber 8 · drei 9.
Versions are pinned to the generation React Three Fiber 8 is proven on; moving to React 19 / Tailwind 4 later is a contained upgrade.

## Layout

```
src/
  data/        devices.ts (every layer and spec), finishes.ts, shots.ts
  lib/         tokens.ts (the one easing curve, accent), scroll.ts (Lenis + ScrollTrigger), sound.ts, events.ts
  sequence/    player.ts (frame-sequence player), FrameSequence.tsx, placeholders.ts (stand-in art, delete as shots land)
  components/  Nav, Logo, Loader, SectionIntro, ScrubSection, Readouts, Chips, SpiralBackground
  sections/    Hero, Cinematic (Frozen, Design, Finish, Camera, Chip, Durability), Inside, Numbers, Slate, Compare, Footer
  three/       Stage.tsx (the one persistent canvas + director), devices3d.ts (procedural Crown Pro / Slate Pro, one group per layer),
               useStageAnchor.ts + store.ts (how sections place the device), breakdown.ts (explode, pull, view modes, lens), geometry.ts, textures.ts
public/frames/ manifest.json + generated frames
```

## Adding AI frames

One command per shot (needs ffmpeg). It samples exactly the right number of frames, cover-crops to 16:9, writes 1440p
frames plus 720p phone copies, and marks the shot ready in `public/frames/manifest.json`:

```bash
node scripts/ingest.mjs 1 ~/Downloads/juice-drop.mp4               # shots 1–10
node scripts/ingest.mjs 3 orbit.mp4 --from 0.5 --to 7.5             # use only part of a clip
node scripts/ingest.mjs 0 master.png --finish ripen                 # master stills (shot 0)
node scripts/ingest.mjs 0 slate-back.png --finish rind --device tablet
```

Commit and push: the Pages workflow publishes it. Frames are committed to the repo (Pages serves up to 1 GB; a shot is
roughly 10–25 MB). The player loads every 8th frame first, then fills in, and always draws the nearest loaded frame.
Shots without frames show placeholder art and a dashed "AI sequence slot" label.

## How the live 3D works

One fixed, transparent canvas sits over the page (`three/Stage.tsx`). Sections never render 3D themselves: they drop a
`<DeviceAnchor>` where the device should be, with a spec (device, finish, rotation, drag, cursor light). Every frame the
director reads the anchors on screen and places the device to fit them, so it rides with scroll, holds still inside pinned
stages, and blends from one anchor to the next. Rotation and finish colour ease, so hand-offs never snap.

- Live sections: Design (03, drag to spin, light follows the cursor), Finish (04, Ripen shifts green→gold with the angle),
  the breakdown (05, see below), Compare configurator (10).
- Live stages are two sticky layers: a background below the canvas and a transparent UI layer above it (`live` on
  `ScrubSection`, `.pin-over` in CSS), so panels and text always sit above the device.

## The breakdown (section 05)

`sections/Breakdown.tsx` owns a `BreakdownState`; `three/breakdown.ts` applies it to each model every frame.
Scroll explodes the stack (staggered, outer layers first, each in its own colour burst) and keeps scrolling reassembles it;
the slider overrides. Drag a layer to pull it (long-press on touch); it springs back. Click or tap to inspect: other layers
fade, the layer comes forward and turns to face you, the spec panel slides in (↑ ↓ to step, swipe on phones, Esc backs out).
View modes: X-ray (shell outlines, glowing insides), Thermal (heat flows from the chip to the Core chamber), Dimensions
(thickness labels). The hover-lens scanner is a stencil-masked second render pass with a live reading. Look closer flies in
with a depth-of-field blur: AI shots 06/07/08/10 play in an overlay; the display shows its subpixels; the frame gets a
raking light while the Crown Key presses in two stages. Build it yourself scatters the layers; dropping them back in order
(back glass first) rebuilds the device and ends with the logo burst.
- The canvas renders on demand and stops completely when no anchor is on screen (0 draw calls during the AI sequences).
- The 3D code is a separate lazy chunk (~250 KB gzipped); the first view loads ~118 KB.
- Textures start at 512 px and upgrade to 4K (desktop) or 2K (phones) once the device has settled.
- Resolution drops while dragging and recovers when it settles (`performance.regress` + `AdaptiveDpr`).
- Quality (`three/quality.ts`): live 3D, or still renders for devices without WebGL, with a software GPU, on data saver or
  with ≤ 2 GB memory. At runtime the stage also falls back to stills if continuous rendering stays under ~22 fps for
  about 6 s, if the GPU context is lost, or if the 3D code throws. `?quality=high` or `?quality=low` forces either.
- The device sits in a faint floor glow in the accent colour (a shadow cannot show on a black studio).

## Logo burst (plan §6)

`three/Burst.tsx` draws it in the persistent canvas: one instanced mesh of glossy 3D hexagonal scales (one draw call) plus
the three crown leaves. `lib/burst.ts` is the DOM side, and `components/LogoButton.tsx` wires any logo up.

- The pineapple breaks into its own scales from the click point; they swell and spin as they fly, catching the studio light.
- Crown leaves flutter off separately and drift down more slowly.
- After ~2 s the scales spiral back along the golden angle and rebuild the logo where it is now.
- Each click cycles the palette (Ripen; Mango/Lime/Guava/Blueberry/Coral; the five finishes). Five quick clicks: all gold.
- Press and hold to charge (the logo trembles and glows); a new burst only once the logo is mostly rebuilt.
- The page lighting briefly takes on the burst colours. Sound (off by default) adds a glassy shimmer.
- Placement: the loading screen bursts and rebuilds as the hero logo; hero and footer logos give the full burst; the nav
  logo gives a tiny one and scrolls to top. Phones get fewer pieces. Reduced motion: a soft colour pulse only.

The hero also has cursor-following colour droplets (mouse only).

## Accessibility

- Skip link; one `h1`, section `h2`s; every AI sequence has a text description for screen readers (`data/shots.ts`).
- The parts list and specs are real HTML; ↑ ↓ / Esc in the breakdown; stepping is announced; close-ups move focus to
  "Back to the stack" and return it afterwards; the closed spec panel is `inert`.
- Reduced motion: no smooth scroll or intro movement, no droplets, logo burst becomes a colour pulse.
- axe-core reports no violations (page top, breakdown with panel open, compare and footer).

## Rules the code keeps

- One easing curve: `cubic-bezier(.22,1,.36,1)` in CSS, `power4.out` in GSAP, `ease()` in JS.
- Animations follow scroll position; nothing autoplays.
- All text is HTML over the canvas, never drawn into it.
- Reduced motion: no smooth scrolling, no intro movement.

## Phases

1. **Foundation**: done. Tokens, nav, every section with copy, frame-sequence player with placeholders, parts list and spec panel.
2. **Live 3D**: done. Persistent canvas, procedural Crown Pro and Slate Pro, PBR materials (clearcoat glass, anisotropic titanium), procedural studio lighting, drag-to-rotate, finish blending, configurator.
3. **Device breakdown in 3D**: done. Explode, pull a layer, inspect, view modes, hover-lens scanner, close-ups, device switch, Build it yourself.
4. Real frames wired in as they are generated.
5. **Signature moments**: done. Logo burst (all §6 behaviours), loader handoff, cursor droplets, sound, plus the phase 1 recolour chips and Quill pad.
6. **Polish**: mostly done. Progressive 4K, device-scaled assets, low-power fallbacks, accessibility pass. Left: bloom (decision pending) and frame-rate testing on real phones and laptops.
