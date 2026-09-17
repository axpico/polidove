// Boarding-pass framing for a lesson's timing: not started yet ("boarding"),
// in progress ("flying"), or over ("landed").
export type FlightStatus = "boarding" | "flying" | "landed";

export interface StatusInfo {
  status: FlightStatus;
  countdownMinutes: number | null;
}

const COUNTDOWN_THRESHOLD_MINUTES = 60;

// Builds a Date in the browser's local timezone from a YYYYMMDD date and HH:MM time,
// since lesson times from the API are wall-clock times at the campus, not UTC instants.
function parseLocal(date: string, time: string): Date {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1;
  const day = Number(date.slice(6, 8));
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month, day, hour, minute);
}

export function computeStatus(date: string, inizio: string, fine: string, now: Date = new Date()): StatusInfo {
  const start = parseLocal(date, inizio);
  const end = parseLocal(date, fine);

  if (now < start) {
    const minutesUntil = Math.round((start.getTime() - now.getTime()) / 60000);
    return {
      status: "boarding",
      // Only show a countdown once it's imminent; otherwise it's just noise.
      countdownMinutes: minutesUntil < COUNTDOWN_THRESHOLD_MINUTES ? minutesUntil : null,
    };
  }
  if (now <= end) {
    // Inclusive of the exact end instant: the lesson is still "flying" until one minute past.
    return { status: "flying", countdownMinutes: null };
  }
  return { status: "landed", countdownMinutes: null };
}
