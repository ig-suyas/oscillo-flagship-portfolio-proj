"use client";
import { useEffect, useSyncExternalStore } from "react";

/**
 * Scene isolation store.
 * Each scene owns one SceneState. Values are written by its ScrollTrigger and read
 * per frame (no React renders). Only `visible` changes notify React.
 *
 *   enter    0-1  section top travels from viewport bottom to top (scene slides in)
 *   progress 0-1  the "pinned" stretch: the scene's own timeline (clamped)
 *   exit     0-1  section bottom travels from viewport bottom to top (scene slides out)
 *   offsetY  px   translateY of the scene's fixed layers ((1-enter) - exit) * vh
 *   visible       true only while any part of the scene is on screen
 */
export type SceneState = {
  id: string;
  enter: number;
  progress: number;
  exit: number;
  offsetY: number;
  visible: boolean;
};

type FrameCb = (s: SceneState, dt: number, time: number) => void;

const states = new Map<string, SceneState>();
const visSubs = new Map<string, Set<() => void>>();
const frameCbs = new Map<string, Set<FrameCb>>();
const anySubs = new Set<() => void>();

export function getScene(id: string): SceneState {
  let s = states.get(id);
  if (!s) {
    s = { id, enter: 0, progress: 0, exit: 0, offsetY: 0, visible: false };
    states.set(id, s);
  }
  return s;
}

export function setSceneVisible(id: string, v: boolean) {
  const s = getScene(id);
  if (s.visible === v) return;
  s.visible = v;
  visSubs.get(id)?.forEach((f) => f());
  anySubs.forEach((f) => f());
}

export const visibleScenes = () => [...states.values()].filter((s) => s.visible);
export const onAnyVisibility = (f: () => void) => (anySubs.add(f), () => anySubs.delete(f));

export function useSceneVisible(id: string) {
  return useSyncExternalStore(
    (f) => {
      if (!visSubs.has(id)) visSubs.set(id, new Set());
      visSubs.get(id)!.add(f);
      return () => visSubs.get(id)!.delete(f);
    },
    () => getScene(id).visible,
    () => false,
  );
}

/** Per-frame DOM callback. Runs only while the scene is visible. */
export function useSceneFrame(id: string, cb: FrameCb) {
  useEffect(() => {
    if (!frameCbs.has(id)) frameCbs.set(id, new Set());
    frameCbs.get(id)!.add(cb);
    return () => void frameCbs.get(id)!.delete(cb);
  }, [id, cb]);
}

/** Called once per tick by the loop, before the GL frame. */
export function runSceneFrames(dt: number, time: number) {
  for (const [id, set] of frameCbs) {
    const s = getScene(id);
    if (!s.visible) continue;
    set.forEach((cb) => cb(s, dt, time));
  }
}
