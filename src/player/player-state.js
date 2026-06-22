import * as THREE from 'https://esm.sh/three@0.165.0';

const BASE_SPEED = 0.35;
const MAX_GEODESIC_CURVATURE = 2.8;
const CENTER_EPSILON = 0.015;

// ---- Player state stores a WORLD-SPACE unit tangent velocity vector ----
// This ensures the player moves at a consistent speed on ANY surface,
// regardless of how the parametrization distorts lengths.

export function createInitialPlayerState(surface, paramDir = [1, 0], startST) {
  let s = 0, t = 0;
  if (startST) { s = startST[0]; t = startST[1]; }
  const { s: [sMin, sMax], t: [tMin, tMax] } = surface.domain;
  if (s < sMin || s > sMax) s = (sMin + sMax) / 2;
  if (t < tMin || t > tMax) t = (tMin + tMax) / 2;

  const worldVel = surface.worldTangentAt(s, t, paramDir);
  if (worldVel.lengthSq() < 1e-12) worldVel.set(1, 0, 0);
  else worldVel.normalize();

  return {
    s, t,
    velocity: worldVel,           // ℝ³ unit vector tangent to surface
    dirSign: 1,                   // flips on Klein-bottle wrap to keep controls consistent
    normalSign: 1,                // flips on Klein-bottle wrap to keep camera outside
    moving: false,
    mouseX: window.innerWidth / 2,
  };
}

export function setPlayerMoving(player, moving) {
  player.moving = moving;
}

export function setPlayerMouseX(player, mouseX) {
  player.mouseX = mouseX;
}

export function resetPlayerPosition(player, surface) {
  let s = 0, t = 0;
  const { s: [sMin, sMax], t: [tMin, tMax] } = surface.domain;
  if (s < sMin || s > sMax) s = (sMin + sMax) / 2;
  if (t < tMin || t > tMax) t = (tMin + tMax) / 2;
  player.s = s;
  player.t = t;
  const worldVel = surface.worldTangentAt(s, t, [1, 0]);
  if (worldVel.lengthSq() < 1e-12) worldVel.set(1, 0, 0);
  else worldVel.normalize();
  player.velocity = worldVel;
  player.moving = false;
}

// ---- Helper: parameter-space direction from world velocity ----
function directionFromVelocity(surface, s, t, worldVel) {
  try {
    return surface.parameterDirectionFromWorld(s, t, worldVel);
  } catch (_) {
    return [1, 0];
  }
}

export function updatePlayerOnSurface(player, surface, dt) {
  if (!player.moving) return player;

  const { s: [sMin, sMax], t: [tMin, tMax] } = surface.domain;

  const distance = BASE_SPEED * dt;
  const curvature = getCurvatureFromMouse(player.mouseX) * MAX_GEODESIC_CURVATURE * player.dirSign;

  stepOnSurface(player, surface, distance, curvature);

  // Wrap t (always periodic in our surfaces)
  if (player.t < tMin || player.t > tMax) {
    const range = tMax - tMin;
    if (range > 0) {
      while (player.t < tMin) player.t += range;
      while (player.t > tMax) player.t -= range;
    }
  }

  // Wrap s if periodic, otherwise clamp
  if (surface.periodicS) {
    if (player.s < sMin || player.s > sMax) {
      const range = sMax - sMin;
      if (range > 0) {
        while (player.s < sMin) player.s += range;
        while (player.s > sMax) player.s -= range;
      }
    }
  }

  return player;
}

function getCurvatureFromMouse(mouseX) {
  const halfWidth = Math.max(1, window.innerWidth / 2);
  const n = THREE.MathUtils.clamp((mouseX - halfWidth) / halfWidth, -1, 1);
  if (Math.abs(n) < CENTER_EPSILON) return 0;
  return n;
}

function stepOnSurface(player, surface, distance, geodesicCurvature) {
  if (distance <= 0) return;

  const { s: [sMin, sMax] } = surface.domain;

  // --- 1. Rotate velocity in tangent plane (negated: mouse-right = curve-right) ---
  if (Math.abs(geodesicCurvature) > 1e-8) {
    const normal = surface.normalAt(player.s, player.t);
    player.velocity.applyAxisAngle(normal, -geodesicCurvature * distance).normalize();
  }

  // --- 2. Convert world velocity → parameter direction & step ---
  const dir = directionFromVelocity(surface, player.s, player.t, player.velocity);
  const newS = player.s + dir[0] * distance;
  const newT = player.t + dir[1] * distance;

  // --- Handle s-boundary ---
  if (surface.periodicS) {
    // Periodic s: apply wrap
    if (surface.wrapS && (newS < sMin || newS > sMax)) {
      const [ws, wt, flipDt] = surface.wrapS(newS, newT, sMin, sMax);
      player.s = ws;
      player.t = wt;
      const adjDir = [dir[0], dir[1] * flipDt];
      const newVel = surface.worldTangentAt(player.s, player.t, adjDir);
      if (newVel.lengthSq() > 1e-12) player.velocity.copy(newVel.normalize());
      // Flip controls & normal for Klein-bottle non-orientable wrap
      player.dirSign *= -1;
      player.normalSign *= -1;
    } else {
      // Simple periodic: stepOnSurface lets it pass, updatePlayerOnSurface will wrap
      player.s = newS;
      player.t = newT;
      const newVel = surface.worldTangentAt(player.s, player.t, dir);
      if (newVel.lengthSq() > 1e-12) player.velocity.copy(newVel.normalize());
    }
  } else if (newS < sMin || newS > sMax) {
    const crossNorth = newS < sMin;
    const bound = crossNorth ? sMin : sMax;
    // Distance from old position to the boundary
    const toBound = crossNorth ? player.s - bound : bound - player.s;
    // Remaining distance past the pole
    const remaining = distance - toBound;
    player.s = crossNorth
      ? Math.max(0, remaining)
      : bound - Math.max(0, remaining);
    // When the polar cap is excluded from the domain (sMin > 0), reflect further
    if (crossNorth && player.s < sMin) player.s = sMin + (sMin - player.s);
    player.t = newT + Math.PI;

    // Polar crossing: flip ds in parameter direction (north → south)
    const flippedDir = [-dir[0], dir[1]];
    const newVel = surface.worldTangentAt(player.s, player.t, flippedDir);
    if (newVel.lengthSq() > 1e-12) player.velocity.copy(newVel.normalize());
    if (projVel.lengthSq() > 1e-12) player.velocity.copy(projVel.normalize());
  } else {
    player.s = newS;
    player.t = newT;

    // --- 4. Parallel transport: keep world-space velocity, project onto new tangent plane ---
    const newNormal = surface.normalAt(player.s, player.t);
    const projVel = player.velocity.clone().sub(
      newNormal.clone().multiplyScalar(player.velocity.dot(newNormal))
    );
    if (projVel.lengthSq() > 1e-12) player.velocity.copy(projVel.normalize());
  }
}
