# Feature cards: intake and `choices.json` props

## Ask Shantanu for every video (one block per feature)

> For each feature you want shown in this video:
> 1. **Title + one-line description** (approved wording)
> 2. **Trigger**: which spoken words should bring it up
> 3. **Screenshots or mock-ups**, if you have them (attach or give a path)

If he gives no features: propose cards only where the customer names a feature or a concrete benefit, using the approved content from series-bible §4, and mark them "suggested" in the plan.

## Where images go

- Photos for cards → `work/<slug>/public/photos/<name>.jpg`, referenced as `"photos/<name>.jpg"`. Bare names like `"bride"` use the shipped set in `engine/static/photos/`: couple1, bride, decor, couple2, mehndi, haldi, groom, flowers.
- Screenshots → `work/<slug>/public/shots/<name>.png`, referenced as `"shots/<name>.png"`.
- A mock-up image Shantanu sends **as a design reference** (like the Clients select mock-up) is a **layout to match**, not an image to paste. Photos inside it may be cropped out for card tiles (the shipped photo set came from his mock-up). If a tile carries a tick mark, cover it exactly with the card's own badge, which sits in the same top-right corner.

## Card types and props (all optional; the defaults are the approved episode-1 content)

```jsonc
{"type": "stat", "from": 5.95, "to": 8.3,
 "props": {"eyebrow": "Using FotoOwl for", "value": "almost 4–5 years", "icon": true}}

{"type": "culling", "from": 8.42, "to": 10.0,
 "props": {"title": "AI Culling", "subtitle": "Selecting your best shots", "photos": ["bride", "groom", "mehndi"], "countPhoto": "flowers", "count": 472}}

{"type": "studioManager", "from": 10.0, "to": 11.45,
 "props": {"title": "Studio Manager", "subtitle": "Your leads, all in one place", "icon": "users",
           "rows": [{"icon": "chat", "title": "New WhatsApp Lead", "sub": "Wedding Photography Enquiry"},
                    {"icon": "insta", "title": "New Instagram Lead", "sub": "Wedding Shoot Enquiry"}]}}

{"type": "clients", "from": 11.55, "to": 14.3,
 "props": {"title": "Clients select", "subtitle": "They mark album photos. The list comes back to you.",
           "photos": [{"src": "couple1", "selected": true}, {"src": "bride", "selected": true}, {"src": "decor", "selected": false},
                      {"src": "couple2", "selected": true}, {"src": "groom", "selected": true}],
           "countText": "12 photos", "footer": "selected by client", "status": "Received", "showLogo": true}}

{"type": "upgrades", "from": 21.95, "to": 24.3,
 "props": {"title": "New Upgrades", "badge": "NEW",
           "rows": [{"icon": "sparkle", "label": "AI Studio"}, {"icon": "users", "label": "Studio Manager"}, {"icon": "film", "label": "Reelit"}]}}

{"type": "feature", "from": 0, "to": 0,
 "props": {"icon": "face", "title": "Face search delivery", "description": "Guests find their photos with a selfie.",
           "badge": "AI", "photos": ["couple1", "bride", "groom"], "image": "", "showLogo": false}}

{"type": "screenshot", "from": 0, "to": 0,
 "props": {"title": "Forever Gallery", "image": "shots/forever-gallery.png", "caption": "Your client's memories, forever", "maxH": 360}}
```

**Icons:** users, chat, insta, film, sparkle, squareCheck, undo, circleCheck, arrow, check, image, search, camera, tv, heart, face, share, zap.

## Timing rules
- `from` = just before the trigger word (about 0.1–0.3 s), `to` = when the thought ends (usually 1.3–3 s later). Times are **source seconds**.
- Cards may hand over back to back (`to` of one = `from` of the next). The planner prevents overlaps.
- Don't start a card exactly on an important word. The ding sound plays at `from`.
- While a card is visible, there is no big gold word (it's dropped automatically; use gold front words instead).
