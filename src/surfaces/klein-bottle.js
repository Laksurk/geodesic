import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

const A = 3;

export function createKleinBottleSurface() {
  return new ParametricSurface({
    name: 'Klein瓶 (Klein Bottle) ',
    periodicS: true,
    grid: {
      sLines: 40,
      tLines: 40,
      pointsPerLine: 180,
      majorStep: 5,
    },
    wrapS: (s, t, sMin, sMax) => {
      const range = sMax - sMin;
      let newS = s;
      while (newS > sMax) newS -= range;
      while (newS < sMin) newS += range;
      return [newS, -t, -1]; // flip t and dt
    },
    formula: '( (3 + cos(s/2) sin(t) − sin(s/2) sin(2t)) cos(s),  (3 + cos(s/2) sin(t) − sin(s/2) sin(2t)) sin(s),  sin(s/2) sin(t) + cos(s/2) sin(2t) )',
    domain: {
      s: [0, 2 * Math.PI],
      t: [0, 2 * Math.PI],
      segmentsS: 160,
      segmentsT: 160,
    },
    position: (s, t) => {
      const sh = Math.sin(s / 2);
      const ch = Math.cos(s / 2);
      const r = A + ch * Math.sin(t) - sh * Math.sin(2 * t);
      return new THREE.Vector3(
        r * Math.cos(s),
        r * Math.sin(s),
        sh * Math.sin(t) + ch * Math.sin(2 * t)
      );
    },
  });
}
