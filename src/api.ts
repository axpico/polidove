// Thin client for the PoliAule API: classroom occupancy for Politecnico di Milano.
const BASE = "https://api.poliaule.com";

export interface OccupancySlot {
  inizio: string;
  fine: string;
  category?: "COURSE" | "EXAM" | "OTHER";
  idrichiesta?: number;
  course?: string;
  code?: number;
  professors?: string[];
}

export interface Classroom {
  id: number;
  name: string;
  occupancy: OccupancySlot[];
}

export interface Building {
  name: string;
  address: string;
  classrooms: Classroom[];
}

export interface Campus {
  id: string;
  name: string;
  buildings: Building[];
}

export interface OccupationsResponse {
  generated_at: string;
  date: string;
  campuses: Campus[];
}

export interface DatesResponse {
  generated_at: string;
  dates: string[];
}

const REQUEST_TIMEOUT_MS = 10000;

// Returns the dates (YYYYMMDD, today first) the API currently has occupancy data for.
export async function fetchAvailableDates(): Promise<string[]> {
  const res = await fetch(`${BASE}/v1/occupations`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`GET /v1/occupations failed: ${res.status}`);
  const data = (await res.json()) as DatesResponse;
  return data.dates;
}

// Converts our YYYYMMDD date key into the YYYY-MM-DD format the occupations endpoint expects.
function toIsoDate(date: string): string {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

async function fetchOccupationsForDate(date: string): Promise<OccupationsResponse> {
  const isoDate = toIsoDate(date);
  const res = await fetch(`${BASE}/v1/occupations/${isoDate}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`GET /v1/occupations/${isoDate} failed: ${res.status}`);
  return (await res.json()) as OccupationsResponse;
}

// ponytail: process-lifetime cache, never evicted. Fine for a handful of dates per session;
// add a size/TTL bound if this ever caches many more dates than a week's worth.
const cache = new Map<string, OccupationsResponse>();

export async function getOccupationsForDate(date: string, forceRefresh = false): Promise<OccupationsResponse> {
  if (!forceRefresh && cache.has(date)) return cache.get(date)!;
  const data = await fetchOccupationsForDate(date);
  cache.set(date, data);
  return data;
}
