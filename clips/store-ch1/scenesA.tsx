import React from 'react';
import { Doodle, INK, PAL } from './doodle.tsx';
import { Can, CardBg, Doors, Floor, H, NightLot, PACK, ShelfRow, Shopcart, Sign, W, clamp, ink, lerp, rnd } from './props.tsx';
import { idlePose, runPose, walkPose } from '../zombie-break/common.tsx';
import { S } from './state.ts';

const PROD = PACK.map((p) => p[0]);

const SHELF_BACK = '#6f6452';

/** One-point-perspective aisle in the reference's look: tall gondola shelves with dark backs, white shelf lips with yellow
 *  price tags and groups of same-product boxes, dark purple ceiling with fluorescent panels, cream tile floor. */
export const Aisle: React.FC<{ vp?: [number, number]; farGlass?: boolean; farOpen?: number; pushed?: number; lightsOn?: number; endLabel?: string }> = ({ vp = [360, 540], farGlass, farOpen = 0, pushed = 0, lightsOn = 1, endLabel = 'FROZEN FOODS' }) => {
  const zoom = 1 + pushed * 0.5;
  const slices = 26, levels = 5;
  const wall = (side: -1 | 1) => {
    const near = { x: side < 0 ? -10 : W + 10, t: 80, b: 1040 };
    const far = { x: vp[0] + side * 110, t: vp[1] - 120, b: vp[1] + 120 };
    const pos = (a: number) => ({ x: lerp(near.x, far.x, a), t: lerp(near.t, far.t, a), b: lerp(near.b, far.b, a) });
    const depth = (i: number) => Math.pow(i / slices, 1.75);
    const el: React.ReactNode[] = [];
    // shelf back
    el.push(<polygon key="back" points={`${near.x},${near.t} ${far.x},${far.t} ${far.x},${far.b} ${near.x},${near.b}`} fill={SHELF_BACK} stroke={INK} strokeWidth={3} />);
    for (let j = 0; j < levels; j++) {
      const f0 = j / levels, f1 = (j + 1) / levels;
      const yy = (p: { t: number; b: number }, f: number) => lerp(p.t, p.b, f);
      let i = 0, blk = 0;
      while (i < slices) {
        const len = 2 + Math.floor(rnd(j * 17 + blk * 5 + (side + 2) * 31) * 4);
        const [body, stripe] = PACK[Math.floor(rnd(j * 11 + blk * 7 + (side + 3) * 13) * PACK.length)];
        const i1 = Math.min(slices, i + len);
        const p0 = pos(depth(i)), p1 = pos(depth(i1));
        const top = (p: typeof p0) => yy(p, f0) + (yy(p, f1) - yy(p, f0)) * 0.1;
        const bot = (p: typeof p0) => yy(p, f1) - (yy(p, f1) - yy(p, f0)) * 0.16;
        const mid = (p: typeof p0, t: number) => lerp(top(p), bot(p), t);
        // product block (a row of boxes facing the aisle)
        el.push(<polygon key={`b${j}-${blk}`} points={`${p0.x},${top(p0)} ${p1.x},${top(p1)} ${p1.x},${bot(p1)} ${p0.x},${bot(p0)}`} fill={body} stroke={INK} strokeWidth={1.4} />);
        el.push(<polygon key={`s${j}-${blk}`} points={`${p0.x},${mid(p0, 0.38)} ${p1.x},${mid(p1, 0.38)} ${p1.x},${mid(p1, 0.7)} ${p0.x},${mid(p0, 0.7)}`} fill={stripe} />);
        // box dividers
        for (let k = i + 1; k < i1; k++) { const q = pos(depth(k)); el.push(<line key={`d${j}-${blk}-${k}`} x1={q.x} y1={top(q)} x2={q.x} y2={bot(q)} stroke={INK} strokeWidth={1} opacity={0.55} />); }
        // price tag on the lip
        const pt = pos(depth(i) * 0.7 + depth(i1) * 0.3);
        el.push(<rect key={`t${j}-${blk}`} x={pt.x - 3} y={bot(pt) + 2} width={Math.max(3, Math.abs(p1.x - p0.x) * 0.18)} height={Math.max(2.5, (yy(pt, f1) - yy(pt, f0)) * 0.08)} fill="#e8c545" stroke={INK} strokeWidth={0.8} />);
        i = i1; blk++;
      }
      // white front lip + shadow under it
      const e0 = pos(0), e1 = pos(1);
      const lipTop = (p: typeof e0) => lerp(yy(p, f0), yy(p, f1), 0.84), lipBot = (p: typeof e0) => lerp(yy(p, f0), yy(p, f1), 0.93);
      el.push(<polygon key={`lip${j}`} points={`${e0.x},${lipTop(e0)} ${e1.x},${lipTop(e1)} ${e1.x},${lipBot(e1)} ${e0.x},${lipBot(e0)}`} fill="#f1ede0" stroke={INK} strokeWidth={2} />);
      el.push(<polygon key={`sh${j}`} points={`${e0.x},${lipBot(e0)} ${e1.x},${lipBot(e1)} ${e1.x},${lerp(yy(e1, f0), yy(e1, f1), 0.97)} ${e0.x},${lerp(yy(e0, f0), yy(e0, f1), 0.97)}`} fill="#3e362b" opacity={0.85} />);
    }
    // uprights
    for (let k = 0; k <= slices; k += 6) { const p = pos(depth(k)); el.push(<line key={`u${k}`} x1={p.x} y1={p.t} x2={p.x} y2={p.b} stroke={INK} strokeWidth={Math.max(2, 5 * (1 - depth(k)))} />); }
    return el;
  };
  return (
    <g transform={`translate(${vp[0]} ${vp[1]}) scale(${zoom}) translate(${-vp[0]} ${-vp[1]})`}>
      <defs><linearGradient id="ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4560" /><stop offset="1" stopColor="#6b6585" /></linearGradient></defs>
      <rect width={W} height={H} fill="#d9caa4" />
      <polygon points={`0,0 ${W},0 ${W},80 ${vp[0] + 110},${vp[1] - 120} ${vp[0] - 110},${vp[1] - 120} 0,80`} fill="url(#ceil)" stroke={INK} strokeWidth={3} />
      {[0.2, 0.4, 0.57, 0.71, 0.82].map((a, i) => {
        const y = lerp(40, vp[1] - 125, a), hw = lerp(210, 70, a), h = lerp(36, 9, a);
        return <polygon key={i} points={`${vp[0] - hw},${y + h} ${vp[0] - hw * 0.85},${y} ${vp[0] + hw * 0.85},${y} ${vp[0] + hw},${y + h}`} fill={lightsOn ? '#f7f4ea' : '#7a7788'} stroke={INK} strokeWidth={2} />;
      })}
      <polygon points={`-10,1040 ${W + 10},1040 ${vp[0] + 110},${vp[1] + 120} ${vp[0] - 110},${vp[1] + 120}`} fill="#e6d8b2" stroke={INK} strokeWidth={3} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = Math.pow(i / 12, 1.75);
        return <line key={i} x1={lerp(-10, vp[0] - 110, a)} y1={lerp(1040, vp[1] + 120, a)} x2={lerp(W + 10, vp[0] + 110, a)} y2={lerp(1040, vp[1] + 120, a)} stroke="#c4b48a" strokeWidth={2} />;
      })}
      {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={lerp(-10, vp[0] - 110, 0)} y1={1040} x2={vp[0] - 110 + (i / 8) * 220} y2={vp[1] + 120} stroke="#c4b48a" strokeWidth={1.6} opacity={0.0} />)}
      {wall(-1)}{wall(1)}
      <rect x={vp[0] - 110} y={vp[1] - 120} width={220} height={240} fill={farGlass ? '#6d6595' : '#e9dfc6'} stroke={INK} strokeWidth={3} />
      {!farGlass && (
        <g>
          <rect x={vp[0] - 96} y={vp[1] - 108} width={192} height={34} fill={PAL.teal} stroke={INK} strokeWidth={3} />
          <text x={vp[0]} y={vp[1] - 84} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={20} fill="#f6f1e2" letterSpacing={2}>{endLabel}</text>
          <rect x={vp[0] - 96} y={vp[1] - 60} width={192} height={160} fill="#f4f0e4" stroke={INK} strokeWidth={2} />
        </g>
      )}
      {farGlass && <g><rect x={vp[0] - 100} y={vp[1] - 108} width={200} height={216} fill="#8e86b4" /><rect x={vp[0] - 60 - farOpen * 36} y={vp[1] - 60} width={60} height={150} fill="#cfe3ee" opacity={0.4} stroke={INK} strokeWidth={2} /><rect x={vp[0] + farOpen * 36} y={vp[1] - 60} width={60} height={150} fill="#cfe3ee" opacity={0.4} stroke={INK} strokeWidth={2} /></g>}
    </g>
  );
};

