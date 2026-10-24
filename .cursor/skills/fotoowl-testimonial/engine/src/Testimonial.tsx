import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BehindLayer, FrontLayer, KaraokeCaptions, PillCaptions, behindActive} from './Captions';
import {CardLayer, LowerThird} from './Cards';
import {OwlOutro} from './outros/OwlOutro';
import {LogoOutro, NavyOutro} from './outros/AltOutros';
import {Edit, Segment} from './types';
import {clampI, fontCss, kf, useFonts} from './util';

/*
  Layer order (bottom → top):
    plate (zoomed/reframed) → gold behind-word → person cut-out (only while a behind word is up)
    → bottom shade → front captions → lower third / cards → watermark → outro
*/

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const useFraming = (edit: Edit, seg: Segment) => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const tAbs = (seg.outStartF + f) / fps;
  const z = kf(tAbs, seg.zoom, seg.zoomEase === 'linear' ? Easing.linear : undefined);
  const srcF = Math.min(edit.plateFrames - 1, seg.srcStartF + f);
  const p = edit.face[Math.max(0, Math.min(edit.face.length - 1, srcF))] ?? {x: 0.5, y: 0.42};
  // move the face toward the target, but never reveal an edge
  const ox = clamp(edit.faceTarget.x - z * p.x, 1 - z, 0);
  const oy = clamp(edit.faceTarget.y - z * p.y, 1 - z, 0);
  return {f, tAbs, srcF, style: {transform: `translate(${(ox * width).toFixed(2)}px, ${(oy * height).toFixed(2)}px) scale(${z})`, transformOrigin: '0 0'} as React.CSSProperties};
};

const PlateLayer: React.FC<{edit: Edit; seg: Segment}> = ({edit, seg}) => {
  const {style} = useFraming(edit, seg);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
      <AbsoluteFill style={style}>
        <OffthreadVideo src={staticFile(edit.plate)} startFrom={seg.srcStartF} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PersonLayer: React.FC<{edit: Edit; seg: Segment}> = ({edit, seg}) => {
  const {style, srcF} = useFraming(edit, seg);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={style}>
        <Img src={staticFile(`fg/${String(srcF).padStart(4, '0')}.webp`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SegmentLayers: React.FC<{edit: Edit; seg: Segment; ready: boolean}> = ({edit, seg, ready}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = (seg.outStartF + f) / fps;
  const blocks = edit.captions.blocks;
  const on = ready && edit.captions.style === 'parallax' && edit.person && behindActive(blocks, t);
  return (
    <>
      <PlateLayer edit={edit} seg={seg} />
      {on && <BehindLayer blocks={blocks} t={t} />}
      {on && <PersonLayer edit={edit} seg={seg} />}
    </>
  );
};

const CaptionLayer: React.FC<{edit: Edit; ready: boolean}> = ({edit, ready}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  if (!ready) return null;
  const E = edit.outro.startF;
  const shade = interpolate(f, [E - 6, E + 8], [1, 0], clampI);
  const blocks = edit.captions.blocks;
  return (
    <>
      {edit.bottomShade && edit.captions.style === 'parallax' && (
        <AbsoluteFill style={{opacity: shade, background: 'linear-gradient(180deg, rgba(16,22,34,0) 58%, rgba(16,22,34,0.42) 70%, rgba(16,22,34,0.52) 78%, rgba(16,22,34,0.18) 92%, rgba(16,22,34,0) 100%)'}} />
      )}
      {edit.captions.style === 'parallax' && <FrontLayer blocks={blocks} t={t} />}
      {edit.captions.style === 'pill' && <PillCaptions blocks={blocks} t={t} />}
      {edit.captions.style === 'karaoke' && <KaraokeCaptions blocks={blocks} t={t} />}
    </>
  );
};

const Watermark: React.FC<{edit: Edit}> = ({edit}) => {
  const f = useCurrentFrame();
  const E = edit.outro.startF;
  const o = interpolate(f, [0, 8, E - 2, E + 8], [0, 1, 1, 0], clampI);
  return <Img src={staticFile('brand/logo-full.png')} style={{position: 'absolute', left: 48, top: 66, width: 210, height: 'auto', opacity: o}} />;
};

export const Testimonial: React.FC<{edit: Edit}> = ({edit}) => {
  const ready = useFonts();
  const Outro = edit.outro.style === 'navy' ? NavyOutro : edit.outro.style === 'logo' ? LogoOutro : OwlOutro;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <style>{fontCss}</style>
      {edit.segments.map((seg) => (
        <Sequence key={seg.id} from={seg.outStartF} durationInFrames={seg.lenF}>
          <SegmentLayers edit={edit} seg={seg} ready={ready} />
        </Sequence>
      ))}
      <CaptionLayer edit={edit} ready={ready} />
      {edit.lowerThird && <LowerThird {...edit.lowerThird} />}
      {ready && <CardLayer cards={edit.cards} style={edit.cardStyle} />}
      {edit.watermark && <Watermark edit={edit} />}
      <Sequence from={edit.outro.startF} durationInFrames={edit.outro.lenF}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
