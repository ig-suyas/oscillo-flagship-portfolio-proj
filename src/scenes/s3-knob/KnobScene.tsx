"use client";
import { useCallback, useLayoutEffect, useRef } from "react";
import { SceneTrack } from "@/components/SceneTrack";
import { RibbonLine, type RibbonHandle } from "@/ribbon/RibbonLine";
import { useSceneFrame } from "@/lib/scenes";
import { useMode } from "@/lib/mode";
import { range, easeInOutCubic, lerp } from "@/lib/math";
import { setTone } from "@/lib/audio";

/**
 * Scene 02 · Marquee-to-object. Two giant marquee rows; the knob grows out of the "O" ring in row B.
 * progress: 0-0.3 knob rides in the ring · 0.3-0.58 grows to MAX + turns · 0.58-1 HOLD (pointer tilt only)
 */
export const KNOB_ID = "knob";

/** Scene-owned screen state, written by the DOM frame, read by KnobGL in the same tick. */
export const knobState = { x: 0, y: 0, d: 0, grow: 0, value: 0 };

const ROW_A = "Turn the knob.";
const GROW = [0.3, 0.58] as const;
const SPEED = 1.5; // row travel in viewport widths per unit progress

/** Max knob diameter in px. Defined once; the hold never exceeds it. */
export const knobMax = (w: number, h: number) => (w > h ? Math.min(w * 0.36, h * 0.5) : w * 0.6);

function RowB({ ring }: { ring?: React.Ref<HTMLSpanElement> }) {
  return (
    <span className="mr-[0.35em] inline-flex items-center">
      HEAR THE R
      <span ref={ring} className="mx-[0.02em] inline-block h-[0.66em] w-[0.66em] rounded-full border-[0.11em] border-current" />
      OM.
    </span>
  );
}

