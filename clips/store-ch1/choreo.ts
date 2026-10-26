/** GSAP choreography for Chapter 1. Scene cuts and beats are placed from the real sentence times in
 *  assets/sentences.json, so the picture follows the narration. Channels live in state.ts. */
import { S } from './state.ts';

export type Sent = { text: string; start: number; end: number };

export function sceneStarts(sents: Sent[]): number[] {
  const sT = (i: number) => sents[i].start - 0.1;
  // first sentence of each scene
  return [0, sT(2), sT(3), sT(4), sT(6), sT(8), sT(10), sT(12), sT(18), sT(19), sT(20), sT(23), sT(24), sT(28), sT(30), sT(34), sT(35), sT(36), sT(38), sT(41)];
}

export function buildChoreo(tl: any, sents: Sent[], total: number) {
  const tw = (ch: string, from: number, to: number, a: number, b: number, ease = 'none') =>
    tl.fromTo(S, { [ch]: from }, { [ch]: to, duration: Math.max(0.001, b - a), ease, immediateRender: false }, a);
  /** decaying oscillation in seconds */
  const osc = (ch: string, at: number, amps: number[], step = 0.06) => {
    let prev = 0;
    amps.forEach((a, i) => { tw(ch, prev, a, at + i * step, at + (i + 1) * step, 'sine.inOut'); prev = a; });
  };
  const starts = sceneStarts(sents);
  const ends = [...starts.slice(1), total];
  const D = (n: number) => ends[n - 1] - starts[n - 1];
  const A = (n: number, f: number) => starts[n - 1] + D(n) * f;
  const sS = (i: number) => sents[i].start, sE = (i: number) => sents[i].end;

  tl.set(S, { c5_open: 1, c6_open: 1, c8_danaX: 400, c8_goneO: 1, c19_led: 1, c4_cut: 0 }, 0);

  // 1 automatic doors
  tw('c1_open', 0, 1, 0.5, 1.4, 'power2.inOut');
  tw('c1_man', 0, 1, 0.3, D(1) * 0.95, 'sine.inOut');
  tw('c1_walk', 0, 18, 0, D(1));
  tw('c1_blink', 0, 10, 0, D(1));
  // 2 night exterior + clock
  tw('c2_push', 0, 1, starts[1], ends[1], 'sine.inOut');
  tw('c2_clock', 0, 1, starts[1] + 0.3, starts[1] + 0.8, 'back.out(2.4)');
  // 3 stacking cans, doors slide open at the far end
  tw('c3_phase', 0, 26, starts[2], ends[2]);
  tw('c3_cans', 0, 1, starts[2], ends[2] - 0.5);
  tw('c3_open', 0, 1, A(3, 0.68), A(3, 0.95), 'power2.inOut');
  // 4 doorway, then milk and cigarettes
  tw('c4_sway', 0, 8, starts[3], ends[3]);
  tw('c4_cut', 0, 1, sS(5) - 0.05, sS(5));
  tw('c4_milk', 0, 1, sS(5) + 0.05, sS(5) + 0.7, 'bounce.out');
  tw('c4_cig', 0, 1, sS(5) + 0.35, sS(5) + 1.0, 'bounce.out');
  // 5 doors keep closing on him
  [[0, 0.4], [1, 0.4]].forEach(() => {});
  let t5 = sS(7) - 0.1;
  const cyc: [number, number, number][] = [[1, 0.3, 0.38], [0.3, 1, 0.35], [1, 0.25, 0.38], [0.25, 1, 0.35], [1, 0.05, 0.5]];
  cyc.forEach(([a, b, d], i) => { tw('c5_open', a, b, t5, t5 + d, i % 2 === 0 ? 'power2.in' : 'power2.out'); t5 += d + 0.08; });
  tw('c5_open', 1, 1, 0, 0.01);
  // 6 Dana shoves him out, locks, he bumps the glass
  tw('c6_push', 0, 1, sS(8) + 0.9, sS(8) + 3.2, 'power2.inOut');
  tw('c6_out', 0, 1, sS(8) + 1.4, sS(8) + 3.4, 'power2.inOut');
  tw('c6_walk', 0, 40, starts[5], ends[5]);
  tw('c6_open', 1, 0, sE(8) - 0.9, sE(8), 'power2.inOut');
  tw('c6_lock', 0, 1, sE(8) + 0.05, sE(8) + 0.45, 'back.out(2.6)');
  [0.45, 1.5, 2.3].forEach((o) => {
    tw('c6_bump', 0, 1, sS(9) + o, sS(9) + o + 0.12, 'power2.out');
    tw('c6_bump', 1, 0, sS(9) + o + 0.12, sS(9) + o + 0.5, 'power2.in');
    osc('c6_shake', sS(9) + o + 0.1, [9, -7, 5, -3, 0], 0.05);
  });
  // 7 sixteen cameras
  tw('c7_show', 0, 1, starts[6], starts[6] + 1.4);
  tw('c7_phase', 0, 16, starts[6], ends[6]);
  tw('c7_zoom', 0, 1, starts[6], ends[6], 'sine.inOut');
  // 8 Dana grabs her keys, speaks, leaves; you are alone
  tw('c8_keys', 0, 1, sS(12) + 0.3, sS(12) + 1.0, 'power2.out');
  tw('c8_bubble', 0, 1, sS(14), sS(14) + 0.25, 'back.out(2.4)');
  tw('c8_bubble', 1, 0, sE(15) + 0.15, sE(15) + 0.4, 'power2.in');
  tw('c8_moving', 0, 1, sS(16), sS(16) + 0.01);
  tw('c8_danaX', 400, 640, sS(16) + 0.2, sS(16) + 2.3, 'power1.in');
  tw('c8_walk', 0, 22, sS(16) + 0.2, sS(16) + 2.3);
  tw('c8_door', 0, 1, sS(16) + 1.5, sS(16) + 2.2, 'power2.out');
  tw('c8_goneO', 1, 0, sS(16) + 2.2, sS(16) + 2.45);
  tw('c8_idle', 0, 10, starts[7], ends[7]);
  tw('c8_pull', 0, 1, sS(17) - 0.2, ends[7], 'power2.inOut');
  tw('c8_dim', 0, 0.3, sS(17), ends[7], 'sine.inOut');
  // 9 forty thousand products
  tw('c9_push', 0, 1, starts[8], ends[8], 'sine.inOut');
  // 10 PROBLEM 1 card
  tw('c10_in', 0, 1, starts[9] + 0.05, starts[9] + 0.5, 'back.out(2.4)');
  tw('c10_text', 0, 1, starts[9] + 0.3, starts[9] + 0.75, 'power2.out');
  // 11 shutter days per year
  tw('c11_grid', 0, 1, sS(20) - 0.1, sE(21) + 0.6, 'power1.inOut');
  tw('c11_red', 0, 1, sS(22) + 2.3, sS(22) + 2.8, 'back.out(3)');
  tw('c11_label', 0, 1, sS(22) + 2.6, sS(22) + 3.1, 'power2.out');
  // 12 by hand, with an audience
  tw('c12_sway', 0, 9, starts[11], ends[11]);
  tw('c12_crowd', 0, 1, starts[11] + 1.2, starts[11] + 3.4, 'power1.inOut');
  tw('c12_crank', 0, 720, starts[11], ends[11]);
  tw('c12_drop', 0, 0.5, starts[11], ends[11]);
  // 13 the shutter comes down like a freight train
  tw('c13_drop', 0, 1, sS(25) - 0.1, sS(25) + 2.4, 'power3.in');
  let tr = sS(25) - 0.1;
  for (let i = 0; i < 20; i++) { tw('c13_shake', i % 2 ? -5 : 5, i % 2 ? 5 : -5, tr, tr + 0.12, 'sine.inOut'); tr += 0.12; }
  tw('c13_shake', 0, 0, tr, tr + 0.01);
  tw('c13_dust', 0, 1, sS(25) + 2.0, sS(25) + 3.6, 'power1.out');
  tw('c13_sign', 0, 1, sS(26), sS(26) + 0.5, 'back.out(2.6)');
  // 14 you count stock
  tw('c14_x', 90, 600, starts[13], ends[13], 'sine.inOut');
  tw('c14_walk', 0, 18, starts[13], ends[13]);
  tw('c14_tick', 0, 1, starts[13] + 0.5, ends[13], 'none');
  // 15 AISLE 7 card
  tw('c15_title', 0, 1, starts[14], starts[14] + 0.35, 'power2.out');
  tw('c15_cans', 0, 1, sS(31) - 0.2, sS(31) + 1.3, 'power1.inOut');
  tw('c15_num', 0, 7300, sS(31), sS(31) + 1.3, 'power2.out');
  tw('c15_years', 0, 1, sS(33), sS(33) + 0.35, 'back.out(2)');
  // 16 enough to last a lifetime
  tw('c16_push', 0, 1, starts[15], ends[15], 'sine.inOut');
  tw('c16_walk', 0, 1, starts[15], ends[15], 'sine.inOut');
  tw('c16_phase', 0, 14, starts[15], ends[15]);
  // 17 day thirty
  tw('c17_stamp', 0, 1, starts[16] + 0.5, starts[16] + 1.0, 'back.out(3)');
  tw('c17_breath', 0, 12, starts[16], ends[16]);
  tw('c17_look', -3, 4, starts[16] + 1.0, starts[16] + 2.6, 'sine.inOut');
  tw('c17_look', 4, 0, starts[16] + 2.6, starts[16] + 3.6, 'sine.inOut');
  tw('c17_slide', 0, -26, starts[16], ends[16]);
  // 18 the power dies
  tw('c18_clock', 0, 1, starts[17], starts[17] + 0.25);
  const dies = sE(36) - 0.45;
  [[0, 0.25, 0.05], [0.25, 0.02, 0.07], [0.02, 0.5, 0.07], [0.5, 0.1, 0.08], [0.1, 1, 0.3]].reduce((t, [a, b, d]) => { tw('c18_dark', a, b, t, t + d, 'none'); return t + d; }, dies);
  tw('c18_hum', 0, 1, sS(37), sS(37) + 0.3);
  // 19 clunk at the back, the magnet needs power
  osc('c19_clunk', sE(38) - 0.55, [10, -8, 5, -3, 0], 0.06);
  tw('c19_ajar', 0, 1, sE(38) - 0.5, sE(38) + 0.6, 'power2.out');
  tw('c19_zoom', 0, 1, sS(39), sE(39) + 0.4, 'power2.inOut');
  tw('c19_led', 1, 0, sS(40) + 0.9, sS(40) + 0.92);
  // 20 you run
  tw('c20_scroll', 0, 1, starts[19], ends[19]);
  tw('c20_run', 0, 62, starts[19], ends[19]);
  tw('c20_fade', 0, 1, ends[19] - 0.5, ends[19], 'power2.in');
}
