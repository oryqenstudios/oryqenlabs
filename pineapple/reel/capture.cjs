/**
 * Instagram reel, step 1: capture the site from header to footer, frame by frame.
 * node capture.cjs <site url> <out dir> — writes 00001.jpg… (1440×900, 30 fps) and timeline.json (captions).
 * The page clock is faked, so every frame is exactly 1/30 s apart: scrolling, tweens and footage stay perfectly smooth.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const [URL_, OUT] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, DT = 1000 / FPS;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(URL_, { waitUntil: 'load' }); await page.waitForTimeout(3000);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 450) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(260); } // warm every frame into the cache
  const pos = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('main section[id], footer')].map(el => {
    const r = el.getBoundingClientRect(); return [el.id || 'footer', [r.top + scrollY, el.offsetHeight]];
  })));
  const vh = 900, at = (id, p) => { const [t, h] = pos[id]; return t + Math.max(0, h - vh) * p; };
  // [section, seconds, caption]; actions run while the scroll holds
  const plan = [
    ['drop', 11, 'Five finishes. One scroll.'], ['reveal', 6, 'Light finds the lens'], ['design', 3.5, 'Every scale, etched by hand'],
    ['finish', 5, 'A 360° turntable per finish'], ['inside', 6, 'Ten layers, exploded'], ['breakdown', 2.5, 'Pull it apart yourself'],
    ['camera', 6, 'From the whole phone to the sensor'], ['chip', 4, 'Into the Nectar N7 Pro'], ['die', 2, 'Every part, up close'],
    ['sound', 6, 'Inside the speaker'], ['water', 4, 'Six metres down'], ['slate', 5, 'Slate Pro: draw on it'], ['compare', 3, 'Pick your pineapple'],
  ].filter(([id]) => pos[id]);
  const keys = [{ y: 0, t: 0, cap: plan[0][2] }]; let t = 0;
  for (const [id, secs, cap] of plan) { t += secs; keys.push({ y: id === 'breakdown' || id === 'die' ? at(id, 0) + 140 : at(id, id === 'reveal' ? 0.93 : 1), t, cap, id }); }
  keys.push({ y: H - vh, t: t + 2.5, cap: 'pineappleconcept.com' });
  await page.clock.install(); let n = 0; const tl = [];
  const shot = async (cap) => { await page.waitForTimeout(12); await page.clock.runFor(DT); n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(5, '0')}.jpg`, quality: 92 }); tl.push(cap); };
  const hold = async (secs, cap) => { for (let i = 0; i < secs * FPS; i++) await shot(cap); };
  const click = sel => page.evaluate(s => { const e = [...document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === s || b.textContent.trim() === s); e?.click(); }, sel);
  for (let k = 1; k < keys.length; k++) {
    const a = keys[k - 1], c = keys[k], frames = Math.round((c.t - a.t) * FPS);
    for (let i = 1; i <= frames; i++) { await page.evaluate(y => window.scrollTo(0, y), a.y + (c.y - a.y) * ease(i / frames)); await shot(c.cap); }
    if (c.id === 'reveal') { await click('Camera plateau'); await hold(3.4, 'Zoom in with a real camera move'); await click('← Whole phone'); await hold(2.2, 'Zoom in with a real camera move'); }
    if (c.id === 'breakdown') { // drag the battery out, then let it glide home
      const r = await page.evaluate(() => { const e = document.querySelector('img[alt="Battery"]'); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; });
      await page.mouse.move(r[0], r[1]); await page.mouse.down();
      for (let i = 1; i <= 45; i++) { const q = ease(i / 45); await page.mouse.move(r[0] + 260 * q, r[1] - 120 * q); await shot('Drag any real layer out'); }
      await page.mouse.up(); await hold(1.2, 'Drag any real layer out');
    }
    if (c.id === 'die') { await click('Open part 1: Nectar N7 Pro'); await hold(3.4, 'Every part, up close'); await page.keyboard.press('Escape'); await click('← All parts'); await hold(1.2, 'Every part, up close'); }
    if (c.id === 'slate') { // pick up the Quill and draw
      const bx = await page.evaluate(() => { const e = document.querySelector('canvas[aria-label="Drawing surface on the Slate Pro screen"]'); const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; });
      await page.mouse.move(bx[0] + bx[2] * 0.25, bx[1] + bx[3] * 0.5); await page.mouse.down();
      for (let i = 1; i <= 60; i++) { const q = i / 60; await page.mouse.move(bx[0] + bx[2] * (0.25 + 0.5 * q), bx[1] + bx[3] * (0.5 + 0.22 * Math.sin(q * Math.PI * 3))); await shot('Pick up the Quill and draw'); }
      await page.mouse.up(); await hold(1, 'Pick up the Quill and draw');
    }
  }
  fs.writeFileSync(`${OUT}/timeline.json`, JSON.stringify(tl)); console.log('frames', n); await b.close();
})();
