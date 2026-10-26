"""Step 4 — clean the dialogue (source timeline) → work/<slug>/audio/voice_clean.wav

    python voice.py --slug <slug> [--denoise 10]

Chain: high-pass 80 Hz → FFT denoise (always on) → −2 dB @ 200 Hz (mud) → +2.5 dB @ 3.4 kHz (presence)
→ +1.5 dB high shelf → 3:1 compression → gentle dynamic levelling → two-pass loudnorm to −15 LUFS.
Default --denoise 10 on every video. Use 8 if the voice sounds thin; 12 only if a hall is still noisy.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import work_dir  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--denoise', type=float, default=10)
    a = ap.parse_args()
    wd = work_dir(a.slug)
    raw, out = wd / 'audio/voice_raw.wav', wd / 'audio/voice_clean.wav'
    ch = (f"highpass=f=80,afftdn=nr={a.denoise}:nf=-50:tn=1,equalizer=f=200:t=q:w=1:g=-2,equalizer=f=3400:t=q:w=1.2:g=2.5,"
          "highshelf=f=9000:g=1.5,acompressor=threshold=-26dB:ratio=3:attack=6:release=160:makeup=3,dynaudnorm=f=300:g=11:m=5:p=0.9")
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', str(raw), '-af', ch + ',loudnorm=I=-15:TP=-2:LRA=7:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    t = r.stderr
    j = json.loads(t[t.rindex('{'):t.rindex('}') + 1])
    ln = (f"loudnorm=I=-15:TP=-2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', f'{ch},{ln},aresample=48000', '-c:a', 'pcm_s24le', str(out)], check=True)
    print('voice_clean.wav written (pre-norm', j['input_i'], 'LUFS)')


if __name__ == '__main__':
    main()
