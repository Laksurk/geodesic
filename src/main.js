import * as THREE from 'https://esm.sh/three@0.165.0';
import {
  createInitialPlayerState,
  resetPlayerPosition,
  setPlayerMouseX,
  setPlayerMoving,
  updatePlayerOnSurface,
} from './player/player-state.js';
import { createSurfaceMesh } from './render/surface-renderer.js';
import { placeCameraOnSurface } from './render/camera-rig.js';
import { createUnitSphereSurface } from './surfaces/unit-sphere.js';
import { createPlaneSurface } from './surfaces/plane.js';
import { createEllipsoidSurface } from './surfaces/ellipsoid.js';
import { createHyperbolicParaboloidSurface } from './surfaces/hyperbolic-paraboloid.js';
import { createParaboloidSurface } from './surfaces/paraboloid.js';
import { createHyperboloidSurface } from './surfaces/hyperboloid.js';
import { createCylinderSurface } from './surfaces/cylinder.js';
import { createTorusSurface } from './surfaces/torus.js';
import { createKleinBottleSurface } from './surfaces/klein-bottle.js';

// ---- Surface Registry ----
const surfaceRegistry = {
  'unit-sphere':     { factory: createUnitSphereSurface,      label: '单位球面', initDir: [0, 1] },
  'plane':           { factory: createPlaneSurface,            label: '平面' },
  'cylinder':        { factory: createCylinderSurface,         label: '圆柱面' },
  'torus':           { factory: createTorusSurface,            label: '环面' },
  'klein-bottle':    { factory: createKleinBottleSurface,     label: 'Klein瓶', startST: [3.0, 0.5] },
  'ellipsoid':       { factory: createEllipsoidSurface,        label: '椭球面' },
  'paraboloid':      { factory: createParaboloidSurface,       label: '椭圆抛物面' },
  'hyperbolic-paraboloid': { factory: createHyperbolicParaboloidSurface, label: '双曲抛物面' },
  'hyperboloid':     { factory: createHyperboloidSurface,      label: '单叶双曲面' },
};

// ---- Scene Setup ----
const canvas = document.querySelector('#scene');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101820);
scene.fog = new THREE.Fog(0x101820, 5, 18);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ---- Minimal ambient (Basic material ignores it, just for fog) ----
const hemiLight = new THREE.HemisphereLight(0xb8e7ff, 0x293241, 0.3);
scene.add(hemiLight);

// ---- Dynamic Surface Objects ----
let surfaceGroup = new THREE.Group();
scene.add(surfaceGroup);

let currentSurfaceKey = 'unit-sphere';
let currentSurface = null;
let player = null;
let cameraFrame = null;
let gridDensity = 1;

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

function clearSurfaceGroup() {
  while (surfaceGroup.children.length) {
    const child = surfaceGroup.children[0];
    disposeObject(child);
    surfaceGroup.remove(child);
  }
}

function rebuildSurfaceVisuals() {
  if (!currentSurface) return;

  clearSurfaceGroup();
  const { mesh, wire } = createSurfaceMesh(currentSurface, gridDensity);
  surfaceGroup.add(mesh, wire);
}

// ---- Surface Loading ----
function loadSurface(surfaceKey) {
  const entry = surfaceRegistry[surfaceKey];
  if (!entry) return;

  currentSurfaceKey = surfaceKey;
  currentSurface = entry.factory();
  rebuildSurfaceVisuals();

  player = createInitialPlayerState(currentSurface, entry.initDir, entry.startST);
  cameraFrame = placeCameraOnSurface(camera, currentSurface, player);

  // Reset win flag for this surface session
  surfaceWinFired = false;
  document.getElementById('winOverlay').classList.remove('show');

  // Update UI: selector + formula
  document.querySelectorAll('.selector-menu button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.surface === surfaceKey);
  });
}

// ---- Surface Selector UI ----
const selector = document.getElementById('surfaceSelector');
const toggleBtn = document.getElementById('selectorToggle');
const menu = document.getElementById('selectorMenu');
const gridDensitySlider = document.getElementById('gridDensity');
const gridDensityValue = document.getElementById('gridDensityValue');

