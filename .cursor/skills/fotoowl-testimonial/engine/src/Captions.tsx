import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Block, Word} from './types';
import {CAPTION_GOLD, GOLD, INTER, SERIF, clampI, emWidth, outE} from './util';

/*
  Caption styles (series-bible.md → Captions)
  - parallax (default): port of HyperFrames "caption-parallax-layers", 9:16, FotoOwl gold.
      BehindLayer = big gold word, drawn BETWEEN the plate and the person cut-out.
      FrontLayer  = remaining words, white serif, each word appears as spoken.
  - pill:    v1 style — Inter 700 in a navy pill, key words gold.
  - karaoke: Inter 800, no pill, every word white and the spoken word turns gold.
*/

/* ── parallax constants ── */
const BEHIND_WIDTH = 980;
const BEHIND_BASE = 170;
const BEHIND_SCALE_Y = 2.5;
const FRONT_WIDTH = 940;
const FRONT_BASE = 92;
export const FRONT_Y = 1418;
const ENTRY_DUR = 0.1;

const strip = (s: string) => s.replace(/[.,!?]$/, '');

export const behindActive = (blocks: Block[], t: number) =>
  blocks.some((b) => b.behind !== null && t >= b.words[b.behind].s - 0.05 && t <= b.end + 0.02);

export const BehindLayer: React.FC<{blocks: Block[]; t: number}> = ({blocks, t}) => (
  <>
    {blocks.map((b, i) => {
      if (b.behind === null) return null;
      const w = b.words[b.behind];
      if (t < w.s - 0.05 || t > b.end + 0.02) return null;
      const life = b.end - w.s;
      const inP = interpolate(t, [w.s, w.s + ENTRY_DUR], [0, 1], {...clampI, easing: Easing.out(Easing.quad)});
      const outP = interpolate(t, [b.end - 0.12, b.end], [0, 1], clampI);
      const drift = interpolate(t, [w.s, w.s + Math.max(life, 0.6)], [16, -16], clampI); // slower than the speaker → parallax
      const grow = interpolate(t, [w.s, w.s + 0.35], [1.035, 1], {...clampI, easing: Easing.out(Easing.cubic)});
      const text = strip(w.t);
      const em = emWidth(text, SERIF);
      const fit = Math.min(BEHIND_BASE, (BEHIND_WIDTH / (em * BEHIND_BASE)) * BEHIND_BASE); // shrink only if too wide
      const sx = BEHIND_WIDTH / (em * fit);
      return (
        <div
          key={i}
          style={{
            position: 'absolute', left: 0, right: 0, top: b.top, display: 'flex', justifyContent: 'center',
            opacity: inP * (1 - outP), transform: `translateY(${drift}px) scale(${grow})`, transformOrigin: '50% 30%',
          }}
        >
          <div
            style={{
              fontFamily: SERIF, fontWeight: 400, fontSize: fit, lineHeight: 0.9, color: GOLD,
              WebkitTextStroke: `5px ${GOLD}`,
              textShadow: '2px 4px 4px #A9761A, 0 14px 40px rgba(20,28,44,0.30)',
              whiteSpace: 'nowrap', transform: `scaleX(${sx}) scaleY(${BEHIND_SCALE_Y})`, transformOrigin: '50% 0%',
            }}
          >
            {text}
          </div>
        </div>
      );
    })}
  </>
);

