"""Instagram reel, step 2: put each captured frame in a browser mockup on premium black, with captions, and encode.
python3 compose.py <frames dir> <out.mp4>  (1080×1920, 30 fps, H.264). Uses the Inter fonts installed on the system."""
import json, os, sys, subprocess
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFilter, ImageFont
SRC, OUT = sys.argv[1], sys.argv[2]; TMP = SRC.rstrip('/') + '-reel'; os.makedirs(TMP, exist_ok=True)
W, H = 1080, 1920; FD = '/usr/share/fonts/opentype/inter/'
f = lambda name, size: ImageFont.truetype(FD + name, size)
caps = json.load(open(f'{SRC}/timeline.json')); N = len(caps)
GOLD, CREAM, MUTE = (240, 181, 58), (243, 241, 230), (156, 157, 141)
# the static template: background glow, title, browser window frame and shadow
base = Image.new('RGB', (W, H), (5, 5, 5)); glow = Image.new('L', (W, H), 0)
ImageDraw.Draw(glow).ellipse((-200, 380, W + 200, 1500), fill=60); glow = glow.filter(ImageFilter.GaussianBlur(160))
base.paste(Image.new('RGB', (W, H), (40, 30, 10)), (0, 0), glow)
d = ImageDraw.Draw(base)
d.text((W // 2, 200), 'CONCEPT WEBSITE', font=f('Inter-Medium.otf', 28), fill=MUTE, anchor='mm')
t1, t2 = 'PINEAPPLE ', 'Crown'; ft = f('InterDisplay-Bold.otf', 104)
w1, w2 = d.textlength(t1, font=ft), d.textlength(t2, font=ft); x0 = (W - w1 - w2) / 2
d.text((x0, 300), t1, font=ft, fill=CREAM, anchor='lm'); d.text((x0 + w1, 300), t2, font=ft, fill=GOLD, anchor='lm')
d.text((W // 2, 400), 'Designed by nature’s math.', font=f('Inter-Regular.otf', 36), fill=MUTE, anchor='mm')
MX, MY, MW, BAR = 40, 560, 1000, 48; SH = round(MW * 900 / 1440)
sh = Image.new('L', (W, H), 0); ImageDraw.Draw(sh).rounded_rectangle((MX + 30, MY + 60, MX + MW - 30, MY + BAR + SH + 50), 30, fill=170)
base.paste((0, 0, 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(40)))
d = ImageDraw.Draw(base)
d.rounded_rectangle((MX, MY, MX + MW, MY + BAR + SH), 26, fill=(20, 20, 20), outline=(46, 46, 44), width=2)
for i, c in enumerate([(237, 106, 94), (245, 191, 79), (98, 197, 84)]): d.ellipse((MX + 22 + i * 24, MY + 17, MX + 36 + i * 24, MY + 31), fill=c)
d.rounded_rectangle((MX + 330, MY + 11, MX + MW - 330, MY + 37), 13, fill=(32, 32, 31))
d.text((W // 2, MY + 24), 'pineappleconcept.com', font=f('Inter-Medium.otf', 20), fill=MUTE, anchor='mm')
d.text((W // 2, 1790), 'pineappleconcept.com', font=f('Inter-SemiBold.otf', 34), fill=GOLD, anchor='mm')
d.text((W // 2, 1840), 'Scroll-driven · 4K AI footage · every part photographed', font=f('Inter-Regular.otf', 24), fill=MUTE, anchor='mm')
mask = Image.new('L', (MW, SH), 0); ImageDraw.Draw(mask).rounded_rectangle((0, -30, MW - 1, SH - 1), 26, fill=255)
FC = f('InterDisplay-SemiBold.otf', 58)
def frame(i):
    im = base.copy(); site = Image.open(f'{SRC}/{i + 1:05d}.jpg').convert('RGB').resize((MW, SH), Image.LANCZOS)
    im.paste(site, (MX, MY + BAR), mask)
    cap = caps[i]; j = i
    while j > 0 and caps[j - 1] == cap: j -= 1
    a = min(1, (i - j) / 9)  # each caption fades and rises in
    layer = Image.new('RGBA', (W, 160), (0, 0, 0, 0)); ImageDraw.Draw(layer).text((W // 2, 80), cap, font=FC, fill=CREAM + (int(255 * a),), anchor='mm')
    im.paste(layer, (0, 1420 - int(14 * (1 - a))), layer)
    dd = ImageDraw.Draw(im); dd.rounded_rectangle((140, 1600, W - 140, 1606), 3, fill=(38, 38, 36)); dd.rounded_rectangle((140, 1600, 140 + int((W - 280) * (i + 1) / N), 1606), 3, fill=GOLD)
    im.save(f'{TMP}/{i + 1:05d}.jpg', quality=93)
if __name__ == '__main__':
    with Pool(os.cpu_count()) as p: p.map(frame, range(N), chunksize=16)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '30', '-i', f'{TMP}/%05d.jpg', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], check=True)
    print('reel', OUT, N / 30, 's')
