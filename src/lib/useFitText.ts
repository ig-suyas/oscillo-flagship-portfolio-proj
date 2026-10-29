"use client";
import { useLayoutEffect, useRef } from "react";

/** Scales an element's font-size so its widest line spans `fraction` of its parent width. */
export function useFitText<T extends HTMLElement>(fraction = 1, deps: unknown[] = []) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const lines = el.querySelectorAll<HTMLElement>("[data-line]");
      const w = Math.max(...(lines.length ? [...lines] : [el]).map((l) => l.scrollWidth));
      const target = el.parentElement!.clientWidth * fraction;
      el.style.fontSize = `${(100 * target) / w}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}
