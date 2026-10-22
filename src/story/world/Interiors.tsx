import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {H, W} from '../../config';
import {ANTON, MONTSERRAT} from '../../fonts';
import {sosOn} from '../sos';

const FLOOR = 1500;

/** Interior shots share the figure glow filters with the outdoor world. */
const Defs: React.FC = () => (
  <defs>
    <filter id="glowWide" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={10} /></filter>
    <filter id="glowTight" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={2.5} /></filter>
    <filter id="iSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={18} /></filter>
    <radialGradient id="iGlow">
      <stop offset="0" stopColor="#ffd9a0" stopOpacity={0.8} />
      <stop offset="1" stopColor="#ffd9a0" stopOpacity={0} />
    </radialGradient>
    <filter id="tGlow" x="-30%" y="-60%" width="160%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={9} result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <radialGradient id="iVignette" cx="0.5" cy="0.45" r="0.75">
      <stop offset="0.5" stopColor="#000" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.7} />
    </radialGradient>
  </defs>
);

export type RadioDisplay = 'off' | 'ready' | 'static' | 'alert' | 'warning';

/** The bakery's coast-watch radio: a box with a grille and a text display. (x, y) is its bottom-left corner. */
const Radio: React.FC<{x: number; y: number; s: number; display: RadioDisplay; t: number}> = ({x, y, s, display, t}) => {
  const w = 200 * s;
  const h = 120 * s;
  const text = display === 'alert' ? (t % 0.8 < 0.55 ? 'ALERT PENDING' : '') : display === 'warning' ? (t % 0.6 < 0.4 ? 'WARNING' : '') : display === 'ready' ? 'CH 9' : '';
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} rx={10 * s} fill="#23252b" stroke="#000" strokeWidth={3 * s} />
      {Array.from({length: 12}, (_, i) => <circle key={i} cx={x + 26 * s + (i % 4) * 14 * s} cy={y - h + 62 * s + Math.floor(i / 4) * 14 * s} r={4 * s} fill="#0c0d10" />)}
      <rect x={x + 92 * s} y={y - h + 20 * s} width={96 * s} height={34 * s} fill={display === 'off' ? '#0a0b0d' : display === 'alert' ? '#3a2405' : display === 'warning' ? '#3a0808' : '#10261b'} />
      {display === 'static'
        ? Array.from({length: 9}, (_, i) => (
            <rect key={i} x={x + 96 * s + i * 10 * s} y={y - h + 26 * s + (1 - Math.abs(noise2D(`st${i}`, t * 12, 0))) * 18 * s}
              width={6 * s} height={Math.abs(noise2D(`sh${i}`, t * 12, 0)) * 22 * s + 2 * s} fill="#7dd3a0" />
          ))
        : <text x={x + 140 * s} y={y - h + 45 * s} textAnchor="middle" fontFamily={ANTON} fontSize={(display === 'alert' ? 21 : display === 'warning' ? 24 : 18) * s} fill={display === 'alert' ? '#ffc24a' : display === 'warning' ? '#ff5a4a' : '#7dd3a0'}
          filter={display === 'alert' || display === 'warning' ? 'url(#tGlow)' : undefined}>{text}</text>}
      <rect x={x + 150 * s} y={y - h - 70 * s} width={5 * s} height={70 * s} fill="#23252b" />
      <circle cx={x + 170 * s} cy={y - 26 * s} r={9 * s} fill="#3a3d45" />
    </g>
  );
};

const Clock: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#e9e1cf" stroke="#3a2a20" strokeWidth={8} />
    <path d={`M${x} ${y}L${x + r * 0.45} ${y + r * 0.1}`} stroke="#222" strokeWidth={7} strokeLinecap="round" />
    <path d={`M${x} ${y}L${x + r * 0.08} ${y - r * 0.8}`} stroke="#222" strokeWidth={4} strokeLinecap="round" />
  </g>
);

