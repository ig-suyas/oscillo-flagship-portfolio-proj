"use client";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { ribbonPath, type WaveOpts } from "./wave";

/**
 * Ribbon API, part 2: the 2D ribbon. A glowing waveform made of two strokes
 * (soft halo + bright core). No SVG filters.
 *
 *   <RibbonLine ref={r} wave={{ shape: "signal", cycles: 4 }} draw={0} />
 *   r.current.setDraw(0.5)   // stroke draw-on, 0-1 (stroke-dashoffset on one path)
 *   r.current.setShift(0.2)  // horizontal travel via transform (use with `loop`)
 */
export type RibbonHandle = { setDraw: (v: number) => void; setShift: (v: number) => void };

type Props = {
  wave?: WaveOpts & { samples?: number };
  width?: number;
  height?: number;
  draw?: number;
  /** Draws two periods side by side so setShift(0..1) loops seamlessly. */
  loop?: boolean;
  color?: string;
  core?: number; // core stroke px
  halo?: number; // halo stroke px (0 = none)
  className?: string;
  style?: React.CSSProperties;
};

export const RibbonLine = forwardRef<RibbonHandle, Props>(function RibbonLine(
  { wave = {}, width = 1000, height = 200, draw = 1, loop = false, color = "var(--color-signal)", core = 2, halo = 10, className, style },
  ref,
) {
  const g = useRef<SVGGElement>(null);
  const paths = useRef<SVGPathElement[]>([]);
  const d = useMemo(() => {
    const one = ribbonPath(width, height, wave);
    if (!loop) return one;
    return one + " " + ribbonPath(width, height, wave).replace(/([ML])([\d.]+)/g, (_, c, x) => `${c}${(+x + width).toFixed(2)}`);
  }, [width, height, loop, JSON.stringify(wave)]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    setDraw: (v) => paths.current.forEach((p) => p && (p.style.strokeDashoffset = String(1 - v))),
    setShift: (v) => g.current && (g.current.style.transform = `translate3d(${-v * width}px,0,0)`),
  }));

  const common = {
    d,
    fill: "none",
    stroke: color,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - draw,
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ overflow: "visible", ...style }}
      aria-hidden
    >
      <g ref={g} style={{ willChange: loop ? "transform" : undefined }}>
        {halo > 0 && <path ref={(p) => void (paths.current[0] = p!)} {...common} strokeWidth={halo} opacity={0.18} />}
        <path ref={(p) => void (paths.current[1] = p!)} {...common} strokeWidth={core} />
      </g>
    </svg>
  );
});
