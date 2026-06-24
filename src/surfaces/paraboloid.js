import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createParaboloidSurface() {
  return new ParametricSurface({
    name: '椭圆抛物面 (Elliptic Paraboloid)',
    formula: '(s,  t,  s² + t²)',
    grid: {
      sLines: 28,
      tLines: 28,
      pointsPerLine: 150,
      majorStep: 4,
    },
    domain: {
      s: [-4, 4],
      t: [-4, 4],
      segmentsS: 180,
      segmentsT: 180,
    },
    position: (s, t) => new THREE.Vector3(s, t, s * s + t * t),
    tangentS: (s) => new THREE.Vector3(1, 0, 2 * s),
    tangentT: (t) => new THREE.Vector3(0, 1, 2 * t),
    parametersFromPoint: (point) => ({
      s: point.x,
      t: point.y,
    }),
  });
}
