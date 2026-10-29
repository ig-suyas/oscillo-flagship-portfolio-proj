"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Studio } from "@/gl/Studio";
import { Synth, type SynthDrive } from "@/gl/Synth";
import { useGLFrame } from "@/gl/hooks";
import { pointer } from "@/lib/pointer";
import { damp, range, easeInOutCubic, lerp } from "@/lib/math";
import { color } from "@/lib/tokens";
import { SPECS, specsState, type PartBox } from "./parts";
import { SPECS_ID } from "./Specs";

const TOP = 0.16;
const DIR = new THREE.Vector3(0, 1.25, 1).normalize();
const EDGE = 0.022;

/** A lit outline + faint fill hovering on the panel over one part. Opacity is damped toward `on`. */
function Frame({ box, i }: { box: PartBox; i: number }) {
  const g = useRef<THREE.Group>(null);
  const mats = useMemo(
    () => ({
      edge: new THREE.MeshBasicMaterial({ color: color.signal, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }),
      fill: new THREE.MeshBasicMaterial({ color: color.signal, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  const v = useRef(0);
  useGLFrame(SPECS_ID, (_, dt) => {
    v.current = damp(v.current, specsState.active === i ? 1 : 0, 10, dt);
    mats.edge.opacity = v.current;
    mats.fill.opacity = v.current * 0.16;
    if (g.current) {
      g.current.visible = v.current > 0.01;
      g.current.position.y = TOP + 0.012 + v.current * 0.03;
    }
  });
  const w = box.x2 - box.x1, d = box.z2 - box.z1, cx = (box.x1 + box.x2) / 2, cz = (box.z1 + box.z2) / 2;
  return (
    <group ref={g} position={[cx, TOP, cz]} visible={false}>
      <mesh rotation-x={-Math.PI / 2} material={mats.fill}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {[
        [0, -d / 2, w + EDGE, EDGE],
        [0, d / 2, w + EDGE, EDGE],
        [-w / 2, 0, EDGE, d],
        [w / 2, 0, EDGE, d],
      ].map(([x, z, sx, sz], k) => (
        <mesh key={k} position={[x, 0, z]} material={mats.edge}>
          <boxGeometry args={[sx, 0.012, sz]} />
        </mesh>
      ))}
    </group>
  );
}

/** Scene 06 GL: the synth at its fit distance (the MAX), parts lit by the spec list. */
export default function SpecsGL() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const rig = useRef<THREE.Group>(null);
  const drive = useMemo<SynthDrive>(() => ({ power: 1, master: 0.5 }), []);
  const v = useMemo(() => ({ tx: 0, ty: 0, master: 0.5 }), []);

  // Frame the synth off-center so the list keeps its own column: right in landscape, top in portrait
  useEffect(() => {
    const { width: w, height: h } = size;
    if (w / h < 0.8) camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    else camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    return () => camera.clearViewOffset();
  }, [camera, size]);

  useGLFrame(SPECS_ID, (s, dt) => {
    const g = rig.current;
    if (!g) return;
    const k = easeInOutCubic(range(s.progress, 0, 0.18));
    v.tx = damp(v.tx, pointer.x, 3, dt);
    v.ty = damp(v.ty, pointer.y, 3, dt);
    g.rotation.set(v.ty * 0.08, lerp(-0.9, -0.22, k) + v.tx * 0.2, 0);

    // fit distance = defined maximum; entry starts 40% further out and never gets closer than fit
    const portrait = camera.aspect < 0.8;
    const fit = portrait ? 0.48 : 0.5;
    const dist = 4.6 / (fit * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.copy(DIR).multiplyScalar(dist * lerp(1.4, 1, k));
    camera.lookAt(0, 0, 0.05);

    v.master = damp(v.master, SPECS[specsState.active]?.id === "filter" ? 0.92 : 0.45, 4, dt);
    drive.master = v.master;
  });

  return (
    <>
      <Studio />
      <group ref={rig}>
        <Synth drive={drive} sceneId={SPECS_ID} />
        {SPECS.map((s, i) => (
          <Frame key={s.id} box={s.box} i={i} />
        ))}
      </group>
    </>
  );
}
