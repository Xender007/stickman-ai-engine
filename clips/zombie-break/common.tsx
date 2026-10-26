import React from 'react';

export const W = 720;
export const H = 1280;
export const FPS = 24;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { const c = clamp(t); return c * c * (3 - 2 * c); };
/** progress of f between frames a and b, 0..1 */
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
/** deterministic hash noise in [0,1) */
export const rnd = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const rad = (d: number) => (d * Math.PI) / 180;

export const C = {
  ink: '#0b0c10',
  hood: '#3a3d45',
  hoodDark: '#2a2c32',
  pack: '#5d6b2f',
  packDark: '#434d20',
  dead: '#7f9a86',
  deadDark: '#33423a',
  nightA: '#0a1226',
  nightB: '#16223f',
  concrete: '#26324d',
  concreteLight: '#3a4a6c',
  red: '#e0262c',
  green: '#6dff9c',
  orange: '#ffa23a',
  candle: '#ffb347',
};

export type Pose = {
  lean: number; head?: number;
  lT: number; lS: number; rT: number; rS: number; // near / far leg thigh, shin (deg from straight down, + = forward)
  lU: number; lF: number; rU: number; rF: number; // near / far arm upper, fore
};

export const idlePose = (breath = 0): Pose => ({ lean: 0 + breath, lT: 3, lS: 3, rT: -3, rS: -3, lU: 4, lF: 8, rU: -4, rF: 2 });

/** Run cycle, phase in radians. */
export const runPose = (p: number, lean = 16, amp = 52): Pose => {
  const leg = (q: number) => {
    const t = amp * Math.sin(q);
    return [t, t - 22 - 55 * clamp(Math.cos(q), 0, 1)] as const;
  };
  const [lT, lS] = leg(p);
  const [rT, rS] = leg(p + Math.PI);
  return {
    lean, lT, lS, rT, rS,
    lU: -amp * 0.85 * Math.sin(p), lF: -amp * 0.85 * Math.sin(p) + 70,
    rU: amp * 0.85 * Math.sin(p), rF: amp * 0.85 * Math.sin(p) + 70,
  };
};

export const walkPose = (p: number, lean = 4): Pose => runPose(p, lean, 26);

const L1 = 34, L2 = 34, T = 52, U = 26, F = 26, HR = 13;
const pt = (x: number, y: number, len: number, deg: number) => [x + len * Math.sin(rad(deg)), y + len * Math.cos(rad(deg))] as const;

type FigProps = {
  x: number; y: number; s?: number; flip?: boolean; pose: Pose;
  kind?: 'xender' | 'dead' | 'plain';
  torn?: boolean; scratch?: boolean; tint?: string; opacity?: number; pack?: boolean; rot?: number;
};