export type BakeryProps = {
  t: number;
  lights: number; // ceiling light and window glow, 1..0
  ovens: number; // oven fire, 0..1
  shake: number; // 0..1
  hum: number; // window glass vibration, 0..1
  radio: RadioDisplay;
  zoom?: {x: number; y: number; z: number}; // screen point to zoom into
  children?: React.ReactNode; // actors in screen coordinates (drawn behind the counter)
};

export const Bakery: React.FC<BakeryProps> = ({t, lights, ovens, shake, hum, radio, zoom, children}) => {
  const sx = noise2D('bsx', t * 16, 0) * shake * 26;
  const sy = noise2D('bsy', t * 16, 0) * shake * 18;
  const swing = noise2D('lamp', t * 2.5, 0) * shake * 16;
  const wall = lights > 0.5 ? '#3a2a22' : '#1a1311';
  const fire = ovens * (0.85 + 0.15 * noise2D('fire', t * 6, 0));
  const z = zoom ? `translate(${W / 2} ${H / 2}) scale(${zoom.z}) translate(${-zoom.x} ${-zoom.y})` : '';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <Defs />
      <rect width={W} height={H} fill="#0b0807" />
      <g transform={`${z} translate(${sx} ${sy})`}>
        <rect x={-200} y={-200} width={W + 400} height={FLOOR + 200} fill={wall} />
        {Array.from({length: 14}, (_, i) => <rect key={i} x={-200} y={420 + i * 80} width={W + 400} height={3} fill="#00000030" />)}
        {/* ovens */}
        <rect x={30} y={700} width={390} height={800} fill="#4a2a1f" />
        {[0, 1].map((k) => (
          <g key={k}>
            <path d={`M${70} ${1080 + k * 240}h310v-120a155 120 0 0 0 -310 0z`} fill="#140a07" />
            <path d={`M${90} ${1080 + k * 240}h270v-100a135 100 0 0 0 -270 0z`} fill="#ff7a2a" opacity={0.15 + 0.75 * fire} />
            <ellipse cx={225} cy={1040 + k * 240} rx={190} ry={120} fill="#ff8a3a" opacity={0.25 * fire} filter="url(#iSoft)" />
          </g>
        ))}
        {/* bread shelves */}
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x={470} y={640 + r * 120} width={230} height={10} fill="#2a1a12" />
            {Array.from({length: 4}, (_, i) => <ellipse key={i} cx={500 + i * 56} cy={622 + r * 120} rx={24} ry={16} fill="#c58a4a" opacity={0.6 + 0.4 * lights} />)}
          </g>
        ))}
        <Clock x={585} y={470} r={62} />
        {/* window onto the street */}
        <g>
          <rect x={720} y={500} width={300} height={400} fill="#0d1630" />
          <circle cx={830} cy={760} r={90} fill="url(#iGlow)" opacity={0.5 * lights + 0.15} />
          <rect x={720} y={500} width={300} height={400} fill="none" stroke="#1a110d" strokeWidth={18} />
          <rect x={866} y={500} width={8} height={400} fill="#1a110d" />
          {Array.from({length: 4}, (_, i) => (
            <path key={i} d={`M${740 + i * 70 + hum * noise2D(`g${i}`, t * 40, 0) * 6} 520l40 360`} stroke="#ffffff" strokeOpacity={0.08 + 0.25 * hum} strokeWidth={3} />
          ))}
        </g>
        {/* ceiling lamp */}
        <g transform={`rotate(${swing} 560 0)`}>
          <rect x={557} y={0} width={6} height={250} fill="#140d0a" />
          <path d="M500 300L620 300L590 250L530 250Z" fill="#2a1d16" />
          {lights > 0.05 ? <circle cx={560} cy={330} r={260} fill="url(#iGlow)" opacity={0.55 * lights} /> : null}
        </g>
        {children}
        {/* counter (in front of the actors) */}
        <rect x={380} y={1230} width={760} height={270} fill="#5a3a26" />
        <rect x={370} y={1218} width={780} height={18} fill="#7a5236" />
        <Radio x={820} y={1218} s={1} display={radio} t={t} />
        <g transform="rotate(-8 778 1218)">
          <rect x={752} y={1150} width={56} height={68} rx={5} fill="#efe8da" />
          <rect x={752} y={1150} width={56} height={14} rx={3} fill="#22355e" />
        </g>
        <rect x={-200} y={FLOOR} width={W + 400} height={H} fill="#140d0a" />
        {lights < 0.5 ? <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#000" opacity={0.55 * (1 - lights) * (1 - 0.4 * fire)} /> : null}
      </g>
      <rect width={W} height={H} fill="url(#iVignette)" />
    </svg>
  );
};

