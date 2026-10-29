"use client";
import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { brushedTexture } from "./textures";
import { color } from "@/lib/tokens";
import type { ThreeElements } from "@react-three/fiber";

/**
 * Knurled, machined knob. Unit size: radius 1, height 0.9; scale it.
 * Local +Y is the shaft axis; rotate the inner `spin` group (ref) to turn it.
 */
let geo: { body: THREE.BufferGeometry; cap: THREE.BufferGeometry } | null = null;
let mats: Record<string, THREE.Material> | null = null;

function knobGeometry() {
  if (geo) return geo;
  // profile: skirt, knurled body, chamfer
  const p = [
    [0, 0], [1.12, 0], [1.12, 0.1], [1.0, 0.14], [1.0, 0.78], [0.94, 0.86], [0.86, 0.9], [0, 0.9],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.LatheGeometry(p, 240);
  // knurl: 60 sharp ridges on the body band only
  const pos = body.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y < 0.18 || y > 0.76) continue;
    const a = Math.atan2(z, x);
    const k = 1 - 0.045 * Math.abs(Math.sin(a * 60)) ** 0.6;
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  body.computeVertexNormals();
  const cap = new THREE.CircleGeometry(0.86, 96);
  cap.rotateX(-Math.PI / 2);
  cap.translate(0, 0.901, 0);
  geo = { body, cap };
  return geo;
}

function knobMaterials() {
  if (mats) return mats;
  const rough = brushedTexture();
  mats = {
    body: new THREE.MeshPhysicalMaterial({ color: "#d2cfc9", metalness: 1, roughness: 0.3, clearcoat: 0.2 }),
    cap: new THREE.MeshPhysicalMaterial({ color: "#e4e1db", metalness: 0.9, roughness: 0.42, roughnessMap: rough }),
    mark: new THREE.MeshBasicMaterial({ color: color.signal, toneMapped: false }),
  };
  return mats;
}

export const Knob = forwardRef<THREE.Group, ThreeElements["group"]>(function Knob(props, spin) {
  const g = useMemo(knobGeometry, []);
  const m = useMemo(knobMaterials, []);
  return (
    <group {...props}>
      <group ref={spin}>
        <mesh geometry={g.body} material={m.body} />
        <mesh geometry={g.cap} material={m.cap} />
        <mesh material={m.mark} position={[0, 0.905, -0.48]}>
          <boxGeometry args={[0.07, 0.01, 0.62]} />
        </mesh>
      </group>
    </group>
  );
});

