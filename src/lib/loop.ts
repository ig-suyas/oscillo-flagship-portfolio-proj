"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { runSceneFrames } from "./scenes";

/**
 * One loop for the whole page, driven by gsap.ticker:
 *   1. Lenis advances (fires ScrollTrigger.update -> scene states)
 *   2. visible scenes' DOM frame callbacks
 *   3. the shared WebGL canvas renders (R3F advance), only if a GL scene is visible
 * Same tick for DOM and GL, so scene layers and 3D never drift apart.
 */
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

let lenis: Lenis | null = null;
let glTick: ((time: number) => void) | null = null;
let started = false;
let last = 0;

export const setGLTick = (f: typeof glTick) => void (glTick = f);
export const getLenis = () => lenis;

export function startLoop(smooth: boolean) {
  if (started) return;
  started = true;
  if (smooth) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.1, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    (window as unknown as { __lenis: Lenis }).__lenis = lenis; // handy for QA + recording presets
  }
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time) => {
    const dt = Math.min(0.05, last ? time - last : 0.016);
    last = time;
    lenis?.raf(time * 1000);
    runSceneFrames(dt, time);
    glTick?.(time * 1000);
  });
}

export function lockScroll(lock: boolean) {
  if (lenis) (lock ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // pinned scenes: land on the scene's anchor progress (data-anchor), not mid-transition
  const a = Number(el.dataset.anchor ?? 0);
  if (lenis) lenis.scrollTo(el.offsetTop + a * (el.offsetHeight - innerHeight), { duration: 1.6 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/** Set by the canvas after its first rendered frame. The loader waits on it. */
export const glStatus = { ready: false, onReady: new Set<() => void>() };
