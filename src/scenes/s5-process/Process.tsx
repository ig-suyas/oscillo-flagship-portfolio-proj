"use client";
import { useCallback, useLayoutEffect, useRef } from "react";
import { SceneTrack } from "@/components/SceneTrack";
import { RibbonLine } from "@/ribbon/RibbonLine";
import { wave, envelope, type WaveOpts } from "@/ribbon/wave";
import { useSceneFrame } from "@/lib/scenes";
import { useMode } from "@/lib/mode";
import { range, easeInOutCubic, lerp } from "@/lib/math";

/**
 * Scene 05 · Path-following ribbon (the signature moment).
 * The spine becomes the path: four segments sampled from wave(), one per step, so the
 * ribbon itself gets oscillated, filtered, shaped and played as the head travels.
 * progress: 0-0.05 settle · 0.05-0.84 head travels anchor to anchor with a dwell at each · 0.84-1 HOLD
 * Landscape: the path runs left to right, captions alternate above/below their anchor (one quarter each).
 * Portrait: the path runs top to bottom in a left column, captions sit right of their anchor.
 */
export const PROCESS_ID = "process";

type Step = { n: string; name: string; body: string; seg: WaveOpts & { amp: number } };
const STEPS: Step[] = [
  { n: "01", name: "Oscillate", body: "Three oscillators start raw: a saw full of teeth, a sub an octave down.", seg: { shape: "saw", cycles: 4, amp: 1 } },
  { n: "02", name: "Filter", body: "The 24 dB ladder files the teeth off. CUTOFF decides how much survives.", seg: { shape: "sine", cycles: 3, amp: 0.55 } },
  { n: "03", name: "Shape", body: "Four faders draw the envelope: how a note swells in and how long it hangs.", seg: { shape: "sine", cycles: 3, amp: 1, envelope: "swell" } },
  { n: "04", name: "Play", body: "Sixteen keys and a ribbon. Drag a finger and the pitch goes where it goes.", seg: { shape: "signal", cycles: 3, amp: 0.9, envelope: "taper" } },
];
const N = STEPS.length;
const SAMPLES = 120; // per segment
const anchorU = (i: number) => (i + 0.5) / N;

/** Path offset in -1..1 at u (0..1). Each segment starts and ends at 0, so they join cleanly. */
function offset(u: number) {
  const i = Math.min(N - 1, Math.floor(u * N));
  const l = u * N - i;
  const { amp, envelope: env = "flat", ...w } = STEPS[i].seg;
  return wave(l, w) * envelope(l, env) * amp;
}

/** Head position u over progress: travel, dwell at each anchor, travel on to the end. */
const KEYS = [0, ...STEPS.flatMap((_, i) => [anchorU(i), anchorU(i)]), 1];
function headU(p: number) {
  const q = range(p, 0.05, 0.84) * (KEYS.length - 1);
  const i = Math.min(KEYS.length - 2, Math.floor(q));
  return lerp(KEYS[i], KEYS[i + 1], easeInOutCubic(q - i));
}

type Layout = { pts: Float32Array; len: Float32Array; d: string; portrait: boolean; w: number; h: number };

