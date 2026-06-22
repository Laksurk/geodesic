import * as THREE from 'https://esm.sh/three@0.165.0';

const DEFAULT_EPSILON = 1e-4;

export class ParametricSurface {
  constructor({ name, domain, position, tangentS, tangentT, parametersFromPoint, formula, periodicS, wrapS }) {
    this.name = name;
    this.formula = formula || '';
    this.periodicS = periodicS || false;
    this.wrapS = wrapS; // optional: (s, t, sMin, sMax) => [newS, newT, flipDt]
    this.domain = domain;
    this.position = position;
    this.tangentS = tangentS ?? ((s, t) => this.numericTangent(s, t, 's'));
    this.tangentT = tangentT ?? ((s, t) => this.numericTangent(s, t, 't'));
    this.parametersFromPoint = parametersFromPoint;
  }

  pointAt(s, t) {
    return this.position(s, t);
  }

  jacobianAt(s, t) {
    return {
      s: this.tangentS(s, t),
      t: this.tangentT(s, t),
    };
  }

  /** Coefficients of the first fundamental form: E, F, G */
  fffCoeffs(s, t) {
    const { s: fs, t: ft } = this.jacobianAt(s, t);
    return {
      E: fs.dot(fs),
      F: fs.dot(ft),
      G: ft.dot(ft),
    };
  }

  firstFundamentalFormAt(s, t) {
    const { E, F, G } = this.fffCoeffs(s, t);
    return [[E, F], [F, G]];
  }

  tangentQuadraticAt(s, t, direction) {
    const { E, F, G } = this.fffCoeffs(s, t);
    const [x, y] = direction;
    return E * x * x + 2 * F * x * y + G * y * y;
  }

  tangentLengthAt(s, t, direction) {
    return Math.sqrt(Math.max(0, this.tangentQuadraticAt(s, t, direction)));
  }

  normalAt(s, t) {
    const { s: fs, t: ft } = this.jacobianAt(s, t);
    return new THREE.Vector3().crossVectors(fs, ft).normalize();
  }

  worldTangentAt(s, t, direction) {
    const { s: fs, t: ft } = this.jacobianAt(s, t);
    return fs.multiplyScalar(direction[0]).add(ft.multiplyScalar(direction[1]));
  }

  parameterDirectionFromWorld(s, t, worldDirection) {
    const { s: fs, t: ft } = this.jacobianAt(s, t);
    const { E, F, G } = this.fffCoeffs(s, t);
    const rhsS = worldDirection.dot(fs);
    const rhsT = worldDirection.dot(ft);
    const det = E * G - F * F;

    if (Math.abs(det) < 1e-8) {
      return [1, 0];
    }

    return [
      (rhsS * G - rhsT * F) / det,
      (E * rhsT - F * rhsS) / det,
    ];
  }

  /** Numeric coefficients of the second fundamental form: L, M, N */
  sffCoeffs(s, t) {
    const n = this.normalAt(s, t);
    const h = 1e-4;

    const p = this.position(s, t);
    const ps_f = this.position(s + h, t);
    const ps_b = this.position(s - h, t);
    const pt_f = this.position(s, t + h);
    const pt_b = this.position(s, t - h);
    const pst_f = this.position(s + h, t + h);
    const pst_b = this.position(s - h, t - h);
    const pst_sp = this.position(s + h, t - h);
    const pst_sm = this.position(s - h, t + h);

    // r_ss ≈ (p(s+h,t) - 2p(s,t) + p(s-h,t)) / h²
    const r_ss = new THREE.Vector3()
      .copy(ps_f).add(ps_b).sub(p.clone().multiplyScalar(2))
      .multiplyScalar(1 / (h * h));
    // r_tt ≈ (p(s,t+h) - 2p(s,t) + p(s,t-h)) / h²
    const r_tt = new THREE.Vector3()
      .copy(pt_f).add(pt_b).sub(p.clone().multiplyScalar(2))
      .multiplyScalar(1 / (h * h));
    // r_st ≈ (p(s+h,t+h) + p(s-h,t-h) - p(s+h,t-h) - p(s-h,t+h)) / (4h²)
    const r_st = new THREE.Vector3()
      .copy(pst_f).add(pst_b).sub(pst_sp).sub(pst_sm)
      .multiplyScalar(1 / (4 * h * h));

    return {
      L: r_ss.dot(n),
      M: r_st.dot(n),
      N: r_tt.dot(n),
    };
  }

  /** Gaussian curvature K at (s, t) */
  gaussianCurvatureAt(s, t) {
    const { E, F, G } = this.fffCoeffs(s, t);
    const { L, M, N } = this.sffCoeffs(s, t);
    const denom = E * G - F * F;
    if (Math.abs(denom) < 1e-12) return 0;
    return (L * N - M * M) / denom;
  }

  /** Normal curvature κ_n in direction [ds, dt] at (s, t) */
  normalCurvatureAt(s, t, direction) {
    const { E, F, G } = this.fffCoeffs(s, t);
    const { L, M, N } = this.sffCoeffs(s, t);
    const [ds, dt] = direction;
    const I = E * ds * ds + 2 * F * ds * dt + G * dt * dt;
    if (Math.abs(I) < 1e-12) return 0;
    const II = L * ds * ds + 2 * M * ds * dt + N * dt * dt;
    return II / I;
  }

  /** Mean curvature H at (s, t) */
  meanCurvatureAt(s, t) {
    const { E, F, G } = this.fffCoeffs(s, t);
    const { L, M, N } = this.sffCoeffs(s, t);
    const denom = E * G - F * F;
    if (Math.abs(denom) < 1e-12) return 0;
    return (E * N + G * L - 2 * F * M) / (2 * denom);
  }

  moveForward(state, distance) {
    return { ...state, distance, notImplemented: true };
  }

  numericTangent(s, t, variable) {
    const h = DEFAULT_EPSILON;
    const before = variable === 's'
      ? this.position(s - h, t)
      : this.position(s, t - h);
    const after = variable === 's'
      ? this.position(s + h, t)
      : this.position(s, t + h);

    return after.sub(before).multiplyScalar(1 / (2 * h));
  }
}
