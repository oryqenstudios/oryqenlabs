/**
 * Summary reel, step 1: capture ten highlight clips of the whole desktop site (1920×1080 by default; the
 * composer fits each full width into the vertical reel), each with the interaction that shows off the site. node highlights.cjs <site url> <out dir>
 * Writes <out>/<NN>/00001.jpg… and <out>/clips.json ([{dir, label, caption}]). Faked page clock: frame-exact 30 fps.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const [URL_, OUT] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, DT = 1000 / FPS, W = Number(process.env.REEL_W || 1920), H = Number(process.env.REEL_H || 1080); // the whole site in frame
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(URL_, { waitUntil: 'load' }); await page.waitForTimeout(3000);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 700) { await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(300); }
  await page.clock.install();
  const yOf = (sel, p) => page.evaluate(([s, p]) => { const el = /[#.\[ ]/.test(s) ? document.querySelector(s) : document.getElementById(s);
    const t = el.getBoundingClientRect().top + scrollY; return t + Math.max(0, el.offsetHeight - innerHeight) * p; }, [sel, p]);
  const clips = []; let dir, n;
  const start = (label, caption) => { dir = `${OUT}/${String(clips.length + 1).padStart(2, '0')}`; fs.mkdirSync(dir, { recursive: true }); n = 0; clips.push({ dir, label, caption }); };
  const shot = async () => { await page.waitForTimeout(10); await page.clock.runFor(DT); n++; await page.screenshot({ path: `${dir}/${String(n).padStart(5, '0')}.jpg`, quality: 92 }); };
  const hold = async s => { for (let i = 0; i < s * FPS; i++) await shot(); };
  const scroll = async (sel, p0, p1, s) => { const a = await yOf(sel, p0), c = await yOf(sel, p1); const f = Math.round(s * FPS);
    await page.evaluate(y => window.scrollTo(0, y), a); await page.clock.runFor(400); await page.waitForTimeout(400);
    for (let i = 1; i <= f; i++) { await page.evaluate(y => window.scrollTo(0, y), a + (c - a) * ease(i / f)); await shot(); } };
  const click = (label, within) => page.evaluate(([l, w]) => { const root = w ? document.querySelector(w) : document;
    const e = [...root.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === l || b.textContent.trim() === l); e?.click(); }, [label, within]);
  const center = sel => page.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2, b.width, b.height]; }, sel);

  start('01 · Hero', 'Five finishes.\nOne scroll.'); await scroll('drop', 0.03, 0.37, 5.5);
  start('02 · Design', 'Light finds\nthe lens.'); await scroll('reveal', 0.05, 0.93, 3.4); await click('Camera plateau'); await hold(2.6);
  start('03 · Finish', 'Pick a finish.\nWatch it change.'); await scroll('#finish .scrub', 0.15, 0.4, 1.4); await click('Golden Flesh', '#finish'); await hold(1.3); await click('Crown Green', '#finish'); await hold(1.3); await click('Ripen', '#finish');
  start('04 · Inside', 'Ten layers.\nPull them apart.'); await scroll('#inside .scrub', 0.02, 0.4, 2.6); await scroll('breakdown', 0.0, 0.0, 0.4);
  { const [x, y] = await center('img[alt="Battery"]'); await page.mouse.move(x, y); await page.mouse.down();
    for (let i = 1; i <= 40; i++) { const q = ease(i / 40); await page.mouse.move(x + 220 * q, y + 260 * q); await shot(); } await page.mouse.up(); await hold(1); }
  start('05 · Camera', '0.5× to 25×.\nIt really zooms.'); await scroll('#camera .scrub', 0.0, 0.95, 3.2);
  for (let i = 1; i <= 66; i++) { await page.evaluate(v => { const el = document.querySelector('input[aria-label="Zoom, 0.5× to 25×"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(el, String(v)); el.dispatchEvent(new Event('input', { bubbles: true })); }, Math.round(1000 * ease(i / 66))); await shot(); }
  start('06 · Chip', 'Into the\nsilicon.'); await scroll('#chip .scrub', 0.0, 0.98, 3); await scroll('die', 0.0, 0.0, 0.4); await click('Open part 1: Nectar N7 Pro'); await hold(2);
  start('07 · Sound', 'See the bass.'); await scroll('[aria-label="Inside the speaker"]', 0.0, 1, 3.6);
  start('08 · Durability', 'Six metres down.\nStill on.'); await scroll('#water .scrub', 0.0, 1, 3);
  start('09 · Slate Pro', 'Pick up the Quill.\nDraw.'); await scroll('[aria-label="Draw on Slate Pro"]', 0.12, 0.7, 2.2);
  { const [cx, cy, w, h] = await center('canvas[aria-label="Drawing surface on the Slate Pro screen"]'); const x0 = cx - w * 0.3, y0 = cy;
    await page.mouse.move(x0, y0); await page.mouse.down();
    for (let i = 1; i <= 54; i++) { const q = i / 54; await page.mouse.move(x0 + w * 0.6 * q, y0 + h * 0.2 * Math.sin(q * Math.PI * 3)); await shot(); } await page.mouse.up(); await hold(0.6); }
  start('10 · Compare', 'Build yours.'); await scroll('compare', 0.0, 0.0, 0.3);
  { const y = await page.evaluate(() => { const e = [...document.querySelectorAll('#compare button')].find(b => b.textContent.trim() === 'Zest'); return e.getBoundingClientRect().top + scrollY - 900; });
    await page.evaluate(y => window.scrollTo(0, y), y); await page.clock.runFor(500); await page.waitForTimeout(500); }
  await hold(0.8); await click('Zest', '#compare'); await hold(1.1); await click('Slate Pro', '#compare'); await hold(1.1); await click('Crown Pro', '#compare'); await hold(0.8);
  fs.writeFileSync(`${OUT}/clips.json`, JSON.stringify(clips.map(c => ({ ...c, frames: fs.readdirSync(c.dir).length })))); console.log('clips', clips.length); await b.close();
})();
