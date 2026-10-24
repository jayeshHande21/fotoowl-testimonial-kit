---
name: fotoowl-testimonial
description: Edit a raw FotoOwl customer testimonial clip into the series' finished 9:16 video — verbatim parallax captions (gold word behind the speaker), feature pop-ups, cleaned voice + music + subtle SFX, top-left logo watermark and the owl-eyes outro. Use whenever a new testimonial video is added or Shantanu asks to edit, revise or re-render one.
metadata:
  series: FotoOwl Testimonial Series
  owner: Shantanu (FotoOwl)
  version: "1.0"
---

# FotoOwl Testimonial Series

Turn one raw testimonial clip into the finished series video, the same way every time.

**Read first:** `references/series-bible.md` (every rule and value), then use `references/edit-plan-template.md`, `references/feature-cards.md`, `references/alternatives.md` and `references/troubleshooting.md` as you go.

**Golden rules** (details in the bible):
- Never invent dialogue, claims or features.
- Captions are verbatim, in English letters, never translated.
- Never alter the logo.
- No name card unless the customer says his name.
- **Always get the edit plan approved before rendering.**
- When something is disliked, change only that element and offer 2–3 options from `alternatives.md`.

All commands run from the repo root. `PY=.venv/bin/python`, `S=.cursor/skills/fotoowl-testimonial`.

## 0 · One-time setup
```bash
bash $S/scripts/setup.sh          # Homebrew ffmpeg/node/python, venv, engine npm, models (~1.3 GB)
```

## 1 · Intake
- Put the clip anywhere; choose a slug (`firstname-lastname`, or `customer-YYYYMMDD` if no name).
- **Ask Shantanu, for each feature to show:** (1) title + one-line description, (2) the trigger words, (3) screenshots or mock-ups. See `feature-cards.md`. Also ask which music track (list `assets/music/`; default woven-memories.mp3).
- Don't ask for the customer's name, studio or consent. Use only what he says on camera.

## 2 · Analyse
```bash
$PY $S/scripts/analyze.py <clip> --slug <slug>        # add --lang hi|mr if not English
$PY $S/scripts/plate.py --slug <slug>                 # stabilise + grade + 9:16 reframe + face track
$PY $S/scripts/voice.py --slug <slug>                 # cleaned dialogue
$PY $S/scripts/plan.py --slug <slug> --draft          # choices.json with auto caption phrases
```
Then **read** `work/<slug>/analysis/transcript.md` and **look at** `analysis/sheet.jpg`. Also check `audio.json`, `plate.json` and `face_boxes.json`. Listen for meaning: fix ASR spelling (FotoOwl, names), and for Hindi or Marathi rewrite every word in English letters via `wordEdits` (keep the timings).

## 3 · Edit plan → approval (mandatory)
Fill in `edit-plan-template.md` and show it:
- transcript as captions
- spellings to confirm
- hook line, kept ranges and proposed trims (only if speech is over ~45–60 s)
- big gold words
- each pop-up with its trigger
- push-ins, music, runtime

**Wait for approval.** Apply his changes.

## 4 · Build the spec
Write `work/<slug>/choices.json` (schema in `scripts/plan.py`; worked example in `examples/pradeep-jindal.choices.json`). Copy any card photos or screenshots into `work/<slug>/public/photos|shots/`.
```bash
$PY $S/scripts/plan.py --slug <slug>       # → edit.json + timeline printout; read the ⚠ warnings
$PY $S/scripts/matte.py --slug <slug>      # person cut-out for the big gold words (only the needed frames)
$PY $S/scripts/plan.py --slug <slug>       # re-run so edit.json has person: true
```

## 5 · Preview before the full render
```bash
(cd $S/engine && node render.mjs --work ../../../../work/<slug> stills 60 200)   # any frames
$PY $S/scripts/qc.py --slug <slug>         # stills at every key moment → stills/qc_sheet.jpg + qc_edges.jpg
```
**Look at both images.** Fix placement, timing or text issues now, while stills take seconds instead of a full render.

## 6 · Render + mix + deliver
```bash
(cd $S/engine && node render.mjs --work ../../../../work/<slug> full)   # ~15–20 min; only ONE render at a time
$PY $S/scripts/mix.py --slug <slug>
$PY $S/scripts/deliver.py --slug <slug> --name "<Customer Name>"
$PY $S/scripts/qc.py --slug <slug> --video output/<slug>/<master>.mp4     # check the final file
```
Fill in `output/<slug>/*_post.md` (hook quote from his words · who and what he said · CTA fotoowl.ai · hashtags). Run the bible §9 checklist. Then deliver: master, light, cover, .srt and post caption, with a 2–3 line summary.

## 7 · Feedback loop
When Shantanu dislikes something:
1. Identify the element (captions, a pop-up, hook, framing, music, outro…).
2. Offer 2–3 options from `alternatives.md`, each with one line on the difference.
3. Change only `choices.json` for that element.
4. `plan.py` → `qc.py --frames …` → show the stills → full render only after he's happy.

The version number increments (v2, v3…). If he approves a new option, add it to `alternatives.md`. If he changes a rule for the whole series, update `series-bible.md`.

## Standalone outro
`node render.mjs --work <any work dir> outro` → `render/outro_noaudio.mp4`. Ready-made copies are in `assets/outro/`.
