"""Shared paths and helpers for the FotoOwl testimonial pipeline."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]          # …/fotoowl-testimonial
ENGINE = SKILL / 'engine'
STATIC = ENGINE / 'static'
ASSETS = SKILL / 'assets'


def _workspace() -> Path:
    env = os.environ.get('FOTOOWL_WORKSPACE')
    if env:
        return Path(env).expanduser().resolve()
    p = SKILL.parents
    # repo/.cursor/skills/fotoowl-testimonial → repo
    if len(p) >= 3 and p[1].name == '.cursor':
        return p[2]
    return Path.cwd()


WORKSPACE = _workspace()
WORK_ROOT = WORKSPACE / 'work'
OUTPUT = WORKSPACE / 'output'
MODELS = Path(os.environ.get('FOTOOWL_MODELS', '~/.cache/fotoowl-testimonial/models')).expanduser()

FPS = 30
OUT_W, OUT_H = 1080, 1920


def work_dir(slug: str) -> Path:
    d = WORK_ROOT / slug
    for sub in ('analysis', 'audio', 'public', 'render', 'stills'):
        (d / sub).mkdir(parents=True, exist_ok=True)
    return d


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    kw.setdefault('check', True)
    return subprocess.run([str(c) for c in cmd], **kw)


def ffprobe(path: Path) -> dict:
    out = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', str(path)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def video_info(path: Path) -> dict:
    """Display size (after rotation), fps, duration, frame count."""
    j = ffprobe(path)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    w, h = int(v['width']), int(v['height'])
    rot = 0
    for sd in v.get('side_data_list', []) or []:
        if 'rotation' in sd:
            rot = int(float(sd['rotation']))
    if 'tags' in v and 'rotate' in v['tags']:
        rot = int(v['tags']['rotate'])
    if abs(rot) % 180 == 90:
        w, h = h, w
    num, den = (v.get('avg_frame_rate') or v.get('r_frame_rate') or '30/1').split('/')
    fps = float(num) / float(den or 1)
    dur = float(j['format'].get('duration', v.get('duration', 0)))
    has_audio = any(s['codec_type'] == 'audio' for s in j['streams'])
    return {'width': w, 'height': h, 'fps': fps, 'duration': dur, 'frames': int(round(dur * fps)),
            'rotation': rot, 'orientation': 'vertical' if h >= w else 'horizontal', 'has_audio': has_audio}


def load_json(p: Path):
    return json.loads(Path(p).read_text())


def save_json(p: Path, obj, indent=1):
    Path(p).write_text(json.dumps(obj, indent=indent, ensure_ascii=False))


def link_static(public: Path):
    """Expose engine/static (fonts, brand, photos, sfx) inside a work folder's public/."""
    for sub in ('fonts', 'brand', 'photos', 'sfx'):
        dst = public / sub
        if dst.is_symlink() or dst.exists():
            if dst.is_symlink():
                dst.unlink()
            else:
                continue  # a real folder (e.g. extra photos) — leave it
        dst.symlink_to(STATIC / sub, target_is_directory=True)


def require(binary: str):
    if not shutil.which(binary):
        raise SystemExit(f'Missing "{binary}". Run scripts/setup.sh first.')
