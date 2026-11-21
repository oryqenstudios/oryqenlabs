"""Summary reel, step 2: the highlight clips, full width in a 1080x1920 frame over a blurred copy of themselves, with kinetic
captions, a title and end card, and zoom-through / whip-pan / light-sweep transitions. python3 summary.py <clips dir> <out.mp4>"""
import json, math, os, sys, subprocess
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
SRC, OUT = sys.argv[1], sys.argv[2]; TMP = SRC.rstrip('/') + '-summary'; os.makedirs(TMP, exist_ok=True)
W, H, T = 1080, 1920, 12; FD = '/usr/share/fonts/opentype/inter/'
F = lambda n, s: ImageFont.truetype(FD + n, s)
GOLD, CREAM, MUTE = (240, 181, 58), (243, 241, 230), (156, 157, 141)
clips = json.load(open(f'{SRC}/clips.json'))
# under each clip: what you are watching someone do (keep in step with highlights.cjs)
DETAILS = ['4K splash footage · one continuous scroll', 'A beam of light reveals it · tap a hotspot to zoom', 'Tap a finish · the phone repaints live',
           'Real photographed layers · drag any one out', 'Drag the slider · ultra-wide to 25× zoom', 'Macro-photographed board · tap a part for specs',
           'Scroll inside the speaker · watch the bass move', 'IP68 · 6 m for 30 minutes', 'Lift the Quill · draw on the screen', 'Three models · five finishes']
ease = lambda t: 1 - (1 - max(0, min(1, t))) ** 3
FG_W, FG_H = W, round(W * 9 / 16); FG_Y = (H - FG_H) // 2 + 60
def vignette():
    v = Image.new('L', (W, H), 0); ImageDraw.Draw(v).ellipse((-300, -200, W + 300, H + 200), fill=255)
    return v.filter(ImageFilter.GaussianBlur(220))
VIG = vignette()
ROUND = Image.new('L', (FG_W, FG_H), 0); ImageDraw.Draw(ROUND).rounded_rectangle((0, 0, FG_W - 1, FG_H - 1), 22, fill=255)
def words_layer(text, font, a_list, color):
    lay = Image.new('RGBA', (W, 420), (0, 0, 0, 0)); d = ImageDraw.Draw(lay); y = 60; k = 0
    for line in text.split('\n'):
        ws = line.split(' '); widths = [d.textlength(w + ' ', font=font) for w in ws]; x = (W - sum(widths)) / 2
        for w, wd in zip(ws, widths):
            a = a_list(k); k += 1
            d.text((x, y + 40 * (1 - a)), w, font=font, fill=color + (int(255 * a),)); x += wd
        y += font.size + 10
    return lay
