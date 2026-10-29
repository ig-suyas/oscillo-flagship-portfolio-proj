"use client";
import { useCallback, useRef, useState } from "react";
import { SceneTrack } from "@/components/SceneTrack";
import { SynthSchematic } from "@/components/SynthSchematic";
import { useSceneFrame } from "@/lib/scenes";
import { range } from "@/lib/math";
import { SPECS, specsState } from "./parts";

/**
 * Scene 06 · Interactive specs. Hover, focus or tap a spec line and the matching part of the
 * 3D synth lights up (SpecsGL, same shared canvas). Without interaction, scroll walks the list.
 * progress: 0-0.18 synth settles to its fit distance (MAX, defined in SpecsGL) · 0.18-0.9 scroll walks
 * the list · 0.9-1 HOLD. Pointer tilt is the only motion during the hold.
 * Labels never sit on the 3D: the list is its own column, the light is on the model.
 */
export const SPECS_ID = "specs";

function List({ active, onPick, compact }: { active: number; onPick: (i: number, pin: boolean) => void; compact?: boolean }) {
  return (
    <ul className="interactive" onPointerLeave={() => onPick(-1, false)}>
      {SPECS.map((s, i) => (
        <li key={s.id} className="border-t border-current/15 last:border-b">
          <button
            type="button"
            aria-pressed={active === i}
            onPointerEnter={(e) => e.pointerType === "mouse" && onPick(i, true)}
            onFocus={() => onPick(i, true)}
            onBlur={() => onPick(-1, false)}
            onClick={() => onPick(i, true)}
            className={`group grid w-full grid-cols-[2.2rem_1fr] items-baseline gap-x-3 text-left transition-colors duration-200 ${compact ? "py-[clamp(6px,1.1vh,10px)]" : "py-[clamp(6px,1.3vh,14px)]"} ${active === i ? "text-signal" : ""}`}
          >
            <span className={`f-mono ${active === i ? "" : "opacity-60"}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="f-display text-[clamp(1.05rem,1.7vw,1.9rem)] leading-none">{s.name}</span>
              <span className={`f-mono ${active === i ? "" : "opacity-70"}`}>{s.value}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Specs() {
  const [active, setActive] = useState(0);
  const head = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const pick = useCallback((i: number, pin: boolean) => {
    specsState.pinned = pin ? i : -1;
    if (pin) {
      specsState.active = i;
      setActive(i);
    }
  }, []);

  const frame = useCallback((s: { progress: number }) => {
    const p = s.progress;
    if (head.current) head.current.style.opacity = String(range(p, 0, 0.12));
    if (list.current) list.current.style.opacity = String(range(p, 0.06, 0.18));
    if (specsState.pinned >= 0) return;
    const i = Math.min(SPECS.length - 1, Math.floor(range(p, 0.18, 0.9) * SPECS.length));
    if (i !== specsState.active) {
      specsState.active = i;
      setActive(i);
    }
  }, []);
  useSceneFrame(SPECS_ID, frame);

  return (
    <SceneTrack
      id={SPECS_ID}
      label="Specifications"
      duration={3}
      theme="specs"
      front={
        <div className="absolute inset-0 text-bone">
          <div ref={head} className="absolute left-gutter top-[clamp(64px,10vh,96px)] opacity-0">
            <h2 className="f-mono text-signal">Specification · concept</h2>
            <p className="f-display mt-3 text-[clamp(2.4rem,5vw,6rem)] [@media(max-aspect-ratio:4/5)]:text-[2.4rem]">Every part, lit.</p>
          </div>
          <div
            ref={list}
            className="absolute bottom-[clamp(20px,5vh,48px)] left-gutter w-[min(46vw,40rem)] opacity-0 [@media(max-aspect-ratio:4/5)]:right-gutter [@media(max-aspect-ratio:4/5)]:w-auto"
          >
            <p className="f-mono mb-3 opacity-60">Hover, focus or tap a line</p>
            <List active={active} onPick={pick} />
          </div>
        </div>
      }
      poster={
        <div className="px-gutter pb-16 pt-20 text-bone">
          <h2 className="f-mono text-signal">Specification · concept</h2>
          <p className="f-display mt-3 text-[2.4rem]">Every part, lit.</p>
          <SynthSchematic className="mx-auto my-8 w-[min(100%,640px)]" highlight={SPECS[active].box} />
          <p className="f-mono mb-3 opacity-60">Tap a line to light the part</p>
          <List active={active} onPick={(i) => i >= 0 && setActive(i)} compact />
        </div>
      }
    />
  );
}
