"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initMode, useMode } from "@/lib/mode";
import { startLoop } from "@/lib/loop";
import { bindPointer } from "@/lib/pointer";
import { scenes } from "@/scenes/registry";
import { Loader } from "@/scenes/s1-loader/Loader";
import { Header } from "./Header";
import { Cursor } from "./Cursor";
import { Grain } from "./Grain";
import { Footer } from "./Footer";

// The shared canvas + three.js live in a lazy chunk, full mode only.
const GLRoot = dynamic(() => import("@/gl/GLRoot"), { ssr: false });

export function Experience() {
  const mode = useMode();
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const m = initMode();
    bindPointer();
    startLoop(m === "full");
    setFine(m === "full" && matchMedia("(pointer: fine)").matches);
  }, []);

  // Lite mode: header/cursor colors follow whichever [data-fg] block sits under the header
  useEffect(() => {
    if (mode !== "lite") return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && document.documentElement.style.setProperty("--scene-fg", (e.target as HTMLElement).dataset.fg!)),
      { rootMargin: "0px 0px -94% 0px" },
    );
    document.querySelectorAll("[data-fg]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mode]);

  useEffect(() => {
    if (mode !== "full") return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [mode]);

  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <a href="#main" className="f-mono fixed left-2 top-2 -translate-y-24 bg-signal px-3 py-2 text-ink focus:translate-y-0" style={{ zIndex: 70 }}>
        Skip to content
      </a>
      <Loader />
      <Header />
      <main id="main">
        {scenes.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>
      <Footer />
      {mode === "full" && <GLRoot />}
      {fine && <Cursor />}
      <Grain />
    </MotionConfig>
    </LazyMotion>
  );
}
