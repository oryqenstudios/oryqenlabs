"""Convert a folder of PNG frames to AVIF in parallel, then delete the PNGs.
Usage: python3 scripts/avif.py <dir> <quality 0-100>. Needs Pillow 11.3+ (built-in AVIF)."""
import os, sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image
d, q = sys.argv[1], int(sys.argv[2])
def conv(f):
    p = os.path.join(d, f)
    Image.open(p).convert('RGB').save(p[:-4] + '.avif', quality=q, speed=8)
    os.remove(p)
if __name__ == '__main__':
    files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    with ProcessPoolExecutor(os.cpu_count() or 4) as ex: list(ex.map(conv, files))
