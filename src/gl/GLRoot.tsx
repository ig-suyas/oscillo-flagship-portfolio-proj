"use client";
import { useEffect, useMemo, useLayoutEffect } from "react";
import { Canvas, advance, createPortal, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getScene } from "@/lib/scenes";
import { glStatus, setGLTick } from "@/lib/loop";
import { glScenes } from "@/scenes/gl-registry";

/**
 * The one shared WebGL canvas + context (lazy chunk, client only).
 * Each GL scene gets its own THREE.Scene + camera (a "view") and is drawn with
 * scissor into the rect of its scene's fixed layers. Views of hidden scenes are
 * skipped; when no GL scene is visible the canvas stops rendering entirely.
 */
type View = { id: string; scene: THREE.Scene; camera: THREE.PerspectiveCamera };
const views: View[] = [];


const anyGLVisible = () => views.some((v) => getScene(v.id).visible);

function Renderer() {
  useFrame(({ gl, size }) => {
    const { width: w, height: h } = size;
    gl.setScissorTest(false);
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.setScissorTest(true);
    for (const v of views) {
      const s = getScene(v.id);
      if (!s.visible) continue;
      const y = s.offsetY;
      const top = Math.max(0, y);
      const bottom = Math.min(h, y + h);
      if (bottom <= top) continue;
      gl.setViewport(0, -y, w, h);
      gl.setScissor(0, h - bottom, w, bottom - top);
      gl.render(v.scene, v.camera);
    }
    gl.setScissorTest(false);
    if (!glStatus.ready) {
      glStatus.ready = true;
      glStatus.onReady.forEach((f) => f());
    }
  }, 1);
  return null;
}

/**
 * Uploads textures and compiles programs of every view during idle time after the first frame,
 * one view per idle slot, so a scene's first visible frame never stalls the scroll.
 */
function Prewarm() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    let alive = true;
    const idle = (f: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 200));
    const warm = (i: number) => {
      if (!alive || i >= views.length) return;
      const v = views[i];
      v.scene.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
        if (!m) return;
        for (const t of [m.map, m.envMap, m.roughnessMap, m.normalMap, m.bumpMap]) if (t) gl.initTexture(t);
      });
      if (v.scene.environment) gl.initTexture(v.scene.environment);
      gl.compile(v.scene, v.camera);
      idle(() => warm(i + 1));
    };
    // after the loader hand-off and the panel print (fonts) are in
    const t = setTimeout(() => idle(() => warm(0)), 2500);
    return () => void ((alive = false), clearTimeout(t));
  }, [gl]);
  return null;
}

/** A scene's private 3D world. Children use useThree().camera = this view's camera. */
function GLView({ id, fov, children }: { id: string; fov: number; children: React.ReactNode }) {
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(fov, 1, 0.1, 200), [fov]);
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  useEffect(() => {
    const v = { id, scene, camera };
    views.push(v);
    return () => void views.splice(views.indexOf(v), 1);
  }, [id, scene, camera]);
  return createPortal(children, scene, { camera });
}

export default function GLRoot() {
  useEffect(() => {
    let wasOn = false;
    setGLTick((t) => {
      const on = anyGLVisible();
      // one extra frame after the last GL scene hides clears the canvas
      if (on || wasOn) advance(t);
      wasOn = on;
    });
    return () => setGLTick(null);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 10, height: "100lvh" }}>
      <Canvas
        frameloop="never"
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        camera={{ position: [0, 0, 10] }}
      >
        <Renderer />
        <Prewarm />
        {glScenes.map(({ id, fov, Component }) => (
          <GLView key={id} id={id} fov={fov}>
            <Component />
          </GLView>
        ))}
      </Canvas>
    </div>
  );
}
