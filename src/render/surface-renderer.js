import * as THREE from 'https://esm.sh/three@0.165.0';

export function createSurfaceMesh(surface) {
  const {
    s: [sMin, sMax],
    t: [tMin, tMax],
    segmentsS,
    segmentsT,
  } = surface.domain;

  // ---- Translucent light surface ----
  const vertices = [];
  const colors = [];
  const indices = [];
  const c = new THREE.Color();

  for (let j = 0; j <= segmentsT; j++) {
    const t = THREE.MathUtils.lerp(tMin, tMax, j / segmentsT);
    for (let i = 0; i <= segmentsS; i++) {
      const s = THREE.MathUtils.lerp(sMin, sMax, i / segmentsS);
      const pt = surface.pointAt(s, t);
      vertices.push(pt.x, pt.y, pt.z);

      // Pale, desaturated tones
      const h = 0.58 + pt.z * 0.03;
      const sat = 0.08 + Math.abs(pt.z) * 0.03;
      const lig = 0.70 + pt.z * 0.04;
      c.setHSL(
        THREE.MathUtils.clamp(h, 0.54, 0.66),
        THREE.MathUtils.clamp(sat, 0.05, 0.16),
        THREE.MathUtils.clamp(lig, 0.62, 0.82)
      );
      colors.push(c.r, c.g, c.b);
    }
  }

  for (let j = 0; j < segmentsT; j++) {
    for (let i = 0; i < segmentsS; i++) {
      const a = j * (segmentsS + 1) + i;
      const b = a + 1;
      const c = a + segmentsS + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: true,
    })
  );
  mesh.renderOrder = 0;

  // ---- Parameter grid lines (main visual) ----
  const gridGroup = createParameterGrid(surface);

  return { mesh, wire: gridGroup };
}

function createParameterGrid(surface) {
  const group = new THREE.Group();
  const {
    s: [sMin, sMax],
    t: [tMin, tMax],
  } = surface.domain;

  const sLines = 36;
  const tLines = 36;
  const ptsPerLine = 160;
  const majorStep = 6;

  // --- s-const lines — blue ---
  for (let i = 0; i <= sLines; i++) {
    const s = THREE.MathUtils.lerp(sMin, sMax, i / sLines);
    const isMajor = i % majorStep === 0;
    const pos = [];
    const cols = [];
    const c = new THREE.Color();

    for (let j = 0; j < ptsPerLine; j++) {
      const t = THREE.MathUtils.lerp(tMin, tMax, j / ptsPerLine);
      const pt = surface.pointAt(s, t);
      pos.push(pt.x, pt.y, pt.z);
      const b = isMajor ? 0.50 + pt.z * 0.05 : 0.38 + pt.z * 0.04;
      c.setHSL(isMajor ? 0.60 : 0.62, isMajor ? 0.75 : 0.60, THREE.MathUtils.clamp(b, 0.30, 0.60));
      cols.push(c.r, c.g, c.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));

    group.add(new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ vertexColors: true, opacity: isMajor ? 1.0 : 0.80 })
    ));
  }

  // --- t-const lines — red ---
  for (let i = 0; i <= tLines; i++) {
    const t = THREE.MathUtils.lerp(tMin, tMax, i / tLines);
    const isMajor = i % majorStep === 0;
    const pos = [];
    const cols = [];
    const c = new THREE.Color();

    for (let j = 0; j < ptsPerLine; j++) {
      const s = THREE.MathUtils.lerp(sMin, sMax, j / ptsPerLine);
      const pt = surface.pointAt(s, t);
      pos.push(pt.x, pt.y, pt.z);
      const b = isMajor ? 0.45 + pt.z * 0.05 : 0.35 + pt.z * 0.04;
      c.setHSL(isMajor ? 0.98 : 0.005, isMajor ? 0.72 : 0.58, THREE.MathUtils.clamp(b, 0.28, 0.55));
      cols.push(c.r, c.g, c.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));

    group.add(new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ vertexColors: true, opacity: isMajor ? 0.95 : 0.75 })
    ));
  }
  return group;
}
