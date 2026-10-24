import React from 'react';
import {Easing, continueRender, delayRender, interpolate, staticFile} from 'remotion';

/* ── brand tokens (see references/series-bible.md) ── */
export const NAVY = '#2E3A50';
export const GOLD = '#F4BA44'; // logo gold — pop-ups, behind words, outro
export const CAPTION_GOLD = '#FDBF36'; // brief gold — pill caption highlights
export const MUTED = '#6B7385';
export const CREAM = '#F8F4EA';
export const INTER = 'Inter, system-ui, sans-serif';
export const SERIF = '"Instrument Serif", serif';

export const outE = Easing.bezier(0.22, 1, 0.36, 1);
export const inOutE = Easing.bezier(0.45, 0, 0.2, 1);
export const popE = Easing.bezier(0.34, 1.5, 0.64, 1);

export const clampI = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const rr = (t: number, a: number, b: number, e: (n: number) => number = outE) =>
  interpolate(t, [a, b], [0, 1], {...clampI, easing: e});

/** piecewise keyframes with easing */
export function kf(t: number, keys: [number, number][], ease: (n: number) => number = inOutE) {
  if (!keys.length) return 1;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) {
      if (t1 === t0) return v1;
      return v0 + (v1 - v0) * ease((t - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
}

export const fontCss =
  [500, 600, 700, 800]
    .map((w) => `@font-face{font-family:Inter;font-weight:${w};font-style:normal;src:url(${staticFile(`fonts/inter-latin-${w}-normal.woff2`)}) format('woff2');}`)
    .join('\n') +
  `\n@font-face{font-family:"Instrument Serif";font-weight:400;font-style:normal;src:url(${staticFile('fonts/instrument-serif-latin-400-normal.woff2')}) format('woff2');}` +
  `\n@font-face{font-family:"Instrument Serif";font-weight:400;font-style:italic;src:url(${staticFile('fonts/instrument-serif-latin-400-italic.woff2')}) format('woff2');}`;

/** Blocks the frame until every font is loaded; returns true once ready (so text can be measured). */
export const useFonts = () => {
  const [handle] = React.useState(() => delayRender('fonts'));
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    Promise.all([
      ...[500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Inter`)),
      document.fonts.load('400 40px "Instrument Serif"'),
      document.fonts.load('italic 400 40px "Instrument Serif"'),
    ])
      .catch(() => undefined)
      .then(() => {
        setReady(true);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};

/** width of `text` in em for a font (canvas measureText), cached */
const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;
export const emWidth = (text: string, family: string, italic = false) => {
  const key = `${family}|${italic}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * 0.45;
  ctx.font = `${italic ? 'italic ' : ''}400 100px ${family}`;
  const w = ctx.measureText(text).width / 100;
  cache.set(key, w);
  return w;
};