gridDensity = Number(gridDensitySlider.value) / 100;

function updateGridDensityLabel() {
  gridDensityValue.textContent = `${Math.round(gridDensity * 100)}%`;
}

let pendingGridRebuild = false;
gridDensitySlider.addEventListener('input', () => {
  gridDensity = Number(gridDensitySlider.value) / 100;
  updateGridDensityLabel();

  if (pendingGridRebuild) return;
  pendingGridRebuild = true;
  requestAnimationFrame(() => {
    pendingGridRebuild = false;
    rebuildSurfaceVisuals();
  });
});

updateGridDensityLabel();

toggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  selector.classList.toggle('open');
});

document.addEventListener('click', () => {
  selector.classList.remove('open');
});

menu.addEventListener('click', (e) => {
  e.stopPropagation();
});

menu.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-surface]');
  if (!btn) return;

  const key = btn.dataset.surface;
  if (key === currentSurfaceKey) {
    selector.classList.remove('open');
    return;
  }

  loadSurface(key);
  selector.classList.remove('open');
});

// ---- Input ----
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (player) setPlayerMoving(player, true);
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (player) setPlayerMoving(player, false);
  }
});

window.addEventListener('mousemove', (event) => {
  if (player) setPlayerMouseX(player, event.clientX);
});

// ---- Touch / Mobile Support ----
// Holding finger on screen ≡ pressing Space; finger X position ≡ mouse X.
// Touches inside HUD or win overlay are excluded — they need native click events.
function isUI(target) {
  return target.closest('.hud') || target.closest('.win-overlay');
}

window.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches[0];
  if (!touch) return;
  if (isUI(event.target)) return;
  event.preventDefault();
  if (player) {
    setPlayerMouseX(player, touch.clientX);
    setPlayerMoving(player, true);
  }
}, { passive: false });

window.addEventListener('touchmove', (event) => {
  const touch = event.changedTouches[0];
  if (!touch) return;
  if (isUI(event.target)) return;
  event.preventDefault();
  if (player) setPlayerMouseX(player, touch.clientX);
}, { passive: false });

window.addEventListener('touchend', (event) => {
  if (isUI(event.target)) return;
  event.preventDefault();
  if (player) setPlayerMoving(player, false);
}, { passive: false });

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (player) setPlayerMouseX(player, window.innerWidth / 2);
}

window.addEventListener('resize', resize);

// ---- Collapse / Expand HUD ----
const collapseBtn = document.getElementById('collapseBtn');
const hud = document.getElementById('hud');
collapseBtn.addEventListener('click', () => {
  hud.classList.toggle('collapsed');
  collapseBtn.title = hud.classList.contains('collapsed') ? '展开' : '收起';
});

// ---- Collapse / Expand Grid Density ----
const gridCollapseBtn = document.getElementById('gridCollapseBtn');
gridCollapseBtn.addEventListener('click', () => {
  hud.classList.toggle('hud-grid-collapsed');
  gridCollapseBtn.title = hud.classList.contains('hud-grid-collapsed') ? '展开' : '收起';
});

// ---- HUD Update ----
const hudName = document.getElementById('hudName');
const hudFormula = document.getElementById('hudFormula');
const hudST = document.getElementById('hudST');
const hudKg = document.getElementById('hudKg');
const hudKn = document.getElementById('hudKn');
const hudK = document.getElementById('hudK');
const hudH = document.getElementById('hudH');

