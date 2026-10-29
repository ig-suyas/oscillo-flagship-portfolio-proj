"use client";

/**
 * The OSC-1 drone. Off by default; created on first user toggle.
 * Two detuned saws + a sub through a lowpass. Scenes call setTone(0-1) to open the filter.
 */
let ctx: AudioContext | null = null;
let filter: BiquadFilterNode | null = null;
let out: GainNode | null = null;
let on = false;
const subs = new Set<(on: boolean) => void>();

function build() {
  ctx = new AudioContext();
  filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 260;
  filter.Q.value = 6;
  out = ctx.createGain();
  out.gain.value = 0;
  filter.connect(out).connect(ctx.destination);
  const voice = (type: OscillatorType, f: number, g: number) => {
    const o = ctx!.createOscillator();
    const gn = ctx!.createGain();
    o.type = type;
    o.frequency.value = f;
    gn.gain.value = g;
    o.connect(gn).connect(filter!);
    o.start();
  };
  voice("sawtooth", 55, 0.22);
  voice("sawtooth", 55.35, 0.22);
  voice("sine", 27.5, 0.5);
}

export function toggleSound() {
  if (!ctx) build();
  on = !on;
  ctx!.resume();
  out!.gain.setTargetAtTime(on ? 0.09 : 0, ctx!.currentTime, 0.25);
  subs.forEach((f) => f(on));
  return on;
}

export function setTone(v: number) {
  if (!on || !ctx || !filter) return;
  filter.frequency.setTargetAtTime(180 + v * v * 2600, ctx.currentTime, 0.08);
}

export const onSound = (f: (on: boolean) => void) => (subs.add(f), () => void subs.delete(f));
