/** Hero-owned state. Written by the hero intro timeline, read by HeroGL. */
export const heroIntro = { drop: 0, ribbon: 0, power: 0 };

let played = false;
const subs = new Set<() => void>();

/** Called by the loader at hand-off. */
export function playHeroIntro() {
  if (played) return;
  played = true;
  subs.forEach((f) => f());
}

export function onHeroIntro(f: () => void) {
  if (played) f();
  subs.add(f);
  return () => void subs.delete(f);
}
