"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Studio } from "@/gl/Studio";
import { Synth, SYNTH_MASTER, type SynthDrive } from "@/gl/Synth";
import { Ribbon3D, type Ribbon3DHandle } from "@/gl/Ribbon3D";
import { useGLFrame } from "@/gl/hooks";
import { pointer } from "@/lib/pointer";
import { damp, range, easeInOutCubic, lerp } from "@/lib/math";
import { setTone } from "@/lib/audio";
import { heroIntro } from "./state";
import { HERO_ID } from "./Hero";

const BASE_DIR = new THREE.Vector3(0, 0.52, 1).normalize();
const CLOSE_DIR = new THREE.Vector3(0.1, 1.5, 0.75).normalize();
const MAX_ZOOM_DIST = 2.3; // defined maximum: the dolly never gets closer than this

export default function HeroGL() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const rig = useRef<THREE.Group>(null);
  const ribbon = useRef<Ribbon3DHandle>(null);
  const drive = useMemo<SynthDrive>(() => ({ power: 0, master: 0.3 }), []);
  const v = useMemo(() => ({ tx: 0, ty: 0, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), knob: new THREE.Vector3(), t0: new THREE.Vector3(0, 0.75, 0.3) }), []);

  useGLFrame(HERO_ID, (s, dt, { clock }) => {
    const g = rig.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const k = easeInOutCubic(range(s.progress, 0.1, 0.72));

    // pointer tilt (the only motion allowed during holds)
    v.tx = damp(v.tx, pointer.x, 3, dt);
    v.ty = damp(v.ty, pointer.y, 3, dt);
    const drop = heroIntro.drop;
    g.position.y = (1 - drop) * 2.6;
    g.rotation.set(v.ty * 0.12 - (1 - drop) * 0.7, -0.34 + v.tx * 0.28 + (1 - drop) * 0.9, 0);

    // camera: fit the synth to the frame, then dolly to the CUTOFF knob
    const fit = camera.aspect > 1 ? 0.6 : 0.94;
    const dist = 4.6 / (fit * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    g.updateMatrixWorld();
    v.knob.copy(SYNTH_MASTER).applyMatrix4(g.matrixWorld);
    v.tgt.copy(v.t0).lerp(v.knob, k);
    const d = lerp(Math.max(dist, 8), MAX_ZOOM_DIST, k);
    v.pos.copy(BASE_DIR).lerp(CLOSE_DIR, k).normalize().multiplyScalar(d).add(v.tgt);
    camera.position.copy(v.pos);
    camera.lookAt(v.tgt);

    drive.power = heroIntro.power;
    drive.master = 0.3 + 0.55 * k + v.tx * 0.05;
    setTone(drive.master);

    const r = ribbon.current;
    if (r?.group) {
      r.setDraw(heroIntro.ribbon);
      r.setTime(t);
      r.group.rotation.y = t * 0.05;
      r.group.scale.setScalar(1 + k * 0.7);
    }
  });

  return (
    <>
      <Studio />
      <group ref={rig}>
        <Synth drive={drive} sceneId={HERO_ID} />
        <group rotation={[0.12, 0, -0.06]}>
          <Ribbon3D ref={ribbon} rx={3.4} rz={2.6} amp={0.16} cycles={6} />
        </group>
      </group>
    </>
  );
}
