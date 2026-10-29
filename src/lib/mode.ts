"use client";
import { useSyncExternalStore } from "react";

/**
 * Lite-mode switch. "lite" = static poster scenes, native scroll, no WebGL.
 * Triggered by: coarse pointer (touch), reduced motion, save-data, low power
 * (<=4 cores or <=4GB memory), or no WebGL. Override with ?lite=1 or ?full=1.
 */
export type Mode = "pending" | "lite" | "full";

let mode: Mode = "pending";
let reduced = false;
const subs = new Set<() => void>();

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function detectMode(): Mode {
  const q = new URLSearchParams(location.search);
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (q.has("lite")) return "lite";
  if (q.has("full")) return "full";
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  const touch = matchMedia("(pointer: coarse)").matches && !matchMedia("(any-pointer: fine)").matches;
  const saveData = !!nav.connection?.saveData;
  const lowPower = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return touch || reduced || saveData || lowPower || !hasWebGL() ? "lite" : "full";
}

export function initMode() {
  if (mode !== "pending") return mode;
  mode = detectMode();
  document.documentElement.dataset.mode = mode;
  subs.forEach((f) => f());
  return mode;
}

export const prefersReducedMotion = () => reduced;

export function useMode(): Mode {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => mode,
    () => "pending",
  );
}
