// Pointer/gyroscope-tracked 3D tilt for the ticket card: makes it feel like a physical
// boarding pass catching light as it moves, rather than a flat DOM element.
const MAX_TILT_DEG = 6;
const GYRO_SENSITIVITY = 0.15; // hand-tuned: keeps normal hand tremor from looking frantic

let requestedGyroPermission = false;
let activeTicket: HTMLElement | null = null;
let gyroListenerAttached = false;

function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// nx/ny are normalized in [-1, 1]; positive nx = right, positive ny = down.
function applyTilt(ticket: HTMLElement, nx: number, ny: number) {
  const rx = -ny * MAX_TILT_DEG;
  const ry = nx * MAX_TILT_DEG;
  ticket.style.setProperty("--tilt-rx", `${rx}deg`);
  ticket.style.setProperty("--tilt-ry", `${ry}deg`);
  ticket.style.setProperty("--sheen-x", `${(nx * 0.5 + 0.5) * 100}%`);
  ticket.style.setProperty("--sheen-y", `${(ny * 0.5 + 0.5) * 100}%`);
  ticket.style.setProperty("--shadow-x", `${ry * 2}px`);
}

function resetTilt(ticket: HTMLElement) {
  ticket.style.setProperty("--tilt-rx", "0deg");
  ticket.style.setProperty("--tilt-ry", "0deg");
  ticket.style.setProperty("--shadow-x", "0px");
}

function attachPointerTilt(ticket: HTMLElement) {
  ticket.addEventListener("pointerenter", () => ticket.classList.add("ticket--tilting"));
  ticket.addEventListener("pointermove", (e) => {
    const rect = ticket.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    applyTilt(ticket, nx, ny);
  });
  ticket.addEventListener("pointerleave", () => {
    ticket.classList.remove("ticket--tilting");
    resetTilt(ticket);
  });
}

function handleDeviceOrientation(e: DeviceOrientationEvent) {
  if (!activeTicket || e.beta === null || e.gamma === null) return;
  const nx = Math.max(-1, Math.min(1, (e.gamma / 90) * GYRO_SENSITIVITY * 10));
  const ny = Math.max(-1, Math.min(1, ((e.beta - 90) / 90) * GYRO_SENSITIVITY * 10));
  activeTicket.classList.add("ticket--tilting");
  applyTilt(activeTicket, nx, ny);
}

function startGyroTilt() {
  if (gyroListenerAttached) return;
  gyroListenerAttached = true;
  window.addEventListener("deviceorientation", handleDeviceOrientation);
}

// Must be called synchronously from within a user-gesture handler (no prior `await`),
// or iOS Safari silently refuses the permission prompt. Idempotent: prompts once per load.
export function maybeRequestGyroPermission(): void {
  if (requestedGyroPermission || prefersReducedMotion()) return;
  const DeviceOrientationEventCtor = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  if (typeof DeviceOrientationEventCtor.requestPermission !== "function") {
    // Android/desktop: no gating needed, gyro (if present) already works via startGyroTilt.
    return;
  }
  requestedGyroPermission = true;
  DeviceOrientationEventCtor.requestPermission()
    .then((state) => {
      if (state === "granted") startGyroTilt();
    })
    .catch(() => {});
}

export function attachTilt(ticket: HTMLElement): void {
  activeTicket = ticket;
  if (prefersReducedMotion()) return;

  if (matchMedia("(pointer: fine)").matches) {
    attachPointerTilt(ticket);
    return;
  }

  // Touch device without an established iOS permission gate: Android exposes
  // deviceorientation directly, no prompt required.
  const DeviceOrientationEventCtor = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  if (typeof DeviceOrientationEventCtor.requestPermission !== "function") {
    startGyroTilt();
  }
}
