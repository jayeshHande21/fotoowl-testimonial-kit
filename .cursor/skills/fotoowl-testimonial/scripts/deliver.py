"""Step 9 — deliverables → output/<slug>/

    python deliver.py --slug <slug> --name "Pradeep Jindal"

  FotoOwl_Testimonial_<Name>_v<N>.mp4         master (H.264, 1080×1920, 30 fps, AAC 256k, −14 LUFS)
  FotoOwl_Testimonial_<Name>_v<N>_light.mp4   ~9 Mbps for WhatsApp / LinkedIn
  FotoOwl_Testimonial_<Name>_v<N>_cover.jpg   cover / thumbnail frame
  FotoOwl_Testimonial_<Name>_v<N>.srt         subtitles (spoken words, original wording)
  FotoOwl_Testimonial_<Name>_v<N>_post.md     post-caption template — fill it in from the transcript
The version number increments automatically.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import FPS, OUTPUT, load_json, run, video_info, work_dir  # noqa: E402


def ts(t: float) -> str:
    t = max(0.0, t)
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--name', required=True, help='customer name for the file name')
    a = ap.parse_args()
    wd = work_dir(a.slug)
    e = load_json(wd / 'edit.json')
    od = OUTPUT / a.slug
    od.mkdir(parents=True, exist_ok=True)
    base = 'FotoOwl_Testimonial_' + re.sub(r'[^A-Za-z0-9]', '', a.name.title())
    n = 1
    while (od / f'{base}_v{n}.mp4').exists():
        n += 1
    stem = od / f'{base}_v{n}'
    master = Path(f'{stem}.mp4')
    run(['ffmpeg', '-v', 'error', '-y', '-i', wd / 'render/video_noaudio.mp4', '-i', wd / 'audio/mix.wav', '-map', '0:v', '-map', '1:a',
         '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', master])
    run(['ffmpeg', '-v', 'error', '-y', '-i', master, '-c:v', 'libx264', '-preset', 'slow', '-b:v', '9M', '-maxrate', '12M', '-bufsize', '18M',
         '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', f'{stem}_light.mp4'])
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{e['coverF'] / FPS:.3f}", '-i', master, '-frames:v', '1', '-q:v', '2', f'{stem}_cover.jpg'])
    # subtitles: every spoken word in its block, in order
    lines = []
    for k, b in enumerate(sorted(e['captions']['blocks'], key=lambda b: b['start'])):
        lines += [str(k + 1), f"{ts(b['start'])} --> {ts(b['end'])}", ' '.join(w['t'] for w in b['words']), '']
    Path(f'{stem}.srt').write_text('\n'.join(lines))
    Path(f'{stem}_post.md').write_text(
        '# Post caption (fill in — use only what the customer actually said)\n\n'
        '**Hook (≤ 8 words, his strongest line in quotes):** "…"\n\n'
        '**Body (1–2 lines):** Who he is (name · studio · city if said) + what he said about FotoOwl, no new claims.\n\n'
        '**CTA:** Discover FotoOwl → fotoowl.ai\n\n'
        '**Hashtags (5–8):** #FotoOwl #WeddingPhotography #PhotographersOfIndia #ClientGallery #AIforPhotographers\n')
    vi = video_info(master)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(master), '-af', 'ebur128=framelog=quiet:peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    lufs = re.search(r'I:\s+(-?[\d.]+) LUFS', r); peak = re.search(r'Peak:\s+(-?[\d.]+) dBFS', r)
    ok = vi['width'] == 1080 and vi['height'] == 1920 and abs(vi['frames'] - e['totalF']) <= 1
    print(f"master {master.name}: {vi['width']}x{vi['height']} {vi['fps']:.0f}fps {vi['duration']:.2f}s frames {vi['frames']}/{e['totalF']} "
          f"| {lufs.group(1) if lufs else '?'} LUFS peak {peak.group(1) if peak else '?'} dBFS | {'OK' if ok else 'CHECK'}")
    for p in sorted(od.glob(f'{base}_v{n}*')):
        print('  ', p.name, f'{p.stat().st_size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