/** Side-view stick figure; (x,y) = the ground point under the hips' mid height is NOT used: (x,y) is the hip joint. */
export const Figure: React.FC<FigProps> = ({ x, y, s = 1, flip, pose, kind = 'xender', torn, scratch, tint, opacity = 1, pack = true, rot = 0 }) => {
  const dead = kind === 'dead';
  const limb = dead ? '#1a1f1d' : C.ink;
  const lw = 5;
  const hipX = 0, hipY = 0;
  const lk = pt(hipX, hipY, L1, pose.lT), lf = pt(lk[0], lk[1], L2, pose.lS);
  const rk = pt(hipX, hipY, L1, pose.rT), rf = pt(rk[0], rk[1], L2, pose.rS);
  const lean = pose.lean;
  const neck: [number, number] = [hipX + T * Math.sin(rad(lean)), hipY - T * Math.cos(rad(lean))];
  const sh: [number, number] = [hipX + (T - 8) * Math.sin(rad(lean)), hipY - (T - 8) * Math.cos(rad(lean))];
  const le = pt(sh[0], sh[1], U, pose.lU), lh = pt(le[0], le[1], F, pose.lF);
  const re = pt(sh[0], sh[1], U, pose.rU), rh = pt(re[0], re[1], F, pose.rF);
  const head: [number, number] = [neck[0] + (HR + 2) * Math.sin(rad(lean + (pose.head ?? 0))), neck[1] - (HR + 2) * Math.cos(rad(lean + (pose.head ?? 0)))];
  const line = (a: readonly number[], b: readonly number[], c: string, w = lw) => (
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
  );
  const sleeve = kind === 'xender' ? C.hood : limb;
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * s} ${s}) rotate(${rot})`} opacity={opacity}
      style={kind === 'xender' ? { filter: 'drop-shadow(0 0 2px rgba(255,255,255,.95)) drop-shadow(0 0 7px rgba(255,255,255,.45))' } : undefined}>
      {/* far limbs */}
      {line(hipY === 0 ? [0, 0] : [0, 0], rk, limb)}{line(rk, rf, limb)}
      {line(sh, re, kind === 'xender' ? C.hoodDark : limb, kind === 'xender' ? 8 : lw)}{line(re, rh, limb)}
      {/* torso */}
      {kind === 'xender' ? (
        <>
          <g transform={`rotate(${lean} 0 0)`}>
            {pack && <rect x={-27} y={-T + 6} width={18} height={30} rx={5} fill={C.pack} stroke={C.packDark} strokeWidth={2} />}
          </g>
          {line([0, 0], neck, C.hood, 24)}
          {line([0, 0], neck, C.hoodDark, 3)}
          <circle cx={neck[0]} cy={neck[1]} r={9} fill={C.hoodDark} />
        </>
      ) : (
        line([0, 0], neck, dead ? '#222a27' : limb, dead ? 9 : 6)
      )}
      {/* near limbs */}
      {line([0, 0], lk, limb)}{line(lk, lf, limb)}
      {kind === 'xender' ? (
        <>
          {line(sh, le, C.hood, 9)}
          {torn ? line(le, lh, limb, 4) : line(le, lh, C.hood, 9)}
          {torn && (() => {
            const m = [lerp(le[0], lh[0], 0.18), lerp(le[1], lh[1], 0.18)];
            return <polygon points={`${le[0] - 5},${le[1]} ${m[0] - 6},${m[1] - 2} ${m[0] - 2},${m[1] + 3} ${m[0] + 2},${m[1] - 2} ${m[0] + 6},${m[1] + 3} ${le[0] + 5},${le[1]}`} fill={C.hood} />;
          })()}
          {scratch && line([lerp(le[0], lh[0], 0.45), lerp(le[1], lh[1], 0.45)], [lerp(le[0], lh[0], 0.8) + 2, lerp(le[1], lh[1], 0.8) - 2], '#c44a3a', 2)}
        </>
      ) : (
        <>{line(sh, le, limb)}{line(le, lh, limb)}</>
      )}
      {/* head */}
      <circle cx={head[0]} cy={head[1]} r={HR} fill={dead ? C.dead : C.ink} stroke={dead ? '#25302a' : 'none'} strokeWidth={2.5} />
      {dead && <circle cx={head[0]} cy={head[1]} r={HR + 5} fill={C.green} opacity={0.12} />}
      {tint && <rect x={-60} y={-130} width={120} height={200} fill={tint} opacity={0.0} />}
    </g>
  );
};

export const deadPose = (t: number, seed: number): Pose => {
  const q = Math.floor(t * 3.2 + seed * 7) + smooth((t * 3.2 + seed * 7) % 1);
  const p = q * 1.4;
  const base = walkPose(p, 26);
  const j = rnd(Math.floor(t * 4 + seed * 31)) - 0.5;
  return { ...base, head: 10 + j * 30, lU: 62 + j * 20, lF: 80, rU: 70 - j * 20, rF: 88 };
};

/** Burned-in text: narration captions + overlays. Safe zones: bottom fifth and right edge empty. */
export const Caption: React.FC<{ text: string; y?: number; size?: number; fill?: string }> = ({ text, y = 800, size = 46, fill = '#fff' }) => (
  <text x={W / 2 - 20} y={y} textAnchor="middle" fontFamily="Arial Black, Impact, sans-serif" fontWeight={900} fontSize={size}
    fill={fill} stroke="#000" strokeWidth={9} paintOrder="stroke" strokeLinejoin="round" letterSpacing={1}>{text}</text>
);

export const Flicker: React.FC<{ f: number; base?: number; amt?: number; seed?: number }> = () => null;

/** Radial glow */
export const Glow: React.FC<{ x: number; y: number; r: number; color: string; o?: number; id: string }> = ({ x, y, r, color, o = 0.6, id }) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={o} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </>
);

export const Vignette: React.FC<{ o?: number }> = ({ o = 0.7 }) => (
  <>
    <defs>
      <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.45" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={o} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#vig)" />
  </>
);

/** Shared film grain-ish dust motes (deterministic). */
export const Motes: React.FC<{ f: number; n?: number; color?: string; o?: number; seed?: number }> = ({ f, n = 24, color = '#fff', o = 0.35, seed = 1 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const x = rnd(i * 3 + seed) * W + Math.sin(f / 30 + i) * 14;
      const y = (rnd(i * 5 + seed + 9) * H + f * (0.4 + rnd(i + seed) * 0.8)) % H;
      return <circle key={i} cx={x} cy={y} r={1 + rnd(i + 2) * 2} fill={color} opacity={o * (0.4 + rnd(i + 7) * 0.6)} />;
    })}
  </>
);

/** Screen position of the near hand (and head centre) for a Figure with the same props. */
export const jointPos = (x: number, y: number, s: number, flip: boolean | undefined, pose: Pose) => {
  const sh: [number, number] = [(T - 8) * Math.sin(rad(pose.lean)), -(T - 8) * Math.cos(rad(pose.lean))];
  const le = pt(sh[0], sh[1], U, pose.lU), lh = pt(le[0], le[1], F, pose.lF);
  const neck: [number, number] = [T * Math.sin(rad(pose.lean)), -T * Math.cos(rad(pose.lean))];
  const hd: [number, number] = [neck[0] + (HR + 2) * Math.sin(rad(pose.lean + (pose.head ?? 0))), neck[1] - (HR + 2) * Math.cos(rad(pose.lean + (pose.head ?? 0)))];
  const k = flip ? -1 : 1;
  return { hand: [x + k * s * lh[0], y + s * lh[1]] as [number, number], head: [x + k * s * hd[0], y + s * hd[1]] as [number, number] };
};
