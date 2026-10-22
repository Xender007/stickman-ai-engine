import type {Mood} from '../episode/schema';

export type Palette = {
  skyTop: string; skyBottom: string; far: string; mid: string; ground: string; curb: string; lane: string;
  lit: string; unlit: string; litChance: number; glow: string; glowStrength: number; stars: boolean;
  sun: string | null; water: string; waterLine: string; tree: string; treeFar: string; fire: boolean;
};

/** Every mood stays dark enough for the white glowing figure to read. */
export const PALETTES: Record<Mood, Palette> = {
  night: {
    skyTop: '#081026', skyBottom: '#2b3f75', far: '#1d2949', mid: '#2a3657', ground: '#14161c', curb: '#2f323c', lane: '#4a4532',
    lit: '#f4c862', unlit: '#1c2643', litChance: 0.5, glow: '#6d86c9', glowStrength: 0.12, stars: true, sun: null,
    water: '#16213f', waterLine: '#41558c', tree: '#121a30', treeFar: '#1b2645', fire: false,
  },
  dusk: {
    skyTop: '#1a1233', skyBottom: '#b24a3a', far: '#3a2440', mid: '#22152b', ground: '#140e16', curb: '#2c2030', lane: '#4a3530',
    lit: '#f4c862', unlit: '#1d1424', litChance: 0.35, glow: '#ff7a4a', glowStrength: 0.25, stars: false, sun: '#ffb36b',
    water: '#2a1a33', waterLine: '#7a4a5a', tree: '#1a1020', treeFar: '#2e1c34', fire: false,
  },
  storm: {
    skyTop: '#07090c', skyBottom: '#2d3b46', far: '#1d262d', mid: '#141a1f', ground: '#0e1114', curb: '#252c33', lane: '#38403f',
    lit: '#e9d7a0', unlit: '#141b21', litChance: 0.2, glow: '#8fb0c8', glowStrength: 0.08, stars: false, sun: null,
    water: '#121b22', waterLine: '#3b505e', tree: '#0d1216', treeFar: '#18222a', fire: false,
  },
  disaster: {
    skyTop: '#120709', skyBottom: '#83291a', far: '#2c1b1c', mid: '#1f1516', ground: '#100b0b', curb: '#2a1d1c', lane: '#3a2a22',
    lit: '#f4c862', unlit: '#170f10', litChance: 0, glow: '#ff5a1f', glowStrength: 0.3, stars: false, sun: null,
    water: '#1d1214', waterLine: '#6a2a22', tree: '#140c0c', treeFar: '#2a1716', fire: true,
  },
  dawn: {
    skyTop: '#241a3d', skyBottom: '#f08a4b', far: '#3b2a4a', mid: '#24182f', ground: '#170f1c', curb: '#33253a', lane: '#4a3a40',
    lit: '#f4c862', unlit: '#1f1628', litChance: 0, glow: '#ffb070', glowStrength: 0.3, stars: false, sun: '#ffd98a',
    water: '#2b1d36', waterLine: '#c9845f', tree: '#1c1226', treeFar: '#3a2846', fire: false,
  },
};