/** The ridge shelter, seen from inside: the coastal window on the left wall, desk with the station's kit. */
export type ShelterProps = {
  t: number;
  window: {lights: {x: number; y: number; phase: number; from: number}[]}; // answering lamps seen outside
  lampInWindow?: number; // Mara's lamp at the window: lens brightness 0..1 (null = not there)
  receiver?: 'idle' | 'live';
  zoom?: {x: number; y: number; z: number};
  children?: React.ReactNode;
};

export const ShelterRoom: React.FC<ShelterProps> = ({t, window: win, lampInWindow, receiver = 'idle', zoom, children}) => {
  const z = zoom ? `translate(${W / 2} ${H / 2}) scale(${zoom.z}) translate(${-zoom.x} ${-zoom.y})` : '';
  const flash = lampInWindow ?? 0;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
      <Defs />
      <rect width={W} height={H} fill="#0e0c0b" />
      <g transform={z}>
        <rect x={-200} y={-200} width={W + 400} height={FLOOR + 200} fill="#3b3028" />
        {Array.from({length: 16}, (_, i) => <rect key={i} x={-200 + i * 96} y={-200} width={4} height={FLOOR + 200} fill="#00000030" />)}
        {/* window over the flooded plain (the sea side is screen-left) */}
        <rect x={60} y={520} width={380} height={470} fill="#9a9a96" />
        <rect x={60} y={800} width={380} height={190} fill="#4c4840" />
        {Array.from({length: 7}, (_, i) => <rect key={i} x={80 + i * 52} y={800 - 10 - random(`wr${i}`) * 40} width={30} height={60} fill="#3a3a3c" />)}
        {win.lights.filter((l) => t >= l.from).map((l, i) =>
          sosOn((t - l.from) * 30 + l.phase) ? <circle key={i} cx={l.x} cy={l.y} r={9} fill="#fff4cc" /> : null)}
        <rect x={60} y={520} width={380} height={470} fill="none" stroke="#241b15" strokeWidth={22} />
        <rect x={244} y={520} width={10} height={470} fill="#241b15" />
        <ellipse cx={250} cy={760} rx={330} ry={300} fill="#e9e4d8" opacity={0.18} filter="url(#iSoft)" />
        {lampInWindow !== undefined ? (
          <g>
            <rect x={300} y={930} width={90} height={70} rx={8} fill="#2b2f36" />
            <circle cx={300} cy={962} r={22} fill={flash > 0.5 ? '#fff4c8' : '#4a4a50'} />
            {flash > 0.5 ? <circle cx={300} cy={962} r={240} fill="url(#iGlow)" /> : null}
          </g>
        ) : null}
        {/* shelf with the receiver */}
        <rect x={700} y={1040} width={380} height={14} fill="#241b15" />
        <rect x={760} y={930} width={250} height={110} rx={8} fill="#26292f" stroke="#000" strokeWidth={3} />
        <rect x={780} y={950} width={110} height={36} fill="#10261b" />
        <text x={835} y={977} textAnchor="middle" fontFamily={ANTON} fontSize={24} fill="#7dd3a0">CH 9</text>
        <circle cx={960} cy={968} r={14} fill={receiver === 'live' ? '#ff3b3b' : '#3a1414'} />
        {receiver === 'live' ? <circle cx={960} cy={968} r={50} fill="#ff3b3b" opacity={0.25} filter="url(#iSoft)" /> : null}
        {children}
        {/* desk with roster, logbook, recorder and microphone */}
        <rect x={420} y={1240} width={720} height={260} fill="#4a3526" />
        <rect x={410} y={1226} width={740} height={18} fill="#6a4b34" />
        <rect x={470} y={1190} width={160} height={36} fill="#e9e2d0" />
        <rect x={660} y={1186} width={130} height={40} fill="#5a3a26" />
        <rect x={830} y={1160} width={170} height={66} rx={6} fill="#2a2c31" />
        <circle cx={870} cy={1190} r={18} fill="#111" />
        <circle cx={940} cy={1190} r={18} fill="#111" />
        <rect x={1020} y={1120} width={8} height={106} fill="#1a1a1d" />
        <rect x={1006} y={1096} width={36} height={40} rx={14} fill="#1a1a1d" />
        <rect x={-200} y={FLOOR} width={W + 400} height={H} fill="#1a1411" />
      </g>
      <rect width={W} height={H} fill="url(#iVignette)" />
    </svg>
  );
};

