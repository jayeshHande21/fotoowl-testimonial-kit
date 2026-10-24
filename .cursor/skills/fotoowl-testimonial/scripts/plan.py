"""Step 3 — turn the approved choices into edit.json (frame-accurate spec for the engine + mix).

    python plan.py --slug <slug> --draft      → work/<slug>/choices.json (auto caption groups, defaults) to edit
    python plan.py --slug <slug>              → work/<slug>/edit.json + timeline summary

choices.json (all times in SOURCE seconds; word indices refer to analysis/transcript.json):
{
  "customer":   {"name": "…", "studio": "…"}            # only if said on camera, else null
  "wordEdits":  {"12": "FotoOwl", "13": null}             # fix ASR spelling; null = merge into previous word
  "hook":       {"from": 24.57, "to": 27.13} | null        # cold open (strongest line), replayed at the start
  "keep":       [[0.70, 29.77]]                            # kept source ranges in order (trims = several ranges)
  "groups":     [[0, 4], [5, 8], …]                        # caption phrases: inclusive word-index ranges
  "behind":     [12, 45, 49, 80, 86]                       # big gold words (parallax) — main part
  "hookBehind": 80                                         # big gold word in the cold open (or null)
  "highlight":  [17, 18, 19, 20, 30, 31]                   # gold words (shown gold in phrases without a behind word)
  "italic":     [50, 83]                                   # serif italic words
  "pushIns":    [{"from": 14.75, "to": 17.5, "zoom": 1.12}, {"from": 24.45, "to": 27.35, "zoom": 1.14, "settle": 1.07}]
  "openingReframe": "auto" | null
  "lowerThird": {"from": 1.15, "to": 4.55} | null          # uses customer name / studio
  "cards":      [{"type": "stat", "from": 5.95, "to": 8.3, "props": {…}}, …]
  "styles":     {"captions": "parallax", "cards": "wide", "outro": "owl"}
  "music":      {"file": "woven-memories.mp3", "db": -20} | null
}
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from common import ASSETS, FPS, OUT_H, OUT_W, link_static, load_json, save_json, work_dir  # noqa: E402

OUTRO_LEN = {'owl': 168, 'navy': 96, 'logo': 66}
OUTRO_LOGO_T = {'owl': 3.0, 'navy': 0.62, 'logo': 0.25}  # seconds after outro start when the logo resolves
CARD_SFX = {'stat': 'click'}


# ── caption grouping ──
# words a phrase should not END on (they belong with what follows)
FUNC = {w.lower() for w in 'the a an and of to for from with in on at by i i\'m so because since my our this that what very are is am was will also they we all any not don\'t want who which than then or but if as its it\'s'.split()}


def auto_groups(words: list[dict], max_words=5, max_chars=28, gap=0.3) -> list[list[int]]:
    """Split the transcript into 2–5-word caption phrases.
    Hard breaks at sentence ends and pauses; inside a run, choose break points by dynamic programming:
    prefer commas, avoid ending on function words, prefer ~3–4 words, never exceed max_chars."""
    runs, cur = [], []
    for k, w in enumerate(words):
        cur.append(k)
        nxt = words[k + 1] if k + 1 < len(words) else None
        if nxt is None or re.search(r'[.?!]$', w['w']) or nxt['s'] - w['e'] > gap:
            runs.append(cur); cur = []
    groups = []
    for run_ in runs:
        n = len(run_)
        best = [0.0] + [float('inf')] * n
        prev = [0] * (n + 1)
        for j in range(1, n + 1):
            for L in range(1, min(max_words, j) + 1):
                i = j - L
                seg = run_[i:j]
                text = ' '.join(words[k]['w'] for k in seg)
                if len(text) > max_chars and L > 1:
                    continue
                last = words[seg[-1]]['w']
                cost = 0.35 * (L - 3.5) ** 2
                if L == 1 and n > 1:
                    cost += 4
                if j < n:  # an internal break
                    nxt_w = words[run_[j]]['w']
                    if last.rstrip(',').lower() in FUNC:
                        cost += 3
                    if last[:1].isupper() and nxt_w[:1].isupper() and last not in ('I', "I'm") and not last.endswith(','):
                        cost += 4  # keep names together ("Pradeep Jindal", "Wedding Book")
                    if last.endswith(','):
                        cost -= 1.5
                if best[i] + cost < best[j]:
                    best[j] = best[i] + cost; prev[j] = i
        cuts, j = [], n
        while j > 0:
            cuts.append((prev[j], j)); j = prev[j]
        for i, j in reversed(cuts):
            groups.append([words[run_[i]]['i'], words[run_[j - 1]]['i']])
    # a lone short word (e.g. "Hi,") joins the next phrase
    out = []
    k = 0
    while k < len(groups):
        g = groups[k]
        if g[0] == g[1] and k + 1 < len(groups) and not re.search(r'[.?!]$', words[g[1]]['w']) and groups[k + 1][1] - groups[k + 1][0] < 4:
            out.append([g[0], groups[k + 1][1]]); k += 2
        else:
            out.append(g); k += 1
    return out


def apply_word_edits(words: list[dict], edits: dict) -> list[dict]:
    ws = [dict(w) for w in words]
    for k in sorted(edits, key=lambda x: int(x)):
        i = int(k); v = edits[k]
        if v is None:  # merge into previous
            ws[i - 1]['e'] = ws[i]['e']; ws[i]['_drop'] = True
        else:
            ws[i]['w'] = v
    return ws


# ── timeline mapping ──
class Timeline:
    def __init__(self, hook, keep, plate_frames):
        self.segs = []
        out = 0
        if hook:
            s, e = round(hook['from'] * FPS), round(hook['to'] * FPS)
            self.segs.append({'id': 'hook', 'srcStartF': s, 'lenF': e - s, 'outStartF': out}); out += e - s
        for n, (a, b) in enumerate(keep):
            s, e = round(a * FPS), min(round(b * FPS), plate_frames)
            self.segs.append({'id': f'main{n}', 'srcStartF': s, 'lenF': e - s, 'outStartF': out}); out += e - s
        self.endF = out

    def main_segs(self):
        return [g for g in self.segs if g['id'] != 'hook']

    def to_out(self, src_s: float, segs=None):
        """source seconds → output seconds (None if the moment was trimmed)."""
        for g in segs or self.main_segs():
            a = g['srcStartF'] / FPS; b = (g['srcStartF'] + g['lenF']) / FPS
            if a - 1e-6 <= src_s <= b + 1e-6:
                return g['outStartF'] / FPS + (src_s - a)
        return None

    def to_out_clamped(self, src_s: float):
        o = self.to_out(src_s)
        if o is not None:
            return o
        best = None
        for g in self.main_segs():  # nearest kept edge
            a = g['srcStartF'] / FPS; b = (g['srcStartF'] + g['lenF']) / FPS
            for edge, oo in ((a, g['outStartF'] / FPS), (b, (g['outStartF'] + g['lenF']) / FPS)):
                d = abs(src_s - edge)
                if best is None or d < best[0]:
                    best = (d, oo)
        return best[1]


def build_blocks(words, groups, behind, highlight, italic, tl, segs, top, end_cap):
    """caption blocks in OUTPUT time for the words that fall inside `segs`."""
    blocks = []
    wmap = {w['i']: w for w in words if not w.get('_drop')}
    gl = []
    for a, b in groups:
        ids = [i for i in range(a, b + 1) if i in wmap and tl.to_out(wmap[i]['s'], segs) is not None]
        if ids:
            gl.append(ids)
    for k, ids in enumerate(gl):
        ws = [{'t': wmap[i]['w'], 's': round(tl.to_out(wmap[i]['s'], segs), 3), 'hl': i in highlight} for i in ids]
        start = ws[0]['s'] - 0.06
        last = wmap[ids[-1]]
        seg = next(g for g in segs if tl.to_out(last['s'], [g]) is not None)
        seg_end_src = (seg['srcStartF'] + seg['lenF']) / FPS
        end = tl.to_out(min(last['e'], last['s'] + 1.2, seg_end_src), [seg]) + 0.25
        if k + 1 < len(gl):
            nxt = tl.to_out(wmap[gl[k + 1][0]]['s'], segs) - 0.06
            if nxt - end < 0.6:
                end = nxt
        end = min(end, end_cap)
        bi = next((n for n, i in enumerate(ids) if i in behind), None)
        blocks.append({'start': round(start, 3), 'end': round(end, 3), 'words': ws, 'behind': bi,
                       'italic': [n for n, i in enumerate(ids) if i in italic], 'top': top, '_ids': ids})
    return blocks


def opening_reframe(face, seg, zoom=1.16):
    """Zoom in while the speaker is off-centre at the start; ease out once centred."""
    f0 = seg['srcStartF']
    xs = np.array([p['x'] for p in face[f0:f0 + 8 * FPS]]); ys = np.array([p['y'] for p in face[f0:f0 + 8 * FPS]])
    if not len(xs):
        return []
    off = (np.abs(xs - 0.5) > 0.07) | (ys > 0.5)
    if not off[:FPS].any():
        return []
    settled = next((i for i in range(len(off)) if not off[i:i + FPS].any()), len(off))
    t_set = seg['outStartF'] / FPS + settled / FPS
    return [(seg['outStartF'] / FPS, zoom), (t_set - 0.4, zoom), (t_set + 1.2, 1.0)]


def find_music_offset(music: Path, logo_t: float, total: float) -> float:
    """Choose a start offset so a soft accent near the end of the track lands on the logo reveal
    and the track's natural ending covers the rest of the outro."""
    import subprocess
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(music), '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.float32); sr = 8000
    hop = sr // 4
    rms = np.array([20 * np.log10(np.sqrt((a[i:i + sr // 2] ** 2).mean()) + 1e-9) for i in range(0, len(a) - sr // 2, hop)])
    t = np.arange(len(rms)) * 0.25
    audible = t[rms > -40]
    if not len(audible):
        return 0.0
    music_end = audible[-1]
    need_after = (total - logo_t) + 0.6
    cands = []
    for i in range(4, len(rms)):
        if t[i] < 0.6 * music_end or t[i] + need_after > music_end:
            continue
        if rms[i] - rms[i - 4:i].mean() >= 4.0 and rms[i] > -24:
            cands.append(t[i])
    acc = cands[-1] if cands else max(0.0, music_end - need_after)
    return round(max(0.0, acc - logo_t), 2)


def draft(wd: Path):
    tr = load_json(wd / 'analysis/transcript.json')
    words = tr['words']
    first, last = words[0]['s'], words[-1]['e']
    info = load_json(wd / 'analysis/plate.json') if (wd / 'analysis/plate.json').exists() else load_json(wd / 'analysis/info.json')
    ch = {
        'customer': None,
        'wordEdits': {},
        'hook': None,
        'keep': [[round(max(0, first - 0.3), 2), round(min(info['duration'], last + 0.4), 2)]],
        'groups': auto_groups(words),
        'behind': [], 'hookBehind': None, 'highlight': [], 'italic': [],
        'pushIns': [], 'openingReframe': 'auto', 'lowerThird': None, 'cards': [],
        'styles': {'captions': 'parallax', 'cards': 'wide', 'outro': 'owl'},
        'music': {'file': 'woven-memories.mp3', 'db': -20},
    }
    save_json(wd / 'choices.json', ch)
    print('draft → choices.json with', len(ch['groups']), 'caption groups')
    for a, b in ch['groups']:
        print(f'  [{a}-{b}]', ' '.join(w['w'] for w in words[a:b + 1]))


def build(wd: Path):
    ch = load_json(wd / 'choices.json')
    tr = load_json(wd / 'analysis/transcript.json')
    face = load_json(wd / 'analysis/face.json')
    plate = load_json(wd / 'analysis/plate.json')
    words = apply_word_edits(tr['words'], ch.get('wordEdits', {}))
    styles = {'captions': 'parallax', 'cards': 'wide', 'outro': 'owl', **(ch.get('styles') or {})}
    tl = Timeline(ch.get('hook'), ch['keep'], plate['frames'])
    warn = []

    # cards (source → output) — consecutive cards hand over without overlap
    cards = []
    for c in ch.get('cards', []):
        tin, tout = tl.to_out_clamped(c['from']), tl.to_out_clamped(c['to'])
        cards.append({'type': c['type'], 'tIn': round(tin, 3), 'tOut': round(tout, 3), 'props': c.get('props', {})})
    cards.sort(key=lambda c: c['tIn'])
    for x, y in zip(cards, cards[1:]):
        if y['tIn'] < x['tOut']:
            x['tOut'] = y['tIn']
    lt = None
    if ch.get('lowerThird') and ch.get('customer'):
        lt = {'name': ch['customer']['name'], 'studio': ch['customer'].get('studio') or '',
              'tIn': round(tl.to_out_clamped(ch['lowerThird']['from']), 3), 'tOut': round(tl.to_out_clamped(ch['lowerThird']['to']), 3)}
    busy = [(c['tIn'], c['tOut']) for c in cards] + ([(lt['tIn'], lt['tOut'])] if lt else [])

    out_end = tl.endF / FPS
    outro_style = styles['outro']
    outro_start = tl.endF - 10
    total = outro_start + OUTRO_LEN[outro_style]
    end_cap = outro_start / FPS + 0.2

    # captions
    groups = ch['groups']
    blocks = []
    hook_seg = [g for g in tl.segs if g['id'] == 'hook']
    if hook_seg:
        hb = {ch['hookBehind']} if ch.get('hookBehind') is not None else set()
        blocks += build_blocks(words, groups, hb, set(ch.get('highlight', [])), set(ch.get('italic', [])), tl, hook_seg, 205, hook_seg[0]['lenF'] / FPS - 0.02)
        for b in blocks:  # the cold open starts mid-sentence → capitalise its first word
            b['words'][0]['t'] = b['words'][0]['t'][:1].upper() + b['words'][0]['t'][1:]
            break
    main_blocks = build_blocks(words, groups, set(ch.get('behind', [])), set(ch.get('highlight', [])), set(ch.get('italic', [])), tl, tl.main_segs(), 212, end_cap)
    for b in main_blocks:
        if b['behind'] is not None:
            ws = b['words'][b['behind']]['s']
            if any(ws < z - 0.02 and b['end'] > a + 0.1 for a, z in busy):  # card/name card still on screen when the word appears
                warn.append(f"behind word '{b['words'][b['behind']]['t']}' overlaps a pop-up → dropped (series rule)")
                b['behind'] = None
    blocks += main_blocks
    for b in blocks:
        b.pop('_ids', None)
    if styles['captions'] != 'parallax':
        for b in blocks:
            if b['behind'] is not None:
                b['words'][b['behind']]['hl'] = True
                b['behind'] = None

    # zoom keys
    segs = []
    for n, g in enumerate(tl.segs):
        g = dict(g)
        t0 = g['outStartF'] / FPS; t1 = (g['outStartF'] + g['lenF']) / FPS
        if g['id'] == 'hook':
            g['zoom'] = [[t0, 1.36], [t1, 1.41]]; g['zoomEase'] = 'linear'
        else:
            keys = []
            orf = ch.get('openingReframe')
            if n == (1 if hook_seg else 0) and orf == 'auto':
                keys += [list(k) for k in opening_reframe(face, g)]
            elif n == (1 if hook_seg else 0) and isinstance(orf, dict):  # {"zoom": 1.16, "holdUntil": 5.4, "easeTo": 7.0} (source s)
                keys += [[t0, orf.get('zoom', 1.16)], [tl.to_out(orf['holdUntil'], [g]), orf.get('zoom', 1.16)], [tl.to_out(orf['easeTo'], [g]), 1.0]]
            for p in ch.get('pushIns', []):
                a, b = tl.to_out(p['from'], [g]), tl.to_out(p['to'], [g])
                if a is None or b is None:
                    continue
                z = p.get('zoom', 1.12)
                keys += [[a, 1.0], [a + 0.6, z], [b, z], [b + 0.85, p.get('settle', 1.0)]]
            keys.sort(key=lambda k: k[0])
            base = 1.0 if (n - (1 if hook_seg else 0)) % 2 == 0 else 1.08  # alternate framing across trims
            g['zoom'] = [[round(k[0], 3), round(k[1] * base if k[1] == 1.0 and base != 1.0 else k[1], 3)] for k in keys] or [[t0, base]]
        segs.append(g)

    # audio spec
    voice = []
    for g in tl.segs:
        voice.append({'srcS': round(g['srcStartF'] / FPS, 4), 'srcE': round((g['srcStartF'] + g['lenF']) / FPS, 4), 'outS': round(g['outStartF'] / FPS, 4)})
    sfx = []
    if hook_seg:
        sfx.append({'name': 'whoosh', 't': round(hook_seg[0]['lenF'] / FPS - 0.30, 3), 'db': -17})
    prev_out = None
    for c in cards:
        swap = prev_out is not None and abs(c['tIn'] - prev_out) < 0.05  # one card hands straight over to the next
        name = 'click' if swap else CARD_SFX.get(c['type'], 'notify')
        sfx.append({'name': name, 't': c['tIn'], 'db': -16 if name == 'click' and not swap else (-17 if swap else -19)})
        prev_out = c['tOut']
    logo_t = outro_start / FPS + OUTRO_LOGO_T[outro_style]
    if outro_style == 'owl':
        sfx.append({'name': 'whoosh', 't': round(outro_start / FPS + 0.30, 3), 'db': -24})
    sfx.append({'name': 'accent', 't': round(logo_t - 0.08, 3), 'db': -13})
    music = None
    if ch.get('music'):
        mf = ASSETS / 'music' / ch['music']['file']
        music = {'file': str(mf), 'db': ch['music'].get('db', -20), 'endDb': ch['music'].get('db', -20) + 9,
                 'offset': ch['music'].get('offset', find_music_offset(mf, logo_t, total / FPS)), 'liftFrom': round(outro_start / FPS - 0.1, 3), 'liftTo': round(logo_t, 3)}

    cover_t = ch.get('coverAt')
    if cover_t is None:
        bb = next((b for b in main_blocks if b['behind'] is not None), None)
        cover_t = (bb['words'][bb['behind']]['s'] + 0.5) if bb else (hook_seg[0]['lenF'] / FPS * 0.6 if hook_seg else 2.0)

    edit = {
        'fps': FPS, 'width': OUT_W, 'height': OUT_H, 'plate': 'plate.mp4', 'plateFrames': plate['frames'],
        'person': (wd / 'public/fg').exists() and any((wd / 'public/fg').iterdir()),
        'face': face, 'faceTarget': {'x': 0.5, 'y': 0.42}, 'segments': segs,
        'captions': {'style': styles['captions'], 'blocks': blocks}, 'lowerThird': lt, 'cards': cards,
        'cardStyle': styles['cards'], 'watermark': True, 'bottomShade': True,
        'outro': {'style': outro_style, 'startF': outro_start, 'lenF': OUTRO_LEN[outro_style]}, 'totalF': total,
        'audio': {'voice': voice, 'music': music, 'sfx': sfx}, 'coverF': int(round(cover_t * FPS)),
    }
    save_json(wd / 'edit.json', edit, indent=None)
    link_static(wd / 'public')

    # summary
    print(f"edit.json → {total} frames = {total / FPS:.2f} s (speech {out_end:.2f} s + outro '{outro_style}')")
    for g in segs:
        print(f"  segment {g['id']:6s} src {g['srcStartF'] / FPS:6.2f}–{(g['srcStartF'] + g['lenF']) / FPS:6.2f}s → out {g['outStartF'] / FPS:6.2f}s  zoom {g['zoom']}")
    for b in blocks:
        txt = ' '.join(('[' + w['t'].upper() + ']') if i == b['behind'] else (('*' + w['t'] + '*') if w.get('hl') else w['t']) for i, w in enumerate(b['words']))
        print(f"  {b['start']:6.2f}–{b['end']:6.2f}  {txt}")
    if lt:
        print(f"  lower third {lt['tIn']:.2f}–{lt['tOut']:.2f}  {lt['name']} · {lt['studio']}")
    for c in cards:
        print(f"  card {c['type']:13s} {c['tIn']:6.2f}–{c['tOut']:6.2f}  {c['props'].get('title') or c['props'].get('value') or ''}")
    print('  sfx', [(s['name'], s['t']) for s in sfx])
    if music:
        print(f"  music {Path(music['file']).name} offset {music['offset']}s @ {music['db']} dB")
    for w in warn:
        print('  ⚠', w)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug', required=True)
    ap.add_argument('--draft', action='store_true')
    a = ap.parse_args()
    wd = work_dir(a.slug)
    draft(wd) if a.draft else build(wd)


if __name__ == '__main__':
    main()
