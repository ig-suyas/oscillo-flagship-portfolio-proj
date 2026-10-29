"use client";
import { useEffect, useRef } from "react";

/** The page's single static grain layer, generated once on a canvas. Never animated. */
export function Grain() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d")!;
    const img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 22;
    }
    g.putImageData(img, 0, 0);
    if (ref.current) ref.current.style.backgroundImage = `url(${c.toDataURL()})`;
  }, []);
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 40 }} />;
}