export const FrontLayer: React.FC<{blocks: Block[]; t: number}> = ({blocks, t}) => (
  <>
    {blocks.map((b, i) => {
      const front = b.words.map((w, k) => ({w, k})).filter(({k}) => k !== b.behind);
      if (!front.length || t < b.start || t > b.end) return null;
      const outP = interpolate(t, [b.end - 0.1, b.end], [0, 1], clampI);
      const isItalic = (k: number, w: Word) => b.italic.includes(k) || (b.behind === null && !!w.hl);
      const natEm = front.reduce((a, {w, k}) => a + emWidth(w.t, SERIF, isItalic(k, w)), 0) + 0.17 * (front.length - 1);
      const size = Math.max(FRONT_BASE * 0.45, Math.min(FRONT_BASE, FRONT_WIDTH / natEm));
      const drift = interpolate(t, [b.start, b.end], [6, -4], clampI);
      return (
        <div
          key={i}
          style={{
            position: 'absolute', left: 0, right: 0, top: FRONT_Y, display: 'flex', justifyContent: 'center',
            alignItems: 'baseline', gap: size * 0.17, transform: `translateY(calc(-50% + ${drift}px))`,
            opacity: 1 - outP, whiteSpace: 'nowrap',
          }}
        >
          {front.map(({w, k}) => {
            const p = interpolate(t, [w.s - 0.03, w.s + 0.09], [0, 1], {...clampI, easing: Easing.out(Easing.quad)});
            const gold = b.behind === null && !!w.hl;
            return (
              <span
                key={k}
                style={{
                  display: 'inline-block', fontFamily: SERIF, fontStyle: isItalic(k, w) ? 'italic' : 'normal',
                  fontWeight: 400, fontSize: size, lineHeight: 1.1, color: gold ? GOLD : '#F2F2F2',
                  textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.35)',
                  opacity: p, transform: `translateY(${(1 - p) * 10}px)`,
                }}
              >
                {w.t}
              </span>
            );
          })}
        </div>
      );
    })}
  </>
);

/* ── pill (v1) ── */
const PILL_Y = 1432;
export const PillCaptions: React.FC<{blocks: Block[]; t: number}> = ({blocks, t}) => (
  <>
    {blocks.map((b, i) => {
      if (t < b.start || t > b.end) return null;
      const size = b.words.length > 5 ? 48 : 52;
      const inP = interpolate(t, [b.start, b.start + 0.26], [0, 1], {...clampI, easing: outE});
      const outP = interpolate(t, [b.end - 0.14, b.end], [0, 1], clampI);
      return (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: PILL_Y, display: 'flex', justifyContent: 'center', transform: `translateY(calc(-50% + ${(1 - inP) * 16 - outP * 6}px))`, opacity: inP * (1 - outP)}}>
          <div style={{background: 'rgba(46,58,80,0.80)', borderRadius: 24, padding: `${size * 0.26}px ${size * 0.52}px ${size * 0.3}px ${size * 0.78}px`, boxShadow: '0 10px 30px rgba(14,20,32,0.28)', fontFamily: INTER, fontWeight: 700, fontSize: size, lineHeight: 1.18, letterSpacing: '-0.015em', textAlign: 'center', maxWidth: 940, border: '1px solid rgba(255,255,255,0.08)'}}>
            {b.words.map((w, k) => {
              const p = w.hl ? interpolate(t, [w.s - 0.02, w.s + 0.22], [0, 1], {...clampI, easing: outE}) : 1;
              return (
                <span key={k} style={{display: 'inline-block', color: w.hl ? CAPTION_GOLD : '#fff', transform: w.hl ? `translateY(${(1 - p) * 3}px) scale(${0.965 + 0.035 * p})` : undefined, marginRight: '0.26em'}}>
                  {w.t}
                </span>
              );
            })}
          </div>
        </div>
      );
    })}
  </>
);

/* ── karaoke: spoken word turns gold ── */
export const KaraokeCaptions: React.FC<{blocks: Block[]; t: number}> = ({blocks, t}) => (
  <>
    {blocks.map((b, i) => {
      if (t < b.start || t > b.end) return null;
      const inP = interpolate(t, [b.start, b.start + 0.18], [0, 1], {...clampI, easing: outE});
      return (
        <div key={i} style={{position: 'absolute', left: 60, right: 60, top: PILL_Y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', transform: `translateY(calc(-50% + ${(1 - inP) * 12}px))`, opacity: inP}}>
          {b.words.map((w, k) => {
            const next = b.words[k + 1]?.s ?? b.end;
            const on = t >= w.s && t < next;
            return (
              <span key={k} style={{fontFamily: INTER, fontWeight: 800, fontSize: 64, letterSpacing: '-0.02em', marginRight: '0.24em', color: on ? CAPTION_GOLD : '#fff', transform: on ? 'scale(1.06)' : undefined, display: 'inline-block', textShadow: '0 3px 14px rgba(0,0,0,0.55)'}}>
                {w.t}
              </span>
            );
          })}
        </div>
      );
    })}
  </>
);
