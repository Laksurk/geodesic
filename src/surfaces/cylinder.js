import * as THREE from 'https://esm.sh/three@0.165.0';
import { ParametricSurface } from '../math/parametric-surface.js';

export function createCylinderSurface() {
  return new ParametricSurface({
    name: '圆柱面 (Cylinder)',
    periodicS: true,
    formula: '(cos s,  sin s,  t)',
    domain: {
      s: [-Math.PI, Math.PI],
      t: [-5, 5],
      segmentsS: 140,
      segmentsT: 140,
    },
    position: (s, t) => new THREE.Vector3(
      Math.cos(s),
      Math.sin(s),
      t
    ),
    tangentS: (s) => new THREE.Vector3(-Math.sin(s), Math.cos(s), 0),
    tangentT: () => new THREE.Vector3(0, 0, 1),
    parametersFromPoint: (point) => ({
      s: Math.atan2(point.y, point.x),
      t: point.z,
    }),
  });
}