export const AisleSign: React.FC<{ x: number; y: number; n: string; label?: string; sub?: string; s?: number }> = ({ x, y, n, label = 'PANTRY STAPLES', sub = 'TINS · JARS', s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={-92} y1={-90} x2={-92} y2={0} stroke={INK} strokeWidth={3} /><line x1={92} y1={-90} x2={92} y2={0} stroke={INK} strokeWidth={3} />
    <rect x={-120} y={0} width={240} height={74} rx={6} fill={PAL.teal} stroke={INK} strokeWidth={3.5} />
    <circle cx={-82} cy={37} r={24} fill="#f6f1e2" stroke={INK} strokeWidth={3} />
    <text x={-82} y={48} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={32} fill={PAL.teal}>{n}</text>
    <text x={32} y={32} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={21} fill="#f6f1e2" letterSpacing={1}>{label}</text>
    <text x={34} y={59} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={20} fill="#d6ebe6" letterSpacing={1}>{sub}</text>
  </g>
);

const StoreBand: React.FC<{ y?: number }> = ({ y = 120 }) => (
  <g>
    <rect x={0} y={y - 60} width={W} height={60} fill={PAL.teal} stroke={INK} strokeWidth={3} />
    <text x={W / 2} y={y - 20} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={26} fill="#dff2ef" letterSpacing={3}>WELCOME TO OAKLINE FOODS</text>
  </g>
);

/* ---- 1: automatic doors */
export const Sc1: React.FC = () => {
  const man = S.c1_man;
  return (
    <g>
      <rect width={W} height={H} fill={PAL.wall} />
      <StoreBand y={150} />
      <Doors x={60} y={330} w={600} h={620} open={S.c1_open} sensorOn={(Math.floor(S.c1_blink * 4) % 2) === 0}>
        <NightLot y0={330} h={620} />
        <Doodle x={360} y={lerp(640, 760, man)} s={lerp(0.7, 1.15, man)} kind="man" pose={walkPose(S.c1_walk, 6)} mouth="none" />
      </Doors>
      <rect x={140} y={1000} width={440} height={34} rx={8} fill="#6b5a48" stroke={INK} strokeWidth={3} />
    </g>
  );
};

/* ---- 2: exterior */
export const Sc2: React.FC = () => {
  const p = S.c2_push;
  return (
    <g>
      <g transform={`translate(360 700) scale(${1 + p * 0.22}) translate(-360 -700)`}>
        <NightLot y0={0} h={1280} />
        <rect x={0} y={760} width={W} height={520} fill="#4c456f" />
        <rect x={40} y={560} width={640} height={250} fill="#e8dcc0" stroke={INK} strokeWidth={4} />
        <rect x={70} y={470} width={420} height={80} fill={PAL.teal} stroke={INK} strokeWidth={4} />
        <text x={280} y={528} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={46} fill="#f6f1e2" letterSpacing={3}>OAKLINE FOODS</text>
        <rect x={510} y={480} width={150} height={60} rx={6} fill="#c93a2e" stroke={INK} strokeWidth={3.5} />
        <text x={585} y={506} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={19} fill="#fff">OPEN</text>
        <text x={585} y={529} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={19} fill="#fff">LATE</text>
        <rect x={60} y={590} width={600} height={190} fill="#ffe6a8" stroke={INK} strokeWidth={3} />
        {Array.from({ length: 10 }, (_, i) => <rect key={i} x={72 + i * 59} y={640} width={46} height={110} fill={PROD[i % PROD.length]} opacity={0.75} stroke={INK} strokeWidth={2} />)}
        <rect x={300} y={600} width={120} height={180} fill="#fff6d0" stroke={INK} strokeWidth={3} />
        <Doodle x={360} y={716} s={0.45} kind="hero" pose={idlePose()} mouth="none" />
        <rect x={40} y={900} width={170} height={70} rx={14} fill="#3d63a8" stroke={INK} strokeWidth={4} />
        <circle cx={80} cy={975} r={18} fill="#222" stroke={INK} strokeWidth={3} /><circle cx={170} cy={975} r={18} fill="#222" stroke={INK} strokeWidth={3} />
        <rect x={500} y={960} width={190} height={74} rx={14} fill="#9b4b3a" stroke={INK} strokeWidth={4} />
        <circle cx={540} cy={1040} r={18} fill="#222" stroke={INK} strokeWidth={3} /><circle cx={650} cy={1040} r={18} fill="#222" stroke={INK} strokeWidth={3} />
      </g>
      <g transform={`translate(360 ${150}) scale(${S.c2_clock})`} opacity={clamp(S.c2_clock)}>
        <rect x={-130} y={-48} width={260} height={96} rx={14} fill="#142a2a" stroke={INK} strokeWidth={4} />
        <text x={0} y={22} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={70} fill="#7dffb0" letterSpacing={4}>3:07</text>
      </g>
    </g>
  );
};

/* ---- 3: stacking cans, doors slide open at the far end */
export const Sc3: React.FC = () => {
  const ph = S.c3_phase;
  const arm = Math.sin(ph);
  const pose = { ...idlePose(), lean: 8 + arm * 4, lU: 40 + arm * 40, lF: 70 + arm * 50, rU: 30, rF: 60 };
  return (
    <g>
      <Aisle farGlass farOpen={S.c3_open} />
      <AisleSign x={360} y={190} n="5" s={1.1} />
      {S.c3_open > 0.4 && <Doodle x={360} y={600} s={0.32} kind="man" pose={idlePose()} mouth="none" opacity={clamp((S.c3_open - 0.4) * 3)} />}
      <g>
        <rect x={120} y={900} width={190} height={34} fill="#9b7a4b" stroke={INK} strokeWidth={3} />
        {Array.from({ length: 6 }, (_, i) => <Can key={i} x={150 + (i % 3) * 50} y={900 - Math.floor(i / 3) * 34} c={PROD[(i + 3) % PROD.length]} s={clamp(S.c3_cans * 6 - i)} />)}
      </g>
      <Doodle x={470} y={900 - Math.abs(arm) * 3} s={2.1} kind="hero" pose={pose} />
    </g>
  );
};

/* ---- 4: the man in the doorway / milk and cigarettes */
export const Sc4: React.FC = () => {
  if (S.c4_cut < 0.5) {
    return (
      <g>
        <rect width={W} height={H} fill={PAL.wall} />
        <StoreBand y={150} />
        <Doors x={60} y={330} w={600} h={620} open={1} sensorOn>
          <NightLot y0={330} h={620} />
        </Doors>
        <g transform={`translate(0 ${S.c4_in * 0})`}><Doodle x={360} y={900} s={1.7} kind="man" pose={{ ...idlePose(Math.sin(S.c4_sway * 2) * 1.5), head: 8 }} mouth="none" /></g>
        <rect x={0} y={950} width={W} height={330} fill={PAL.floor} />
      </g>
    );
  }
  return (
    <g>
      <rect width={W} height={H} fill="#3a3f48" />
      <rect y={820} width={W} height={460} fill="#2c2f36" />
      <rect x={80} y={160} width={290} height={140} rx={12} fill="#1f5a52" stroke={INK} strokeWidth={5} />
      <text x={225} y={222} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={46} fill="#dff7ec">TOTAL $4.50</text>
      <text x={225} y={274} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={40} fill="#dff7ec">03:00 AM</text>
      <rect x={0} y={760} width={W} height={70} fill="#1d2026" stroke={INK} strokeWidth={4} />
      <g transform={`translate(210 ${lerp(300, 760, clamp(S.c4_milk))})`} opacity={clamp(S.c4_milk * 3)}>
        <path d="M -55 -150 L 55 -150 L 44 0 L -44 0 Z" fill="#f4efe6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={-50} y={-150} width={100} height={22} rx={6} fill="#4a4036" stroke={INK} strokeWidth={4} />
        <path d="M -52 -104 L 52 -104 L 47 -66 L -47 -66 Z" fill="#6b3f86" stroke={INK} strokeWidth={3.5} />
        <circle cx={0} cy={-85} r={14} fill="#f4efe6" stroke={INK} strokeWidth={3} />
        <path d="M -20 -176 q 10 -14 0 -28 M 6 -176 q 10 -14 0 -28 M 30 -176 q 10 -14 0 -28" fill="none" stroke="#f1ead6" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
      </g>
      <g transform={`translate(450 ${lerp(300, 760, clamp(S.c4_cig))}) rotate(-4)`} opacity={clamp(S.c4_cig * 3)}>
        <rect x={-85} y={-190} width={170} height={190} fill="#e9e4d4" stroke={INK} strokeWidth={5} />
        <rect x={-72} y={-176} width={144} height={30} fill="#2a2a2e" />
        <rect x={-72} y={-134} width={64} height={52} fill="#9aa7b4" stroke={INK} strokeWidth={2.5} />
        {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={0} y1={-132 + i * 11} x2={72} y2={-132 + i * 11} stroke={INK} strokeWidth={3} opacity={0.7} />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={`l${i}`} x1={-72} y1={-70 + i * 11} x2={72 - (i % 3) * 18} y2={-70 + i * 11} stroke={INK} strokeWidth={2.6} opacity={0.55} />)}
      </g>
            {[0, 1, 2].map((i) => <ellipse key={i} cx={560 + i * 26} cy={790 - i * 4} rx={20} ry={7} fill="#d9a441" stroke={INK} strokeWidth={2.5} opacity={clamp(S.c4_milk * 3)} />)}
    </g>
  );
};

