# Instagram reels

## Summary reel (under a minute)

The current cut is `pineapple-summary-reel.mp4` (54.9 s, 1080×1920, 30 fps, H.264, no audio).

Ten highlights of the live site, each showing its interaction, cut together for a 1080×1920, 30 fps reel. The whole
desktop page is in frame: every clip is recorded at 1920×1080 and laid full width across the reel over a blurred copy of
itself, under a kinetic caption. There is a title card at the start and an end card, and the transitions rotate between
a zoom-through, a whip pan and a gold light sweep.

```bash
cd pineapple/site && npm run build && npx vite preview --port 4173 &
cd ../reel
node highlights.cjs "http://localhost:4173/?quality=low" /tmp/hl     # frame-exact capture (faked page clock)
python3 summary.py /tmp/hl ../pineapple-summary.mp4                  # captions, transitions, title and end cards
```

Change the clips, timings and captions in highlights.cjs, and the title and end card text in summary.py. `REEL_W` and
`REEL_H` change the capture size; for a tall capture, add `reel` to the site URL (`?quality=low&reel`) so every scene is
drawn full-bleed instead of fitted.

## Full walkthrough (mockup)

The site in a browser mockup, header to footer, with a caption per section.

```bash
node capture.cjs "http://localhost:4173/?quality=low" /tmp/reel-frames
python3 compose.py /tmp/reel-frames ../pineapple-reel.mp4
```

Both need Playwright, Pillow, NumPy, ffmpeg and the Inter fonts.
