/** GSAP choreography for Part 1. Every channel in scenes/state.ts is tweened here; the scenes only read it.
 *  Frames are absolute (24 fps); clip N starts at N * 240. Sequential tweens on one channel use fromTo with
 *  immediateRender:false so seeking in any order (parallel render workers) lands on the same value. */
import { S } from './scenes/state.ts';

const FPS = 24;
const CLIP = 240;

export function buildChoreo(tl: any) {
  const tw = (ch: string, from: number, to: number, a: number, b: number, ease = 'none') =>
    tl.fromTo(S, { [ch]: from }, { [ch]: to, duration: (b - a) / FPS, ease, immediateRender: false }, a / FPS);
  /** decaying oscillation: a hit that rings out (camera shake, door rattle) */
  const osc = (ch: string, at: number, amps: number[], step = 1.3) => {
    let prev = 0;
    amps.forEach((a, i) => { tw(ch, prev, a, at + i * step, at + (i + 1) * step, 'sine.inOut'); prev = a; });
  };
  // defaults that must hold before a channel's first tween
  tl.set(S, { c2_fade: 1, c3_enterO: 1, c3_back: 470, c4_x: 330, c4_dark: 0.25, c5_x: 330, c5_x2: 470, c5_lean: 8, c5_cam: 1, c6_sx: 610, c6_sy: 560, c6_x: 470, c6_push: 1, c6_rush: 1 }, 0);

  /* ------------------------------------------------------------ clip 1: peephole, tower, stairs */
  const c1 = 0;
  [2, 17, 32].forEach((k, i) => {
    osc('c1_shake', c1 + k, [16, -12, 9, -6, 4, -2, 0], 1.2);
    tw(`c1_dust${i}`, 0, 1, c1 + k, c1 + k + 22, 'power1.out');
  });
  tw('c1_camY', 0, 2220, 72, 167, 'power3.inOut');           // the drop: slow start, hard acceleration, soft landing
  tw('c1_crowd', 0, 96, 72, 168);
  tw('c1_door', 0, 1, 168, 176, 'back.out(1.6)');             // door bursts, overshoots, settles
  tw('c1_entry', 0, 1, 168, 180, 'power2.out');
  tw('c1_cam', 0, 1, 168, 186, 'power2.out');
  tw('c1_s', 0, 1.52, 178, 240, 'sine.in');                   // sprint builds
  tw('c1_run', 0, 50, 168, 240);
  tw('c1_tilt', 0, -4, 168, 240, 'sine.inOut');

  /* ------------------------------------------------------------ clip 2: stairs, glass, sleeve */
  const c2 = CLIP;
  tw('c2_s', 0.25, 1.4, c2, c2 + 72);
  tw('c2_s', 1.4, 1.55, c2 + 72, c2 + 100, 'power3.out');     // the snag: hard stop
  tw('c2_s', 1.55, 1.72, c2 + 100, c2 + 168, 'sine.out');
  tw('c2_s', 1.72, 2.73, c2 + 216, c2 + 240, 'power2.in');
  tw('c2_run', 0, 117.6, c2, c2 + 168);
  tw('c2_run', 117.6, 134.4, c2 + 216, c2 + 240);
  tw('c2_look', 0, 1, c2 + 172, c2 + 184, 'power2.inOut');
  tw('c2_look', 1, 0, c2 + 198, c2 + 206, 'power2.inOut');
  tw('c2_shrug', 0, 1, c2 + 200, c2 + 206, 'power2.out');
  tw('c2_shrug', 1, 0, c2 + 206, c2 + 214, 'power2.in');
  tw('c2_fade', 1, 0, c2 + 226, c2 + 240);
  tw('c2_glass', 0, 1, c2 + 82, c2 + 140, 'power1.out');
  tw('c2_camx', 0, 60, c2 + 216, c2 + 240);

  /* ------------------------------------------------------------ clip 3: door, chain, chair, cross-section */
  const c3 = CLIP * 2;
  tw('c3_x', 60, 520, c3, c3 + 28, 'power2.inOut');
  tw('c3_run', 0, 28, c3, c3 + 36);
  tw('c3_open', 0, 1, c3 + 22, c3 + 30, 'power3.out');
  tw('c3_open', 1, 0, c3 + 36, c3 + 40, 'power4.in');          // pulled shut fast
  osc('c3_slamA', c3 + 40, [11, -8, 5, -3, 0], 1.5);          // slam
  tw('c3_enterX', 520, 620, c3 + 26, c3 + 34, 'power2.in');
  tw('c3_enterO', 1, 0, c3 + 30, c3 + 34);
  osc('c3_slamB', c3 + 46, [12, -9, 6, -4, 2, 0], 1.6);
  tw('c3_chain', 0, 1, c3 + 54, c3 + 80, 'power2.inOut');
  tw('c3_walk', 0, 15, c3 + 90, c3 + 120);
  tw('c3_slide', 0, 1, c3 + 90, c3 + 120, 'power2.inOut');
  tw('c3_wedge', 0, 1, c3 + 120, c3 + 138, 'back.out(2.4)');   // chair snaps under the handle, bounces
  tw('c3_back', 470, 380, c3 + 140, c3 + 154, 'power2.inOut');
  osc('c3_shakeC', c3 + 168, [7, -6, 4, -3, 2, -1, 0], 2);
  tw('c3_camY', -200, 600, c3 + 186, c3 + 240, 'power3.inOut'); // sinking through the floors
  tw('c3_heads', 0, 1, c3 + 222, c3 + 232, 'power2.out');

  /* ------------------------------------------------------------ clip 4: window, rations, time-lapse, candle */
  const c4 = CLIP * 3;
  tw('c4_hand', 0, 1, c4 + 14, c4 + 34, 'back.out(1.5)');
  tw('c4_x', 330, 360, c4 + 72, c4 + 84, 'power2.out');
  tw('c4_crackers', 0, 1, c4 + 84, c4 + 112);
  tw('c4_sip', 0, 1, c4 + 124, c4 + 136, 'sine.out');
  tw('c4_sip', 1, 0, c4 + 136, c4 + 148, 'sine.in');
  tw('c4_cap', 0, 1, c4 + 148, c4 + 156, 'sine.out');
  tw('c4_cap', 1, 0, c4 + 156, c4 + 164, 'sine.in');
  tw('c4_lapse', 0, 1, c4 + 168, c4 + 222);
  tw('c4_dark', 0.25, 0.92, c4 + 168, c4 + 222, 'sine.inOut');
  tw('c4_sun', 380, 820, c4 + 168, c4 + 222, 'sine.in');
  tw('c4_strike', 0, 1, c4 + 196, c4 + 210);
  tw('c4_candle', 0, 1, c4 + 206, c4 + 218, 'back.out(2)');
  tw('c4_seat', 0, 1, c4 + 222, c4 + 234, 'power2.inOut');

  /* ------------------------------------------------------------ clip 5: knocks, creep, peephole */
  const c5 = CLIP * 4;
  [8, 32, 56].forEach((k, i) => {
    osc('c5_shake', c5 + k, [10, -8, 6, -4, 2, -1, 0], 1.4);
    tw('c5_spike', 1, 0, c5 + k, c5 + k + 8, 'power2.out');
    tw(`c5_dust${i}`, 0, 1, c5 + k, c5 + k + 30, 'power1.out');
  });
  tw('c5_x', 330, 470, c5 + 72, c5 + 160, 'power2.inOut');
  tw('c5_walk', 0, 29, c5 + 72, c5 + 160);
  tw('c5_x2', 470, 500, c5 + 160, c5 + 184, 'power2.inOut');
  tw('c5_lean', 8, 24, c5 + 164, c5 + 190, 'power2.inOut');
  tw('c5_cam', 1, 1.5, c5 + 72, c5 + 190, 'power2.inOut');     // slow creeping push toward the door
  tw('c5_zoomIn', 0, 1, c5 + 200, c5 + 240, 'power3.inOut');

  /* ------------------------------------------------------------ clip 6: flashlight, chalk, rush into black */
  const c6 = CLIP * 5;
  tw('c6_x', 470, 400, c6, c6 + 40, 'power2.out');
  tw('c6_sy', 560, 760, c6 + 8, c6 + 72, 'power2.inOut');
  tw('c6_sy', 760, 650, c6 + 72, c6 + 100, 'power2.inOut');
  tw('c6_sx', 610, 80, c6 + 170, c6 + 200, 'power3.inOut');
  tw('c6_sy', 650, 760, c6 + 170, c6 + 200, 'power3.inOut');
  tw('c6_spun', 0, 1, c6 + 168, c6 + 186, 'back.out(1.8)');    // quick spin with a little overshoot
  tw('c6_push', 1, 2.1, c6 + 72, c6 + 168, 'power2.inOut');
  tw('c6_rush', 1, 3.2, c6 + 170, c6 + 232, 'expo.in');
  tw('c6_dim', 0, 1, c6 + 200, c6 + 232);
}
