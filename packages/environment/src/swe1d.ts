/**
 * 1D shallow-water solver along a transect (plan 8.1), for side-view shots.
 *
 * Finite volume on a uniform grid. Interface fluxes: HLL with dry-aware wave speeds (Toro/Einfeldt). Bed slope: hydrostatic
 * reconstruction (Audusse et al. 2004), which keeps a lake at rest exactly at rest over uneven terrain and keeps depths
 * non-negative at wet/dry fronts under the CFL limit. Friction: Manning, semi-implicit. Float64, fixed loop order, no
 * randomness: the same inputs give the same state hash (rule R9).
 *
 * Variables are depth h (m) and discharge hu (m^2/s); bed elevation b (m) and surface eta = h + b.
 */
export type Boundary = 'wall' | 'open';

export interface SweOptions {
  x0: number;
  dx: number;
  cells: number;
  bed: (x: number) => number;
  /** Initial surface elevation (m); depth is max(0, eta - bed). */
  eta0: (x: number) => number;
  manning?: number;
  g?: number;
  cfl?: number;
  left?: Boundary;
  right?: Boundary;
}

const EPS = 1e-9;

export class Swe1D {
  readonly g: number;
  readonly dx: number;
  readonly x0: number;
  readonly n: number;
  readonly b: Float64Array;
  readonly h: Float64Array;
  readonly hu: Float64Array;
  t = 0;
  steps = 0;
  /** Time-integrated mass flux (m^3 per m width) through the left and right boundary interfaces, positive = toward +x. */
  fluxLeft = 0;
  fluxRight = 0;
  private readonly manning: number;
  private readonly cfl: number;
  private readonly left: Boundary;
  private readonly right: Boundary;
  // scratch, allocated once
  private readonly fh: Float64Array;
  private readonly fmL: Float64Array;
  private readonly fmR: Float64Array;

  constructor(o: SweOptions) {
    this.g = o.g ?? 9.81;
    this.dx = o.dx;
    this.x0 = o.x0;
    this.n = o.cells;
    this.manning = o.manning ?? 0;
    this.cfl = o.cfl ?? 0.45;
    this.left = o.left ?? 'wall';
    this.right = o.right ?? 'wall';
    this.b = new Float64Array(this.n);
    this.h = new Float64Array(this.n);
    this.hu = new Float64Array(this.n);
    for (let i = 0; i < this.n; i++) {
      const x = this.xc(i);
      this.b[i] = o.bed(x);
      this.h[i] = Math.max(0, o.eta0(x) - this.b[i]);
    }
    this.fh = new Float64Array(this.n + 1);
    this.fmL = new Float64Array(this.n + 1);
    this.fmR = new Float64Array(this.n + 1);
  }

  xc(i: number): number {
    return this.x0 + (i + 0.5) * this.dx;
  }

  eta(i: number): number {
    return this.b[i] + this.h[i];
  }

  velocity(i: number): number {
    return this.h[i] > EPS ? this.hu[i] / this.h[i] : 0;
  }

  volume(): number {
    let v = 0;
    for (let i = 0; i < this.n; i++) v += this.h[i] * this.dx;
    return v;
  }

