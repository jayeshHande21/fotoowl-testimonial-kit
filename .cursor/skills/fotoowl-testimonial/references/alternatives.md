# Alternatives menu: when Shantanu doesn't like an element

**How to use it:** change **only that element**, offer **2–3 options from this menu** (with one line on how each differs), apply the choice in `choices.json`, re-run `plan.py`, preview with `qc.py --frames …` (stills take seconds) and **only then** re-render the full video. Never rebuild what he already approved.

If he describes something not on the menu, build it, then add it here as a new approved option once he's happy.

---

## Captions (`styles.captions`)

| Option | Looks like | When to suggest it |
|---|---|---|
| **`parallax`** (default) | big gold serif word behind the speaker + white serif words below | premium, cinematic |
| `pill` | Inter 700 in a navy pill (#2E3A50 80 %), key words gold (#FDBF36) | busy or dark backgrounds, maximum readability, or no clean cut-out |
| `karaoke` | Inter 800, no box; the spoken word turns gold | energetic or fast talkers |

**Tweaks inside parallax (no style change):**
- fewer or more big words: edit `behind`
- big word higher (less overlap): `top` 212 → 180
- lower: 212 → 240
- front words larger or smaller: `FRONT_BASE` in `engine/src/Captions.tsx`
- italics off: `italic: []`

## Pop-ups (`styles.cards`, per-card `type`)

| Option | Looks like | When |
|---|---|---|
| **`wide`** (default) | full-width white cards at the top, one at a time | most videos |
| `chip` | compact white pill: icon + title + one line | he finds the cards too big or busy, or the speaker's head sits high |
| `none` | no pop-ups | pure emotional testimonial |
| per card: `feature` | generic: icon + title + description (+ photos or screenshot) | a feature without its own design |
| per card: `screenshot` | real product screenshot in a clean frame | Shantanu supplies real UI |
| timing | move `from` / `to` to other trigger words, or drop a card | "too many", "too early" |

## Motion (HyperFrames ports)

Always on. Keep Linear / Apple restraint — these are the only extra motions.

| Option | Difference |
|---|---|
| **Grid dissolve on the hook cut** (default) | Wedding-photo tile dissolve, once, ~1.0 s |
| No dissolve | Hard cut + whoosh only (if the tiles feel busy) |
| **Photo carousel on cards** (default) | Culling / clients / feature photos drift slowly |
| Static tiles | The original still grid (if the drift feels busy) |

Do not add Grid Dissolve, warp, or flash transitions on every sentence.

## Hook (`hook`)

| Option | When |
|---|---|
| **strongest line as a cold open** (default) | always, unless it doesn't make sense out of context |
| a different line (loyalty, result, delight) | he prefers another line |
| no cold open (`hook: null`) | very short clips, or the first sentence is already strong |

## Framing (`pushIns`, `openingReframe`, plate `--mode`)

| Option | When |
|---|---|
| fewer or no push-ins | "too much movement" |
| stronger push (1.16–1.2) | sharp 4K vertical sources only |
| horizontal source: `crop-follow` ↔ `inset` | one person cropped tight vs. both people / the full scene |

## Voice denoise (`voice.py --denoise`)

Always run. Default is **10** (series rule from Nishche / Oct 2026).

| Option | Difference |
|---|---|
| **`--denoise 10`** (default) | Clears booth hum and room hiss; voice stays natural |
| `--denoise 8` | Lighter — use if the voice sounds thin or watery |
| `--denoise 12` | Stronger — use only if a hall is still noisy after 10 |

Picture stays; remake with `voice.py` → `mix.py` → `deliver.py` (no full re-render).

## Music (`music`)

| Option | When |
|---|---|
| **woven-memories.mp3 @ −20 dB** (default) | default |
| other track from `assets/music/` | he wants variety; list the files that exist |
| quieter (−24) / louder (−17) | "music too loud / can't hear it" |
| `music: null` | dialogue only |

## Outro (`styles.outro`): keep owl unless he asks

| Option | Length | Looks like |
|---|---|---|
| **`owl`** (default, approved) | 5.6 s | owl-eyes animation → logo → "Made for photographers." → FOTOOWL.AI |
| `navy` | 3.2 s | v1: navy card, gold bar, dark logo, tagline, fotoowl.ai |
| `logo` | 2.2 s | cream, official logo fades up, FOTOOWL.AI |

## Watermark

On by default (top-left, 210 px). It can move to top-right or be resized in `engine/src/Testimonial.tsx` (`Watermark`) if he asks, using the official logo unchanged.
