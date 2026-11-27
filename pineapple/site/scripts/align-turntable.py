#!/usr/bin/env python3
"""
Re-time the per-finish turntable takes (shots 15 and 16) so that frame N shows the same angle in every finish.

Each finish's turn is its own AI take, and the takes turn at different speeds: at the same frame one finish can face
you while another is edge-on. Switching finish mid-turn then jumps the phone to another angle (and the cross-fade
between them shows two phones). This measures the phone's silhouette width in every frame, turns it into a rotation
angle (a slab turning about its vertical axis is cos(a) + t·sin(a) wide, t being its thickness), fits a smooth turn to
each take, and re-orders the other finishes' frames to follow Ripen's turn, frame for frame. Ripen (the default finish)
is left as it is, and the frames themselves are untouched: nothing is re-encoded.

    python3 scripts/align-turntable.py            # desktop and mobile frames, in place
    python3 scripts/align-turntable.py --dry-run  # print the angles and the mapping only

Run it again after re-ingesting any of these takes (ingest writes the take's own timing).
"""
import os, shutil, sys
import numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'frames')
FINS = ['ripen', 'rind', 'golden', 'green', 'core']
SHOTS = (15, 16)


def width(path):
    """Phone width in px at 640×360: the lit columns across the middle band of the frame."""
    g = np.asarray(Image.open(path).convert('L').resize((640, 360), Image.BILINEAR), dtype=np.float32)
    cols = (g[110:250] > 38).mean(axis=0) > 0.5
    xs = np.nonzero(cols)[0]
    return float(xs.max() - xs.min() + 1) if len(xs) else 0.0


def angle_from_width(w, t):
    """Degrees from face-on (0–90) for a relative width w, for a slab of relative thickness t."""
    a = np.radians(np.linspace(0, 90, 9001))
    wa = np.cos(a) + t * np.sin(a)  # falls monotonically from 1 to t
    return np.degrees(np.interp(-np.clip(w, t, 1), -wa, a))


def turn_angles(ws):
    """A take's angle per frame, 0 = the face it starts on, 180 = the opposite face, as a smooth one-way turn. Frames
    before the first widest point turn towards the camera first (negative); after the last one they overshoot (>180).
    Near face-on the width hardly changes with the angle, so those frames count for little in the fit."""
    ws = np.asarray(ws, dtype=float)
    W, t = ws.max(), ws.min() / ws.max()  # this take's face-on width and the phone's relative thickness
    w = ws / W
    jmin = int(np.argmin(w))
    jpre = int(np.argmax(w[: jmin + 1]))
    jpost = jmin + int(np.argmax(w[jmin:]))
    phi = angle_from_width(w, t)
    th = np.where(np.arange(len(w)) <= jmin, phi, 180 - phi)
    th[:jpre] = -phi[:jpre]
    th[jpost + 1:] = 180 + phi[jpost + 1:]
    r = np.radians(phi)
    weight = np.maximum(0.05, np.abs(-np.sin(r) + t * np.cos(r)))  # how much the width moves per degree here
    j = np.arange(len(th))
    fit = np.polyval(np.polyfit(j, th, 5, w=weight), j)
    return np.maximum.accumulate(fit)  # a turn only goes one way


def main(dry):
    jobs = {(s, f): sorted(os.listdir(f'{ROOT}/shot-{s}/{f}')) for s in SHOTS for f in FINS}
    with ProcessPoolExecutor() as ex:
        widths = {key: list(ex.map(width, [f'{ROOT}/shot-{key[0]}/{key[1]}/{n}' for n in names])) for key, names in jobs.items()}
    for s in SHOTS:
        angles = {f: turn_angles(widths[(s, f)]) for f in FINS}
        target = angles['ripen']  # every finish follows Ripen's turn
        n = len(target)
        print(f'shot {s}: {n} frames, Ripen turns {target[0]:.0f}° → {target[-1]:.0f}°')
        for f in FINS[1:]:
            a = angles[f] + np.arange(len(angles[f])) * 1e-6  # strictly increasing for interpolation
            pick = np.clip(np.rint(np.interp(target, a, np.arange(len(a)))).astype(int), 0, len(a) - 1)
            held = int(np.sum(np.diff(pick) == 0)); skipped = int(np.sum(np.clip(np.diff(pick) - 1, 0, None)))
            print(f'  {f:7s} edge-on at frame {int(np.argmin(widths[(s, f)])):3d} → {int(np.argmin(np.abs(target - 90))):3d}   '
                  f'held {held:2d}, skipped {skipped:2d}   ' + ' '.join(str(p) for p in pick[::12]))
            if dry: continue
            for base in (f'{ROOT}/shot-{s}/{f}', f'{ROOT}/mobile/shot-{s}/{f}'):
                if not os.path.isdir(base): continue
                names = sorted(os.listdir(base)); tmp = base + '.align'
                shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
                for k, j in enumerate(pick): shutil.copyfile(f'{base}/{names[j]}', f'{tmp}/{names[k]}')
                shutil.rmtree(base); os.rename(tmp, base)


if __name__ == '__main__':
    main('--dry-run' in sys.argv)
