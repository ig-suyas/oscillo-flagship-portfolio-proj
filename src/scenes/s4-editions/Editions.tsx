"use client";
import { useCallback, useRef } from "react";
import { SceneTrack, applyTheme } from "@/components/SceneTrack";
import { RibbonLine } from "@/ribbon/RibbonLine";
import type { WaveShape } from "@/ribbon/wave";
import { useSceneFrame } from "@/lib/scenes";
import { pointer } from "@/lib/pointer";
import { range, damp, easeInOutCubic } from "@/lib/math";
import { color } from "@/lib/tokens";

/**
 * Scene 03 · Perspective card stack (CSS 3D planes, no WebGL).
 * Cursor c = progress * 3. Card k is at the front (z = 0, the MAX zoom) while c - k is in
 * [0, 0.6] (HOLD), drops out over [0.6, 1]. Cards behind only move forward while the front
 * card exits, so nothing creeps or keeps zooming. The last card holds until the scene leaves.
 */
export const EDITIONS_ID = "editions";

type Edition = { n: string; name: string; world: string; card: string; ink: string; line: string; wave: WaveShape; specs: [string, string][] };
const EDITIONS: Edition[] = [
  {
    n: "01", name: "Carbon", world: color.bone, card: color.ink, ink: color.bone, line: color.signal, wave: "sine",
    specs: [["Body", "Bead-blasted black"], ["Knobs", "Raw aluminium"], ["Voice", "Sine, round and low"]],
  },
  {
    n: "02", name: "Signal", world: color.ink, card: color.signal, ink: color.ink, line: color.ink, wave: "saw",
    specs: [["Body", "Signal orange powdercoat"], ["Knobs", "Black anodised"], ["Voice", "Saw, all teeth"]],
  },
  {
    n: "03", name: "Volt", world: color.volt, card: color.bone, ink: color.volt, line: color.volt, wave: "square",
    specs: [["Body", "Bone enamel"], ["Knobs", "Electric blue caps"], ["Voice", "Square, hollow and loud"]],
  },
];
const THEMES = EDITIONS.map((e) => ({ bg: e.world, fg: e.world === color.bone ? color.ink : color.bone, accent: color.signal }));
const DEPTH = 300; // px between stacked planes
const exitOf = (c: number, k: number) => (k === EDITIONS.length - 1 ? 0 : easeInOutCubic(range(c - k, 0.6, 1)));

function Card({ e }: { e: Edition }) {
  return (
    <article
      className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[clamp(10px,1.2vw,18px)] p-[clamp(16px,2.4vw,36px)] [container-type:inline-size]"
      style={{ background: e.card, color: e.ink }}
    >
      <header className="f-mono flex justify-between gap-4">
        <span>Edition {e.n} / 03</span>
        <span>OSC-1 · {e.name}</span>
      </header>
      <div className="relative">
        <h3 className="f-display relative z-[1] text-[19cqi]">{e.name}</h3>
        <RibbonLine wave={{ shape: e.wave, cycles: 5, amp: 0.7 }} width={1000} height={160} color={e.line} core={2.5} halo={0} className="mt-[3cqi] h-[9cqi] w-full" />
      </div>
      <dl className="f-mono grid grid-cols-3 gap-4 max-sm:grid-cols-1 max-sm:gap-1">
        {e.specs.map(([k, v]) => (
          <div key={k} className="max-sm:flex max-sm:justify-between max-sm:gap-4">
            <dt className="opacity-[0.85]">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div data-shade className="pointer-events-none absolute inset-0 bg-ink opacity-0" />
    </article>
  );
}

export function Editions() {
  const worlds = useRef<(HTMLDivElement | null)[]>([]);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const m = useRef({ tx: 0, ty: 0, active: -1 });

  const frame = useCallback((s: { progress: number; enter: number; exit: number }, dt: number) => {
    const c = s.progress * EDITIONS.length;
    let depth = 0;
    EDITIONS.forEach((_, k) => {
      const ex = exitOf(c, k);
      const el = cards.current[k];
      if (el) {
        const y = ex * 105;
        el.style.transform = `translate3d(0,${y - depth * 7}vh,${-depth * DEPTH}px) rotateX(${ex * -28}deg)`;
        el.style.opacity = String(1 - range(ex, 0.75, 1));
        el.style.visibility = ex >= 1 || depth > 2.2 ? "hidden" : ""; // "" inherits, so the hidden layer hides it
        const shade = el.querySelector<HTMLElement>("[data-shade]");
        if (shade) shade.style.opacity = String(Math.min(0.55, depth * 0.3));
      }
      if (k > 0 && worlds.current[k]) worlds.current[k]!.style.opacity = String(exitOf(c, k - 1));
      depth += 1 - ex;
    });
    const active = Math.min(EDITIONS.length - 1, EDITIONS.findIndex((_, k) => exitOf(c, k) < 0.5));
    if (active !== m.current.active && s.enter >= 0.5 && s.exit < 0.5) {
      m.current.active = active;
      applyTheme(THEMES[active], `editions-${active}`);
      if (counter.current) counter.current.textContent = EDITIONS[active].n;
    }
    if (s.enter < 0.5 || s.exit >= 0.5) m.current.active = -1;
    m.current.tx = damp(m.current.tx, pointer.x, 4, dt);
    m.current.ty = damp(m.current.ty, pointer.y, 4, dt);
    if (stage.current) stage.current.style.transform = `rotateY(${m.current.tx * 7}deg) rotateX(${-m.current.ty * 5}deg)`;
  }, []);
  useSceneFrame(EDITIONS_ID, frame);

  return (
    <SceneTrack
      id={EDITIONS_ID}
      label="Editions"
      duration={3.4}
      theme="editions"
      ownsTheme
      back={
        <div className="absolute inset-0">
          {EDITIONS.map((e, k) => (
            <div key={e.n} ref={(el) => void (worlds.current[k] = el)} className="absolute inset-0" style={{ background: e.world, opacity: k ? 0 : 1 }} />
          ))}
        </div>
      }
      front={
        <div className="absolute inset-0" style={{ color: "var(--scene-fg)" }}>
          <h2 className="f-mono absolute left-gutter top-[clamp(72px,11vh,110px)]">
            Editions <span ref={counter}>01</span> / 03
          </h2>
          <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
            <div ref={stage} className="relative h-[min(64vh,calc(min(78vw,1180px)*0.58))] w-[min(78vw,1180px)] [transform-style:preserve-3d] [@media(max-aspect-ratio:4/5)]:h-[60svh] [@media(max-aspect-ratio:4/5)]:w-[88vw]">
              {EDITIONS.map((e, k) => (
                <div key={e.n} ref={(el) => void (cards.current[k] = el)} className="absolute inset-0 origin-bottom will-change-transform" style={{ zIndex: 10 - k }}>
                  <Card e={e} />
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      poster={
        <div className="flex flex-col">
          <h2 className="f-mono px-gutter pb-6 pt-20">Editions / 03</h2>
          {EDITIONS.map((e, k) => (
            <div key={e.n} data-fg={THEMES[k].fg} className="px-gutter py-10" style={{ background: e.world }}>
              <div className="relative h-[70svh] max-h-[560px]">
                <Card e={e} />
              </div>
            </div>
          ))}
        </div>
      }
    />
  );
}
