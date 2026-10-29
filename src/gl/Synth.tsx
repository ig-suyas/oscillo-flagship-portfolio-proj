"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";
import { Knob } from "./Knob";
import { panelTexture, scopeTexture, shadowTexture } from "./textures";
import { useGLFrame } from "./hooks";
import { color } from "@/lib/tokens";

/**
 * The OSC-1, built from primitives. Units: body 4.4 x 0.32 x 2.4, top at y = 0.16, front = +z.
 * `drive` is a mutable object the owning scene writes to: power (0-1 boot), master (0-1 cutoff).
 */
export type SynthDrive = { power: number; master: number };

const TOP = 0.16;
const COLS = [-1.75, -1.25, -0.75, -0.25];
const MASTER = { x: 1.6, z: -0.3, r: 0.42 };
const MED = [{ x: 0.3, z: 0.1, l: "RES" }, { x: 0.8, z: 0.1, l: "DRIVE" }];
const SCOPE = { x: 0.55, z: -0.6, w: 0.8, d: 0.48 };
const RING = 11;
export const SYNTH_MASTER = new THREE.Vector3(MASTER.x, TOP, MASTER.z);

const ringAngle = (i: number) => THREE.MathUtils.degToRad(-135 + (270 * i) / (RING - 1));

function drawPanel(font: string) {
  return panelTexture({ w: 4.26, d: 2.26 }, (g, map, s) => {
    const txt = (t: string, x: number, z: number, size = 0.05, align: CanvasTextAlign = "center", a = 0.75) => {
      g.globalAlpha = a;
      g.font = `500 ${size * s}px ${font}`;
      g.textAlign = align;
      g.textBaseline = "middle";
      g.fillText(t, ...map(x, z));
      g.globalAlpha = 1;
    };
    const line = (x1: number, z1: number, x2: number, z2: number, w = 0.006, a = 0.5) => {
      g.globalAlpha = a;
      g.lineWidth = w * s;
      g.beginPath();
      g.moveTo(...map(x1, z1));
      g.lineTo(...map(x2, z2));
      g.stroke();
      g.globalAlpha = 1;
    };
    const ticks = (cx: number, cz: number, r: number, n: number, len = 0.04) => {
      for (let i = 0; i < n; i++) {
        const a = THREE.MathUtils.degToRad(-135 + (270 * i) / (n - 1));
        const sx = Math.sin(a), cz2 = -Math.cos(a);
        line(cx + sx * r, cz + cz2 * r, cx + sx * (r + len), cz + cz2 * (r + len));
      }
    };
    const slot = (x: number, z1: number, z2: number, w: number) => {
      g.fillStyle = "#030303";
      const [ax, az] = map(x - w / 2, z1);
      g.beginPath();
      g.roundRect(ax, az, w * s, (z2 - z1) * s, (w * s) / 2);
      g.fill();
      g.fillStyle = color.bone;
    };
    ["ATK", "DEC", "SUS", "REL"].forEach((l, i) => {
      txt(l, COLS[i], -0.9);
      ticks(COLS[i], -0.6, 0.23, 7);
      slot(COLS[i], -0.26, 0.34, 0.045);
      for (let k = 0; k <= 6; k++) line(COLS[i] + 0.1, -0.24 + k * 0.093, COLS[i] + 0.15, -0.24 + k * 0.093, 0.005, 0.4);
    });
    txt("ENV", -2.0, -0.6, 0.04, "left", 0.45);
    MED.forEach((m) => (txt(m.l, m.x, m.z + 0.33), ticks(m.x, m.z, 0.27, 9)));
    txt("CUTOFF", MASTER.x, MASTER.z + 0.72, 0.055);
    for (let i = 0; i < RING; i++) {
      const a = ringAngle(i);
      txt(String(i), MASTER.x + Math.sin(a) * 0.7, MASTER.z - Math.cos(a) * 0.7, 0.04, "center", 0.55);
    }
    txt("SCOPE", SCOPE.x - SCOPE.w / 2, SCOPE.z - SCOPE.d / 2 - 0.07, 0.04, "left", 0.55);
    slot(0, 0.5, 0.56, 4.0);
    txt("RIBBON", -2.0, 0.44, 0.035, "left", 0.5);
    txt("OSCILLO", 0.86, -0.98, 0.075, "left", 0.95);
    txt("OSC-1  ANALOG MONOSYNTH", 0.86, -0.88, 0.032, "left", 0.5);
  });
}

