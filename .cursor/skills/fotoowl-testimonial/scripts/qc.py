"""Quality check — render stills at every important moment and build one contact sheet to LOOK at.

    python qc.py --slug <slug>                 → work/<slug>/stills/qc_sheet.jpg (+ qc_edges.jpg)
    python qc.py --slug <slug> --frames 30 200 → just those frames
    python qc.py --slug <slug> --video output/…/x.mp4   → sample the FINAL file instead of rendering stills

Check: captions readable and clear of mouth/mic · big gold words readable and only their lower edge
behind the head · cards clear of the head · watermark visible · cut-out edges clean · outro intact.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import ENGINE, FPS, load_json, run, work_dir  # noqa: E402


def key_frames(e: dict) -> list[tuple[int, str]]:
    fr = []
    for b in e['captions']['blocks']:
        if b['behind'] is not None:
            w = b['words'][b['behind']]
            fr.append((int(((w['s'] + b['end']) / 2) * FPS), f"behind '{w['t']}'"))
    for c in e['cards']:
        fr.append((int(((c['tIn'] + c['tOut']) / 2 + 0.2) * FPS), f"card {c['type']}"))
    if e.get('lowerThird'):
        lt = e['lowerThird']; fr.append((int((lt['tIn'] + lt['tOut']) / 2 * FPS), 'lower third'))
    for g in e['segments']:
        fr.append((g['outStartF'] + 12, f"start {g['id']}"))
    o = e['outro']['startF']
    fr += [(o + 30, 'outro 1s'), (o + 60, 'outro 2s'), (e['totalF'] - 3, 'outro end')]
    seen, out = set(), []
    for f, lab in sorted(fr):
        f = max(0, min(e['totalF'] - 1, f))
        if f not in seen:
            seen.add(f); out.append((f, lab))
    return out


def sheet(paths_labels, dst: Path, w=270):
    from PIL import Image, ImageDraw
    ims = [(Image.open(p), lab) for p, lab in paths_labels]
    h = int(w * 16 / 9)
    cols = 6
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (w * cols, (h + 22) * rows), 'white')
    d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = (i % cols) * w, (i // cols) * (h + 22)
        S.paste(im.resize((w, h)), (x, y + 22)); d.text((x + 4, y + 4), lab[:40], fill='black')
    S.save(dst, quality=88)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--frames', nargs='*', type=int)
    ap.add_argument('--video', default=None)
    a = ap.parse_args()
    wd = work_dir(a.slug)
    e = load_json(wd / 'edit.json')
    frames = [(f, f'f{f}') for f in a.frames] if a.frames else key_frames(e)
    st = wd / 'stills'
    for p in st.glob('f*.jpg'):
        p.unlink()
    if a.video:
        for f, _ in frames:
            run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{f / FPS:.3f}', '-i', a.video, '-frames:v', '1', st / f'f{f:04d}.jpg'])
    else:
        env = dict(os.environ)
        run(['node', ENGINE / 'render.mjs', '--work', wd, 'stills', *[f for f, _ in frames]], cwd=ENGINE, env=env, stdout=subprocess.DEVNULL)
    pl = [(st / f'f{f:04d}.jpg', f'{f} · {lab}') for f, lab in frames]
    sheet(pl, st / 'qc_sheet.jpg')
    # close-ups of the cut-out edge for each behind word
    from PIL import Image
    crops = []
    for f, lab in frames:
        if lab.startswith('behind'):
            im = Image.open(st / f'f{f:04d}.jpg')
            crops.append(im.crop((240, 300, 840, 740)).resize((450, 330)))
    if crops:
        E = Image.new('RGB', (450 * min(4, len(crops)), 330 * ((len(crops) + 3) // 4)), 'white')
        for i, c in enumerate(crops):
            E.paste(c, ((i % 4) * 450, (i // 4) * 330))
        E.save(st / 'qc_edges.jpg', quality=90)
    print('QC sheet →', st / 'qc_sheet.jpg', '| edges →', st / 'qc_edges.jpg' if crops else 'n/a')


if __name__ == '__main__':
    main()
