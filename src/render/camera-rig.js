import * as THREE from 'https://esm.sh/three@0.165.0';

export function placeCameraOnSurface(camera, surface, state, eyeHeight = 0.08, sideSign = 1) {
  const point = surface.pointAt(state.s, state.t);
  const ns = (state.normalSign || 1) * sideSign;
  const normal = surface.normalAt(state.s, state.t).multiplyScalar(ns);

  // Forward is the player's world-space velocity
  const forward = state.velocity.lengthSq() > 1e-12
    ? state.velocity.clone().normalize()
    : new THREE.Vector3(1, 0, 0);

  camera.position.copy(point).addScaledVector(normal, eyeHeight);
  camera.up.copy(normal);
  camera.lookAt(camera.position.clone().add(forward));

  return { point, normal, forward };
}
