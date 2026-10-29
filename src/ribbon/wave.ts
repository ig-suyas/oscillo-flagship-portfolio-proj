/**
 * Ribbon API, part 1: the waveform math shared by every appearance of the spine
 * (loader, hero tube, dividers, cursor, edition cards, footer line, and the
 * process path in scene 5). Pure functions, no DOM, no three.
 */
export type WaveShape = "signal" | "sine" | "saw" | "square";
export type Envelope = "flat" | "swell" | "taper";

export type WaveOpts = {
  shape?: WaveShape;
  cycles?: number; // full periods across u = 0..1
  phase?: number; // radians
  amp?: number; // 0..1 of half-height
  envelope?: Envelope;
};

const TAU = Math.PI * 2;

/** Raw waveform value in -1..1 at u (0..1). Corners are softened so it reads as a physical ribbon. */
export function wave(u: number, { shape = "signal", cycles = 3, phase = 0 }: WaveOpts = {}) {
  const t = u * cycles * TAU + phase;
  switch (shape) {
    case "sine":
      return Math.sin(t);
    case "saw": {
      // smoothed saw from the first harmonics
      let v = 0;
      for (let k = 1; k <= 6; k++) v += Math.sin(k * t) / k;
      return v * 0.58;
    }
    case "square":
      return Math.tanh(Math.sin(t) * 4.5);
    default:
      // "signal": the OSC-1 voice, a fundamental with a beating overtone
      return Math.sin(t) * 0.72 + Math.sin(t * 2.03 + 1.1) * 0.2 + Math.sin(t * 5.1 + 0.4) * 0.08;
  }
}

export function envelope(u: number, e: Envelope = "flat") {
  if (e === "swell") return Math.sin(Math.PI * u) ** 1.4;
  if (e === "taper") return Math.min(1, u * 6, (1 - u) * 6);
  return 1;
}

/** SVG path data for a ribbon spanning a w x h box, centered on h/2. */
export function ribbonPath(w: number, h: number, opts: WaveOpts & { samples?: number } = {}) {
  const { samples = 240, amp = 0.8, envelope: env = "flat" } = opts;
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const y = h / 2 - wave(u, opts) * envelope(u, env) * amp * (h / 2);
    d += `${i ? "L" : "M"}${(u * w).toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}
