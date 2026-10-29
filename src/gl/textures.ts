import * as THREE from "three";
import { color } from "@/lib/tokens";
import { wave } from "@/ribbon/wave";

/** Procedural textures, drawn once on a 2D canvas. No image files. */

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

/** Concentric machining rings for knob caps (roughness map). */
export function brushedTexture() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#777";
  g.fillRect(0, 0, 256, 256);
  for (let r = 1; r < 128; r += 1) {
    const v = 90 + Math.random() * 90;
    g.strokeStyle = `rgb(${v},${v},${v})`;
    g.beginPath();
    g.arc(128, 128, r, 0, Math.PI * 2);
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

/** Soft radial blob for the contact shadow. */
export function shadowTexture() {
  const [c, g] = canvas(128, 128);
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(0,0,0,1)");
  grd.addColorStop(0.55, "rgba(0,0,0,0.45)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** Oscilloscope screen: one period of the OSC-1 signal, tiled so offset.x scrolls it. */
export function scopeTexture() {
  const [c, g] = canvas(512, 256);
  g.fillStyle = "#070707";
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "rgba(236,230,218,0.07)";
  g.lineWidth = 1;
  for (let x = 0; x <= 512; x += 64) (g.beginPath(), g.moveTo(x, 0), g.lineTo(x, 256), g.stroke());
  for (let y = 0; y <= 256; y += 64) (g.beginPath(), g.moveTo(0, y), g.lineTo(512, y), g.stroke());
  const line = (w: number, a: number) => {
    g.strokeStyle = `rgba(255,74,20,${a})`;
    g.lineWidth = w;
    g.beginPath();
    for (let i = 0; i <= 512; i++) {
      const y = 128 - wave(i / 512, { shape: "sine", cycles: 2 }) * 70 - Math.sin((i / 512) * Math.PI * 8) * 14;
      i ? g.lineTo(i, y) : g.moveTo(i, y);
    }
    g.stroke();
  };
  line(14, 0.12);
  line(3, 1);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Panel print: labels, scales and the fader slots, mapped to synth-top coordinates. */
export function panelTexture(
  extent: { w: number; d: number },
  draw: (g: CanvasRenderingContext2D, map: (x: number, z: number) => [number, number], s: number) => void,
) {
  const W = 2048;
  const H = Math.round((W * extent.d) / extent.w);
  const [c, g] = canvas(W, H);
  const s = W / extent.w; // px per world unit
  const map = (x: number, z: number): [number, number] => [(x + extent.w / 2) * s, (z + extent.d / 2) * s];
  g.fillStyle = "#121211";
  g.fillRect(0, 0, W, H);
  g.fillStyle = color.bone;
  g.strokeStyle = color.bone;
  draw(g, map, s);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
