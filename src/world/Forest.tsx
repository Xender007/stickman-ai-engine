import React from 'react';
import {random} from 'remotion';
import {GROUND_Y, W} from '../config';

type Tree = {x: number; h: number; w: number; key: string};

const cache = new Map<string, Tree[]>();
const trees = (seed: string, span: number, minH: number, maxH: number): Tree[] => {
  const id = `${seed}:${span}:${minH}`;
  let out = cache.get(id);
  if (!out) {
    out = [];
    for (let x = -200, i = 0; x < span; i++) {
      const key = `${id}-${i}`;
      const h = minH + random(key) * (maxH - minH);
      out.push({x, h, w: h * (0.32 + random(key + 'w') * 0.1), key});
      x += 70 + random(key + 'g') * 110;
    }
    cache.set(id, out);
  }
  return out;
};

/** Pine silhouettes: three stacked triangles on a trunk. */
const pine = ({x, h, w}: Tree, baseY: number) => {
  const tiers = [0, 0.3, 0.55].map((f, i) => {
    const bottom = baseY - h * (0.12 + f);
    const top = bottom - h * (0.5 - i * 0.08);
    const half = (w / 2) * (1 - i * 0.22);
    return `M${x - half} ${bottom}L${x} ${top}L${x + half} ${bottom}Z`;
  });
  return `${tiers.join('')}M${x - 6} ${baseY}L${x - 6} ${baseY - h * 0.14}L${x + 6} ${baseY - h * 0.14}L${x + 6} ${baseY}Z`;
};

export const TreeLayer: React.FC<{seed: string; camX: number; depth: number; fill: string; baseY: number; minH: number; maxH: number}> = ({
  seed, camX, depth, fill, baseY, minH, maxH,
}) => {
  const off = -camX * depth;
  const list = trees(`${seed}-${depth}`, 7000, minH, maxH).filter((t) => t.x + off > -300 && t.x + off < W + 300);
  return (
    <g transform={`translate(${off} 0)`}>
      <path d={list.map((t) => pine(t, baseY)).join('')} fill={fill} />
    </g>
  );
};

export const ForestBack: React.FC<{seed: string; camX: number; far: string; near: string}> = ({seed, camX, far, near}) => (
  <>
    <TreeLayer seed={seed} camX={camX} depth={0.25} fill={far} baseY={GROUND_Y - 60} minH={380} maxH={620} />
    <TreeLayer seed={seed} camX={camX} depth={0.55} fill={near} baseY={GROUND_Y + 4} minH={520} maxH={900} />
    <rect x={-200} y={GROUND_Y - 95} width={W + 400} height={100} fill={near} opacity={0.75} />
  </>
);
