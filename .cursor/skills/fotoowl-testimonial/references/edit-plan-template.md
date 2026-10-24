# Edit plan template (show this to Shantanu BEFORE rendering)

Fill it in from `analysis/transcript.md`, `analysis/sheet.jpg`, `analysis/audio.json` and `analysis/face_boxes.json`. Keep it short, scannable and decision-focused. Shantanu approves or changes it; then write `choices.json` and run `plan.py`.

---

## Edit plan: <Customer name or "customer"> · <studio if said>

**Footage:** <vertical/horizontal> · <resolution> · <duration> s · <one person / two people> · plate mode <vertical | crop-follow | inset>
**Picture:** <exposure · stability · framing problems, e.g. "low in frame for the first 5 s → opening reframe">
**Audio:** <LUFS> · noise floor <dB> · <issues, e.g. "dip at 21 s when he lowers the mic">
**Language:** <English / Hindi / Marathi / mixed> → captions in English letters

### Transcript (what the captions will say)
| Time | Words (verbatim; brand and number fixes only) |
|---|---|
| 1.0–6.0 | Hi, I am Pradeep Jindal from The Wedding Book, and I'm using FotoOwl for the last almost 4 to 5 years… |

Spelling to confirm: <names / studio / city as heard>

### Structure
- **Hook (cold open):** "<line>" (<from>–<to> s) · why: <one line>
- **Kept:** <ranges> · **Trims proposed:** <none | list with timestamps and reason> (only if speech is over ~45–60 s)
- **Runtime:** ≈ <hook + speech + 5.6 outro> s

### Captions: parallax layers
| Phrase | Big gold word | Gold / italic |
|---|---|---|
| and I'm using **[FotoOwl]** | FotoOwl | |
| 4 to 5 years | (card on screen) | gold italic |

### Pop-ups: one row per feature Shantanu gave (title · description · trigger · screenshot?)
| Trigger words (time) | Card type | Content | Screenshot |
|---|---|---|---|
| "…with the features" (8.4 s) | culling | AI Culling · Selecting your best shots… | mock-up |

### Framing
Opening reframe <yes/no> · push-ins at "<statement>" (<time>), "<statement>" (<time>)

### Sound
Music <file> @ −20 dB (accent lands on the logo) · SFX: whoosh at cut · click/ding per card · outro whoosh + shimmer

### Deliverables
master · light · cover (<moment>) · .srt · post caption → `output/<slug>/FotoOwl_Testimonial_<Name>_v1.*`

**Approve, or tell me what to change.**