// ---------- full-frame inserts (clues framed to read on a phone) ----------
const InsertFrame: React.FC<{bg: string; children: React.ReactNode; t: number; drift?: number}> = ({bg, children, t, drift = 1}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    <Defs />
    <rect width={W} height={H} fill={bg} />
    {Array.from({length: 22}, (_, i) => <rect key={i} x={0} y={i * 92} width={W} height={2} fill="#00000025" />)}
    <g transform={`translate(${W / 2} ${1050}) scale(${1 + 0.012 * t * drift}) translate(${-W / 2} ${-1050})`}>{children}</g>
    <rect width={W} height={H} fill="url(#iVignette)" />
  </svg>
);

const Logo: React.FC<{x: number; y: number; r: number; color?: string}> = ({x, y, r, color = '#f2ead8'}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={r * 0.14} />
    <path d={`M${x - r * 0.6} ${y + r * 0.15}q${r * 0.3} ${-r * 0.4} ${r * 0.6} 0t${r * 0.6} 0`} fill="none" stroke={color} strokeWidth={r * 0.14} strokeLinecap="round" />
  </g>
);

/** P1-S1: the coast-watch card beside the radio. Must match the P3 roster exactly: BAKERY 4 · RAVI. */
export const CardInsert: React.FC<{t: number; lights: number}> = ({t, lights}) => (
  <InsertFrame bg={lights > 0.5 ? '#5a3a26' : '#24170f'} t={t}>
    <g transform="rotate(-3 540 1050)">
      <rect x={150} y={780} width={780} height={480} rx={26} fill="#efe8da" />
      <rect x={150} y={780} width={780} height={130} rx={26} fill="#22355e" />
      <rect x={150} y={880} width={780} height={30} fill="#22355e" />
      <Logo x={240} y={845} r={42} />
      <text x={305} y={872} fontFamily={MONTSERRAT} fontWeight={800} fontSize={60} fill="#f2ead8" letterSpacing={4}>COAST WATCH</text>
      <text x={200} y={1010} fontFamily={MONTSERRAT} fontWeight={800} fontSize={72} fill="#22355e">BAKERY 4</text>
      <text x={200} y={1190} fontFamily={ANTON} fontSize={170} fill="#121212">RAVI</text>
      <rect x={150} y={780} width={780} height={480} rx={26} fill="none" stroke="#ffd98a" strokeWidth={10} opacity={0.5 + 0.4 * Math.sin(t * 5)} filter="url(#tGlow)" />
    </g>
    <g transform="translate(620 1520) scale(1.6)"><Radio x={0} y={0} s={1} display="ready" t={t} /></g>
  </InsertFrame>
);

