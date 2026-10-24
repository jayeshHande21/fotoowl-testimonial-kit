"""Step 7 — final audio mix from edit.json → work/<slug>/audio/mix.wav (−14 LUFS, −1.5 dBTP)

    python mix.py --slug <slug> [--music-db -20]

Voice segments follow the edit (cold open + kept ranges), music bed sits ~20 dB under the voice and
lifts ~9 dB across the outro, SFX are placed from edit.json['audio']['sfx'].
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import FPS, STATIC, load_json, work_dir  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--music-db', type=float, default=None)
    a = ap.parse_args()
    wd = work_dir(a.slug)
    e = load_json(wd / 'edit.json')
    A = e['audio']
    total = e['totalF'] / FPS
    ms = lambda t: max(0, int(round(t * 1000)))  # noqa: E731
    inputs, fc, labels = [], [], []
    for k, v in enumerate(A['voice']):
        inputs += ['-i', str(wd / 'audio/voice_clean.wav')]
        d = v['srcE'] - v['srcS']
        fc.append(f"[{k}:a]atrim={v['srcS']}:{v['srcE']},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={max(0, d - 0.07):.3f}:d=0.07,"
                  f"aformat=channel_layouts=stereo,aresample=48000,adelay={ms(v['outS'])}:all=1[v{k}]")
        labels.append(f'[v{k}]')
    n = len(inputs) // 2
    mu = A.get('music')
    if mu:
        db = a.music_db if a.music_db is not None else mu['db']
        g0, g1 = 10 ** (db / 20), 10 ** ((db + 9) / 20)
        lf, lt = mu['liftFrom'], mu['liftTo']
        vol = f"volume='if(lt(t,{lf}),{g0},if(lt(t,{lt}),{g0}+({g1}-{g0})*(t-{lf})/{max(0.01, lt - lf)},{g1}))':eval=frame"
        inputs += ['-i', mu['file']]
        fc.append(f"[{n}:a]atrim={mu['offset']}:{mu['offset'] + total},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,{vol},"
                  f"afade=t=in:d=0.9,afade=t=out:st={total - 1.25:.3f}:d=1.25[mu]")
        labels.append('[mu]'); n += 1
    for k, s in enumerate(A['sfx']):
        inputs += ['-i', str(STATIC / 'sfx' / f"{s['name']}.wav")]
        fc.append(f"[{n}:a]volume={s['db']}dB,aresample=48000,adelay={ms(s['t'])}:all=1[s{k}]")
        labels.append(f'[s{k}]'); n += 1
    fc.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{total}[pre]")
    g = ';'.join(fc)

    def go(out, tail):
        return subprocess.run(['ffmpeg', '-hide_banner', '-y', *inputs, '-filter_complex', g + f';[pre]{tail}[out]', '-map', '[out]', *out], capture_output=True, text=True)

    r = go(['-f', 'null', '-'], 'loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json')
    t = r.stderr
    if '{' not in t:
        print(t[-3000:]); raise SystemExit(1)
    j = json.loads(t[t.rindex('{'):t.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
    r = go(['-c:a', 'pcm_s24le', str(wd / 'audio/mix.wav')], ln)
    if r.returncode:
        print(r.stderr[-2000:]); raise SystemExit(1)
    print('mix.wav written | pre-norm', j['input_i'], 'LUFS |', len(A['sfx']), 'sfx | music', bool(mu))


if __name__ == '__main__':
    main()