export function Synth({ drive, sceneId }: { drive: SynthDrive; sceneId: string }) {
  const [panel, setPanel] = useState<THREE.Texture | null>(null);
  const scope = useMemo(scopeTexture, []);
  const shadow = useMemo(shadowTexture, []);
  const master = useRef<THREE.Group>(null);
  const leds = useRef<THREE.InstancedMesh>(null);
  const faders = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    let t: THREE.Texture | null = null;
    document.fonts.ready.then(() => {
      const font = getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono") || "monospace";
      t = drawPanel(font);
      setPanel(t);
    });
    return () => {
      t?.dispose();
      scope.dispose();
      shadow.dispose();
    };
  }, [scope, shadow]);

  const mats = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({ color: "#121212", roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.55 }),
      cheek: new THREE.MeshPhysicalMaterial({ color: "#8f8c87", metalness: 1, roughness: 0.42 }),
      key: new THREE.MeshStandardMaterial({ color: color.bone, roughness: 0.55 }),
      keyAccent: new THREE.MeshStandardMaterial({ color: color.signal, roughness: 0.45 }),
      glow: new THREE.MeshBasicMaterial({ color: color.signal, toneMapped: false }),
      cap: new THREE.MeshStandardMaterial({ color: "#dcd6ca", roughness: 0.4 }),
      led: new THREE.MeshBasicMaterial({ toneMapped: false }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  // LED positions: 8 sequencer LEDs + an 11-step ring around CUTOFF
  const ledPos = useMemo(() => {
    const p: [number, number][] = [];
    for (let i = 0; i < 8; i++) p.push([-1.95 + i * 0.24, -1.04]);
    for (let i = 0; i < RING; i++) {
      const a = ringAngle(i);
      p.push([MASTER.x + Math.sin(a) * 0.56, MASTER.z - Math.cos(a) * 0.56]);
    }
    return p;
  }, []);

  useEffect(() => {
    const m = new THREE.Matrix4();
    ledPos.forEach(([x, z], i) => leds.current!.setMatrixAt(i, m.makeTranslation(x, TOP + 0.005, z)));
    leds.current!.instanceMatrix.needsUpdate = true;
  }, [ledPos]);

  const on = useMemo(() => new THREE.Color(color.signal).multiplyScalar(1.6), []);
  const off = useMemo(() => new THREE.Color("#2b0f07"), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useGLFrame(sceneId, (_, dt, { clock }) => {
    const t = clock.elapsedTime;
    scope.offset.x = (scope.offset.x + dt * 0.35) % 1;
    if (master.current) master.current.rotation.y = THREE.MathUtils.degToRad(135 - 270 * drive.master);
    const step = Math.floor(t * 3) % 8; // 3 steps/s: never above the 3 Hz flash limit per LED
    const lit = Math.round(drive.master * (RING - 1));
    for (let i = 0; i < ledPos.length; i++) {
      const booted = drive.power >= i / ledPos.length;
      const isOn = booted && (i < 8 ? i === step || i === 0 : i - 8 <= lit);
      leds.current!.setColorAt(i, tmp.copy(isOn ? on : off));
    }
    leds.current!.instanceColor!.needsUpdate = true;
    faders.current.forEach((f, i) => f && (f.position.z = 0.28 - (0.5 * (0.35 + 0.3 * Math.sin(i * 1.7 + 0.6)) * drive.power)));
  });

  return (
    <group>
      <mesh position={[0, -TOP - 0.02, 0.1]} rotation-x={-Math.PI / 2} renderOrder={-1}>
        <planeGeometry args={[7, 4.2]} />
        <meshBasicMaterial map={shadow} transparent opacity={0.85} depthWrite={false} color="#000" />
      </mesh>

      <RoundedBox args={[4.4, 0.32, 2.4]} radius={0.07} smoothness={4} material={mats.body} />
      {[-1, 1].map((sx) => (
        <RoundedBox key={sx} args={[0.09, 0.4, 2.46]} radius={0.035} smoothness={3} position={[sx * 2.245, 0.03, 0]} material={mats.cheek} />
      ))}

      <mesh position={[0, TOP + 0.0005, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4.26, 2.26]} />
        <meshStandardMaterial key={panel ? "print" : "blank"} map={panel} color={panel ? "#ffffff" : "#121211"} roughness={0.72} />
      </mesh>

      <mesh position={[SCOPE.x, TOP + 0.002, SCOPE.z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[SCOPE.w, SCOPE.d]} />
        <meshBasicMaterial map={scope} toneMapped={false} />
      </mesh>

      {COLS.map((x) => (
        <Knob key={x} position={[x, TOP, -0.6]} scale={[0.17, 0.2, 0.17]} />
      ))}
      {MED.map((m) => (
        <Knob key={m.x} position={[m.x, TOP, m.z]} scale={[0.2, 0.22, 0.2]} />
      ))}
      <Knob ref={master} position={[MASTER.x, TOP, MASTER.z]} scale={[MASTER.r, 0.34, MASTER.r]} />

      {COLS.map((x, i) => (
        <mesh key={x} ref={(m) => void (faders.current[i] = m)} position={[x, TOP + 0.04, 0.28]} material={mats.cap}>
          <boxGeometry args={[0.15, 0.08, 0.09]} />
        </mesh>
      ))}

      <mesh position={[0, TOP + 0.004, 0.53]} material={mats.glow}>
        <boxGeometry args={[3.96, 0.006, 0.018]} />
      </mesh>

      {Array.from({ length: 16 }, (_, i) => (
        <RoundedBox
          key={i}
          args={[0.225, 0.05, 0.4]}
          radius={0.015}
          smoothness={2}
          position={[-1.875 + i * 0.25, TOP + 0.02, 0.88]}
          material={i === 0 || i === 12 ? mats.keyAccent : mats.key}
        />
      ))}

      <instancedMesh ref={leds} args={[undefined, undefined, ledPos.length]} material={mats.led}>
        <cylinderGeometry args={[0.028, 0.028, 0.016, 16]} />
      </instancedMesh>
    </group>
  );
}
