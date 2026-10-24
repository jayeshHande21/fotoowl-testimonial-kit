"""Face tracking (YuNet). Used on the plate to keep the speaker framed and to keep
captions / cards clear of the face.

    python face.py --slug <slug>          → work/<slug>/analysis/face.json (+ face_boxes.json)
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from common import MODELS, save_json, work_dir  # noqa: E402


def track(video: Path, det_w: int = 405):
    import cv2
    cap = cv2.VideoCapture(str(video))
    W = cap.get(cv2.CAP_PROP_FRAME_WIDTH); H = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    det_h = int(round(det_w * H / W))
    det = cv2.FaceDetectorYN.create(str(MODELS / 'yunet.onnx'), '', (det_w, det_h), 0.7, 0.3, 50)
    pts, boxes, counts = [], [], []
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        g = cv2.resize(fr, (det_w, det_h))
        _, res = det.detect(g)
        fs = [tuple(r[:4]) for r in res] if res is not None else []
        counts.append(len(fs))
        if fs:
            x, y, w, h = max(fs, key=lambda r: r[2] * r[3])
            pts.append(((x + w / 2) / det_w, (y + h / 2) / det_h))
            boxes.append([round(float(v), 4) for v in (x / det_w, y / det_h, (x + w) / det_w, (y + h) / det_h)])
        else:
            pts.append(None); boxes.append(None)
    n = len(pts)
    arr = np.array([p if p else (np.nan, np.nan) for p in pts], float)
    idx = np.arange(n)
    for k in range(2):
        v = arr[:, k]; m = ~np.isnan(v)
        arr[:, k] = np.interp(idx, idx[m], v[m]) if m.any() else (0.5 if k == 0 else 0.42)
    sig = 18
    ker = np.exp(-0.5 * (np.arange(-3 * sig, 3 * sig + 1) / sig) ** 2); ker /= ker.sum()
    sm = np.stack([np.convolve(np.pad(arr[:, k], 3 * sig, mode='edge'), ker, 'valid') for k in range(2)], 1)
    two_people = float(np.mean([c >= 2 for c in counts])) > 0.4 if counts else False
    return sm, boxes, counts, two_people


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--video', default=None, help='default: work/<slug>/public/plate.mp4')
    a = ap.parse_args()
    wd = work_dir(a.slug)
    v = Path(a.video) if a.video else wd / 'public/plate.mp4'
    sm, boxes, counts, two = track(v)
    save_json(wd / 'analysis/face.json', [{'x': round(float(x), 4), 'y': round(float(y), 4)} for x, y in sm], indent=None)
    save_json(wd / 'analysis/face_boxes.json', {'boxes': boxes, 'faces_per_frame': counts, 'two_people': two}, indent=None)
    det = [b for b in boxes if b]
    if det:
        B = np.array(det)
        print('frames', len(boxes), '| face box min', B.min(0).round(3), 'max', B.max(0).round(3), '| two people:', two)


if __name__ == '__main__':
    main()
