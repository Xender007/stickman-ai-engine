import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {GROUND_Y, W} from '../config';
import {Lights, lightLevel} from './Common';
import type {Palette} from './palettes';

type Win = {x: number; y: number; roll: number; fire: boolean; seed: string};
export type Building = {x: number; w: number; h: number; seed: string; roof: number; antenna: boolean; windows: Win[]};

const buildLayer = (name: string, span: number, minH: number, maxH: number, withWindows: boolean): Building[] => {
  const out: Building[] = [];
  for (let x = -300, i = 0; x < span; i++) {
    const seed = `${name}-${i}`;
    const w = 150 + random(seed + 'w') * 150;
    const h = minH + random(seed + 'h') * (maxH - minH);
    const windows: Win[] = [];
    if (withWindows) {
      const cols = Math.floor((w - 36) / 40);
      const rows = Math.floor((h - 70) / 56);
      const ox = (w - (cols * 40 - 18)) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ws = `${seed}-${r}-${c}`;
          windows.push({x: ox + c * 40, y: 44 + r * 56, roll: random(ws), fire: random(ws + 'f') < 0.07, seed: ws});
        }
      }
    }
    const roofRoll = random(seed + 'r');
    out.push({x, w, h, seed, windows, roof: roofRoll < 0.45 ? 26 + roofRoll * 40 : 0, antenna: roofRoll < 0.18});
    x += w + 8 + random(seed + 'g') * 50;
  }
  return out;
};

const cache = new Map<string, {far: Building[]; mid: Building[]}>();
/** One skyline per series seed, so the same city appears in every part. */
export const cityFor = (seed: string) => {
  let c = cache.get(seed);
  if (!c) {
    c = {far: buildLayer(`${seed}-far`, 3200, 760, 1180, false), mid: buildLayer(`${seed}-mid`, 7000, 520, 1000, true)};
    cache.set(seed, c);
  }
  return c;
};

export const BuildingLayer: React.FC<{
  blds: Building[]; camX: number; depth: number; fill: string; pal: Palette; t: number; lights: Lights | null;
}> = ({blds, camX, depth, fill, pal, t, lights}) => {
  const off = -camX * depth;
  return (
    <g transform={`translate(${off} 0)`}>
      {blds
        .filter((b) => b.x + off < W + 60 && b.x + b.w + off > -60)
        .map((b) => (
          <g key={b.seed} transform={`translate(${b.x} ${GROUND_Y - b.h})`}>
            {b.roof ? <rect x={b.w * 0.2} y={-b.roof} width={b.w * 0.3} height={b.roof + 2} fill={fill} /> : null}
            {b.antenna ? <rect x={b.w * 0.33} y={-b.roof - 90} width={5} height={92} fill={fill} /> : null}
            <rect width={b.w} height={b.h + 4} fill={fill} />
            {b.windows.map((w) => {
              if (pal.fire && w.fire && t > random(w.seed + 'd') * 1.8) {
                return <rect key={w.seed} x={w.x} y={w.y} width={18} height={26} fill="#ff6a1f" opacity={0.7 + 0.3 * noise2D(w.seed, t * 4, 0)} />;
              }
              const on = w.roll < pal.litChance && lightLevel(t, w.seed, lights) > 0;
              return <rect key={w.seed} x={w.x} y={w.y} width={18} height={26} fill={on ? pal.lit : pal.unlit} />;
            })}
          </g>
        ))}
    </g>
  );
};

/** Street lamps on the ground layer; lit only in moods where windows are lit. */
export const Lamps: React.FC<{camX: number; t: number; lights: Lights | null; pal: Palette}> = ({camX, t, lights, pal}) => {
  const gap = 560;
  const first = Math.floor((camX - 460) / gap);
  return (
    <g>
      {Array.from({length: 4}, (_, i) => {
        const k = first + i;
        const x = 260 + k * gap - camX;
        const on = pal.litChance > 0 ? lightLevel(t, `lamp${k}`, lights) : 0;
        const top = GROUND_Y - 330;
        return (
          <g key={k}>
            <circle cx={x + 34} cy={top + 14} r={130} fill="url(#lampGlow)" opacity={0.6 * on} />
            <rect x={x - 4} y={top} width={8} height={330} fill={pal.curb} />
            <rect x={x - 4} y={top} width={44} height={7} fill={pal.curb} />
            <rect x={x + 22} y={top + 4} width={26} height={12} rx={4} fill={on ? '#ffe2a8' : pal.curb} />
          </g>
        );
      })}
    </g>
  );
};
