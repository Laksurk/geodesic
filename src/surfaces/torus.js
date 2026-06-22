import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createTorusSurface(R = 1.5, r = 0.6) {
  return new ParametricSurface({
    name: '环面 (Torus)',
    periodicS: true,
    formula: '((1.5 + 0.6 cos t) cos s,  (1.5 + 0.6 cos t) sin s,  0.6 sin t)',
    domain: {
      s: [-Math.PI, Math.PI],
      t: [-Math.PI, Math.PI],
      segmentsS: 160,
      segmentsT: 160,
    },
    position: (s, t) => new THREE.Vector3(
      (R + r * Math.cos(t)) * Math.cos(s),
      (R + r * Math.cos(t)) * Math.sin(s),
      r * Math.sin(t)
    ),
    tangentS: (s, t) => {
      const RprCosT = R + r * Math.cos(t);
      return new THREE.Vector3(
        -RprCosT * Math.sin(s),
        RprCosT * Math.cos(s),
        0
      );
    },
    tangentT: (s, t) => new THREE.Vector3(
      -r * Math.sin(t) * Math.cos(s),
      -r * Math.sin(t) * Math.sin(s),
      r * Math.cos(t)
    ),
  });
}
