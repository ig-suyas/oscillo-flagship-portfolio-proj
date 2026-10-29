// Design tokens. CSS mirror lives in app/globals.css (@theme). Keep both in sync.

export const color = {
  ink: "#0d0c0b",
  graphite: "#1b1a18",
  bone: "#ece6da",
  stone: "#8d877c",
  signal: "#ff4a14", // spine color: the ribbon, LEDs, accents
  volt: "#1730ff", // the one electric-blue world
} as const;

/** One color world per scene. fg drives header + cursor contrast. */
export type SceneTheme = { bg: string; fg: string; accent: string };
export const sceneTheme = {
  loader: { bg: color.ink, fg: color.bone, accent: color.signal },
  hero: { bg: color.ink, fg: color.bone, accent: color.signal },
  knob: { bg: color.bone, fg: color.ink, accent: color.signal },
  editions: { bg: color.graphite, fg: color.bone, accent: color.signal },
  process: { bg: color.bone, fg: color.ink, accent: color.signal },
  specs: { bg: color.ink, fg: color.bone, accent: color.signal },
  waitlist: { bg: color.signal, fg: color.ink, accent: color.ink },
} satisfies Record<string, SceneTheme>;

/** Fluid type scale (CSS clamp strings). Display = Archivo expanded, detail = Plex Mono. */
export const type = {
  mega: "clamp(4.5rem, 17.2vw, 26rem)", // OSCILLO wordmark, one line
  display: "clamp(3.5rem, 13vw, 18rem)", // marquee rows
  title: "clamp(2.75rem, 7.5vw, 9rem)", // edition names
  lead: "clamp(1.05rem, 1.35vw, 1.5rem)",
  mono: "clamp(0.75rem, 0.72vw, 0.8rem)", // 12px floor: legible on phones
} as const;

/** 4px base spacing; gutter is the page edge everywhere. */
export const space = {
  unit: 4,
  gutter: "clamp(16px, 2.6vw, 40px)",
} as const;

export const ease = {
  out: "expo.out",
  inOut: "expo.inOut",
  soft: "power3.inOut",
  css: { out: "cubic-bezier(0.16, 1, 0.3, 1)", inOut: "cubic-bezier(0.87, 0, 0.13, 1)" },
} as const;

/** Seconds. */
export const dur = { xs: 0.2, s: 0.45, m: 0.8, l: 1.2, xl: 2 } as const;

/** Stacking order. Scene back layers sit under the shared canvas, front layers over it. */
export const z = { back: 1, canvas: 10, front: 20, header: 30, grain: 40, cursor: 50, loader: 60 } as const;
