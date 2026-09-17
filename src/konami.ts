// Hidden easter egg: the classic Konami code (↑↑↓↓←→←→BA) triggers a shower of
// paper-plane icons falling down the screen. Each plane is an independent,
// self-removing element — no shared drag/animation state to get stuck.
import { buildBrandMark } from "./ticket.ts";

const SEQUENCE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const PLANE_COUNT = 20;

function spawnPlaneShower() {
  for (let i = 0; i < PLANE_COUNT; i++) {
    const plane = buildBrandMark();
    plane.classList.add("konami-plane");
    plane.style.left = `${Math.random() * 100}%`;
    plane.style.animationDelay = `${Math.random() * 0.6}s`;
    plane.style.setProperty("--drift", `${(Math.random() - 0.5) * 200}px`);
    plane.addEventListener("animationend", () => plane.remove(), { once: true });
    document.body.append(plane);
  }
}

export function attachKonamiEgg(): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let progress = 0;
  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = SEQUENCE[progress];
    if (key === expected) {
      progress++;
    } else {
      progress = key === SEQUENCE[0] ? 1 : 0;
    }
    if (progress === SEQUENCE.length) {
      progress = 0;
      spawnPlaneShower();
    }
  });
}
