"use client";
import { useFrame, type RootState } from "@react-three/fiber";
import { getScene, type SceneState } from "@/lib/scenes";

/** useFrame that only runs while its scene is visible. Use this in every GL scene. */
export function useGLFrame(id: string, cb: (s: SceneState, dt: number, state: RootState) => void) {
  useFrame((state, dt) => {
    const s = getScene(id);
    if (s.visible) cb(s, Math.min(dt, 0.05), state);
  });
}