export function KnobScene() {
  const rowA = useRef<HTMLDivElement>(null);
  const rowB = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const rows = useRef<HTMLDivElement>(null);
  const dial = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const line = useRef<RibbonHandle>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const m = useRef({ ringX: 0, ringY: 0, ringD: 0, last: "" });
  const mode = useMode();

  // cache ring geometry relative to row B (no layout reads per frame)
  useLayoutEffect(() => {
    const measure = () => {
      const r = ring.current, row = rowB.current;
      if (!r || !row) return;
      row.style.transform = "none";
      const a = r.getBoundingClientRect(), b = row.getBoundingClientRect(), l = row.parentElement!.parentElement!.getBoundingClientRect();
      m.current.ringX = a.left - b.left + a.width / 2;
      m.current.ringY = a.top - l.top + a.height / 2;
      m.current.ringD = a.width;
    };
    measure();
    document.fonts?.ready.then(measure);
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, [mode]);

  const frame = useCallback((s: { progress: number }, _dt: number, time: number) => {
    const w = innerWidth, h = innerHeight, p = s.progress, c = m.current;
    // row B is placed so the ring hits screen center at p = GROW[0]
    const bx = w / 2 - c.ringX + (GROW[0] - p) * SPEED * w;
    if (rowB.current) rowB.current.style.transform = `translate3d(${bx}px,0,0)`;
    if (rowA.current) rowA.current.style.transform = `translate3d(${-w * 0.4 + p * SPEED * w * 0.8}px,0,0)`;
    if (rows.current) rows.current.style.opacity = String(1 - 0.86 * range(p, 0.3, 0.5) - 0.14 * range(p, 0.55, 0.62)); // gone before the copy lands

    const g = easeInOutCubic(range(p, GROW[0], GROW[1]));
    const max = knobMax(w, h);
    const cy = w > h ? h * 0.5 : h * 0.44;
    knobState.grow = g;
    knobState.x = lerp(bx + c.ringX, w / 2, g);
    knobState.y = lerp(c.ringY, cy, g);
    knobState.d = lerp(c.ringD * 0.86, max, g);
    knobState.value = g * 0.78;
    if (ring.current) ring.current.style.opacity = g > 0.02 ? "0.25" : "0";
    setTone(knobState.value);

    const hold = range(p, 0.55, 0.66);
    if (dial.current) {
      dial.current.style.opacity = String(hold);
      dial.current.style.transform = `translate3d(-50%,-50%,0) translate3d(${w / 2}px,${cy}px,0) scale(${max / 400})`;
    }
    if (copy.current) copy.current.style.opacity = String(range(p, 0.6, 0.72));
    if (wrap.current) wrap.current.style.transform = `translate3d(0,${cy}px,0) scaleY(${0.25 + knobState.value * 1.1})`;
    line.current?.setShift((time * 0.12) % 1);
    const txt = (knobState.value * 10).toFixed(1);
    if (readout.current && txt !== c.last) readout.current.textContent = c.last = txt;
  }, []);
  useSceneFrame(KNOB_ID, frame);

  return (
    <SceneTrack
      id={KNOB_ID}
      label="Turn the knob. Hear the room."
      duration={2.6}
      theme="knob"
      back={
        <div className="absolute inset-0 overflow-hidden">
          <div ref={wrap} className="absolute inset-x-0 top-0 -mt-[60px] h-[120px] origin-center will-change-transform">
            <div className="h-full w-[200vw]">
              <RibbonLine ref={line} loop wave={{ shape: "signal", cycles: 3, amp: 0.9 }} width={1000} height={120} className="h-full w-[100vw]" core={2} halo={10} />
            </div>
          </div>
          <div ref={rows} className="f-display absolute inset-0 text-ink will-change-[opacity]" aria-hidden>
            <div className="absolute top-[13vh] whitespace-nowrap text-display">
              <div ref={rowA} className="w-max will-change-transform">
                {Array.from({ length: 4 }, (_, i) => <span key={i} className="mr-[0.35em]">{ROW_A}</span>)}
              </div>
            </div>
            <div className="absolute bottom-[14vh] whitespace-nowrap text-display">
              <div ref={rowB} className="flex w-max will-change-transform">
                <RowB />
                <RowB ring={ring} />
                <RowB />
                <RowB />
              </div>
            </div>
          </div>
        </div>
      }
      front={
        <div className="absolute inset-0 text-ink">
          <h2 className="sr-only">Turn the knob. Hear the room.</h2>
          <div ref={dial} className="absolute left-0 top-0 h-[400px] w-[400px] opacity-0 will-change-transform" aria-hidden>
            <Dial />
          </div>
          <div ref={copy} className="absolute bottom-[clamp(20px,5vh,48px)] left-gutter right-gutter flex items-end justify-between gap-8 opacity-0">
            <p className="max-w-[24rem] text-lead leading-snug">
              Machined from solid aluminium, knurled for a thumb, weighted to coast a hair after you let go. Seven o&apos;clock is a whisper. Five o&apos;clock fills the room.
            </p>
            <p className="f-mono shrink-0 text-right">
              Cutoff
              <span ref={readout} className="block font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,5rem)] font-black leading-none text-signal">
                0.0
              </span>
            </p>
          </div>
        </div>
      }
      poster={<KnobPoster />}
    />
  );
}

/** Scale ring around the knob, drawn in a 400px box and scaled to the knob size. Labels sit on fixed anchors. */
const r2 = (v: number) => Math.round(v * 100) / 100;

function Dial() {
  const ticks = Array.from({ length: 41 }, (_, i) => -135 + (270 * i) / 40);
  return (
    <svg viewBox="-200 -200 400 400" className="h-full w-full overflow-visible">
      {ticks.map((a, i) => {
        const r1 = 228, rr = i % 4 === 0 ? 248 : 238, rad = (a * Math.PI) / 180;
        return <line key={i} x1={r2(Math.sin(rad) * r1)} y1={r2(-Math.cos(rad) * r1)} x2={r2(Math.sin(rad) * rr)} y2={r2(-Math.cos(rad) * rr)} stroke="currentColor" strokeWidth={i % 4 === 0 ? 2.5 : 1.2} />;
      })}
      {Array.from({ length: 11 }, (_, i) => {
        const rad = ((-135 + 27 * i) * Math.PI) / 180;
        return (
          <text key={i} x={r2(Math.sin(rad) * 276)} y={r2(-Math.cos(rad) * 276)} textAnchor="middle" dominantBaseline="middle" fontSize={20} fill="currentColor" className="font-[family-name:var(--font-mono)]">
            {i}
          </text>
        );
      })}
    </svg>
  );
}

function KnobPoster() {
  return (
    <div className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden py-20 text-ink">
      <div className="f-display text-display whitespace-nowrap" aria-hidden>
        <div className="-translate-x-[18%]">{ROW_A} {ROW_A}</div>
      </div>
      <h2 className="sr-only">Turn the knob. Hear the room.</h2>
      <div className="relative mx-auto my-8 aspect-square w-[min(62vw,420px)]">
        <div className="absolute inset-[14%] rounded-full bg-ink" />
        <div className="absolute inset-[24%] rounded-full border border-bone/25" />
        <div className="absolute inset-[14%] rotate-[100deg]">
          <div className="mx-auto mt-[6%] h-[30%] w-[3.5%] rounded-full bg-signal" />
        </div>
        <div className="absolute inset-0">
          <Dial />
        </div>
      </div>
      <div className="f-display text-display whitespace-nowrap" aria-hidden>
        <div className="-translate-x-[6%]"><RowB /><RowB /></div>
      </div>
      <p className="mx-gutter mt-8 max-w-[24rem] text-lead leading-snug">
        Machined from solid aluminium, knurled for a thumb, weighted to coast a hair after you let go. Seven o&apos;clock is a whisper. Five o&apos;clock fills the room.
      </p>
    </div>
  );
}
