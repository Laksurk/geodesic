import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createPseudosphereSurface() {
  return new ParametricSurface({
    name: '伪球面 (Pseudosphere)',
    formula: '(sech s cos t,  sech s sin t,  s − tanh s)',
    domain: {
      s: [0.01, 6],
      t: [-Math.PI, Math.PI],
      segmentsS: 200,
      segmentsT: 160,
    },
    position: (s, t) => {
      const sech = 1 / Math.cosh(s);
      return new THREE.Vector3(
        sech * Math.cos(t),
        sech * Math.sin(t),
        s - Math.tanh(s)
      );
    },
    tangentS: (s, t) => {
      const ch = Math.cosh(s);
      const sech = 1 / ch;
      const tanh = Math.tanh(s);
      return new THREE.Vector3(
        sech * tanh * Math.cos(t),
        sech * tanh * Math.sin(t),
        -tanh * tanh
      );
    },
    tangentT: (s, t) => {
      const sech = 1 / Math.cosh(s);
      return new THREE.Vector3(
        -sech * Math.sin(t),
        sech * Math.cos(t),
        0
      );
    },
  });
}
