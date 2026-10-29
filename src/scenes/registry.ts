"use client";
import type { ComponentType } from "react";
import { Hero } from "./s2-hero/Hero";
import { KnobScene } from "./s3-knob/KnobScene";
import { Editions } from "./s4-editions/Editions";
import { Process } from "./s5-process/Process";
import { Specs } from "./s6-specs/Specs";
import { Waitlist } from "./s7-waitlist/Waitlist";

/**
 * Scroll scenes, in page order. The loader (scenes/s1-loader) is an overlay, not listed here.
 * `id` = section id (nav anchor) = SceneTrack id = gl-registry id.
 */
export type SceneDef = { id: string; nav?: string; Component: ComponentType };

export const scenes: SceneDef[] = [
  { id: "hero", nav: "OSC-1", Component: Hero },
  { id: "knob", nav: "Knob", Component: KnobScene },
  { id: "editions", nav: "Editions", Component: Editions },
  { id: "process", nav: "Process", Component: Process },
  { id: "specs", nav: "Specs", Component: Specs },
  { id: "waitlist", nav: "Pre-order", Component: Waitlist },
  // Scene 08 is the footer (components/Footer.tsx): the ribbon lands flat.
];
