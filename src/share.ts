// Encodes/decodes the shareable-ticket link: ?d=<YYYYMMDD>&r=<idrichiesta>.
export interface ShareParams {
  date: string;
  idrichiesta: number;
}

export function encodeShareUrl(params: ShareParams, base: string): string {
  const url = new URL(base);
  url.search = ""; // drop any params already on `base` (e.g. from an incoming share link)
  url.searchParams.set("d", params.date);
  url.searchParams.set("r", String(params.idrichiesta));
  return url.toString();
}

export function decodeShareParams(search: string): ShareParams | null {
  const params = new URLSearchParams(search);
  const date = params.get("d");
  const r = params.get("r");
  if (!date || !r || !/^\d{8}$/.test(date) || !/^\d+$/.test(r)) return null;
  return { date, idrichiesta: Number(r) };
}
