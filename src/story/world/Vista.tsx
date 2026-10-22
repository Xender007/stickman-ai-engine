import React from 'react';
import {random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {W} from '../../config';
import {Look, mixColor} from './look';

/**
 * The city spreading to the horizon, in five depth rows behind the world. Dry, it is a night skyline with lit windows
 * (the tsunami wall rises behind it). Flooded, only the upper floors and roofs show above choppy water, some tilted or
 * collapsed, with foam at every waterline. Screen space: `horizon` is where the rows start, `bottom` where the
 * foreground world takes over.
 */
export const Vista: React.FC<{look: Look; t: number; camX: number; horizon: number; bottom: number; flood: number; lights: number; elevation: number}> = ({
  look, t, camX, horizon, bottom, flood, lights, elevation,
}) => {
  if (bottom - horizon < 40) return null;
  const rows = [0, 1, 2, 3, 4];
  const span = W + 600;
  const water = flood > 0.02;
  const chop = water
    ? Array.from({length: 70}, (_, i) => {
        const s = `ch${i}`;
        const k = random(s + 'k');
        const y = horizon + (bottom - horizon) * Math.pow(k, 0.8);
        const size = 6 + 26 * k;
        const x = ((((random(s) * span - camX * (0.1 + 0.3 * k) + t * 14 * (0.3 + k)) % span) + span) % span) - 300;
        const lift = Math.abs(noise2D(s, t * 0.8, 0));
        return <path key={s} d={`M${x - size} ${y}q${size} ${-size * 0.5 * (0.5 + lift)} ${size * 2} 0`} fill="none" stroke={look.foam} strokeOpacity={0.35 + 0.35 * k} strokeWidth={1.5 + 3 * k} />;
      })
    : null;
  return (
    <g>
      {water ? (
        <>
          <rect x={-200} y={horizon} width={W + 400} height={bottom - horizon + 400} fill={mixColor(look.waterHi, look.skyBottom, 0.25)} />
          <rect x={-200} y={horizon} width={W + 400} height={6} fill={look.foam} opacity={0.25} />
        </>
      ) : (
        <rect x={-200} y={horizon} width={W + 400} height={bottom - horizon + 400} fill={mixColor(look.ground, look.far, 0.5)} />
      )}
      {rows.map((r) => {
        const k = (r + 1) / rows.length; // 0.2 far .. 1 near
        const base = horizon + 14 + (bottom - horizon - 14) * Math.pow(k, 1.6) * elevation;
        const sc = (0.22 + 0.7 * k) * (0.55 + 0.45 * elevation);
        const fill = mixColor(look.far, look.town, 0.35 + 0.65 * k);
        const n = 15 - r;
        return (
          <g key={r}>
            {Array.from({length: n}, (_, i) => {
              const s = `v${r}-${i}`;
              const kind = random(s + 'kind');
              const bw = (70 + random(s + 'w') * 110) * sc * 1.5;
              const bh = (r === 0 ? 260 + random(s + 'h') * 420 : 120 + random(s + 'h') * 300) * sc * 1.6;
              const x = ((((i + random(s)) / n) * span - camX * (0.05 + 0.25 * k)) % span + span) % span - 300;
              // Flooded, only the top of each building shows; tall far towers keep more of their height.
              const shown = water ? bh * Math.max(0.12, 1 - flood * (r === 0 ? 0.5 : 0.85) * (0.75 + 0.5 * random(s + 'f'))) : bh;
              const top = base - shown;
              const tilt = water && random(s + 't') < 0.18 ? (random(s + 'tt') - 0.5) * 26 : 0;
              const house = kind < 0.3 && r >= 2;
              const spire = kind > 0.94 && r >= 1;
              const cols = Math.max(1, Math.floor(bw / (14 * sc + 10)));
              const winRows = Math.max(1, Math.floor(shown / (26 * sc + 12)));
              return (
                <g key={i} transform={`rotate(${tilt} ${x + bw / 2} ${base})`}>
                  {house ? (
                    <>
                      <rect x={x} y={top + bw * 0.25} width={bw} height={shown - bw * 0.25} fill={fill} />
                      <path d={`M${x - bw * 0.08} ${top + bw * 0.27}L${x + bw / 2} ${top - bw * 0.12}L${x + bw * 1.08} ${top + bw * 0.27}Z`} fill="#7e3a2e" />
                    </>
                  ) : spire ? (
                    <>
                      <rect x={x} y={top} width={bw * 0.6} height={shown} fill={fill} />
                      <path d={`M${x - bw * 0.05} ${top}L${x + bw * 0.3} ${top - bw * 1.1}L${x + bw * 0.65} ${top}Z`} fill={fill} />
                    </>
                  ) : (
                    <>
                      <rect x={x} y={top} width={bw} height={shown} fill={fill} />
                      <rect x={x - 3} y={top - 5 * sc} width={bw + 6} height={6 * sc} fill={mixColor(fill, '#000000', 0.2)} />
                      {kind > 0.75 && water ? <path d={`M${x} ${top}l${bw * 0.3} ${bw * 0.25}l${bw * 0.2} ${-bw * 0.15}l${bw * 0.5} ${bw * 0.3}V${top - 2}Z`} fill={look.skyBottom} opacity={0.6} /> : null}
                    </>
                  )}
                  {!house && !spire
                    ? Array.from({length: Math.min(40, cols * winRows)}, (_, wI) => {
                        const cx = wI % cols;
                        const ry = Math.floor(wI / cols);
                        const lit = lights > 0.5 && random(`${s}w${wI}`) < 0.4;
                        return <rect key={wI} x={x + 6 * sc + cx * (14 * sc + 10)} y={top + 10 * sc + ry * (26 * sc + 12)} width={8 * sc + 4} height={12 * sc + 5}
                          fill={lit ? look.townLit : '#00000050'} />;
                      })
                    : null}
                  {water ? (
                    <path d={`M${x - 8} ${base}q${bw * 0.25 + 4} ${-6 * sc} ${bw * 0.5 + 8} 0t${bw * 0.5 + 8} 0`} fill="none" stroke={look.foam} strokeWidth={2 + 4 * k} strokeOpacity={0.75} />
                  ) : null}
                </g>
              );
            })}
            {water ? <rect x={-200} y={base} width={W + 400} height={(bottom - horizon) * 0.2 * k + 30} fill={mixColor(look.waterHi, look.water, k * 0.5)} opacity={0.92} /> : null}
          </g>
        );
      })}
      {chop}
      {water ? (
        // A far bridge, broken in the middle.
        <path d={`M${120 - camX * 0.04} ${horizon + 4}h220M${420 - camX * 0.04} ${horizon + 4}h200M${160 - camX * 0.04} ${horizon + 4}v-34M${300 - camX * 0.04} ${horizon + 4}v-34M${460 - camX * 0.04} ${horizon + 4}v-34M${590 - camX * 0.04} ${horizon + 4}v-34`}
          stroke={mixColor(look.far, '#000000', 0.2)} strokeWidth={4} opacity={0.8} />
      ) : null}
    </g>
  );
};

/** Low storm clouds: dark masses with lit edges, drifting slowly. */
export const Clouds: React.FC<{look: Look; t: number; amount: number}> = ({look, t, amount}) => {
  if (amount < 0.02) return null;
  return (
    <g opacity={amount}>
      {Array.from({length: 9}, (_, i) => {
        const s = `cl${i}`;
        const x = ((random(s) * (W + 800) + t * (6 + 6 * random(s + 'v'))) % (W + 800)) - 400;
        const y = 120 + random(s + 'y') * 560;
        const rx = 260 + random(s + 'r') * 300;
        const dark = mixColor(look.skyTop, '#000000', 0.2);
        return (
          <g key={s} filter="url(#wSoft)" opacity={0.8}>
            {Array.from({length: 6}, (_, j) => {
              const px = x + (j - 2.5) * rx * 0.32;
              const pr = rx * (0.22 + 0.16 * random(`${s}p${j}`));
              return <circle key={j} cx={px} cy={y - pr * 0.4 * Math.sin((j / 5) * Math.PI)} r={pr} fill={dark} />;
            })}
            <rect x={x - rx * 0.95} y={y} width={rx * 1.9} height={rx * 0.18} fill={dark} />
          </g>
        );
      })}
    </g>
  );
};
