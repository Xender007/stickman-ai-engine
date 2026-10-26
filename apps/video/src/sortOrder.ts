import type { WebGLRenderer } from 'three';

/**
 * Three.js breaks draw-order ties (same render order, same depth) by object and material creation id. Creation order differs
 * between a frame rendered alone and the same frame inside a sequence, so overlapping translucent or coplanar meshes blended in a
 * different order and the frames differed in the last bits (rule R8b). Break ties by what the object is instead.
 */
type Item = { groupOrder: number; renderOrder: number; z: number; object: { position: { x: number; y: number; z: number }; scale: { x: number; y: number } }; material: { opacity?: number; color?: { getHex: () => number } } };

const tie = (a: Item, b: Item): number => {
  const ka = [a.object.position.x, a.object.position.y, a.object.position.z, a.object.scale.x, a.object.scale.y, a.material.opacity ?? 1, a.material.color?.getHex() ?? 0];
  const kb = [b.object.position.x, b.object.position.y, b.object.position.z, b.object.scale.x, b.object.scale.y, b.material.opacity ?? 1, b.material.color?.getHex() ?? 0];
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
  return 0;
};

export function deterministicSort(gl: WebGLRenderer): void {
  gl.setOpaqueSort((a: Item, b: Item) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || a.z - b.z || tie(a, b));
  gl.setTransparentSort((a: Item, b: Item) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || b.z - a.z || tie(a, b));
}