/** P1-S2: the radio's alert display, then the power dies. */
export const RadioInsert: React.FC<{t: number; display: RadioDisplay}> = ({t, display}) => (
  <InsertFrame bg="#2a1d16" t={t} drift={0.6}>
    <g transform="translate(140 1360) scale(4)"><Radio x={0} y={0} s={1} display={display} t={t} /></g>
  </InsertFrame>
);

const Page: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <g transform="rotate(-2 540 1050)">
    <rect x={110} y={700} width={860} height={760} rx={10} fill="#ece4d0" />
    {Array.from({length: 9}, (_, i) => <rect key={i} x={150} y={880 + i * 66} width={780} height={2} fill="#9fb3c8" />)}
    <Logo x={190} y={772} r={36} color="#22355e" />
    <text x={245} y={795} fontFamily={MONTSERRAT} fontWeight={800} fontSize={48} fill="#22355e" letterSpacing={2}>{title}</text>
    {children}
  </g>
);

export const ROSTER = ['MARKET 1 · ASHA', 'BAKERY 4 · RAVI', 'HARBOR 2 · DEV', 'PIER 3 · TOMAS'];

/** P3-S1/S2: the station roster. `circle` rings an entry; `finger` points at one (Ravi's touch). */
export const RosterInsert: React.FC<{t: number; circle: number | null; finger: number | null; fingerAge: number}> = ({t, circle, finger, fingerAge}) => (
  <InsertFrame bg="#4a3526" t={t}>
    <Page title="COAST WATCH ROSTER">
      {ROSTER.map((r, i) => (
        <text key={r} x={170} y={940 + i * 120} fontFamily={MONTSERRAT} fontWeight={800} fontSize={i === circle || i === finger ? 72 : 60} fill={i === circle || i === finger ? '#121212' : '#5a5a5a'}
          filter={i === circle ? 'url(#tGlow)' : undefined}>{r}</text>
      ))}
      {circle !== null ? <ellipse cx={500} cy={918 + circle * 120} rx={370} ry={62} fill="none" stroke="#b4473f" strokeWidth={8} /> : null}
      {finger !== null ? (
        <g transform={`translate(${960 - 60 * Math.min(1, fingerAge * 2)} ${918 + finger * 120})`}>
          <path d="M0 0L260 30" stroke="#ffffff" strokeWidth={22} strokeLinecap="round" />
          <circle cx={0} cy={0} r={13} fill="#ffffff" />
        </g>
      ) : null}
    </Page>
  </InsertFrame>
);

export const LOG = ['04:03  WARNING CALL · CITY DESK: “HOLD”', '04:04  BAKERY 4 · NO REPLY · STATIC', '04:05  SIRENS'];

/** P3-S3/S4: the station logbook. `lit` are the entries being read; the rest stay faint. */
export const LogInsert: React.FC<{t: number; lit: number[]}> = ({t, lit}) => (
  <InsertFrame bg="#4a3526" t={t}>
    <Page title="STATION LOG">
      {LOG.map((r, i) => (
        <text key={r} x={160} y={960 + i * 150} fontFamily={MONTSERRAT} fontWeight={800} fontSize={lit.includes(i) ? 48 : 42} fill={lit.includes(i) ? '#7a1410' : '#121212'} opacity={lit.includes(i) ? 1 : 0.18}
          filter={lit.includes(i) ? 'url(#tGlow)' : undefined}>{r}</text>
      ))}
      {lit.map((i) => <rect key={i} x={150} y={975 + i * 150} width={780} height={6} fill="#b4473f" opacity={0.8} />)}
    </Page>
  </InsertFrame>
);

