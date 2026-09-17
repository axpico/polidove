// Builds the boarding-pass-styled ticket DOM for a lesson: main stub (course/gate/time
// fields, editable owner name) plus a stub with a shareable QR code.
import type { Lesson } from "./lessons.ts";
import { formatDate } from "./lessons.ts";
import { computeStatus } from "./status.ts";
import { encodeShareUrl } from "./share.ts";
import { buildQrModules } from "./qr.ts";
import { getPassengerName, setPassengerName } from "./passenger.ts";
import { attachTilt } from "./tilt.ts";
import { t } from "./i18n.ts";

const SVG_NS = "http://www.w3.org/2000/svg";

function buildQrSvg(text: string): SVGSVGElement {
  const grid = buildQrModules(text);
  const size = grid.length;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.classList.add("ticket-qr-svg");
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) continue;
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", String(col));
      rect.setAttribute("y", String(row));
      rect.setAttribute("width", "1");
      rect.setAttribute("height", "1");
      svg.append(rect);
    }
  }
  return svg;
}

export function buildBrandMark(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.classList.add("ticket-brand-mark");
  svg.setAttribute("aria-hidden", "true");
  const wing = document.createElementNS(SVG_NS, "path");
  wing.setAttribute("d", "M5 17.5 27 5 19.5 27l-4-8.5z");
  wing.setAttribute("fill", "currentColor");
  const shade = document.createElementNS(SVG_NS, "path");
  shade.setAttribute("d", "M19.5 27 15.5 19l4-1.5z");
  shade.setAttribute("fill", "var(--paper)");
  shade.setAttribute("fill-opacity", "0.45");
  svg.append(wing, shade);
  return svg;
}