/* ---- 5: the doors keep closing on him */
export const Sc5: React.FC = () => (
  <g>
    <rect width={W} height={H} fill={PAL.wall} />
    <StoreBand y={150} />
    <Doors x={60} y={330} w={600} h={620} open={S.c5_open} sensorOn={S.c5_open > 0.5}>
      <NightLot y0={330} h={620} />
      <Doodle x={360} y={836} s={1.45} kind="man" pose={{ ...idlePose(), head: 10 }} mouth="none" />
    </Doors>
    <rect x={140} y={1000} width={440} height={34} rx={8} fill="#6b5a48" stroke={INK} strokeWidth={3} />
  </g>
);

/* ---- 6: Dana shoves him out with a cart, locks up, he bumps the glass */
export const Sc6: React.FC = () => {
  const bump = S.c6_bump;
  const manX = lerp(380, 360, S.c6_out) + bump * 0;
  const manS = lerp(1.25, 0.95, S.c6_out) + bump * 0.22;
  const manY = lerp(870, 700, S.c6_out);
  return (
    <g>
      <rect width={W} height={H} fill={PAL.wall} />
      <StoreBand y={150} />
      <g transform={`translate(${S.c6_shake} 0)`}>
        <Doors x={60} y={330} w={600} h={620} open={S.c6_open} sensorOn={false}>
          <NightLot y0={330} h={620} />
          <Doodle x={manX} y={manY} s={manS} kind="man" pose={walkPose(S.c6_walk, 8)} mouth={bump > 0.1 ? 'o' : 'none'} />
        </Doors>
        {bump > 0.5 && <g stroke="#fff" strokeWidth={4} opacity={bump}>{[0, 1, 2, 3, 4].map((i) => <line key={i} x1={360 + (i - 2) * 24} y1={620} x2={360 + (i - 2) * 60} y2={560 - Math.abs(i - 2) * 10} />)}</g>}
      </g>
      <Floor y={976} />
      <Shopcart x={lerp(150, 330, S.c6_push)} y={1070} s={2.1} />
      <Doodle x={lerp(70, 250, S.c6_push)} y={1000} s={1.6} kind="dana" pose={walkPose(S.c6_walk * 1.1, 14)} mouth="none" />
      {S.c6_lock > 0 && <g transform={`translate(360 ${300 - 30 * (1 - S.c6_lock)}) scale(${S.c6_lock})`}><rect x={-34} y={-14} width={68} height={52} rx={8} fill="#c93a2e" stroke={INK} strokeWidth={4} /><path d="M -18 -14 L -18 -34 A 18 18 0 0 1 18 -34 L 18 -14" fill="none" stroke={INK} strokeWidth={6} /></g>}
    </g>
  );
};

