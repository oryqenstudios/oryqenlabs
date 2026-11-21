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
  // a visible cursor and a gold click ripple, so every interaction reads on camera
  await page.evaluate(() => { const c = document.createElement('div'), r = document.createElement('div');
    c.id = '__cur'; r.id = '__ring'; const base = 'position:fixed;left:0;top:0;pointer-events:none;z-index:2147483647;opacity:0;';
    c.style.cssText = base + 'width:60px;height:60px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.55))';
    c.innerHTML = '<svg width="60" height="60" viewBox="0 0 24 24"><path d="M5 2.5l14.5 8.6-6.3 1.5-3.1 6.4z" fill="#fff" stroke="#0a0a0a" stroke-width="1.1" stroke-linejoin="round"/></svg>';
    r.style.cssText = base + 'width:92px;height:92px;border-radius:50%;border:3.5px solid rgba(240,181,58,.95);box-shadow:0 0 22px rgba(240,181,58,.6)';
    document.body.append(r, c); });
  const cur = { x: W * 0.6, y: H * 0.6, o: 0, to: 0, ring: 1 };
  const paint = () => { cur.o += (cur.to - cur.o) * 0.3; cur.ring = Math.min(1, cur.ring + 1 / 14);
    return page.evaluate(k => { const c = document.getElementById('__cur'), r = document.getElementById('__ring');
      c.style.opacity = k.o; c.style.transform = `translate(${k.x - 12.5}px, ${k.y - 6.25}px)`;
      r.style.opacity = k.ring < 1 ? (1 - k.ring) * k.o : 0; r.style.transform = `translate(${k.x - 46}px, ${k.y - 46}px) scale(${0.35 + k.ring * 0.9})`; }, cur); };
  const yOf = (sel, p) => page.evaluate(([s, p]) => { const el = /[#.\[ ]/.test(s) ? document.querySelector(s) : document.getElementById(s);
    const t = el.getBoundingClientRect().top + scrollY; return t + Math.max(0, el.offsetHeight - innerHeight) * p; }, [sel, p]);
  const clips = []; let dir, n;
  const start = (label, caption) => { cur.o = cur.to = 0; cur.ring = 1; dir = `${OUT}/${String(clips.length + 1).padStart(2, '0')}`; fs.mkdirSync(dir, { recursive: true }); n = 0; clips.push({ dir, label, caption }); };
  const shot = async () => { await paint(); await page.waitForTimeout(10); await page.clock.runFor(DT); n++; await page.screenshot({ path: `${dir}/${String(n).padStart(5, '0')}.jpg`, quality: 92 }); };
  const hold = async s => { for (let i = 0; i < s * FPS; i++) await shot(); };
  const scroll = async (sel, p0, p1, s) => { const a = await yOf(sel, p0), c = await yOf(sel, p1); const f = Math.round(s * FPS);
    await page.evaluate(y => window.scrollTo(0, y), a); await page.clock.runFor(400); await page.waitForTimeout(400);
    for (let i = 1; i <= f; i++) { await page.evaluate(y => window.scrollTo(0, y), a + (c - a) * ease(i / f)); await shot(); } };
  const mv = async (x, y) => { cur.x = x; cur.y = y; await page.mouse.move(x, y); };
  const glide = async (x, y, s = 0.6) => { if (cur.o < 0.05) { cur.x = x + 220; cur.y = y + 150; } cur.to = 1;
    const x0 = cur.x, y0 = cur.y, f = Math.round(s * FPS); for (let i = 1; i <= f; i++) { const q = ease(i / f); await mv(x0 + (x - x0) * q, y0 + (y - y0) * q); await shot(); } };
  const btn = (label, within) => page.evaluate(([l, w]) => { const root = w ? document.querySelector(w) : document;
    const e = [...root.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === l || b.textContent.trim() === l);
    const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, [label, within]);
  const tap = async (label, within) => { const [x, y] = await btn(label, within); await glide(x, y); cur.ring = 0; await page.mouse.click(x, y); };
  const center = sel => page.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2, b.width, b.height]; }, sel);

  start('01 · Hero', 'Five finishes.\nOne scroll.'); await scroll('drop', 0.0, 0.37, 5.6);
  start('02 · Design', 'Light finds\nthe lens.'); await scroll('reveal', 0.05, 0.93, 3.4); await tap('Camera plateau'); await hold(1.9);
  start('03 · Finish', 'Pick a finish.\nWatch it change.'); await scroll('#finish .scrub', 0.15, 0.4, 1.4); await tap('Golden Flesh', '#finish'); await hold(1.0); await tap('Crown Green', '#finish'); await hold(1.0); await tap('Ripen', '#finish'); await hold(0.5);
  start('04 · Inside', 'Ten layers.\nPull them apart.'); await scroll('#inside .scrub', 0.02, 0.4, 2.6); await scroll('#breakdown [class*="h-[100svh]"]', 0.0, 0.0, 0.4);
  { const [x, y] = await center('img[alt="Battery"]'); await glide(x, y, 0.5); cur.ring = 0; await page.mouse.down();
    for (let i = 1; i <= 40; i++) { const q = ease(i / 40); await mv(x + 220 * q, y + 260 * q); await shot(); } await page.mouse.up(); await hold(1); }
  start('05 · Camera', '0.5× to 25×.\nIt really zooms.'); await scroll('#camera .scrub', 0.0, 0.95, 3.2);
  { const [cx, cy, w] = await center('input[aria-label="Zoom, 0.5× to 25×"]'), x0 = cx - w / 2 + 8, x1 = cx + w / 2 - 8; // drag the slider by hand
    await glide(x0, cy, 0.5); cur.ring = 0; await page.mouse.down(); for (let i = 1; i <= 66; i++) { await mv(x0 + (x1 - x0) * ease(i / 66), cy); await shot(); } await page.mouse.up(); await hold(0.4); }
  start('06 · Chip', 'Into the\nsilicon.'); await scroll('#chip .scrub', 0.0, 0.98, 3); await scroll('#die [class*="h-[100svh]"]', 0.0, 0.0, 0.4); await tap('Open part 1: Nectar N7 Pro'); await hold(1.8);
  start('07 · Sound', 'See the bass.'); await scroll('[aria-label="Inside the speaker"]', 0.0, 1, 3.6);
  start('08 · Durability', 'Six metres down.\nStill on.'); await scroll('#water .scrub', 0.0, 1, 3);
  start('09 · Slate Pro', 'Pick up the Quill.\nDraw.'); await scroll('[aria-label="Draw on Slate Pro"]', 0.12, 0.7, 2.2);
  { const [cx, cy, w, h] = await center('canvas[aria-label="Drawing surface on the Slate Pro screen"]'); const x0 = cx - w * 0.3, y0 = cy;
    await glide(x0, y0, 0.5); cur.ring = 0; await page.mouse.down();
    for (let i = 1; i <= 54; i++) { const q = i / 54; await mv(x0 + w * 0.6 * q, y0 + h * 0.2 * Math.sin(q * Math.PI * 3)); await shot(); } await page.mouse.up(); await hold(0.6); }
  start('10 · Compare', 'Build yours.'); await scroll('compare', 0.0, 0.0, 0.3);
  { const y = await page.evaluate(() => { const e = [...document.querySelectorAll('#compare button')].find(b => b.textContent.trim() === 'Zest'); return e.getBoundingClientRect().top + scrollY - 900; });
    await page.evaluate(y => window.scrollTo(0, y), y); await page.clock.runFor(500); await page.waitForTimeout(500); }
  await hold(0.5); await tap('Zest', '#compare'); await hold(0.9); await tap('Slate Pro', '#compare'); await hold(0.9); await tap('Crown Pro', '#compare'); await hold(0.8);
  fs.writeFileSync(`${OUT}/clips.json`, JSON.stringify(clips.map(c => ({ ...c, frames: fs.readdirSync(c.dir).length })))); console.log('clips', clips.length); await b.close();
})();
