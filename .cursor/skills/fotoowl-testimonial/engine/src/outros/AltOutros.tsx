import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CREAM, GOLD, INTER, NAVY, kf, outE, rr} from '../util';

/* Alternative outros (series-bible.md → Outro). Default is OwlOutro. */

/** v1: navy card — gold dot → bar, dark logo resolves from blur, tagline + url. ~3.2 s */
export const NavyOutro: React.FC = () => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const bg = rr(t, 0, 0.32, Easing.inOut(Easing.quad));
  const dot = rr(t, 0.3, 0.55);
  const barW = kf(t, [[0.45, 0], [0.85, 132], [1.35, 132], [1.75, 64]], outE);
  const logo = rr(t, 0.62, 1.32);
  const glow = rr(t, 0.75, 1.8);
  const line = rr(t, 1.3, 1.8);
  const cta = rr(t, 1.65, 2.15);
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <AbsoluteFill style={{background: NAVY}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 62% 30% at 50% 47%, rgba(253,191,54,${0.13 * glow}) 0%, rgba(253,191,54,0) 70%)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <Img src={staticFile('brand/logo-dark.png')} style={{width: 640, height: 'auto', opacity: logo, filter: `blur(${(1 - logo) * 10}px)`, transform: `translateY(${(1 - logo) * 14}px) scale(${0.965 + 0.035 * logo})`}} />
        <div style={{marginTop: 26, height: 5, width: barW, borderRadius: 3, background: GOLD, opacity: dot, boxShadow: `0 0 ${18 * glow}px rgba(253,191,54,${0.55 * glow})`}} />
        <div style={{marginTop: 40, fontFamily: INTER, fontWeight: 600, fontSize: 46, letterSpacing: '-0.015em', color: '#fff', opacity: line * 0.94, transform: `translateY(${(1 - line) * 14}px)`}}>Made for photographers.</div>
        <div style={{marginTop: 22, fontFamily: INTER, fontWeight: 600, fontSize: 34, letterSpacing: '0.05em', color: GOLD, opacity: cta, transform: `translateY(${(1 - cta) * 10}px)`}}>fotoowl.ai</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** short: cream, official logo fades up, url. ~2 s */
export const LogoOutro: React.FC = () => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const bg = rr(t, 0, 0.3, Easing.inOut(Easing.quad));
  const logo = rr(t, 0.25, 0.85);
  const url = rr(t, 0.7, 1.15);
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <AbsoluteFill style={{background: CREAM}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
        <Img src={staticFile('brand/logo-full.png')} style={{width: 620, height: 'auto', opacity: logo, filter: `blur(${(1 - logo) * 10}px)`, transform: `translateY(${(1 - logo) * 14}px)`}} />
        <div style={{marginTop: 46, fontFamily: INTER, fontWeight: 600, fontSize: 30, letterSpacing: '0.42em', marginRight: '-0.42em', color: '#6B6F78', opacity: url}}>FOTOOWL.AI</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
