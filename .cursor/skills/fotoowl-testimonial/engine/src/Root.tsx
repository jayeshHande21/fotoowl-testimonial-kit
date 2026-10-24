import React from 'react';
import {Composition} from 'remotion';
import {Testimonial} from './Testimonial';
import {OwlOutro} from './outros/OwlOutro';
import {Edit} from './types';

const EMPTY: Edit = {
  fps: 30, width: 1080, height: 1920, plate: 'plate.mp4', plateFrames: 1, person: false,
  face: [{x: 0.5, y: 0.42}], faceTarget: {x: 0.5, y: 0.42}, segments: [],
  captions: {style: 'parallax', blocks: []}, lowerThird: null, cards: [], cardStyle: 'wide',
  watermark: true, bottomShade: true, outro: {style: 'owl', startF: 0, lenF: 168}, totalF: 168,
};

const OutroStandalone: React.FC = () => <OwlOutro standalone />;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Testimonial"
      component={Testimonial as unknown as React.FC<Record<string, unknown>>}
      defaultProps={{edit: EMPTY} as unknown as Record<string, unknown>}
      calculateMetadata={({props}) => {
        const e = (props as unknown as {edit: Edit}).edit;
        return {durationInFrames: Math.max(1, e.totalF), fps: e.fps, width: e.width, height: e.height};
      }}
      durationInFrames={168}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition id="Outro" component={OutroStandalone} durationInFrames={168} fps={30} width={1080} height={1920} />
  </>
);