/** P3-S3: the station recorder. While `playing` the reels turn and the PLAY light is on. */
export const RecorderInsert: React.FC<{t: number; playing: boolean; pressed: boolean}> = ({t, playing, pressed}) => {
  const turn = playing ? t * 200 : 0;
  return (
    <InsertFrame bg="#3b3028" t={t} drift={0.5}>
      <rect x={120} y={820} width={840} height={520} rx={30} fill="#2a2c31" stroke="#000" strokeWidth={6} />
      <text x={540} y={890} textAnchor="middle" fontFamily={MONTSERRAT} fontWeight={800} fontSize={36} fill="#b9bcc4" letterSpacing={3}>STATION LOG RECORDER</text>
      {[340, 740].map((cx) => (
        <g key={cx} transform={`rotate(${turn} ${cx} 1050)`}>
          <circle cx={cx} cy={1050} r={120} fill="#111" stroke="#555" strokeWidth={6} />
          {[0, 120, 240].map((a) => <rect key={a} x={cx - 8} y={950} width={16} height={70} fill="#444" transform={`rotate(${a} ${cx} 1050)`} />)}
          <circle cx={cx} cy={1050} r={20} fill="#666" />
        </g>
      ))}
      <rect x={300} y={1210} width={210} height={pressed ? 70 : 90} rx={10} fill={pressed ? '#1e5a36' : '#3a3d45'} transform={pressed ? 'translate(0 16)' : ''} />
      <text x={405} y={1268 + (pressed ? 8 : 0)} textAnchor="middle" fontFamily={ANTON} fontSize={52} fill="#e9f5ec" filter={pressed ? 'url(#tGlow)' : undefined}>▶ PLAY</text>
      <rect x={570} y={1210} width={210} height={90} rx={10} fill="#3a3d45" />
      <text x={675} y={1268} textAnchor="middle" fontFamily={ANTON} fontSize={52} fill="#c9ccd4">■ STOP</text>
      <circle cx={860} cy={1255} r={26} fill={playing ? '#3cff7a' : '#173a22'} />
      {playing ? <circle cx={860} cy={1255} r={80} fill="#3cff7a" opacity={0.25} filter="url(#iSoft)" /> : null}
    </InsertFrame>
  );
};

/** P3-S7: the receiver lights RX LIVE; when `tx`, Ravi's hand keys the microphone. */
export const ReceiverInsert: React.FC<{t: number; live: boolean; tx: boolean}> = ({t, live, tx}) => (
  <InsertFrame bg="#3b3028" t={t} drift={0.5}>
    <rect x={120} y={800} width={840} height={420} rx={26} fill="#26292f" stroke="#000" strokeWidth={6} />
    <rect x={170} y={860} width={440} height={150} fill="#10261b" />
    <text x={390} y={965} textAnchor="middle" fontFamily={ANTON} fontSize={100} fill="#7dd3a0">CH 9</text>
    <rect x={660} y={860} width={250} height={150} rx={12} fill={live ? '#5a1010' : '#2a1010'} />
    <text x={785} y={960} textAnchor="middle" fontFamily={ANTON} fontSize={live ? 84 : 70} fill={live ? '#ff8080' : '#5a2a2a'} filter={live ? 'url(#tGlow)' : undefined}>RX LIVE</text>
    {live ? <circle cx={785} cy={935} r={160} fill="#ff3b3b" opacity={0.2} filter="url(#iSoft)" /> : null}
    {Array.from({length: 18}, (_, i) => <circle key={i} cx={200 + (i % 9) * 46} cy={1080 + Math.floor(i / 9) * 46} r={12} fill="#0c0d10" />)}
    <g transform="translate(760 1150)">
      <rect x={-50} y={-10} width={100} height={170} rx={40} fill="#1a1a1d" />
      <rect x={-30} y={60} width={60} height={34} rx={8} fill={tx ? '#b4473f' : '#3a3d45'} />
      <text x={0} y={86} textAnchor="middle" fontFamily={ANTON} fontSize={26} fill="#fff">PTT</text>
      {tx ? <path d="M160 300L20 90" stroke="#ffffff" strokeWidth={24} strokeLinecap="round" /> : null}
    </g>
  </InsertFrame>
);
