# Troubleshooting (lessons from episode 1)

| Symptom | Cause | Fix |
|---|---|---|
| `Compositor exited with signal SIGKILL` / browser crash mid-render | out of memory (4K plate + cut-out frames) | `RENDER_CONCURRENCY=1`; close other apps. Remotion retries a crashed frame once by itself |
| Render prints RENDER_DONE but the process doesn't exit | open handles | harmless: `render.mjs` ends with `process.exit(0)` |
| Two renders running at once overwrite each other's output | an old render still in the background | check `ps aux \| grep render.mjs` before starting. Never write two renders to the same file |
| `vsFrameAllocate: Assertion 'fi->planes==1'` | vid.stab given a non-yuv420p frame | `plate.py` already adds `format=yuv420p` before vid.stab |
| Captions say "Photo All" / "Photoall" | ASR mishears FotoOwl | `wordEdits: {"12": "FotoOwl", "13": null}` (null merges the word into the previous one) |
| Big gold word unreadable (head hides the middle letters) | word sits too low | keep `top` 212 (205 in a tight cold open); check `qc_edges.jpg` |
| White front words hard to read | light shirt or background | the bottom shade is on by default. Otherwise switch to `pill` captions |
| Card covers the top of the head | tall card while the speaker stands high | use `chip` for that card, shorten it, or nudge `CARD_TOP` in `Cards.tsx` |
| faster-whisper can't download its model | offline | `analyze.py --asr sherpa` (whisper text + parakeet timings; English timings only) |
| Hindi/Marathi words come out in Devanagari | ASR writes the native script | rewrite each word in English letters via `wordEdits` (keep the timings), never translate |
| Music ends abruptly / no accent at the logo | short track | set `music.offset` by hand, or pick a longer track |
| Person cut-out missing (gold word drawn over the face) | `matte.py` not run, or plan not re-run after it | run `matte.py`, then `plan.py` again (sets `person: true`) |
