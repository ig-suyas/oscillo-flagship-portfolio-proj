"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { scenes } from "@/scenes/registry";
import { scrollToId } from "@/lib/loop";
import { toggleSound, onSound } from "@/lib/audio";
import { RibbonLine } from "@/ribbon/RibbonLine";

export function Header() {
  const [on, setOn] = useState(false);
  useEffect(() => onSound(setOn), []);
  return (
    <header className="fixed inset-x-0 top-0 flex items-start justify-between px-gutter pt-[clamp(14px,2.4vh,26px)]" style={{ zIndex: 30, color: "var(--scene-fg)" }}>
      <a href="#hero" onClick={(e) => (e.preventDefault(), scrollToId("hero"))} className="f-display text-[clamp(1rem,1.3vw,1.3rem)] tracking-[-0.02em]">
        Oscillo
      </a>
      <nav aria-label="Scenes" className="f-mono hidden gap-6 md:flex">
        {scenes.filter((s) => s.nav).map((s) => (
          <a key={s.id} href={`#${s.id}`} onClick={(e) => (e.preventDefault(), scrollToId(s.id))} className="opacity-70 transition-opacity hover:opacity-100">
            {s.nav}
          </a>
        ))}
      </nav>
      <button type="button" onClick={toggleSound} aria-pressed={on} className="f-mono flex items-center gap-2">
        <span className="relative h-3 w-8 overflow-hidden">
          <span className={`absolute inset-y-0 left-0 w-16 ${on ? "animate-[osc-run_0.9s_linear_infinite]" : ""}`}>
            <RibbonLine loop wave={{ shape: "sine", cycles: 2, amp: on ? 0.9 : 0.12 }} width={32} height={12} core={1.5} halo={0} color="currentColor" className="h-3 w-8" />
          </span>
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <m.span key={String(on)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            Sound {on ? "on" : "off"}
          </m.span>
        </AnimatePresence>
      </button>
    </header>
  );
}