// Google Maps search link for the lesson's campus/building address.
function mapsUrl(lesson: Lesson): string {
  const query = `${lesson.campusName} ${lesson.buildingAddress}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildMapPin(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.classList.add("ticket-campus-pin");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute(
    "d",
    "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  );
  svg.append(path);
  return svg;
}

function field(label: string, value: string, mono = true): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "ticket-field";
  const labelEl = document.createElement("span");
  labelEl.className = "ticket-label";
  labelEl.textContent = label;
  const valueEl = document.createElement("span");
  valueEl.className = mono ? "ticket-value ticket-mono" : "ticket-value";
  valueEl.textContent = value;
  wrap.append(labelEl, valueEl);
  return wrap;
}

// "PASSENGER" row: click-to-edit name stored via passenger.ts, purely a personalization touch.
function buildOwnerRow(): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "ticket-owner-row";

  const label = document.createElement("span");
  label.className = "ticket-owner-label";
  label.textContent = t().fieldOwner;

  const value = document.createElement("span");
  value.className = "ticket-owner-value";
  value.tabIndex = 0;
  value.setAttribute("role", "button");
  value.title = t().ownerEditHint;

  function paint() {
    const name = getPassengerName();
    value.textContent = name || t().ownerPlaceholder;
    value.classList.toggle("ticket-owner-value--empty", !name);
  }
  paint();

  function startEdit() {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "ticket-owner-input";
    input.value = getPassengerName();
    input.placeholder = t().ownerPlaceholder;
    input.maxLength = 40;
    value.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      setPassengerName(input.value);
      input.replaceWith(value);
      paint();
    };
    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") {
        input.value = getPassengerName();
        input.blur();
      }
    });
  }

  value.addEventListener("click", startEdit);
  value.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startEdit();
  });

  row.append(label, value);
  return row;
}

function statusLabel(status: ReturnType<typeof computeStatus>["status"]): string {
  return { boarding: t().statusBoarding, flying: t().statusFlying, landed: t().statusLanded }[status];
}

function statusText(status: ReturnType<typeof computeStatus>): string {
  const extra =
    status.status === "boarding" && status.countdownMinutes !== null ? t().countdownSuffix(status.countdownMinutes) : "";
  return `${statusLabel(status.status)}${extra}`;
}

// Recomputes and repaints just the status badge, so an open ticket's countdown
// ("tra 12 min") stays accurate and the boarding → flying → landed handoff
// happens automatically without a full re-render (which would replay the entrance animation).
export function updateTicketStatus(container: HTMLElement, lesson: Lesson) {
  const badge = container.querySelector<HTMLElement>(".ticket-status");
  if (!badge) return;
  const status = computeStatus(lesson.date, lesson.inizio, lesson.fine);
  badge.className = `ticket-status ticket-status--${status.status}`;
  badge.textContent = statusText(status);
}

export function renderTicket(container: HTMLElement, lesson: Lesson) {
  const status = computeStatus(lesson.date, lesson.inizio, lesson.fine);
  const shareUrl = encodeShareUrl({ date: lesson.date, idrichiesta: lesson.idrichiesta }, location.href);
  const professorsLabel = lesson.professors.join(", ");

  container.innerHTML = "";

  const ticket = document.createElement("div");
  ticket.className = "ticket";
  ticket.setAttribute("role", "group");
  ticket.setAttribute("aria-label", t().boardingPassLabel);

  const main = document.createElement("div");
  main.className = "ticket-main";

  const header = document.createElement("div");
  header.className = "ticket-row ticket-header";
  const brand = document.createElement("div");
  brand.className = "ticket-brand";
  const airline = document.createElement("span");
  airline.className = "ticket-airline";
  airline.textContent = "POLIDOVE";
  brand.append(buildBrandMark(), airline);
  const statusBadge = document.createElement("span");
  statusBadge.className = `ticket-status ticket-status--${status.status}`;
  statusBadge.textContent = statusText(status);
  header.append(brand, statusBadge);

  const ownerRow = buildOwnerRow();

  const courseEl = document.createElement("div");
  courseEl.className = "ticket-course";
  courseEl.textContent = lesson.course;

  const gateLabel = `${lesson.campusName} · Ed. ${lesson.buildingName}`;

  const gridTop = document.createElement("div");
  gridTop.className = "ticket-grid ticket-grid--top";
  const gateField = field(t().fieldGate, gateLabel, false);
  gateField.classList.add("ticket-field--wide");
  gridTop.append(field(t().fieldFlight, String(lesson.code)), gateField, field(t().fieldSeat, lesson.roomName));

  const gridBottom = document.createElement("div");
  gridBottom.className = "ticket-grid";
  gridBottom.append(
    field(t().fieldDeparture, lesson.inizio),
    field(t().fieldArrival, lesson.fine),
    field(t().fieldDate, formatDate(lesson.date)),
  );

  const docente = field(t().fieldPassenger, professorsLabel, false);
  docente.classList.add("ticket-passenger");

  const address = document.createElement("a");
  address.className = "ticket-campus";
  address.href = mapsUrl(lesson);
  address.target = "_blank";
  address.rel = "noopener";
  address.title = t().openInMaps;
  address.append(buildMapPin(), document.createTextNode(lesson.buildingAddress));

  main.append(header, ownerRow, courseEl, gridTop, gridBottom, docente, address);

  const stub = document.createElement("div");
  stub.className = "ticket-stub";

  const shareHint = document.createElement("span");
  shareHint.className = "ticket-qr-hint";
  shareHint.textContent = t().shareHint;

  const qrBtn = document.createElement("button");
  qrBtn.type = "button";
  qrBtn.className = "ticket-qr-btn";
  qrBtn.setAttribute("aria-label", t().shareLesson);
  qrBtn.append(buildQrSvg(shareUrl));
  qrBtn.addEventListener("click", async () => {
    if (navigator.share) {
      // Native share sheet on supporting devices; swallow errors (e.g. user cancelled).
      await navigator.share({ title: `${lesson.course} — PoliDove`, url: shareUrl }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    shareHint.textContent = t().linkCopied;
    setTimeout(() => (shareHint.textContent = t().shareHint), 2000);
  });

  stub.append(field(t().fieldFlight, String(lesson.code)), field(t().fieldSeat, lesson.roomName), qrBtn, shareHint);

  const sheen = document.createElement("div");
  sheen.className = "ticket-sheen";

  ticket.append(main, stub, sheen);
  container.append(ticket);
  attachTilt(ticket);

  requestAnimationFrame(() => ticket.classList.add("ticket--issued"));
}
