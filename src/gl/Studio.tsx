"use client";
import { Environment, Lightformer } from "@react-three/drei";

/**
 * Studio lighting shared by GL scenes (each view mounts its own copy).
 * Reflections come from procedural lightformers baked once into an env map,
 * no HDR download. Two rim lights (warm right, cool left) cut the black body
 * out of a dark background.
 */
export function Studio({ light = false }: { light?: boolean }) {
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={light ? 1.4 : 2.2} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={5} color="#ffd2bd" position={[-7, 1.5, -1]} rotation-y={Math.PI / 2} scale={[8, 0.5, 1]} />
        <Lightformer form="rect" intensity={4} color="#dde4ff" position={[7, 2, -2]} rotation-y={-Math.PI / 2} scale={[8, 0.5, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ff4a14" position={[0, 1, -8]} scale={[10, 1.2, 1]} />
      </Environment>
      <ambientLight intensity={light ? 0.15 : 0.04} />
      <directionalLight position={[-3, 7, 5]} intensity={light ? 0.8 : 0.9} />
      <directionalLight position={[5, 2.5, -6]} intensity={light ? 1 : 3} color="#ff7a45" />
      <directionalLight position={[-6, 3, -5]} intensity={light ? 0.8 : 2.2} color="#d4dcff" />
    </>
  );
}
