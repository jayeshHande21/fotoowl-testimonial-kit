"""Step 1 — analyse a raw testimonial clip.

    python analyze.py <video> --slug pradeep-jindal [--asr auto|faster-whisper|sherpa] [--lang en|hi|mr]

Writes work/<slug>/analysis/:
  info.json          size, orientation, fps, duration, rotation
  transcript.json    language, word list [{i,w,s,e}] in SOURCE seconds, raw ASR text
  transcript.md      readable, indexed words with timings (for writing the edit plan)
  audio.json         loudness (LUFS), noise floor, per-second level, pauses
  sheet.jpg          contact sheet (1 frame / 2 s) to look at framing, light, background
and work/<slug>/audio/voice_raw.wav (48 kHz) + asr16k.wav.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from common import MODELS, run, save_json, video_info, work_dir  # noqa: E402


def extract_audio(src: Path, wd: Path):
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s24le', wd / 'audio/voice_raw.wav'])
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', wd / 'audio/asr16k.wav'])


def audio_report(wd: Path) -> dict:
    import soundfile as sf
    a, sr = sf.read(wd / 'audio/voice_raw.wav')
    per_s = [round(float(20 * np.log10(np.sqrt((a[int(t * sr):int((t + 1) * sr)] ** 2).mean()) + 1e-9)), 1) for t in range(int(len(a) / sr))]
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(wd / 'audio/voice_raw.wav'), '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.search(r'I:\s+(-?[\d.]+) LUFS', r)
    s = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(wd / 'audio/voice_raw.wav'), '-af', 'highpass=f=100,silencedetect=noise=-38dB:d=0.25', '-f', 'null', '-'], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', s)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', s)]
    floor = sorted(per_s)[max(0, len(per_s) // 10)] if per_s else None
    return {'integrated_lufs': float(m.group(1)) if m else None, 'per_second_db': per_s, 'noise_floor_db_est': floor,
            'pauses': [[round(a_, 2), round(b_, 2)] for a_, b_ in zip(starts, ends)]}


def contact_sheet(src: Path, wd: Path, dur: float):
    n = max(4, min(20, int(dur / 2)))
    step = dur / n
    tmp = wd / 'analysis/_sheet'
    tmp.mkdir(exist_ok=True)
    for i in range(n):
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{i * step + 0.2:.2f}', '-i', src, '-frames:v', '1', '-vf', 'scale=360:-2', tmp / f'{i:02d}.jpg'])
    from PIL import Image, ImageDraw
    ims = [Image.open(p) for p in sorted(tmp.glob('*.jpg'))]
    w, h = ims[0].size
    cols = 5
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (w * cols, (h + 22) * rows), 'white')
    d = ImageDraw.Draw(sheet)
    for i, im in enumerate(ims):
        x, y = (i % cols) * w, (i // cols) * (h + 22)
        sheet.paste(im, (x, y + 22))
        d.text((x + 6, y + 4), f'{i * step + 0.2:.1f}s', fill='black')
    sheet.save(wd / 'analysis/sheet.jpg', quality=85)
    for p in tmp.glob('*.jpg'):
        p.unlink()
    tmp.rmdir()


# ── ASR backends ──
def asr_faster_whisper(wav: Path, lang: str | None):
    import soundfile as sf
    from faster_whisper import WhisperModel
    m = WhisperModel('large-v3-turbo', device='auto', compute_type='int8')
    audio, _ = sf.read(str(wav), dtype='float32')  # PyAV ≥ 15 breaks faster-whisper's own file decoder
    segs, info = m.transcribe(audio, language=lang, word_timestamps=True, beam_size=5, vad_filter=False,
                              condition_on_previous_text=False)
    words, text = [], []
    for s in segs:
        text.append(s.text)
        for w in s.words or []:
            words.append({'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)})
    return {'backend': 'faster-whisper large-v3-turbo', 'language': info.language, 'text': ' '.join(t.strip() for t in text), 'words': words}


def asr_sherpa(wav: Path, lang: str | None):
    import sherpa_onnx
    import soundfile as sf
    a, sr = sf.read(str(wav), dtype='float32')
    # whisper turbo: accurate text (≤28 s chunks)
    wd_ = MODELS / 'sherpa-onnx-whisper-turbo'
    wr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(wd_ / 'turbo-encoder.int8.onnx'), decoder=str(wd_ / 'turbo-decoder.int8.onnx'),
                                                    tokens=str(wd_ / 'turbo-tokens.txt'), language=lang or 'en', task='transcribe', num_threads=4, tail_paddings=800)
    texts = []
    for s0 in range(0, len(a), 28 * sr):
        st = wr.create_stream(); st.accept_waveform(sr, a[s0:s0 + 28 * sr]); wr.decode_stream(st)
        texts.append(st.result.text.strip())
    # parakeet: word timings (English only)
    pd = MODELS / 'sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8'
    pr = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=str(pd / 'encoder.int8.onnx'), decoder=str(pd / 'decoder.int8.onnx'), joiner=str(pd / 'joiner.int8.onnx'),
                                                       tokens=str(pd / 'tokens.txt'), model_type='nemo_transducer', num_threads=4)
    words = []
    chunk = 60 * sr
    for s0 in range(0, len(a), chunk):
        st = pr.create_stream(); st.accept_waveform(sr, a[s0:s0 + chunk]); pr.decode_stream(st)
        res = st.result
        off = s0 / sr
        durs = list(getattr(res, 'durations', []) or [0.08] * len(res.tokens))
        for tok, ts, du in zip(res.tokens, res.timestamps, durs):
            if tok.startswith(' ') or not words or words[-1].get('_closed'):
                words.append({'w': tok.strip(), 's': round(off + ts, 3), 'e': round(off + ts + du, 3)})
            else:
                words[-1]['w'] += tok
                words[-1]['e'] = round(off + ts + du, 3)
        if words:
            words[-1]['_closed'] = True
    for w in words:
        w.pop('_closed', None)
    for x, y in zip(words, words[1:]):
        x['e'] = min(x['e'], y['s'])
    return {'backend': 'sherpa whisper-turbo (text) + parakeet (timings)', 'language': lang or 'en', 'text': ' '.join(texts), 'words': [w for w in words if w['w']]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('--slug', required=True)
    ap.add_argument('--asr', default='auto')
    ap.add_argument('--lang', default=None, help='force language (en, hi, mr); default: detect')
    a = ap.parse_args()
    src = Path(a.video).expanduser().resolve()
    wd = work_dir(a.slug)
    link = wd / f'source{src.suffix.lower()}'
    if not link.exists():
        link.symlink_to(src)
    info = video_info(src)
    save_json(wd / 'analysis/info.json', info)
    print('info', info)
    extract_audio(src, wd)
    rep = audio_report(wd)
    save_json(wd / 'analysis/audio.json', rep)
    print('loudness', rep['integrated_lufs'], 'LUFS; pauses', len(rep['pauses']))
    contact_sheet(src, wd, info['duration'])

    tr = None
    if a.asr in ('auto', 'faster-whisper'):
        try:
            tr = asr_faster_whisper(wd / 'audio/asr16k.wav', a.lang)
        except Exception as e:  # noqa: BLE001
            if a.asr == 'faster-whisper':
                raise
            print('faster-whisper unavailable →', type(e).__name__, str(e)[:120], '→ using sherpa')
    if tr is None:
        tr = asr_sherpa(wd / 'audio/asr16k.wav', a.lang)
    for i, w in enumerate(tr['words']):
        w['i'] = i
    save_json(wd / 'analysis/transcript.json', tr)

    lines = [f"# Transcript — {a.slug}", '', f"backend: {tr['backend']} · language: {tr['language']}", '', '## ASR text', '', tr['text'], '',
             '## Words (index · start–end in source seconds)', '']
    row = []
    for w in tr['words']:
        row.append(f"[{w['i']}] {w['w']} {w['s']:.2f}")
        if re.search(r'[.?!]$', w['w']) or len(row) >= 10:
            lines.append(' · '.join(row)); row = []
    if row:
        lines.append(' · '.join(row))
    (wd / 'analysis/transcript.md').write_text('\n'.join(lines))
    print('words', len(tr['words']), '| language', tr['language'], '| wrote', wd / 'analysis')


if __name__ == '__main__':
    main()
