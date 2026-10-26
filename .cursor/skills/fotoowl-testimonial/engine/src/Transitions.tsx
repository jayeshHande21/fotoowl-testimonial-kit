import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Edit} from './types';
import {clampI} from './util';

/*
  Restrained HyperFrames ports (series-bible §2: no flashy cuts on every sentence).
  Photo-grid dissolve plays once, on the cold-open → main cut only.
*/

const COLS = 4;
const ROWS = 6;
const PHOTOS = ['bride', 'groom', 'couple1', 'couple2', 'decor', 'flowers', 'haldi', 'mehndi'] as const;

export const GridDissolve: React.FC<{at: number; dur?: number}> = ({at, dur = 1.05}) => {
  const {fps, width, height} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const u = (t - (at - dur * 0.32)) / dur;
  if (u < 0 || u > 1) return null;
  const cw = width / COLS;
  const ch = height / ROWS;
  const cells = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const dist = Math.hypot(x - (COLS - 1) / 2, y - (ROWS - 1) / 2);
      const delay = dist * 0.038;
      const local = interpolate(u, [delay, 0.92 + delay * 0.15], [0, 1], {...clampI, easing: Easing.linear});
      const o = interpolate(local, [0, 0.16, 0.74, 1], [0, 1, 1, 0], clampI);
      const s = interpolate(local, [0, 0.2], [0.84, 1], clampI);
      const src = PHOTOS[(x + y * 3) % PHOTOS.length];
      const posX = 20 + ((x * 17 + y * 11) % 60);
      const posY = 18 + ((y * 19 + x * 7) % 55);
      cells.push(
        <div
          key={`${x}-${y}`}
          style={{
            position: 'absolute',
            left: x * cw + 3,
            top: y * ch + 3,
            width: cw - 6,
            height: ch - 6,
            borderRadius: 12,
            overflow: 'hidden',
            opacity: o,
            transform: `scale(${s})`,
            boxShadow: `inset 0 0 0 1.5px rgba(244,186,68,${0.42 * o})`,
          }}
        >
          <Img
            src={staticFile(`photos/${src}.jpg`)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${posX}% ${posY}%`,
            }}
          />
        </div>,
      );
    }
  }
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{cells}</AbsoluteFill>;
};

export const HookCut: React.FC<{edit: Edit}> = ({edit}) => {
  const hook = edit.segments.find((s) => s.id === 'hook');
  if (!hook) return null;
  const {fps} = useVideoConfig();
  return <GridDissolve at={(hook.outStartF + hook.lenF) / fps} />;
};
