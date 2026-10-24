# FotoOwl Testimonial Series: Series Bible (master prompt)

This is the single source of truth for every testimonial in the series. Every value here was approved on the first episode (Pradeep Jindal, The Wedding Book, Oct 2026). Change a rule here, not in the code: the engine reads its numbers from these decisions.

---

## 0. The test every video must pass

> "This is a genuine customer sharing a real experience, presented by a polished and trustworthy brand."

The edit should feel premium, human and engaging, not overproduced. **The customer is the hero.** Linear, Stripe and Apple product films are the reference for restraint.

### Non-negotiables
1. **Never invent anything.** No dialogue, claims, statistics, features or customer details beyond what is said on camera or supplied by Shantanu for this video.
2. **Captions are verbatim.** They keep the speaker's words, grammar included ("all the features what I want"). Allowed fixes: brand and name spelling (he says "Photo-all" → **FotoOwl**), numerals (four → 4), and punctuation.
3. **Language: always English letters, never translated.** Hindi or Marathi is written as spoken, in Roman script (Hinglish), e.g. *"Bahut accha experience raha, FotoOwl best hai"*. Never translate it into English.
4. **The logo is never altered, redrawn or recreated.** Use the official files in `assets/brand-originals/` and `engine/static/brand/` unchanged. (In the outro animation the eyes are plain circles at the logo's measured geometry and the brows and beak are cut from the official PNG. The official logo file then takes over, so the final lockup is always the real logo.)
5. **No fake product UI.** Use Shantanu's real screenshots or mock-ups when supplied. Otherwise use the approved card designs (§4), which are clean interface representations, not fake screens.
6. **Show the edit plan before rendering** (each render costs about 15–20 min on an M5). Nothing is rendered until Shantanu approves.
7. **Name card only if spoken.** If the customer says his name or studio, show the lower-third and confirm the spelling in the plan. Otherwise there is no name card. Don't ask intake questions.

---

## 1. Format

| | |
|---|---|
| Aspect | **always vertical 9:16**, 1080 × 1920 |
| Frame rate | 30 fps |
| Codec | H.264 MP4, yuv420p, CRF 16 master + ~9 Mbps light version |
| Audio | AAC 256k, 48 kHz stereo, **−14 LUFS integrated, ≤ −1.5 dBTP** |
| Runtime | cold open (~2.5 s) + testimonial + 5.6 s outro. Aim for 30–60 s in total |

### Source footage
| Source | Plate mode (`plate.py --mode`) |
|---|---|
| Vertical phone video | `vertical`: scaled to 1620×2880 for 4K sources (1080×1920 otherwise) |
| Horizontal, one speaker | `crop-follow`: 9:16 window that follows the face |
| Horizontal, two people | `inset`: full frame centred with a soft blurred fill above and below. Stack or crop only if Shantanu asks |

The plate is **stabilised** (vid.stab, smoothing 24) and **lightly graded**: a touch warmer, contrast 1.05, saturation 1.05, gentle S-curve, soft vignette. Keep natural skin. No beauty filters, no heavy sharpening.

---

## 2. Script format (structure)

1. **Cold open / hook (≈ 2–3 s):** the customer's single strongest line, replayed at the start, framed tighter (zoom 1.36 → 1.41). It must make sense on its own and must not change the meaning. Best candidates: surprise or delight ("they almost surprise me every day"), loyalty ("I will definitely continue with this brand only"), a concrete result.
2. **Quiet whoosh, then cut to the start** at a wider framing (the size change makes the cut intentional).
3. **The testimonial in order:** intro (name and studio if said) → experience → features and benefits → loyalty and recommendation → thanks.
4. **Outro:** owl-eyes animation → official logo → "Made for photographers." → FOTOOWL.AI.

### Length and trimming
- **Up to ~45 s of speech:** keep everything, word for word. Drop only dead air before the first word and after the last.
- **Over ~45–60 s:** propose trimming the weakest sentences (repetition, false starts, off-topic). List each cut with its timestamp in the edit plan for approval. Never cut mid-sentence, never join half-sentences, and never reorder sentences in a way that changes meaning. Alternate framing (1.0× / 1.08×) across each cut so it reads as intentional.
- Small stumbles stay unless a cut is seamless and Shantanu approves it.

### Framing and motion
- Face tracked (YuNet) and kept near **(0.5, 0.42)** of the frame, never revealing a frame edge.
- **Opening reframe:** if the speaker starts off-centre or low, hold 1.16× until he settles, then ease to 1.0×.
- **Push-ins:** at most two or three, on the strongest statements. Ease to 1.12–1.14× over 0.6 s, hold for the statement, ease back (or settle at 1.07× near the end).
- No shaky "influencer" zooms, no zoom on every sentence, no flashy transitions.

---

## 3. Captions: parallax layers (default)

Port of HyperFrames `caption-parallax-layers`, adapted to 9:16 and FotoOwl gold.

**Big gold word behind the speaker**
- One key word per phrase at most, roughly 5–7 per 30 s. Candidates: the brand (FotoOwl), the loyalty word (definitely), the emotion (surprise, happy), the product, a number.
- Instrument Serif 400, **#F4BA44** fill and 5 px stroke, shadow `2px 4px 4px #A9761A, 0 14px 40px rgba(20,28,44,.30)`.
- Stretched **scaleY 2.5**, scaleX fills **980 px**. Base size 170 px, shrinking only if needed.
- **Top edge at y 212** (205 in the cold open). The person cut-out is drawn on top, so **only the lower edge of the letters passes behind the head**. The word must stay readable.
- Motion: 0.1 s fade-in, settles from 1.035× scale, drifts 16 px upward over its life (slower than the speaker, which creates the parallax), 0.12 s fade-out.
- **Never while a pop-up card or the name card is on screen.** The planner drops it automatically and moves the emphasis to gold front words.

**Front words**
- The rest of the phrase in Instrument Serif 400, **#F2F2F2**, shadow `0 2px 12px rgba(0,0,0,.6), 0 4px 24px rgba(0,0,0,.35)`.
- Centred at **y 1418**, auto-fit to 940 px (92 px base).
- Each word appears **as it is spoken** (0.1 s fade with a 10 px rise). Phrases exit with a 0.1 s fade.
- **Italic** on a closing word (only., day., you.).
- In phrases with no big word, highlighted words (e.g. "4 to 5 years", "new upgrades") turn **gold italic**.
- **Bottom shade:** a soft dark gradient (58 % → 100 % of the height) keeps white words readable on light clothing. It fades out at the outro.

**Phrase grouping:** 2–5 words, break at sentence ends and pauses, keep names together, never end a phrase on a function word (from, the, and…). `plan.py --draft` proposes the groups; refine them in the plan.

**Placement rules:** captions never cover the mouth or the mic head. They stay above the bottom ~20 % (Reels and Shorts interface).

Alternatives are in `alternatives.md`: navy pill (v1), karaoke and minimal.

---

## 4. Pop-ups (feature cards)

**For every video, ask Shantanu for each feature to show:**
1. an approved **title + one-line description**
2. the **trigger**: the spoken words that should bring it up
3. **real screenshots or mock-ups**, if any

Map each card to its trigger words in the transcript. **At most one card on screen at a time**, about 1.3–3 s each. A card may hand straight over to the next (swap). Every card must reinforce something actually said.

**Design language:** white, radius 34, shadow `0 22px 50px rgba(20,28,44,.22)`, navy **#2E3A50** text, gold **#F4BA44** accents, Inter 500–800. Placed in the **top band** (left 56, top 148, wide cards 968 px), always clear of the head. Enter with a 0.42 s fade and slide from the left; exit 0.28 s.

| Type (`cards[].type`) | Use for | Approved content (episode 1) |
|---|---|---|
| `stat` | a number he says ("4–5 years") | eyebrow "Using FotoOwl for" · value "almost 4–5 years" · official icon |
| `culling` | AI Culling, "features" | "AI Culling" · "Selecting your best shots…" · progress bar · 3 photos + "+472" counter |
| `studioManager` | Studio Manager, leads/CRM, "upgrades" | "Studio Manager" · "Your leads, all in one place" · New WhatsApp Lead / New Instagram Lead rows · green check |
| `clients` | clients, client gallery, album selection | "Clients select" · "They mark album photos. The list comes back to you." · 5 photos with gold ticks · "12 photos selected by client · Received" · official logo |
| `upgrades` | "new things", updates | "New Upgrades" + NEW pill · AI Studio / Studio Manager / Reelit rows |
| `feature` | any other feature (generic) | icon + title + one line (+ badge, photos, screenshot or logo) |
| `screenshot` | a real product screenshot | framed screenshot + optional title and caption |

Example numbers on cards (+472, 12 photos) are allowed as obvious illustrations.

---

## 5. Brand watermark

The official `logo_full.png`, **unaltered, 210 px wide at top-left (x 48, y 66)**. Visible from the first frame (0.27 s fade-in) until the outro starts, then hidden, because the outro ends on the logo. Note that Instagram's "Reels" label sits in roughly the same corner.

---

## 6. Outro: owl eyes (keep exactly as is)

5.6 s on cream **#F8F4EA** with a soft gold glow. It starts 10 frames before the speech ends: a 0.4 s fade from the video.

| t (s) | Beat |
|---|---|
| 0.40–1.00 | eye rings draw from 12 o'clock (left navy, counter-clockwise; right gold, clockwise) |
| 0.86–1.30 | irises and pupils grow, highlights pop |
| 1.18–1.56 | brows drop in, beak pops |
| 1.60–2.56 | eyes glance left and right; blink 1.84–2.04 (eyelids close top → bottom in each ring's colour) |
| 2.60–3.30 | eyes shrink onto the logo's eye positions; the **official logo_full.png** resolves from blur on top |
| 3.35–3.90 | logo lifts |
| 3.72–4.32 | "Made for" (Inter 500, 92 px) / "**photographers.**" (Inter 800, 104 px), navy |
| 4.20–4.75 | FOTOOWL.AI in spaced small caps between gold rules; hold |

A standalone copy (`FotoOwl_Outro_OwlEyes_9x16.mp4`) can be rendered with `node engine/render.mjs --work <dir> outro`.

---

## 7. Sound

- **Voice** (`voice.py`): high-pass 80 Hz → light FFT denoise (nr 6; up to 8–12 only in very noisy halls) → −2 dB @ 200 Hz → +2.5 dB @ 3.4 kHz → +1.5 dB shelf @ 9 kHz → 3:1 compression → gentle levelling → −15 LUFS. Natural, never robotic.
- **Music:** from `assets/music/`, default `woven-memories.mp3`. Other tracks Shantanu adds there can be picked per video. Level **~20 dB under the voice** (`db: −20`), lifting +9 dB across the outro. The planner chooses the start offset so **a soft accent near the end of the track lands on the logo reveal** and the track ends naturally with the video. 0.9 s fade-in, 1.25 s fade-out.
- **SFX** (quiet, each tied to something on screen, never on an important word):
  - whoosh −17 dB under the cold-open cut
  - click −16 dB for a stat card and −17 dB for a card swap
  - soft ding −19 dB for other cards
  - whoosh −24 dB as the outro rings draw
  - shimmer −13 dB on the logo reveal

---

## 8. Deliverables (`output/<slug>/`)

`FotoOwl_Testimonial_<Name>_v<N>`:
- `.mp4`: the master
- `_light.mp4`: ~9 Mbps, for WhatsApp and LinkedIn
- `_cover.jpg`: thumbnail, by default a frame with the first big gold word
- `.srt`: subtitles, original words
- `_post.md`: ready-to-paste post caption (hook quote · 1–2 lines on who and what he said · CTA fotoowl.ai · 5–8 hashtags; no new claims)

The version number increments automatically.

---

## 9. Quality check (before delivery)

Look at `qc.py`'s contact sheet and edge close-ups, plus the final file:
- [ ] captions match the audio word for word, spelling correct (FotoOwl, names), English letters
- [ ] captions and cards clear of the mouth, mic and head; nothing in the bottom ~20 % except front captions
- [ ] big gold words readable; only their lower edge is behind the head; cut-out edges clean (no halo)
- [ ] at most one pop-up at a time; each matches what is being said
- [ ] watermark visible until the outro; outro plays fully; logo unaltered
- [ ] −14 LUFS ±0.5, peak ≤ −1.5 dBTP; music clearly under the voice; SFX quiet and not on important words
- [ ] 1080×1920, 30 fps, frame count = edit.json `totalF`

---

## 10. Licensing note

The engine uses **Remotion**, which is free for companies of **up to 3 people** (FotoOwl currently has 2). If FotoOwl grows to 4 or more, it needs a Remotion Company License ([remotion.dev/docs/license](https://www.remotion.dev/docs/license/faq)), or the engine can be ported to HyperFrames (Apache-2.0).