function buildLayout(w: number, h: number): Layout {
  const portrait = w / h < 0.8;
  const g = Math.max(16, Math.min(40, w * 0.026));
  const total = SAMPLES * N;
  const pts = new Float32Array((total + 1) * 2);
  const len = new Float32Array(total + 1);
  let d = "";
  for (let k = 0; k <= total; k++) {
    const u = k / total, o = offset(u);
    const x = portrait ? g + 36 + o * 26 : lerp(g, w - g, u);
    const y = portrait ? lerp(h * 0.27, h * 0.94, u) : h * 0.56 - o * h * 0.11;
    pts[k * 2] = x;
    pts[k * 2 + 1] = y;
    if (k) len[k] = len[k - 1] + Math.hypot(x - pts[k * 2 - 2], y - pts[k * 2 - 1]);
    d += `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return { pts, len, d, portrait, w, h };
}

function Caption({ s, className = "" }: { s: Step; className?: string }) {
  return (
    <div className={className}>
      <p className="f-mono"><span className="text-signal" aria-hidden>● </span>Step {s.n}</p>
      <h3 className="f-display mt-2 text-[clamp(1.6rem,2.6vw,3rem)] leading-[0.9]">{s.name}</h3>
      <p className="mt-2 max-w-[19rem] text-[clamp(0.9rem,1vw,1.05rem)] leading-snug">{s.body}</p>
    </div>
  );
}

export function Process() {
  const svg = useRef<SVGSVGElement>(null);
  const paths = useRef<SVGPathElement[]>([]);
  const head = useRef<HTMLDivElement>(null);
  const caps = useRef<(HTMLElement | null)[]>([]);
  const dots = useRef<(HTMLDivElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const L = useRef<Layout | null>(null);
  const m = useRef({ draw: -1, step: -1 });
  const mode = useMode();

  // Build the path and place captions once per resize (no layout reads per frame)
  useLayoutEffect(() => {
    if (mode !== "full") return;
    const place = () => {
      const w = innerWidth, h = innerHeight, l = (L.current = buildLayout(w, h));
      svg.current?.setAttribute("viewBox", `0 0 ${w} ${h}`);
      paths.current.forEach((p) => p?.setAttribute("d", l.d));
      const g = Math.max(16, Math.min(40, w * 0.026));
      STEPS.forEach((_, i) => {
        const k = Math.round(anchorU(i) * SAMPLES * N), ax = l.pts[k * 2], ay = l.pts[k * 2 + 1];
        const dot = dots.current[i];
        if (dot) dot.style.transform = `translate3d(${ax}px,${ay}px,0) translate(-50%,-50%)`;
        const c = caps.current[i];
        if (!c) return;
        if (l.portrait) {
          const left = g + 96;
          c.style.width = `${w - left - g}px`;
          c.style.left = `${left}px`;
          c.style.top = `${ay}px`;
          c.dataset.y = "-50%";
        } else {
          const cw = (w - 2 * g) / N - 24;
          c.style.width = `${cw}px`;
          c.style.left = `${ax - cw / 2}px`;
          const above = i % 2 === 0;
          c.style.top = `${above ? h * 0.56 - h * 0.11 - 28 : h * 0.56 + h * 0.11 + 28}px`;
          c.dataset.y = above ? "-100%" : "0%";
        }
      });
      m.current.draw = -1;
    };
    place();
    addEventListener("resize", place);
    return () => removeEventListener("resize", place);
  }, [mode]);

  const frame = useCallback((s: { progress: number }) => {
    const l = L.current;
    if (!l) return;
    const u = headU(s.progress);
    const f = u * SAMPLES * N, k = Math.min(SAMPLES * N - 1, Math.floor(f)), t = f - k;
    const x = lerp(l.pts[k * 2], l.pts[k * 2 + 2], t), y = lerp(l.pts[k * 2 + 1], l.pts[k * 2 + 3], t);
    const draw = lerp(l.len[k], l.len[k + 1], t) / l.len[SAMPLES * N];
    if (Math.abs(draw - m.current.draw) > 1e-4) {
      m.current.draw = draw;
      paths.current.forEach((p, i) => i && p && (p.style.strokeDashoffset = String(1 - draw)));
      if (head.current) head.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
    }
    const step = STEPS.reduce((a, _, i) => (u >= anchorU(i) - 0.002 ? i : a), -1);
    if (step !== m.current.step) {
      m.current.step = step;
      if (counter.current) counter.current.textContent = STEPS[Math.max(0, step)].n;
      STEPS.forEach((_, i) => {
        const c = caps.current[i], on = i <= step;
        if (c) c.style.transform = `translate3d(0,calc(${c.dataset.y} + ${on ? 0 : 16}px),0)`;
        if (c) c.style.opacity = on ? "1" : "0";
        if (dots.current[i]) dots.current[i]!.style.opacity = on ? "1" : "0.35";
      });
    }
  }, []);
  useSceneFrame(PROCESS_ID, frame);

  return (
    <SceneTrack
      id={PROCESS_ID}
      label="Process: oscillate, filter, shape, play"
      duration={4}
      theme="process"
      front={
        <div className="absolute inset-0 text-ink">
          <h2 className="f-mono absolute left-gutter top-[clamp(64px,10vh,96px)]">Process · four moves, one signal</h2>
          <p className="f-display absolute right-gutter top-[clamp(56px,9vh,88px)] text-[clamp(2.75rem,6vw,7rem)] [@media(max-aspect-ratio:4/5)]:top-[calc(clamp(64px,10vh,96px)+30px)] [@media(max-aspect-ratio:4/5)]:left-gutter [@media(max-aspect-ratio:4/5)]:right-auto" aria-hidden>
            <span ref={counter}>01</span>
            <span className="text-signal">/04</span>
          </p>
          <svg ref={svg} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {[
              { w: 1.5, o: 0.16, c: "currentColor" },
              { w: 12, o: 0.18, c: "var(--color-signal)" },
              { w: 3, o: 1, c: "var(--color-signal)" },
            ].map((s, i) => (
              <path
                key={i}
                ref={(p) => void (paths.current[i] = p!)}
                fill="none"
                stroke={s.c}
                strokeWidth={s.w}
                strokeOpacity={s.o}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={i ? 1 : undefined}
                strokeDashoffset={i ? 1 : undefined}
              />
            ))}
          </svg>
          {STEPS.map((s, i) => (
            <div key={s.n} ref={(el) => void (dots.current[i] = el)} className="absolute left-0 top-0 h-4 w-4 rounded-full border-2 border-ink bg-bone opacity-35" aria-hidden />
          ))}
          <div ref={head} className="absolute left-0 top-0 h-5 w-5 rounded-full bg-signal ring-[6px] ring-signal/25 will-change-transform" aria-hidden />
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.n} ref={(el) => void (caps.current[i] = el)} className="absolute opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)]">
                <Caption s={s} />
              </li>
            ))}
          </ol>
        </div>
      }
      poster={
        <div className="px-gutter pb-16 pt-20 text-ink">
          <h2 className="f-mono">Process · four moves, one signal</h2>
          <ol className="mt-8 grid gap-10 sm:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t border-ink/20 pt-5">
                <RibbonLine wave={{ ...s.seg, samples: 160 }} width={1000} height={120} core={2.5} halo={8} className="mb-5 h-16 w-full" />
                <Caption s={s} />
              </li>
            ))}
          </ol>
        </div>
      }
    />
  );
}
