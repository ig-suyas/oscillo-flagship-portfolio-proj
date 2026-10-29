"use client";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { color } from "@/lib/tokens";

/**
 * Ribbon API, part 3: the 3D ribbon. A closed waveform loop (glowing tube + soft
 * halo tube + two travelling "signal" beads) that wraps an object.
 *
 *   <Ribbon3D ref={r} rx={3.4} rz={2.1} amp={0.3} cycles={6} />
 *   r.current.setDraw(0..1)   // draw-on via drawRange (no geometry rebuild)
 *   r.current.setTime(t)      // moves the beads
 */
export type Ribbon3DHandle = { setDraw: (v: number) => void; setTime: (t: number) => void; group: THREE.Group | null };

type Props = { rx: number; rz: number; amp: number; cycles: number; radius?: number } & Omit<
  import("@react-three/fiber").ThreeElements["group"],
  "ref"
>;

export const Ribbon3D = forwardRef<Ribbon3DHandle, Props>(function Ribbon3D({ rx, rz, amp, cycles, radius = 0.014, ...rest }, ref) {
  const group = useRef<THREE.Group>(null);
  const beads = useRef<(THREE.Mesh | null)[]>([]);

  const { curve, core, halo } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 480;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      // integer harmonics only, so the loop closes cleanly
      const y = amp * (Math.sin(a * cycles) * 0.85 + Math.sin(a * cycles * 3 + 0.6) * 0.15);
      pts.push(new THREE.Vector3(Math.cos(a) * rx, y, Math.sin(a) * rz));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
    return {
      curve,
      core: new THREE.TubeGeometry(curve, 900, radius, 8, true),
      halo: new THREE.TubeGeometry(curve, 900, radius * 4.5, 8, true),
    };
  }, [rx, rz, amp, cycles, radius]);

  const mats = useMemo(
    () => ({
      core: new THREE.MeshBasicMaterial({ color: new THREE.Color(color.signal).multiplyScalar(1.4), toneMapped: false }),
      halo: new THREE.MeshBasicMaterial({ color: color.signal, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
      bead: new THREE.MeshBasicMaterial({ color: "#ffd9c9", toneMapped: false }),
    }),
    [],
  );

  useEffect(
    () => () => {
      core.dispose();
      halo.dispose();
    },
    [core, halo],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const p = useMemo(() => new THREE.Vector3(), []);
  useImperativeHandle(
    ref,
    () => ({
      group: group.current,
      setDraw(v) {
        for (const g of [core, halo]) g.setDrawRange(0, Math.floor((g.index!.count * v) / 6) * 6);
        beads.current.forEach((b) => b && (b.visible = v >= 1));
      },
      setTime(t) {
        beads.current.forEach((b, i) => b && b.position.copy(curve.getPointAt((t * 0.06 + i * 0.5) % 1, p)));
      },
    }),
    [core, halo, curve, p],
  );

  return (
    <group ref={group} {...rest}>
      <mesh geometry={core} material={mats.core} />
      <mesh geometry={halo} material={mats.halo} renderOrder={2} />
      {[0, 1].map((i) => (
        <mesh key={i} ref={(m) => void (beads.current[i] = m)} material={mats.bead} visible={false}>
          <sphereGeometry args={[radius * 3.2, 12, 12]} />
        </mesh>
      ))}
    </group>
  );
});
