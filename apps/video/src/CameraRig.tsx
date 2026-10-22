import React, { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';

/**
 * React Three Fiber applies the Canvas `camera` prop once, when the canvas is created. A video render reuses one canvas
 * for many frames, so a camera driven only by that prop freezes at the first frame of each worker's chunk and the result
 * depends on how frames were split (rule R8b). This component re-applies position and lens every render.
 */
export const CameraRig: React.FC<{ position: [number, number, number]; fov?: number }> = ({ position, fov }) => {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.rotation.set(0, 0, 0);
    if (fov !== undefined) camera.fov = fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    invalidate();
  }, [camera, invalidate, position[0], position[1], position[2], fov]);
  return null;
};
