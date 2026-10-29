"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { pointer } from "@/lib/pointer";
import { damp } from "@/lib/math";
import { RibbonLine, type RibbonHandle } from "@/ribbon/RibbonLine";

/** Fine-pointer cursor: a dot plus a lagging ring carrying a live waveform that runs faster as you move. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const wave = useRef<RibbonHandle>(null);

  useEffect(() => {
    document.documentElement.classList.add("has-cursor");
    const s = { x: innerWidth / 2, y: innerHeight / 2, phase: 0, speed: 0, hover: 0, h: 0 };
    const over = (e: PointerEvent) => (s.hover = (e.target as Element).closest("a,button,label,input") ? 1 : 0);
    addEventListener("pointerover", over, { passive: true });
    const tick = (_: number, dms: number) => {
      const dt = Math.min(0.05, dms / 1000);
      s.x = damp(s.x, pointer.px, 14, dt);
      s.y = damp(s.y, pointer.py, 14, dt);
      s.speed = damp(s.speed, pointer.speed, 6, dt);
      pointer.speed *= 0.85;
      s.h = damp(s.h, s.hover, 12, dt);
      s.phase = (s.phase + dt * (0.4 + s.speed * 0.06)) % 1;
      dot.current!.style.transform = `translate3d(${pointer.px}px,${pointer.py}px,0)`;
      ring.current!.style.transform = `translate3d(${s.x}px,${s.y}px,0) scale(${1 + s.h * 0.6})`;
      wave.current?.setShift(s.phase);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0" style={{ zIndex: 50 }}>
      <div ref={dot} className="absolute -left-[3px] -top-[3px] h-[6px] w-[6px] rounded-full" style={{ background: "var(--scene-accent)" }} />
      <div ref={ring} className="absolute -left-[22px] -top-[22px] h-11 w-11 overflow-hidden rounded-full border" style={{ borderColor: "var(--scene-fg)", color: "var(--scene-accent)" }}>
        <div className="absolute left-1 right-1 top-1/2 h-4 -translate-y-1/2 overflow-hidden">
          <div className="h-full w-[200%]">
            <RibbonLine ref={wave} loop wave={{ shape: "sine", cycles: 1, amp: 0.8 }} width={36} height={16} core={1.5} halo={0} color="currentColor" className="h-full w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}