/* ---- 7: sixteen cameras, everyone is running */
export const Sc7: React.FC = () => (
  <g>
    <rect width={W} height={H} fill="#cfc09f" />
    <g transform={`translate(360 560) scale(${1 + S.c7_zoom * 0.2}) translate(-360 -560)`}>
      <rect x={30} y={170} width={660} height={780} rx={12} fill="#2b3340" stroke={INK} strokeWidth={5} />
      {Array.from({ length: 12 }, (_, i) => {
        const cx = 50 + (i % 4) * 160, cy = 190 + Math.floor(i / 4) * 250;
        const vis = clamp(S.c7_show * 16 - i);
        return (
          <g key={i} opacity={vis}>
            <rect x={cx} y={cy} width={150} height={238} fill="#41576d" stroke={INK} strokeWidth={3} />
            <rect x={cx} y={cy + 170} width={150} height={68} fill="#364a5d" />
            <text x={cx + 8} y={cy + 20} fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={16} fill="#cfe3ee">CH {String(i + 1).padStart(2, '0')}</text>
            <circle cx={cx + 136} cy={cy + 14} r={5} fill={Math.floor(S.c7_phase * 0.5 + i) % 2 ? '#e5392b' : '#7a2a24'} />
            {Array.from({ length: 1 + (i % 3) }, (_, k) => {
              const x = cx + 20 + ((S.c7_phase * (22 + k * 9) * (i % 2 ? 1 : -1) + i * 40 + k * 55) % 120 + 120) % 120;
              return <g key={k} transform={`translate(${x} ${cy + 214}) scale(1.1)`}>
                <circle cx={0} cy={-62} r={9} fill="#e8f2f6" stroke={INK} strokeWidth={2} />
                <line x1={0} y1={-52} x2={0} y2={-24} stroke="#e8f2f6" strokeWidth={4} strokeLinecap="round" />
                <line x1={0} y1={-24} x2={Math.sin(S.c7_phase * 6 + k) * 14} y2={0} stroke="#e8f2f6" strokeWidth={4} strokeLinecap="round" />
                <line x1={0} y1={-24} x2={-Math.sin(S.c7_phase * 6 + k) * 14} y2={0} stroke="#e8f2f6" strokeWidth={4} strokeLinecap="round" />
                <line x1={0} y1={-46} x2={Math.sin(S.c7_phase * 6 + k + 2) * 14} y2={-30} stroke="#e8f2f6" strokeWidth={4} strokeLinecap="round" />
              </g>;
            })}
          </g>
        );
      })}
    </g>
    <rect x={0} y={1000} width={W} height={280} fill="#8a6f4e" stroke={INK} strokeWidth={4} />
  </g>
);

