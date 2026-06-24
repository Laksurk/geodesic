import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createPlaneSurface() {
  return new ParametricSurface({
    name: '平面 (Plane)',
    formula: '(s,  t,  0)',
    grid: {
      sLines: 24,
      tLines: 24,
      pointsPerLine: 120,
      majorStep: 4,
    },
    domain: {
      s: [-8, 8],
      t: [-8, 8],
      segmentsS: 180,
      segmentsT: 180,
    },
    position: (s, t) => new THREE.Vector3(s, t, 0),
    tangentS: () => new THREE.Vector3(1, 0, 0),
    tangentT: () => new THREE.Vector3(0, 1, 0),
    parametersFromPoint: (point) => ({
      s: point.x,
      t: point.y,
    }),
  });
}