function updateHUD() {
  if (!currentSurface || !player) return;

  const s = player.s;
  const t = player.t;

  hudName.textContent = currentSurface.name;

  hudFormula.innerHTML = currentSurface.formula
    ? '<span class="val">\u03C6(s, t) = ' + currentSurface.formula + '</span>'
    : '';

  hudST.innerHTML =
    '<span class="label">\u5F53\u524D\u5750\u6807 </span><span class="val">(s, t) = (' +
    s.toFixed(4) + ', ' + t.toFixed(4) + ')</span>';

  const halfWidth = Math.max(1, window.innerWidth / 2);
  const n = THREE.MathUtils.clamp((player.mouseX - halfWidth) / halfWidth, -1, 1);
  const kgVal = Math.abs(n) < 0.015 ? 0 : n * 2.8;
  hudKg.innerHTML =
    '<span class="label">\u6D4B\u5730\u66F2\u7387 </span><span class="val geodesic">\u03BA_g = ' +
    kgVal.toFixed(4) + '</span>';

  try {
    const dir = currentSurface.parameterDirectionFromWorld(s, t, player.velocity);
    const kn = currentSurface.normalCurvatureAt(s, t, dir);
    hudKn.innerHTML =
      '<span class="label">\u6CD5\u66F2\u7387 </span><span class="val normal">\u03BA_n = ' +
      kn.toFixed(6) + '</span>';

    const K = currentSurface.gaussianCurvatureAt(s, t);
    hudK.innerHTML =
      '<span class="label">Gauss\u66F2\u7387 </span><span class="val gauss">K = ' +
      K.toFixed(6) + '</span>';

    const H = currentSurface.meanCurvatureAt(s, t);
    hudH.innerHTML =
      '<span class="label">\u5E73\u5747\u66F2\u7387 </span><span class="val">H = ' +
      (Math.abs(H) < 1e-8 ? '0' : H.toFixed(6)) + '</span>';
  } catch (e) {
    hudKn.innerHTML = '<span class="label">\u6CD5\u66F2\u7387 </span><span class="val normal">\u03BA_n = \u2014</span>';
    hudK.innerHTML = '<span class="label">Gauss\u66F2\u7387 </span><span class="val gauss">K = \u2014</span>';
    hudH.innerHTML = '<span class="label">\u5E73\u5747\u66F2\u7387 </span><span class="val">H = \u2014</span>';
  }
}

// ---- Win check ----
let surfaceWinFired = false;
document.getElementById('winOverlay').addEventListener('click', () => {
  document.getElementById('winOverlay').classList.remove('show');
});

// ---- Init ----
// 支持 #K 直接跳转到 Klein 瓶
function applyHash() {
  if (window.location.hash === '#K') {
    if (currentSurfaceKey !== 'klein-bottle') loadSurface('klein-bottle');
  } else if (!currentSurface) {
    loadSurface('unit-sphere');
  }
}
applyHash();
window.addEventListener('hashchange', applyHash);

// ---- Animation Loop ----
let previousTime = 0;
let hudTick = 0;
let crosshairAngle = 0;

renderer.setAnimationLoop((time) => {
  const seconds = time * 0.001;
  const dt = Math.min(0.05, previousTime === 0 ? 0 : seconds - previousTime);
  previousTime = seconds;

  if (currentSurface && player && !document.getElementById('winOverlay').classList.contains('show')) {
    updatePlayerOnSurface(player, currentSurface, dt);
    cameraFrame = placeCameraOnSurface(camera, currentSurface, player);
  }

  // Rotate crosshair: angular velocity = k_g (from mouse), only when moving
  if (player && player.moving) {
    const halfWidth = Math.max(1, window.innerWidth / 2);
    const n = THREE.MathUtils.clamp((player.mouseX - halfWidth) / halfWidth, -1, 1);
    const kg = Math.abs(n) < 0.015 ? 0 : n * 2.8;
    crosshairAngle += kg * dt;
    document.querySelector('.crosshair').style.transform =
      `translate(-50%, -50%) rotate(${crosshairAngle}rad)`;
  }

  // Update HUD every 3 frames to reduce computation
  hudTick++;
  if (hudTick % 3 === 0) {
    updateHUD();

    // Win check: Klein bottle, first time |K| < 0.001
    if (!surfaceWinFired && currentSurface && player &&
        currentSurfaceKey === 'klein-bottle') {
      try {
        const K = currentSurface.gaussianCurvatureAt(player.s, player.t);
        if (Math.abs(K) < 0.001) {
          surfaceWinFired = true;
          document.getElementById('winOverlay').classList.add('show');
        }
      } catch (_) {}
    }
  }

  renderer.render(scene, camera);
});
