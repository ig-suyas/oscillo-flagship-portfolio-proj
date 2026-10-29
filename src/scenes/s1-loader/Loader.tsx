"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import * as m from "motion/react-m";
import { RibbonLine, type RibbonHandle } from "@/ribbon/RibbonLine";
import { useMode, prefersReducedMotion } from "@/lib/mode";
import { glStatus, lockScroll } from "@/lib/loop";
import { easeOutCubic } from "@/lib/math";
import { ease } from "@/lib/tokens";
import { playHeroIntro } from "@/scenes/s2-hero/state";

/**
 * Scene 00 · Loader. The ribbon draws itself while the counter tracks real readiness
 * (fonts + first WebGL frame), never faster than MIN seconds so the draw reads.
 * Hand-off: the line flattens, the panel splits along it, the hero intro starts.
 */
const MIN = { full: 2.2, lite: 1.1 };
const TIMEOUT = 7; // seconds: never trap a visitor behind the loader

export function Loader() {
  const mode = useMode();
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<RibbonHandle>(null);
  const lineWrap = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const done = useRef<() => void>(() => {});

  useEffect(() => {
    if (mode === "pending") return;
    history.scrollRestoration = "manual";
    scrollTo(0, 0);
    lockScroll(true);
    const reduced = prefersReducedMotion();
    const min = reduced ? 0 : MIN[mode];
    const t0 = performance.now();
    let fonts = 0, gl = mode === "lite" ? 1 : glStatus.ready ? 1 : 0, raf = 0, finished = false;
    document.fonts.ready.then(() => (fonts = 1));
    const onGL = () => (gl = 1);
    glStatus.onReady.add(onGL);

    const exit = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      line.current?.setDraw(1);
      if (count.current) count.current.textContent = "100";
      playHeroIntro();
      const tl = gsap.timeline({
        onComplete: () => {
          lockScroll(false);
          setGone(true);
        },
      });
      if (reduced) tl.to(root.current, { autoAlpha: 0, duration: 0.3 });
      else
        tl.to(lineWrap.current, { scaleY: 0.03, duration: 0.35, ease: "power2.in" })
          .to(".ld-ui", { autoAlpha: 0, duration: 0.25 }, 0)
          .to(".ld-top", { yPercent: -101, duration: 1, ease: ease.inOut }, 0.3)
          .to(".ld-bot", { yPercent: 101, duration: 1, ease: ease.inOut }, 0.3)
          .to(lineWrap.current, { autoAlpha: 0, duration: 0.3 }, 0.45);
    };
    done.current = exit;

    const tick = () => {
      const time = (performance.now() - t0) / 1000;
      const ready = fonts * 0.3 + gl * 0.7;
      const p = Math.min(min ? easeOutCubic(Math.min(1, time / min)) : 1, ready);
      line.current?.setDraw(p);
      if (count.current) count.current.textContent = String(Math.floor(p * 100)).padStart(3, "0");
      if (p >= 1 || time > TIMEOUT) exit();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      glStatus.onReady.delete(onGL);
    };
  }, [mode]);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 overflow-hidden" style={{ zIndex: 60, height: "100lvh" }} role="status" aria-label="Loading OSCILLO">
      <div className="ld-top absolute inset-x-0 top-0 h-1/2 bg-ink will-change-transform" />
      <div className="ld-bot absolute inset-x-0 bottom-0 h-1/2 bg-ink will-change-transform" />
      <div ref={lineWrap} className="absolute inset-x-gutter top-1/2 h-[24vh] -translate-y-1/2 will-change-transform">
        <RibbonLine ref={line} draw={0} wave={{ shape: "signal", cycles: 5, amp: 0.85, envelope: "swell", samples: 400 }} width={1000} height={240} core={2.5} halo={14} className="h-full w-full" />
      </div>
      <div className="ld-ui f-mono absolute left-gutter top-[clamp(16px,3vh,32px)] text-bone/70">
        <p className="text-bone">OSCILLO</p>
        <p>Warming the oscillators</p>
      </div>
      <div className="ld-ui absolute bottom-[clamp(12px,3vh,28px)] left-gutter right-gutter flex items-end justify-between">
        <span ref={count} className="f-display text-[clamp(4rem,14vw,13rem)] leading-[0.78] text-bone" aria-hidden>
          000
        </span>
        <m.button
          type="button"
          onClick={() => done.current()}
          className="f-mono interactive mb-2 border border-bone/40 px-4 py-3 text-bone"
          whileHover={{ backgroundColor: "#ff4a14", borderColor: "#ff4a14", color: "#0d0c0b" }}
          transition={{ duration: 0.2 }}
        >
          Skip intro
        </m.button>
      </div>
    </div>
  );
}
