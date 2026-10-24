"""Step 2 — build the vertical 9:16 "plate": stabilised, graded, reframed footage the engine zooms into.

    python plate.py --slug <slug> [--mode auto|vertical|crop-follow|inset] [--no-stab]

Modes
  vertical     source is already 9:16 → scale (1620×2880 for 4K sources, else 1080×1920)
  crop-follow  horizontal source, one speaker → 9:16 window that follows the face
  inset        horizontal source, two people → full frame centred, soft blurred fill above/below
  auto         vertical if the source is vertical; otherwise crop-follow, or inset if two faces

Then runs face tracking on the plate → analysis/face.json.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from common import load_json, run, save_json, video_info, work_dir  # noqa: E402
from face import track  # noqa: E402

GRADE = ("colorbalance=rm=0.015:gm=0.004:bm=-0.025:rh=0.008:bh=-0.01,eq=contrast=1.05:saturation=1.05:gamma=0.985,"
         "curves=all='0/0.015 0.25/0.235 0.75/0.765 1/0.985'")


def has_vidstab() -> bool:
    r = subprocess.run(['ffmpeg', '-hide_banner', '-filters'], capture_output=True, text=True).stdout
    return 'vidstabdetect' in r


def stab_grade(src: Path, out: Path, scale: str, trf: Path, stab: bool, vignette: bool):
    """scale → (vid.stab) → grade → (vignette) in two passes."""
    pre = f'{scale},format=yuv420p'
    chain = pre
    if stab:
        run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', f'{pre},vidstabdetect=shakiness=4:accuracy=12:result={trf}', '-f', 'null', '-'])
        chain += f',vidstabtransform=input={trf}:smoothing=24:optzoom=1:interpol=bicubic'
    chain += ',' + GRADE
    if vignette:
        chain += ',vignette=angle=0.35:mode=forward'
    chain += ',format=yuv420p'
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-an', '-vf', chain, '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-r', '30', out])


def crop_follow(tmp: Path, out: Path, W: int, H: int):
    """Horizontal → 9:16 window following the (smoothed) face x."""
    import cv2
    sm, _, _, _ = track(tmp)
    info = video_info(tmp)
    sw, sh = info['width'], info['height']
    cw = int(round(sh * 9 / 16)) // 2 * 2
    xs = np.clip(sm[:, 0] * sw - cw / 2, 0, sw - cw)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
                            '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', str(out)], stdin=subprocess.PIPE)
    cap = cv2.VideoCapture(str(tmp))
    i = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        x = int(round(xs[min(i, len(xs) - 1)]))
        crop = fr[:, x:x + cw]
        enc.stdin.write(cv2.resize(crop, (W, H), interpolation=cv2.INTER_LANCZOS4).tobytes())
        i += 1
    enc.stdin.close(); enc.wait()


def inset(tmp: Path, out: Path, W: int, H: int, face_y: float = 0.42):
    info = video_info(tmp)
    fg_h = int(round(W * info['height'] / info['width'])) // 2 * 2
    y = max(0, int(H * face_y - fg_h * 0.45))
    fc = (f"[0:v]split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=40,eq=brightness=-0.06:saturation=0.9[bg];"
          f"[b]scale={W}:{fg_h}[fg];[bg][fg]overlay=0:{y},format=yuv420p[o]")
    run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-filter_complex', fc, '-map', '[o]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-r', '30', out])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--mode', default='auto')
    ap.add_argument('--no-stab', action='store_true')
    a = ap.parse_args()
    wd = work_dir(a.slug)
    src = next(wd.glob('source.*'))
    info = load_json(wd / 'analysis/info.json')
    stab = (not a.no_stab) and has_vidstab()
    mode = a.mode
    if mode == 'auto':
        if info['orientation'] == 'vertical':
            mode = 'vertical'
        else:
            _, _, _, two = track(src, det_w=480)
            mode = 'inset' if two else 'crop-follow'
    plate = wd / 'public/plate.mp4'
    trf = wd / 'analysis/transforms.trf'
    if mode == 'vertical':
        W, H = (1620, 2880) if min(info['width'], info['height']) >= 2160 else (1080, 1920)
        stab_grade(src, plate, f'scale={W}:{H}:flags=lanczos', trf, stab, vignette=True)
    elif mode == 'crop-follow':
        H = 2880 if info['height'] >= 2160 else 1920
        W = H * 9 // 16
        tmp = wd / 'render/_stab.mp4'
        stab_grade(src, tmp, f'scale=-2:{H}:flags=lanczos', trf, stab, vignette=False)
        crop_follow(tmp, plate, W, H)
        tmp.unlink(missing_ok=True)
    elif mode == 'inset':
        W, H = 1080, 1920
        tmp = wd / 'render/_stab.mp4'
        stab_grade(src, tmp, f'scale={W}:-2:flags=lanczos', trf, stab, vignette=False)
        inset(tmp, plate, W, H)
        tmp.unlink(missing_ok=True)
    else:
        raise SystemExit(f'unknown mode {mode}')
    pinfo = video_info(plate)
    save_json(wd / 'analysis/plate.json', {'mode': mode, 'stabilised': stab, **pinfo})
    print('plate', mode, pinfo['width'], 'x', pinfo['height'], pinfo['frames'], 'frames; stabilised:', stab)
    sm, boxes, counts, two = track(plate)
    save_json(wd / 'analysis/face.json', [{'x': round(float(x), 4), 'y': round(float(y), 4)} for x, y in sm], indent=None)
    save_json(wd / 'analysis/face_boxes.json', {'boxes': boxes, 'faces_per_frame': counts, 'two_people': two}, indent=None)
    print('face track saved; two people:', two)


if __name__ == '__main__':
    main()
