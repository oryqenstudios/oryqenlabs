# PINEAPPLE

Concept marketing site for PINEAPPLE (Crown Pro phone, Slate Pro tablet). Every product name, spec and price is a placeholder.

| Path | What it is |
| --- | --- |
| `site/` | The production site: Vite, React, TypeScript, Tailwind, GSAP, Lenis, three.js / React Three Fiber. Start here: [`site/README.md`](site/README.md). |
| `PINEAPPLE_PLAN.md` | The build plan this site follows. |
| `SHOT_PROMPTS.md` | Prompts for the 11 AI-generated frame sequences (shots 0–10). `prompts/` holds their source; `node prompts/build.js` regenerates this file and `shots.html`. |
| `shots.html` | The same prompts as a page with copy buttons. |
| `index.html` | The original single-file prototype (open it in a browser). |

## Run the site

Node.js 18 or later. From `site/`:

```bash
npm install
npm run dev
```

## Status

Phases 1–3, 5 and most of 6 are built: every section, the frame-sequence player with placeholders, live 3D (persistent
canvas, procedural devices, finishes, configurator), the hands-on breakdown, the logo burst, quality fallbacks and an
accessibility pass. Phase 4 waits for the AI frames: drop them into `site/public/frames/` and mark them ready in
`site/public/frames/manifest.json`.
