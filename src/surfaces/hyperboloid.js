import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createHyperboloidSurface() {
  return new ParametricSurface({
    name: '单叶双曲面 (Hyperboloid)',
    formula: '(cosh s cos t,  cosh s sin t,  sinh s)',
    grid: {
      sLines: 30,
      tLines: 30,
      pointsPerLine: 150,
      majorStep: 5,
    },
    domain: {
      s: [-2.2, 2.2],
      t: [-Math.PI, Math.PI],
      segmentsS: 160,
      segmentsT: 160,
    },
    position: (s, t) => new THREE.Vector3(
      Math.cosh(s) * Math.cos(t),
      Math.cosh(s) * Math.sin(t),
      Math.sinh(s)
    ),
    tangentS: (s, t) => new THREE.Vector3(
      Math.sinh(s) * Math.cos(t),
      Math.sinh(s) * Math.sin(t),
      Math.cosh(s)
    ),
    tangentT: (s, t) => new THREE.Vector3(
      -Math.cosh(s) * Math.sin(t),
      Math.cosh(s) * Math.cos(t),
      0
    ),
  });
}
