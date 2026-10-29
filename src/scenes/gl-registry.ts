"use client";
import type { ComponentType } from "react";
import HeroGL from "./s2-hero/HeroGL";
import KnobGL from "./s3-knob/KnobGL";
import SpecsGL from "./s6-specs/SpecsGL";

/**
 * GL half of the scene registry. Imported only by the lazy canvas chunk, so three.js
 * never lands in the main bundle. `id` must match the scene's SceneTrack id; each
 * entry gets its own THREE.Scene + camera (fov) and only renders while that scene is visible.
 */
export const glScenes: { id: string; fov: number; Component: ComponentType }[] = [
  { id: "hero", fov: 26, Component: HeroGL },
  { id: "knob", fov: 30, Component: KnobGL },
  { id: "specs", fov: 26, Component: SpecsGL },
];
