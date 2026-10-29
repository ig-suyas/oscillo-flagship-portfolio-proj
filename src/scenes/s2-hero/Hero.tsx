"use client";
import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import * as m from "motion/react-m";
import { SceneTrack } from "@/components/SceneTrack";
import { SynthSchematic } from "@/components/SynthSchematic";
import { RibbonLine, type RibbonHandle } from "@/ribbon/RibbonLine";
import { useSceneFrame } from "@/lib/scenes";
import { prefersReducedMotion } from "@/lib/mode";
import { useFitText } from "@/lib/useFitText";
import { range, easeInOutCubic } from "@/lib/math";
import { ease } from "@/lib/tokens";
import { heroIntro, onHeroIntro } from "./state";

/**
 * Scene 01 · Hero. Giant wordmark (back layer) / synth + 3D ribbon (canvas) / labels (front).
 * progress: 0-0.1 hold · 0.1-0.72 dolly to the CUTOFF knob (max zoom defined in HeroGL) · 0.72-1 hold
 */
export const HERO_ID = "hero";

function Word({ className = "" }: { className?: string }) {
  const ref = useFitText<HTMLDivElement>(1);
  const letters = (w: string) =>
    [...w].map((c, i) => (
      <span key={i} className="inline-block overflow-hidden pb-[0.04em] pt-[0.06em] -mb-[0.04em] -mt-[0.06em] align-top">
        <span className="hero-letter inline-block will-change-transform">{c}</span>
      </span>
    ));
  return (
    <div ref={ref} className={`f-display select-none whitespace-nowrap text-bone text-[17.25vw] [@media(max-aspect-ratio:4/5)]:text-[33vw] ${className}`} aria-hidden>
      <div data-line className="hero-wide w-max">{letters("OSCILLO")}</div>
      <div data-line className="hero-tall w-max">{letters("OSC")}</div>
      <div data-line className="hero-tall w-max">{letters("ILLO")}</div>
    </div>
  );
}

const Labels = ({ hold }: { hold?: boolean }) => (
  <>
    <div className="hero-label absolute bottom-[clamp(16px,4vh,40px)] left-gutter f-mono max-w-[16rem] text-bone/80">
      <p className="text-bone">OSC-1</p>
      <p>Desktop analog monosynth</p>
      <p>Three oscillators, one ribbon</p>
    </div>
    <div className="hero-label absolute bottom-[clamp(16px,4vh,40px)] right-gutter f-mono text-right text-bone/80">
      <p>Scroll to play</p>
      <RibbonLine wave={{ shape: "sine", cycles: 3 }} width={120} height={18} core={1.5} halo={6} className="ml-auto mt-2 h-[18px] w-[96px]" />
    </div>
    {hold && (
      <div className="hero-hold absolute bottom-[12vh] left-gutter right-gutter max-w-[22rem] opacity-0 sm:bottom-[9vh]">
        <p className="f-mono text-signal">Cutoff / 24 dB ladder</p>
        <p className="mt-3 text-lead leading-snug text-bone">One knob does most of the talking. Everything else is there to argue with it.</p>
      </div>
    )}
  </>
);

export function Hero() {
  const back = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);

  // Intro: plays once when the loader hands off (strong first 3 seconds)
  useEffect(
    () =>
      onHeroIntro(() => {
        const tl = gsap.timeline({ defaults: { ease: ease.out } });
        tl.fromTo(".hero-letter", { y: 0, yPercent: 115 }, { y: 0, yPercent: 0, duration: 1.3, stagger: 0.045 }, 0.15)
          .fromTo(heroIntro, { drop: 0 }, { drop: 1, duration: 1.8 }, 0.25)
          .fromTo(heroIntro, { ribbon: 0 }, { ribbon: 1, duration: 1.6, ease: ease.soft }, 0.7)
          .fromTo(heroIntro, { power: 0 }, { power: 1, duration: 0.9, ease: "none" }, 1.1)
          .fromTo(".hero-label > *", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, 1.4);
        if (prefersReducedMotion()) tl.progress(1);
      }),
    [],
  );

  const frame = useCallback((s: { progress: number }) => {
    const k = easeInOutCubic(range(s.progress, 0.08, 0.6));
    if (back.current) {
      back.current.style.transform = `translate3d(0,${-k * 8}vh,0) scale(${1 + k * 0.3})`;
      back.current.style.opacity = String(1 - range(s.progress, 0.2, 0.6));
    }
    const f = front.current;
    if (f) {
      const lab = 1 - range(s.progress, 0.04, 0.14);
      f.querySelectorAll<HTMLElement>(".hero-label").forEach((l) => (l.style.opacity = String(lab)));
      const hold = f.querySelector<HTMLElement>(".hero-hold");
      if (hold) hold.style.opacity = String(range(s.progress, 0.68, 0.8));
    }
  }, []);
  useSceneFrame(HERO_ID, frame);

  return (
    <SceneTrack
      id={HERO_ID}
      label="OSCILLO OSC-1"
      duration={1.4}
      theme="hero"
      back={
        <div className="absolute inset-0 flex items-start px-gutter pt-[17vh] [@media(max-aspect-ratio:4/5)]:pt-[15vh]">
          <div ref={back} className="w-full will-change-transform">
            <Word />
          </div>
        </div>
      }
      front={
        <div ref={front} className="absolute inset-0">
          <h1 className="sr-only">OSCILLO OSC-1, a desktop analog synthesizer. Concept project.</h1>
          <Labels hold />
        </div>
      }
      poster={<HeroPoster />}
    />
  );
}

function HeroPoster() {
  return (
    <div className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-gutter pb-28 pt-24">
      <h1 className="sr-only">OSCILLO OSC-1, a desktop analog synthesizer. Concept project.</h1>
      <m.div initial={{ y: 30 }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
        <Word />
      </m.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[16vh]">
        <RibbonLine wave={{ shape: "signal", cycles: 4, amp: 0.7, envelope: "taper" }} width={1000} height={120} className="h-[10vh] w-full" core={2} halo={10} />
      </div>
      <SynthSchematic className="relative mx-auto mt-[4vh] w-[min(92vw,760px)]" />
      <Labels />
    </div>
  );
}
