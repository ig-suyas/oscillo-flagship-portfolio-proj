"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Studio } from "@/gl/Studio";
import { Knob } from "@/gl/Knob";
import { shadowTexture } from "@/gl/textures";
import { useGLFrame } from "@/gl/hooks";
import { pointer } from "@/lib/pointer";
import { damp, lerp } from "@/lib/math";
import { KNOB_ID, knobState } from "./KnobScene";

/** The knob, pinned to screen coordinates computed by the DOM scene (knobState). */
export default function KnobGL() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const outer = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const tex = useMemo(shadowTexture, []);
  useEffect(() => () => tex.dispose(), [tex]);
  const v = useMemo(() => ({ x: 0, y: 0 }), []);

  useEffect(() => {
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useGLFrame(KNOB_ID, (_, dt) => {
    const o = outer.current, t = tilt.current, sp = spin.current, sh = shadow.current;
    if (!o || !t || !sp || !sh) return;
    const w = innerWidth, h = innerHeight;
    const s = (2 * 10 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / h; // world units per px at z = 0
    const { x, y, d, grow, value } = knobState;
    o.position.set((x - w / 2) * s, -(y - h / 2) * s, 0);
    o.scale.setScalar((d * s) / 2);
    v.x = damp(v.x, pointer.x, 3, dt);
    v.y = damp(v.y, pointer.y, 3, dt);
    t.rotation.set(Math.PI / 2 - lerp(0, 0.6, grow) + v.y * 0.12 * grow, 0, -v.x * 0.15 * grow);
    sp.rotation.y = -THREE.MathUtils.degToRad(-135 + 270 * value);
    (sh.material as THREE.MeshBasicMaterial).opacity = 0.3 * grow;
  });

  return (
    <>
      <Studio light />
      <group ref={outer}>
        <mesh ref={shadow} position={[0.25, -0.45, -1.2]}>
          <planeGeometry args={[3.4, 3.4]} />
          <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} color="#3a2a1c" />
        </mesh>
        <group ref={tilt}>
          <Knob ref={spin} />
        </group>
      </group>
    </>
  );
}
