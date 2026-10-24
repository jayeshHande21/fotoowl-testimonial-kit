import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';

/*
  Owl-eyes outro, modelled on the TV Gallery reference.
  Geometry is in logo_full.png pixel units (2602 × 666), measured from the official file,
  so the animated eyes land exactly on the logo's eyes before the official PNG takes over.
  Brows + beak are cut straight from logo_full.png (not redrawn).
*/

const NAVY = '#2E3A50';
const GOLD = '#F4BA44'; // exact logo gold
const PUPIL = '#1C2028';
const CREAM = '#F8F4EA';
const FONT = 'Inter, system-ui, sans-serif';
const FPS = 30;

const LW = 2602;
const LH = 666;
const L = {x: 1204, y: 348};
const R = {x: 1615, y: 349};
const EYE_MID = {x: (L.x + R.x) / 2, y: 348.5};

const S_BIG = 0.78;
const S_FIN = 520 / LW;
const BIG_MID = {x: 540, y: 860};
const CENTER_LOGO_Y = 930; // logo vertical centre while it resolves
const FINAL_TOP = 690; // logo canvas top after it lifts

const outE = Easing.bezier(0.22, 1, 0.36, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const r = (t: number, a: number, b: number, e = outE) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

export const OwlOutro: React.FC<{standalone?: boolean}> = ({standalone}) => {
  const t = useCurrentFrame() / FPS;

  // ── timings (s from outro start) ──
  const bg = standalone ? 1 : r(t, 0, 0.4, Easing.inOut(Easing.quad));
  const ring = r(t, 0.38, 1.0, Easing.bezier(0.5, 0, 0.25, 1));
  const iris = r(t, 0.86, 1.18);
  const pupil = r(t, 0.98, 1.26);
  const shine = r(t, 1.14, 1.3);
  const brows = r(t, 1.18, 1.48);
  const beak = r(t, 1.32, 1.56, Easing.bezier(0.34, 1.4, 0.64, 1));

  // eyes look around + blink
  const look =
    -16 * r(t, 1.6, 1.8, inOut) + 32 * r(t, 2.08, 2.28, inOut) - 16 * r(t, 2.42, 2.56, inOut);
  const lookY = 6 * r(t, 1.6, 1.8, inOut) - 6 * r(t, 2.42, 2.56, inOut);
  // eyelid: closes top→bottom, reopens (0 = open, 1 = shut)
  const lid = t < 1.84 ? 0 : t < 1.92 ? Easing.in(Easing.quad)((t - 1.84) / 0.08) : t < 2.04 ? 1 - Easing.out(Easing.quad)((t - 1.92) / 0.12) : 0;
  const blink = 1;

  // shrink into the wordmark
  const shrink = r(t, 2.6, 3.05, inOut);
  const S = Math.exp(Math.log(S_BIG) + (Math.log(S_FIN) - Math.log(S_BIG)) * shrink);
  const centerTop = CENTER_LOGO_Y - (LH / 2) * S_FIN;
  const finMid = {x: 540 - (LW / 2) * S_FIN + EYE_MID.x * S_FIN, y: centerTop + EYE_MID.y * S_FIN};
  const lift = r(t, 3.35, 3.9, inOut);
  const midX = BIG_MID.x + (finMid.x - BIG_MID.x) * shrink;
  const midY = BIG_MID.y + (finMid.y - BIG_MID.y) * shrink + (FINAL_TOP - centerTop) * lift;
  const left = midX - EYE_MID.x * S;
  const top = midY - EYE_MID.y * S;

  const logoIn = r(t, 2.9, 3.25);
  const rigOut = r(t, 3.12, 3.3, Easing.linear);
  const glow = r(t, 0.4, 1.2) * (1 - 0.6 * shrink);
  const tag1 = r(t, 3.72, 4.2);
  const tag2 = r(t, 3.84, 4.32);
  const rule = r(t, 4.2, 4.7);
  const url = r(t, 4.3, 4.75);

  const C1 = 2 * Math.PI * 160.5;
  const C2 = 2 * Math.PI * 157.5;

  return (
    <AbsoluteFill style={{opacity: bg}}>
      <AbsoluteFill style={{background: CREAM}} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 520px at ${midX}px ${midY}px, rgba(253,191,54,${0.16 * glow}) 0%, rgba(253,191,54,0) 70%)`,
        }}
      />

      {/* animated eye rig */}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: LW,
          height: LH,
          transform: `scale(${S})`,
          transformOrigin: '0 0',
          opacity: 1 - rigOut,
        }}
      >
        <svg width={LW} height={LH} viewBox={`0 0 ${LW} ${LH}`} style={{position: 'absolute', overflow: 'visible'}}>
          {/* right eye: gold underlay so the iris can move */}
          <circle cx={R.x} cy={R.y} r={128 * iris} fill={GOLD} />
          <g transform={`translate(${R.x + look} ${R.y + lookY}) scale(1 ${blink})`}>
            <circle r={120 * iris} fill={NAVY} />
            <circle cx={36} cy={-62} r={19 * shine} fill="#fff" />
          </g>
          {/* left eye */}
          <g transform={`translate(${L.x} ${L.y}) scale(1 ${blink})`}>
            <circle r={121 * iris} fill={GOLD} />
            <g transform={`translate(${look * 1.2} ${lookY})`}>
              <circle cx={-2} cy={0} r={39 * pupil} fill={PUPIL} />
              <circle cx={36} cy={-56} r={18 * shine} fill="#fff" />
            </g>
          </g>
          {/* eyelids in each ring's colour */}
          <defs>
            <clipPath id="lidL"><rect x={L.x - 130} y={L.y - 130} width={260} height={262 * lid} /></clipPath>
            <clipPath id="lidR"><rect x={R.x - 130} y={R.y - 130} width={260} height={262 * lid} /></clipPath>
          </defs>
          {lid > 0 && <circle cx={L.x} cy={L.y} r={124} fill={NAVY} clipPath="url(#lidL)" />}
          {lid > 0 && <circle cx={R.x} cy={R.y} r={130} fill={GOLD} clipPath="url(#lidR)" />}
          {/* rings drawn from 12 o'clock: left counter-clockwise, right clockwise */}
          <g transform={`translate(${L.x} ${L.y}) scale(-1 1) rotate(-90)`}>
            <circle r={160.5} fill="none" stroke={NAVY} strokeWidth={81} strokeDasharray={C1} strokeDashoffset={C1 * (1 - ring)} />
          </g>
          <g transform={`translate(${R.x} ${R.y}) rotate(-90)`}>
            <circle r={157.5} fill="none" stroke={GOLD} strokeWidth={75} strokeDasharray={C2} strokeDashoffset={C2 * (1 - ring)} />
          </g>
        </svg>
        {/* brows + beak: pixels from the official logo */}
        <Img
          src={staticFile('brand/brow_l.png')}
          style={{position: 'absolute', left: 1140, top: 61, opacity: brows, transform: `translate(${(1 - brows) * 18}px, ${(1 - brows) * -26}px) rotate(${(1 - brows) * -8}deg)`}}
        />
        <Img
          src={staticFile('brand/brow_r.png')}
          style={{position: 'absolute', left: 1522, top: 61, opacity: brows, transform: `translate(${(1 - brows) * -18}px, ${(1 - brows) * -26}px) rotate(${(1 - brows) * 8}deg)`}}
        />
        <Img
          src={staticFile('brand/beak.png')}
          style={{position: 'absolute', left: 1352, top: 498, opacity: Math.min(1, beak * 1.4), transform: `scale(${beak})`, transformOrigin: '50% 20%'}}
        />
      </div>

      {/* official logo, unaltered, sitting exactly on the rig */}
      <Img
        src={staticFile('brand/logo-full.png')}
        style={{
          position: 'absolute',
          left,
          top,
          width: LW,
          height: LH,
          transform: `scale(${S})`,
          transformOrigin: '0 0',
          opacity: logoIn,
          filter: `blur(${(1 - logoIn) * 14}px)`,
        }}
      />

      {/* tagline */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 862, textAlign: 'center', fontFamily: FONT, color: NAVY}}>
        <div style={{fontSize: 92, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.04, opacity: tag1, transform: `translateY(${(1 - tag1) * 22}px)`, filter: `blur(${(1 - tag1) * 6}px)`}}>
          Made for
        </div>
        <div style={{fontSize: 104, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.04, opacity: tag2, transform: `translateY(${(1 - tag2) * 22}px)`, filter: `blur(${(1 - tag2) * 6}px)`}}>
          photographers.
        </div>
      </div>

      {/* small line, like the reference's INSTALL · SCAN · RELIVE */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34}}>
        <div style={{height: 3, width: 120 * rule, background: GOLD, borderRadius: 2}} />
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 30, letterSpacing: '0.42em', marginRight: '-0.42em', color: '#6B6F78', opacity: url}}>
          FOTOOWL.AI
        </div>
        <div style={{height: 3, width: 120 * rule, background: GOLD, borderRadius: 2}} />
      </div>
    </AbsoluteFill>
  );
};
