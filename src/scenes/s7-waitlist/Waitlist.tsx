"use client";
import { useCallback, useMemo, useRef } from "react";
import { SceneTrack, applyTheme } from "@/components/SceneTrack";
import { wave } from "@/ribbon/wave";
import { useSceneFrame } from "@/lib/scenes";
import { useFitText } from "@/lib/useFitText";
import { range, easeInOutCubic, lerp } from "@/lib/math";
import { sceneTheme } from "@/lib/tokens";
import { WaitlistForm } from "./WaitlistForm";

/**
 * Scene 07 · Color wipe into the pre-order waitlist.
 * The wipe is one translated panel: a signal-orange flood whose crest is the ribbon's waveform.
 * It runs in screen space over c = enter - 1 + progress * DUR (viewports), c in [-0.3, 0.7],
 * so the crest never meets the layer edge while the scene slides in.
 * progress: wipe until ~0.32 · content in 0.3-0.42 · 0.42-1 HOLD (form usable, nothing moves)
 */
export const WAITLIST_ID = "waitlist";
const DUR = 2.2;
const CREST = 0.3; // crest height in viewports
const INK = { ...sceneTheme.specs };

function crestPath(w: number, h: number) {
  let d = `M0 ${h}`;
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    d += `L${(u * w).toFixed(1)} ${(h * 0.5 - wave(u, { shape: "signal", cycles: 2.5 }) * h * 0.38).toFixed(1)}`;
  }
  return d + `L${w} ${h}Z`;
}

function Headline() {
  const ref = useFitText<HTMLHeadingElement>(1);
  return (
    <h2 ref={ref} className="f-display whitespace-nowrap text-ink">
      <span data-line className="hero-wide block w-max">Get in line.</span>
      <span data-line className="hero-tall w-max">Get in</span>
      <span data-line className="hero-tall w-max">line.</span>
    </h2>
  );
}

function Body() {
  return (
    <div className="on-signal flex h-full flex-col px-gutter pb-[clamp(20px,5vh,48px)] pt-[clamp(72px,12vh,120px)]">
      <p className="f-mono text-ink">Pre-order waitlist · OSC-1 · concept</p>
      <div className="mt-[2vh]">
        <Headline />
      </div>
      <div className="mt-auto grid items-end gap-x-[6vw] gap-y-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <p className="max-w-[26rem] text-lead leading-snug text-ink max-lg:hidden">
          First batch: 500 units, hand-built, numbered under the CUTOFF knob. Leave a name and we would write when the line moves. If this were real.
        </p>
        <WaitlistForm />
      </div>
    </div>
  );
}

export function Waitlist() {
  const flood = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const m = useRef({ inert: true, ink: true });
  const d = useMemo(() => crestPath(1000, 300), []);

  const frame = useCallback((s: { enter: number; progress: number; exit: number; offsetY: number }) => {
    const h = innerHeight;
    const c = s.enter - 1 + s.progress * DUR;
    const k = easeInOutCubic(range(c, -0.3, 0.7));
    const crestY = lerp(h, -CREST * h, k); // screen y of the crest's top
    if (flood.current) flood.current.style.transform = `translate3d(0,${crestY - s.offsetY}px,0)`;

    const ink = crestY > h * 0.06;
    if (s.enter >= 0.5 && s.exit < 0.5 && ink !== m.current.ink) {
      m.current.ink = ink;
      applyTheme(ink ? INK : sceneTheme.waitlist, ink ? "waitlist-ink" : "waitlist");
    }
    if (s.enter < 0.5 || s.exit >= 0.5) m.current.ink = !ink; // re-apply when the scene comes back

    const o = range(s.progress, 0.25, 0.36);
    const el = content.current;
    if (el) {
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0,${(1 - o) * 24}px,0)`;
      const inert = o < 0.9;
      if (inert !== m.current.inert) el.inert = m.current.inert = inert;
    }
  }, []);
  useSceneFrame(WAITLIST_ID, frame);

  return (
    <SceneTrack
      id={WAITLIST_ID}
      label="Pre-order waitlist"
      duration={DUR}
      theme="waitlist"
      ownsTheme
      anchor={0.5}
      back={
        <div className="absolute inset-0 overflow-hidden bg-ink">
          <div ref={flood} className="absolute inset-x-0 top-0 will-change-transform" style={{ height: `${(1 + CREST) * 100}lvh` }}>
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="block w-full" style={{ height: `${CREST * 100}lvh` }} aria-hidden>
              <path d={d} fill="var(--color-signal)" />
            </svg>
            <div className="-mt-px h-[100lvh] bg-signal" />
          </div>
        </div>
      }
      front={
        <div ref={content} className="interactive absolute inset-0 opacity-0" inert>
          <Body />
        </div>
      }
      poster={
        <div className="relative">
          <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="block h-[18svh] w-full rotate-180 bg-signal" aria-hidden>
            <path d={d} fill="var(--color-ink)" />
          </svg>
          <Body />
        </div>
      }
    />
  );
}
