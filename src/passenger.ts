// Persists the ticket's editable "passenger" (viewer) name across visits, purely cosmetic.
const STORAGE_KEY = "polidove-passenger-name";

export function getPassengerName(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setPassengerName(name: string) {
  const trimmed = name.trim();
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
  else localStorage.removeItem(STORAGE_KEY);
}
