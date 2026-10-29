/**
 * Spec lines and the synth part each one lights. Boxes are in synth units (see gl/Synth.tsx:
 * top view, x right, z toward the player). The lite schematic draws the same boxes at 100 px/unit.
 * Specification is fictional (concept project).
 */
export type PartBox = { x1: number; x2: number; z1: number; z2: number };
export type Spec = { id: string; name: string; value: string; box: PartBox };

export const SPECS: Spec[] = [
  { id: "osc", name: "Oscillators", value: "2 VCOs + sub · saw, square, sine", box: { x1: 0.11, x2: 0.99, z1: -0.9, z2: -0.32 } },
  { id: "filter", name: "Filter", value: "24 dB ladder lowpass · CUTOFF 0-10", box: { x1: 0.92, x2: 2.2, z1: -0.98, z2: 0.42 } },
  { id: "drive", name: "Drive", value: "RES to self-oscillation · DRIVE into fuzz", box: { x1: 0.05, x2: 1.05, z1: -0.18, z2: 0.48 } },
  { id: "env", name: "Envelope", value: "ADSR · four knobs, four 60 mm faders", box: { x1: -2.0, x2: 0.0, z1: -0.98, z2: 0.4 } },
  { id: "seq", name: "Sequencer", value: "8 steps · one LED per step", box: { x1: -2.06, x2: -0.16, z1: -1.13, z2: -0.95 } },
  { id: "ribbon", name: "Ribbon", value: "400 mm strip · two octaves of glide", box: { x1: -2.06, x2: 2.06, z1: 0.45, z2: 0.61 } },
  { id: "keys", name: "Keys", value: "16 velocity keys · two accent C keys", box: { x1: -2.02, x2: 2.02, z1: 0.65, z2: 1.11 } },
  { id: "body", name: "Chassis", value: "440 × 240 × 32 mm · machined aluminium cheeks", box: { x1: -2.32, x2: 2.32, z1: -1.24, z2: 1.24 } },
];

/** Scene-owned state: which spec is lit. `pinned` = hovered/focused/tapped; otherwise scroll picks one. */
export const specsState = { active: 0, pinned: -1 };
