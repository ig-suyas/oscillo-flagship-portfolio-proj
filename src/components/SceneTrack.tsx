"use client";
import { useCallback, useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScene, setSceneVisible, useSceneFrame } from "@/lib/scenes";
import { useMode } from "@/lib/mode";
import { clamp01 } from "@/lib/math";
import { sceneTheme, type SceneTheme } from "@/lib/tokens";

/**
 * The scene isolation pattern. Every scroll scene renders through this.
 *
 * Full mode: a tall section (scroll length) + two position:fixed layers.
 *   back  (z 1)  full-bleed color world + type that sits behind the 3D
 *   front (z 20) UI, copy and labels that sit over the 3D
 * The shared canvas (z 10) renders this scene's GL view between them.
 * Layers are translated with the section edges (so scenes slide like normal
 * scroll), get visibility:hidden when off screen, and nothing animates while hidden.
 *
 * Lite mode: a normal-flow section showing `poster`. Native scroll, no WebGL.
 */
type Props = {
  id: string;
  label: string;
  /** Length of the pinned stretch in viewports. progress runs 0-1 across it. */
  duration: number;
  theme: keyof typeof sceneTheme;
  back?: React.ReactNode;
  front?: React.ReactNode;
  poster: React.ReactNode;
  /** Scene sets header/cursor theme itself via applyTheme (e.g. per card). */
  ownsTheme?: boolean;
  /** Progress (0-1) that nav anchors land on, so a link never stops mid-transition. */
  anchor?: number;
};

let activeTheme = "";
export function applyTheme(t: SceneTheme, key: string) {
  if (activeTheme === key) return;
  activeTheme = key;
  const s = document.documentElement.style;
  s.setProperty("--scene-fg", t.fg);
  s.setProperty("--scene-accent", t.accent);
}

export function SceneTrack({ id, label, duration, theme, back, front, poster, ownsTheme, anchor }: Props) {
  const mode = useMode();
  const section = useRef<HTMLElement>(null);
  const layers = useRef<HTMLDivElement[]>([]);
  const t = sceneTheme[theme];

  useEffect(() => {
    if (mode !== "full" || !section.current) return;
    const s = getScene(id);
    const st = ScrollTrigger.create({
      trigger: section.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate(self) {
        const vh = innerHeight;
        const H = section.current!.offsetHeight;
        const d = self.scroll() - self.start;
        s.enter = clamp01(d / vh);
        s.progress = clamp01((d - vh) / (H - vh));
        s.exit = clamp01((d - H) / vh);
        s.offsetY = ((1 - s.enter) - s.exit) * vh;
        if (!ownsTheme && s.enter >= 0.5 && s.exit < 0.5) applyTheme(t, theme);
      },
      onToggle(self) {
        setSceneVisible(id, self.isActive);
        layers.current.forEach((l) => l && (l.dataset.on = self.isActive ? "1" : "0"));
      },
    });
    st.refresh();
    st.vars.onUpdate!(st);
    st.vars.onToggle!(st);
    return () => {
      st.kill();
      setSceneVisible(id, false);
    };
  }, [mode, id, t, theme, ownsTheme]);

  const frame = useCallback(() => {
    const y = getScene(id).offsetY;
    for (const l of layers.current) if (l) l.style.transform = `translate3d(0,${y}px,0)`;
  }, [id]);
  useSceneFrame(id, frame);

  if (mode !== "full") {
    return (
      <section id={id} aria-label={label} data-fg={t.fg} className="relative min-h-[100svh] overflow-hidden" style={{ background: t.bg, color: t.fg }}>
        {poster}
      </section>
    );
  }

  return (
    <section id={id} aria-label={label} ref={section} data-anchor={anchor} style={{ height: `${(duration + 1) * 100}lvh` }}>
      <div ref={(el) => void (layers.current[0] = el!)} className="scene-layer" data-on="0" style={{ zIndex: 1, background: t.bg, color: t.fg }}>
        {back}
      </div>
      <div ref={(el) => void (layers.current[1] = el!)} className="scene-layer" data-on="0" style={{ zIndex: 20, color: t.fg }}>
        {front}
      </div>
    </section>
  );
}