/* ---- 8: Dana grabs her keys and leaves */
export const Sc8: React.FC = () => {
  const dx = S.c8_danaX;
  const walking = S.c8_moving > 0.5;
  const danaPose = walking ? walkPose(S.c8_walk, 10) : { ...idlePose(), lU: lerp(4, 150, S.c8_keys), lF: lerp(8, 160, S.c8_keys) };
  const pull = 1 + S.c8_pull * 0.0;
  return (
    <g>
      <g transform={`translate(360 760) scale(${lerp(1.25, 1, S.c8_pull)}) translate(-360 -760)`}>
        <rect width={W} height={H} fill="#d6c7a4" />
        <rect y={900} width={W} height={380} fill="#b8a983" />
        <line x1={0} y1={900} x2={W} y2={900} stroke={INK} strokeWidth={4} />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={380 + i * 74} y={420} width={68} height={480} fill="#6b3f86" stroke={INK} strokeWidth={4} />)}
        <rect x={60} y={400} width={130} height={170} fill="#d9a441" stroke={INK} strokeWidth={4} />
        <text x={125} y={440} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={22} fill={INK}>SHIFTS</text>
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1={74 + (i % 4) * 28} y1={460 + Math.floor(i / 4) * 34} x2={92 + (i % 4) * 28} y2={460 + Math.floor(i / 4) * 34} stroke={INK} strokeWidth={2} />)}
        <rect x={250} y={450} width={50} height={80} rx={6} fill="#7a6a54" stroke={INK} strokeWidth={4} />
        <circle cx={275} cy={535} r={9} fill="#d9d4c0" stroke={INK} strokeWidth={3} /><rect x={270} y={535} width={10} height={30} fill="#d9d4c0" stroke={INK} strokeWidth={2} opacity={1 - S.c8_keys} />
        <g transform={`translate(${S.c8_exit > 0 ? 0 : 0} 0)`}>
          <polygon points={`560,380 650,380 650,900 560,900`} fill="#2a2e38" stroke={INK} strokeWidth={4} />
          <polygon points={`560,380 ${560 + 90 - S.c8_door * 60},${380 + S.c8_door * 14} ${560 + 90 - S.c8_door * 60},${900 - S.c8_door * 14} 560,900`} fill="#7a8794" stroke={INK} strokeWidth={4} />
        </g>
        <Doodle x={dx} y={820} s={1.8} kind="dana" flip={!walking} pose={danaPose} mouth="none" opacity={S.c8_goneO || 1} />
        <Doodle x={200} y={820} s={1.8} kind="hero" pose={{ ...idlePose(Math.sin(S.c8_idle) * 1.5), head: 0 }} />
        {S.c8_bubble > 0 && (
          <g transform={`translate(${dx - 20} 470) scale(${S.c8_bubble})`}>
            <path d="M -120 -60 Q -120 -90 -90 -90 L 150 -90 Q 180 -90 180 -60 L 180 20 Q 180 50 150 50 L -10 50 L -40 86 L -50 50 L -90 50 Q -120 50 -120 20 Z" fill="#fff" stroke={INK} strokeWidth={4} />
            <text x={30} y={-26} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={34} fill={INK}>45 MIN.</text>
            <text x={30} y={22} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={26} fill={INK}>LOCK UP BEHIND ME.</text>
          </g>
        )}
        {S.c8_keys > 0.6 && S.c8_moving < 0.5 && <g transform={`translate(${dx + 40} 560)`}><circle r={11} fill="none" stroke="#d9a441" strokeWidth={4} /><rect x={-4} y={10} width={8} height={26} fill="#d9a441" stroke={INK} strokeWidth={2} /></g>}
      </g>
      <rect width={W} height={H} fill="#1a1020" opacity={S.c8_dim} />
    </g>
  );
};

