import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createEllipsoidSurface(a = 1.6, b = 1.0, c = 0.8) {
  return new ParametricSurface({
    name: '椭球面 (Ellipsoid)',
    formula: `(${a.toFixed(1)} sin s cos t,  ${b.toFixed(1)} sin s sin t,  ${c.toFixed(1)} cos s)`,
    grid: {
      sLines: 32,
      tLines: 32,
      pointsPerLine: 150,
      majorStep: 5,
    },
    domain: {
      s: [0.005, Math.PI - 0.005],
      t: [-Math.PI, Math.PI],
      segmentsS: 160,
      segmentsT: 160,
    },
    position: (s, t) => new THREE.Vector3(
      a * Math.sin(s) * Math.cos(t),
      b * Math.sin(s) * Math.sin(t),
      c * Math.cos(s)
    ),
    tangentS: (s, t) => new THREE.Vector3(
      a * Math.cos(s) * Math.cos(t),
      b * Math.cos(s) * Math.sin(t),
      -c * Math.sin(s)
    ),
    tangentT: (s, t) => new THREE.Vector3(
      -a * Math.sin(s) * Math.sin(t),
      b * Math.sin(s) * Math.cos(t),
      0
    ),
  });
}