  private stableDt(): number {
    let s = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.h[i] > EPS) s = Math.max(s, Math.abs(this.hu[i] / this.h[i]) + Math.sqrt(this.g * this.h[i]));
    }
    return s < 1e-12 ? 0.05 : (this.cfl * this.dx) / s;
  }

  /** HLL flux for reconstructed states. Returns [mass flux, momentum flux] in the module-level scratch. */
  private hll(hL: number, uL: number, hR: number, uR: number): void {
    const g = this.g;
    if (hL <= EPS && hR <= EPS) {
      OUT[0] = 0;
      OUT[1] = 0;
      return;
    }
    const cL = Math.sqrt(g * hL);
    const cR = Math.sqrt(g * hR);
    let sL: number;
    let sR: number;
    if (hL <= EPS) {
      sL = uR - 2 * cR;
      sR = uR + cR;
    } else if (hR <= EPS) {
      sL = uL - cL;
      sR = uL + 2 * cL;
    } else {
      const hStar = ((0.5 * (cL + cR) + 0.25 * (uL - uR)) ** 2) / g;
      const uStar = 0.5 * (uL + uR) + cL - cR;
      const cStar = Math.sqrt(g * hStar);
      sL = Math.min(uL - cL, uStar - cStar);
      sR = Math.max(uR + cR, uStar + cStar);
    }
    const fLh = hL * uL;
    const fLm = hL * uL * uL + 0.5 * g * hL * hL;
    const fRh = hR * uR;
    const fRm = hR * uR * uR + 0.5 * g * hR * hR;
    if (sL >= 0) {
      OUT[0] = fLh;
      OUT[1] = fLm;
    } else if (sR <= 0) {
      OUT[0] = fRh;
      OUT[1] = fRm;
    } else {
      const d = sR - sL;
      OUT[0] = (sR * fLh - sL * fRh + sL * sR * (hR - hL)) / d;
      OUT[1] = (sR * fLm - sL * fRm + sL * sR * (hR * uR - hL * uL)) / d;
    }
  }

  /** Advance by one step of size `dt` (must not exceed `stableDt()`). */
  private advance(dt: number): void {
    const { n, g, b, h, hu, fh, fmL, fmR } = this;
    for (let k = 0; k <= n; k++) {
      // interface k lies between cell k-1 and cell k; ghost cells at the ends
      let hl: number, hul: number, bl: number, hr: number, hur: number, br: number;
      if (k === 0) {
        hr = h[0];
        hur = hu[0];
        br = b[0];
        bl = br;
        hl = this.left === 'wall' ? hr : hr;
        hul = this.left === 'wall' ? -hur : hur;
      } else if (k === n) {
        hl = h[n - 1];
        hul = hu[n - 1];
        bl = b[n - 1];
        br = bl;
        hr = hl;
        hur = this.right === 'wall' ? -hul : hul;
      } else {
        hl = h[k - 1];
        hul = hu[k - 1];
        bl = b[k - 1];
        hr = h[k];
        hur = hu[k];
        br = b[k];
      }
      const bStar = Math.max(bl, br);
      const hLs = Math.max(0, hl + bl - bStar);
      const hRs = Math.max(0, hr + br - bStar);
      const uL = hl > EPS ? hul / hl : 0;
      const uR = hr > EPS ? hur / hr : 0;
      this.hll(hLs, uL, hRs, uR);
      fh[k] = OUT[0];
      fmL[k] = OUT[1] + 0.5 * g * (hl * hl - hLs * hLs); // contribution seen by the cell on the left of the interface
      fmR[k] = OUT[1] + 0.5 * g * (hr * hr - hRs * hRs); // contribution seen by the cell on the right
    }
    const lam = dt / this.dx;
    for (let i = 0; i < n; i++) {
      h[i] -= lam * (fh[i + 1] - fh[i]);
      hu[i] -= lam * (fmL[i + 1] - fmR[i]);
    }
    this.fluxLeft += fh[0] * dt;
    this.fluxRight += fh[n] * dt;

    for (let i = 0; i < n; i++) {
      if (h[i] < 1e-12) {
        h[i] = 0;
        hu[i] = 0;
      } else if (this.manning > 0) {
        hu[i] /= 1 + (dt * g * this.manning * this.manning * Math.abs(hu[i])) / Math.pow(h[i], 7 / 3);
      }
    }
    this.t += dt;
    this.steps++;
  }

  /** Advance to time `tEnd` with CFL-limited steps (the last step is shortened to land exactly on `tEnd`). */
  run(tEnd: number): void {
    while (this.t < tEnd - 1e-12) {
      const dt = Math.min(this.stableDt(), tEnd - this.t);
      this.advance(dt);
    }
  }

  snapshot(): { t: number; h: Float64Array; hu: Float64Array } {
    return { t: this.t, h: Float64Array.from(this.h), hu: Float64Array.from(this.hu) };
  }
}

const OUT = new Float64Array(2);
