import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createHyperbolicParaboloidSurface() {
  return new ParametricSurface({
    name: '双曲抛物面 (Hyperbolic Paraboloid)',
    formula: '(s,  t,  s² − t²)',
    domain: {
      s: [-5, 5],
      t: [-5, 5],
      segmentsS: 180,
      segmentsT: 180,
    },
    position: (s, t) => new THREE.Vector3(s, t, s * s - t * t),
    tangentS: (s) => new THREE.Vector3(1, 0, 2 * s),
    tangentT: (t) => new THREE.Vector3(0, 1, -2 * t),
    parametersFromPoint: (point) => ({
      s: point.x,
      t: point.y,
    }),
  });
}
