import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createUnitSphereSurface() {
  return new ParametricSurface({
    name: '单位球面 (Sphere)',
    formula: '(sin s cos t,  sin s sin t,  cos s)',
    grid: {
      sLines: 30,
      tLines: 40,
      pointsPerLine: 180,
      majorStep: 5,
    },
    domain: {
      s: [0.001, Math.PI - 0.001],
      t: [-Math.PI, Math.PI],
      segmentsS: 160,
      segmentsT: 200,
    },
    position: (s, t) => new THREE.Vector3(
      Math.sin(s) * Math.cos(t),
      Math.sin(s) * Math.sin(t),
      Math.cos(s)
    ),
    tangentS: (s, t) => new THREE.Vector3(
      Math.cos(s) * Math.cos(t),
      Math.cos(s) * Math.sin(t),
      -Math.sin(s)
    ),
    tangentT: (s, t) => new THREE.Vector3(
      -Math.sin(s) * Math.sin(t),
      Math.sin(s) * Math.cos(t),
      0
    ),
  });
}