def clip_frame(job):
    ci, i, n, path, label, caption = job
    src = Image.open(path).convert('RGB')
    bg = src.resize((int(H * src.width / src.height / 4), H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(14))
    bg = bg.resize((int(H * src.width / src.height), H), Image.BILINEAR); x0 = (bg.width - W) // 2; bg = bg.crop((x0, 0, x0 + W, H))
    im = Image.blend(Image.new('RGB', (W, H), (5, 5, 5)), bg, 0.42)
    im = Image.composite(im, Image.new('RGB', (W, H), (5, 5, 5)), VIG)
    fg = src.resize((FG_W, FG_H), Image.LANCZOS)
    sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).rectangle((40, FG_Y + 30, W - 40, FG_Y + FG_H + 40), fill=200)
    im.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(36))); im.paste(fg, (0, FG_Y), ROUND)
    ImageDraw.Draw(im).rounded_rectangle((0, FG_Y, W - 1, FG_Y + FG_H - 1), 22, outline=(60, 52, 36), width=2)
    d = ImageDraw.Draw(im)
    a_in = lambda k: ease((i - 4 - 3 * k) / 12) * (1 - ease((i - (n - 14)) / 10))
    la = a_in(0); d.text((W // 2, 330), label.upper(), font=F('Inter-SemiBold.otf', 30), fill=tuple(int(c * la + 5 * (1 - la)) for c in GOLD), anchor='mm')
    cap = words_layer(caption, F('InterDisplay-Bold.otf', 86), lambda k: a_in(k + 1), CREAM); im.paste(cap, (0, 370), cap)
    da = a_in(4); d.text((W // 2, FG_Y + FG_H + 92 + 24 * (1 - da)), DETAILS[ci % len(DETAILS)], font=F('Inter-Medium.otf', 38), fill=tuple(int(c * da + 5 * (1 - da)) for c in MUTE), anchor='mm')
    # story-style progress: one segment per clip, this one filling
    sw, gap = 72, 10; x = (W - (len(clips) * sw + (len(clips) - 1) * gap)) // 2
    for k in range(len(clips)):
        d.rounded_rectangle((x, 1700, x + sw, 1705), 3, fill=(52, 48, 40))
        f = 1 if k < ci else (i + 1) / n if k == ci else 0
        if f: d.rounded_rectangle((x, 1700, x + max(5, int(sw * f)), 1705), 3, fill=GOLD)
        x += sw + gap
    d.text((W // 2, 1790), 'pineappleconcept.com', font=F('Inter-SemiBold.otf', 32), fill=GOLD, anchor='mm')
    im.save(f'{TMP}/c{ci:02d}_{i:05d}.jpg', quality=94); return f'{TMP}/c{ci:02d}_{i:05d}.jpg'
def card(job):
    kind, i, n = job; im = Image.new('RGB', (W, H), (5, 5, 5)); g = Image.new('L', (W, H), 0)
    ImageDraw.Draw(g).ellipse((-100, 500, W + 100, 1500), fill=70); im.paste(Image.new('RGB', (W, H), (50, 36, 10)), (0, 0), g.filter(ImageFilter.GaussianBlur(170)))
    d = ImageDraw.Draw(im)
    if kind == 'intro':
        f1 = F('InterDisplay-Bold.otf', 132); word = 'PINEAPPLE'; tw = d.textlength(word, font=f1); x = (W - tw) / 2
        for k, ch in enumerate(word):
            a = ease((i - 2 * k) / 14); d.text((x, 860 + 50 * (1 - a)), ch, font=f1, fill=tuple(int(c * a + 5 * (1 - a)) for c in CREAM)); x += d.textlength(ch, font=f1)
        a = ease((i - 24) / 14); d.text((W // 2, 1080 + 30 * (1 - a)), 'Crown', font=F('InterDisplay-Bold.otf', 110), fill=tuple(int(c * a + 5 * (1 - a)) for c in GOLD), anchor='mm')
        a = ease((i - 36) / 14); d.text((W // 2, 1200), 'A concept website', font=F('Inter-Regular.otf', 40), fill=tuple(int(c * a + 5 * (1 - a)) for c in MUTE), anchor='mm')
    else:
        a = ease(i / 16); d.text((W // 2, 880 + 40 * (1 - a)), 'pineappleconcept.com', font=F('InterDisplay-Bold.otf', 84), fill=tuple(int(c * a + 5 * (1 - a)) for c in GOLD), anchor='mm')
        for k, line in enumerate(['4K AI footage', 'Every part photographed', 'Built to be touched']):
            a = ease((i - 14 - 6 * k) / 12); d.text((W // 2, 1010 + 62 * k + 20 * (1 - a)), line, font=F('Inter-Medium.otf', 44), fill=tuple(int(c * a + 5 * (1 - a)) for c in CREAM), anchor='mm')
    p = f'{TMP}/{kind}_{i:05d}.jpg'; im.save(p, quality=94); return p
def transition(job):
    kind, j, a_path, b_path, out = job; t = (j + 1) / (T + 1); A = Image.open(a_path); B = Image.open(b_path)
    if kind == 0:  # zoom-through with a warm flash
        s = 1 + 0.45 * t * t; za = A.resize((int(W * s), int(H * s)), Image.BILINEAR); x, y = (za.width - W) // 2, (za.height - H) // 2
        za = za.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(14 * t))
        s2 = 1.3 - 0.3 * t; zb = B.resize((int(W * s2), int(H * s2)), Image.BILINEAR); x, y = (zb.width - W) // 2, (zb.height - H) // 2
        zb = zb.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(14 * (1 - t)))
        im = Image.blend(za, zb, t); flash = math.sin(math.pi * t) ** 2 * 0.38
        im = Image.blend(im, Image.new('RGB', (W, H), (255, 232, 190)), flash)
    elif kind == 1:  # whip pan with motion blur
        e = (1 - math.cos(math.pi * t)) / 2; off = int(W * e)
        canvas = Image.new('RGB', (W * 2, H)); canvas.paste(A, (0, 0)); canvas.paste(B, (W, 0))
        arr = np.asarray(canvas).astype(np.float32); blur = int(90 * math.sin(math.pi * t)) + 1
        ks = range(0, blur, max(1, blur // 8)); acc = sum(arr[:, min(W, off + k): min(W, off + k) + W] for k in ks) / len(ks)
        im = Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8))
    else:  # gold light sweep
        im = Image.blend(A, B, t); band = Image.new('L', (W, H), 0); cx = int(-400 + (W + 800) * t)
        ImageDraw.Draw(band).polygon([(cx - 160, 0), (cx + 40, 0), (cx - 360, H), (cx - 560, H)], fill=200)
        band = band.filter(ImageFilter.GaussianBlur(70)); glow = Image.new('RGB', (W, H), (255, 214, 140))
        im = ImageChops.add(im, Image.composite(glow, Image.new('RGB', (W, H)), band), scale=1.0)
    im.save(out, quality=94); return out
if __name__ == '__main__':
    with Pool(os.cpu_count()) as p:
        segs = [p.map(card, [('intro', i, 66) for i in range(66)])]
        for ci, c in enumerate(clips):
            fs = sorted(x for x in os.listdir(c['dir']) if x.endswith('.jpg')); n = len(fs)
            segs.append(p.map(clip_frame, [(ci, i, n, f"{c['dir']}/{f}", c['label'], c['caption']) for i, f in enumerate(fs)], chunksize=8))
        segs.append(p.map(card, [('outro', i, 84) for i in range(84)]))
        seq, jobs = [], []
        for k, s in enumerate(segs):
            body = s[T if k else 0: len(s) - (T if k < len(segs) - 1 else 0)]; seq += body
            if k < len(segs) - 1:
                for j in range(T):
                    out = f'{TMP}/t{k:02d}_{j:02d}.jpg'; jobs.append((k % 3, j, s[len(s) - T + j], segs[k + 1][j], out)); seq.append(out)
        p.map(transition, jobs)
    with open(f'{TMP}/list.txt', 'w') as fl:
        for f in seq: fl.write(f"file '{f}'\nduration {1/30:.6f}\n")
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{TMP}/list.txt', '-r', '30', '-c:v', 'libx264', '-preset', 'slow',
                    '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], check=True)
    print('summary', OUT, round(len(seq) / 30, 1), 's')
