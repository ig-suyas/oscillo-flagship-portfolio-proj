"use client";
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RibbonLine } from "@/ribbon/RibbonLine";
import { useMode } from "@/lib/mode";
import { scrollToId } from "@/lib/loop";
import { easeOutCubic, range } from "@/lib/math";

/**
 * Scene 08 · Footer. Where the ribbon ends: as the footer scrolls in, the waveform's amplitude
 * collapses (scaleY, transform only) and hands off to a flat rule (opacity). Lite mode shows the rule.
 * Full-screen, so the page ends on the flatline alone (the waitlist has fully left).
 */
const LINKS = [
  ["hero", "Back to top"],
  ["process", "Process"],
  ["specs", "Specs"],
  ["waitlist", "Pre-order"],
] as const;

export function Footer() {
  const mode = useMode();
  const root = useRef<HTMLElement>(null);
  const amp = useRef<HTMLDivElement>(null);
  const rule = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "full" || !root.current) return;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      end: "bottom bottom",
      onUpdate(self) {
        const e = easeOutCubic(self.progress), hand = range(e, 0.7, 1);
        if (amp.current) amp.current.style.transform = `scaleY(${Math.max(0.1, 1 - e)})`;
        if (amp.current) amp.current.style.opacity = String(1 - hand);
        if (rule.current) rule.current.style.opacity = String(hand);
      },
    });
    st.vars.onUpdate!(st);
    return () => st.kill();
  }, [mode]);

  return (
    <footer ref={root} id="footer" data-fg="#ece6da" className="relative flex min-h-[100svh] flex-col bg-ink px-gutter pb-8 pt-24 text-bone">
      <div className="relative my-auto h-[60px]">
        {mode === "full" && (
          <div ref={amp} className="origin-center">
            <RibbonLine wave={{ shape: "signal", cycles: 6, amp: 0.8, envelope: "taper" }} width={1000} height={60} core={2} halo={8} className="h-[60px] w-full" />
          </div>
        )}
        {/* the landed ribbon: a flat rule (the wave hands off to it below 10% amplitude) */}
        <div ref={rule} className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-signal" style={{ opacity: mode === "full" ? 0 : 1 }} />
      </div>
      <nav aria-label="Footer" className="f-mono flex flex-wrap gap-x-6 gap-y-2">
        {LINKS.map(([id, label]) => (
          <a key={id} href={`#${id}`} onClick={(e) => (e.preventDefault(), scrollToId(id))} className="underline-offset-4 hover:text-signal hover:underline">
            {label}
          </a>
        ))}
      </nav>
      <div className="f-mono mt-10 grid gap-6 text-bone/70 md:grid-cols-3">
        <p>
          <span className="text-signal">Concept project.</span> OSCILLO and the OSC-1 are fictional. No product, no orders, no affiliation. The waitlist sends nothing.
        </p>
        <p>Every object on this page is built in code: three.js primitives, canvas textures, no photos, no stock.</p>
        <p className="md:text-right">Design and build: a freelance studio piece · 2026</p>
      </div>
    </footer>
  );
}
