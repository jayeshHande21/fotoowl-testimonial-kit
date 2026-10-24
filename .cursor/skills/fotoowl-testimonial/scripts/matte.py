"""Step 5 — person cut-out (Robust Video Matting) for the parallax captions.

    python matte.py --slug <slug> [--all]

Only the plate frames where a gold "behind" word is on screen are cut out (plus a warm-up so the
recurrent model is stable) → work/<slug>/public/fg/NNNN.webp (RGBA, plate resolution).
Re-run plan.py afterwards so edit.json picks up `person: true`.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from common import FPS, MODELS, load_json, work_dir  # noqa: E402

WARMUP = 24


def needed_ranges(edit: dict) -> list[tuple[int, int]]:
    """plate-frame ranges [a, b) that need a cut-out."""
    rng = []
    for b in edit['captions']['blocks']:
        if b['behind'] is None:
            continue
        t0 = b['words'][b['behind']]['s'] - 0.1
        t1 = b['end'] + 0.1
        for g in edit['segments']:
            o0 = g['outStartF'] / FPS; o1 = (g['outStartF'] + g['lenF']) / FPS
            a, z = max(t0, o0), min(t1, o1)
            if a < z:
                rng.append((g['srcStartF'] + int((a - o0) * FPS) - 2, g['srcStartF'] + int(np.ceil((z - o0) * FPS)) + 2))
    rng.sort()
    merged = []
    for a, b in rng:
        if merged and a <= merged[-1][1] + WARMUP:
            merged[-1] = (merged[-1][0], max(merged[-1][1], b))
        else:
            merged.append((a, b))
    return merged


def main():
    import cv2
    import onnxruntime as ort
    from PIL import Image
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--all', action='store_true', help='cut out every frame')
    a = ap.parse_args()
    wd = work_dir(a.slug)
    plate = wd / 'public/plate.mp4'
    pinfo = load_json(wd / 'analysis/plate.json')
    W, H, N = pinfo['width'], pinfo['height'], pinfo['frames']
    if a.all:
        ranges = [(0, N)]
    else:
        ranges = needed_ranges(load_json(wd / 'edit.json'))
    ranges = [(max(0, x), min(N, y)) for x, y in ranges]
    if not ranges:
        print('no behind words → nothing to cut out'); return
    out = wd / 'public/fg'
    out.mkdir(parents=True, exist_ok=True)
    providers = [p for p in ('CoreMLExecutionProvider', 'CPUExecutionProvider') if p in ort.get_available_providers()]
    sess = ort.InferenceSession(str(MODELS / 'rvm.onnx'), providers=providers)
    sw, sh = W // 2, H // 2  # model input resolution
    dr = np.array([0.3333 if H >= 2880 else 0.4], np.float32)
    t_start = time.time()
    total = sum(max(0, y - x) for x, y in ranges)
    done = 0
    for x0, x1 in ranges:
        s0 = max(0, x0 - WARMUP)
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', f'{s0 / FPS:.4f}', '-i', str(plate), '-frames:v', str(x1 - s0), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
        rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
        for f in range(s0, x1):
            buf = p.stdout.read(W * H * 3)
            if len(buf) < W * H * 3:
                break
            fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
            small = cv2.resize(fr, (sw, sh), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            _, pha, *rec = sess.run(None, {'src': small.transpose(2, 0, 1)[None], 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': dr})
            if f < x0:
                continue
            al = cv2.resize(pha[0, 0], (W, H), interpolation=cv2.INTER_CUBIC)
            al = np.clip((al - 0.04) / 0.92, 0, 1)
            Image.fromarray(np.dstack([fr, (al * 255).astype(np.uint8)]), 'RGBA').save(out / f'{f:04d}.webp', quality=90, method=3)
            done += 1
            if done % 100 == 0:
                print(f'  {done}/{total} frames · {time.time() - t_start:.0f}s', flush=True)
        p.kill()
    print('MATTE_DONE', done, 'frames in', f'{time.time() - t_start:.0f}s', '| ranges', ranges)


if __name__ == '__main__':
    main()
