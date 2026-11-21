# Instagram reel template

Renders a 1080×1920, 30 fps reel of the live site in a browser mockup, header to footer, with a caption per section and
the key interactions played out (lens zoom, dragging a layer out, the chip explorer, drawing with the Quill).

```bash
cd pineapple/site && npm run build && npx vite preview --port 4173 &
cd ../reel
node capture.cjs "http://localhost:4173/?quality=low" /tmp/reel-frames   # frame-exact capture (faked page clock)
python3 compose.py /tmp/reel-frames ../pineapple-reel.mp4                # mockup, captions, progress bar, H.264
```

Change the sections, timings and captions in `plan` (capture.cjs) and the title or footer text in compose.py. Needs
Playwright, Pillow, ffmpeg and the Inter fonts.
