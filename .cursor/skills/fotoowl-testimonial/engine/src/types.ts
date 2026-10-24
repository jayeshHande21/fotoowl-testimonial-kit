/*
  edit.json — the single per-video spec the engine renders from.
  Written by scripts/plan.py from the approved edit plan. All times are OUTPUT seconds
  unless the field name says otherwise (…F = frames, src… = source plate frames).
*/

export type XY = {x: number; y: number};

/** One continuous piece of the plate placed on the output timeline (cold open, main, trimmed parts). */
export type Segment = {
  id: string;
  srcStartF: number; // first plate frame used
  lenF: number; // how many frames
  outStartF: number; // where it starts on the output timeline
  zoom: [number, number][]; // [output seconds, zoom] keyframes (1 = full frame)
  zoomEase?: 'linear' | 'inOut';
};

export type Word = {t: string; s: number; hl?: boolean};

/** A caption phrase. `behind` = index into words of the big gold word (parallax style), or null. */
export type Block = {
  start: number;
  end: number;
  words: Word[];
  behind: number | null;
  italic: number[];
  top: number; // y of the behind word's top edge (px)
};

export type CardType = 'stat' | 'culling' | 'studioManager' | 'clients' | 'upgrades' | 'feature' | 'screenshot';

export type Card = {
  type: CardType;
  tIn: number;
  tOut: number;
  props: Record<string, any>;
};

export type Edit = {
  fps: number;
  width: number;
  height: number;
  plate: string; // file in public/
  plateFrames: number;
  person: boolean; // person cut-out frames exist in public/fg/
  face: XY[]; // per plate frame, normalised, smoothed
  faceTarget: XY;
  segments: Segment[];
  captions: {style: 'parallax' | 'pill' | 'karaoke'; blocks: Block[]};
  lowerThird: null | {name: string; studio?: string; tIn: number; tOut: number};
  cards: Card[];
  cardStyle: 'wide' | 'chip' | 'none';
  watermark: boolean;
  bottomShade: boolean;
  outro: {style: 'owl' | 'navy' | 'logo'; startF: number; lenF: number};
  totalF: number;
};