/* ---- 9: forty thousand products and a wall of glass */
export const Sc9: React.FC = () => (
  <g>
    <Aisle farGlass farOpen={0} pushed={S.c9_push} />
    <Doodle x={360} y={640} s={0.35} kind="hero" pose={idlePose()} mouth="none" />
    <Floor y={1200} />
  </g>
);

/* ---- 10: PROBLEM 1 card */
export const Sc10: React.FC = () => {
  const k = clamp(S.c10_in);
  return (
    <g>
      <CardBg />
      <g transform={`translate(360 380) scale(${lerp(0.4, 1, k)})`} opacity={k}>
        <rect x={-62} y={-62} width={124} height={124} fill="#cfe3ee" stroke={INK} strokeWidth={6} />
        <line x1={0} y1={-62} x2={0} y2={62} stroke={INK} strokeWidth={6} /><line x1={-62} y1={0} x2={62} y2={0} stroke={INK} strokeWidth={6} />
        <line x1={-40} y1={-30} x2={-12} y2={-8} stroke="#fff" strokeWidth={7} opacity={0.8} />
      </g>
      <g opacity={clamp(S.c10_text)} transform={`translate(0 ${lerp(30, 0, clamp(S.c10_text))})`}>
        <text x={360} y={560} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={44} fill="#6f7f6a" letterSpacing={8}>PROBLEM ONE</text>
        <text x={360} y={660} textAnchor="middle" fontFamily="Patrick Hand, sans-serif" fontWeight={700} fontSize={104} fill={INK} letterSpacing={4}>THE GLASS</text>
      </g>
    </g>
  );
};

export { Shopcart, ShelfRow, Sign, ink, rnd, runPose };
