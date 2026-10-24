# FotoOwl Testimonial Kit

Everything needed to turn a raw customer testimonial into the FotoOwl Testimonial Series video: the Cursor skill, the Series Bible, the render engine, the scripts and the brand assets.

```
.cursor/skills/fotoowl-testimonial/
  SKILL.md                    ← workflow Cursor follows (open Agent chat → "/fotoowl-testimonial", or just drop in a clip)
  references/series-bible.md  ← the master prompt: every rule for script, captions, pop-ups, sound, watermark, outro
  references/…                ← edit-plan template, feature-card intake, alternatives menu, troubleshooting
  scripts/                    ← setup, analyze, plate, voice, plan, matte, mix, qc, deliver
  engine/                     ← Remotion project (captions, cards, outros) — renders from work/<slug>/edit.json
  assets/                     ← official logo files, music library, ready-made outro clips
  examples/                   ← episode 1 (Pradeep Jindal) choices.json
work/<slug>/                  ← per-video working files (git-ignored)
output/<slug>/                ← finished deliverables
```

## First time on a new Mac
```bash
bash .cursor/skills/fotoowl-testimonial/scripts/setup.sh
```

## New video
In Cursor Agent: *"New testimonial: ~/Downloads/IMG_2041.MOV"*. The skill analyses the clip, asks you about the features to show, and shows you an edit plan. It renders only after you approve, then delivers to `output/`.

## Adding music
Drop `.mp3`/`.wav` files into `.cursor/skills/fotoowl-testimonial/assets/music/`, then name the track in the plan.

## Licence note
The engine uses Remotion, which is free for companies of up to 3 people. See the Series Bible §10.
