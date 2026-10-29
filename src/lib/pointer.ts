"use client";

/** Global pointer, normalized to -1..1 from viewport center. Read per frame. */
export const pointer = { x: 0, y: 0, px: 0, py: 0, speed: 0 };

let bound = false;
export function bindPointer() {
  if (bound) return;
  bound = true;
  addEventListener(
    "pointermove",
    (e) => {
      pointer.speed = Math.hypot(e.clientX - pointer.px, e.clientY - pointer.py);
      pointer.px = e.clientX;
      pointer.py = e.clientY;
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.y = (e.clientY / innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}
