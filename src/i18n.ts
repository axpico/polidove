// Minimal it/en dictionary and language state; no i18n library, just a lookup object
// keyed by the current language plus a getter/setter pair.
export type Lang = "it" | "en";

const STORAGE_KEY = "polidove-lang";

const dict = {
  it: {
    tagline: "Digita il prof, trova l'aula.",
    metaDescription:
      "Digita il prof o il corso, trova subito l'aula: orari in tempo reale del Politecnico in stile carta d'imbarco.",
    searchPlaceholder: "Docente o corso…",
    clearSearchLabel: "Cancella ricerca",
    reloadTitle: "Aggiorna dati",
    langToggleLabel: "EN",
    langToggleTitle: "Switch to English",
    loadingToday: "Caricamento orari di oggi…",
    updatedAt: (time: string) => `Dati aggiornati alle ${time}`,
    loadFailed: "Impossibile contattare i dati di PoliAule. Riprova con il pulsante di aggiornamento.",
    searchingNext: "Cerco la prossima lezione…",
    noResultsToday: (q: string) => `Nessuna lezione oggi per "${q}". `,
    noResultsWeek: (q: string) => `Nessuna lezione trovata per "${q}" nei prossimi 7 giorni.`,
    findNextBtn: "Cerca la prossima lezione",
    nextLessonHeading: (d: string) => `Prossima lezione: ${d}`,
    sharedLinkExpired: "Il link condiviso non è più valido: la lezione non rientra nei prossimi 7 giorni.",
    sharedLessonGone: "La lezione condivisa non è più disponibile: potrebbe essere stata spostata o cancellata.",
    lessonNoLongerScheduled: "Questa lezione non risulta più programmata. Prova a cercare di nuovo.",
    boardingPassLabel: "Carta d'imbarco",
    shareLesson: "Condividi questa lezione",
    shareHint: "Inquadra o tocca per condividere",
    linkCopied: "Link copiato!",
    statusBoarding: "IN IMBARCO",
    statusFlying: "IN VOLO",
    statusLanded: "ATTERRATO",
    countdownSuffix: (m: number) => ` — tra ${m} min`,
    fieldFlight: "VOLO",
    fieldGate: "GATE",
    fieldSeat: "POSTO",
    fieldDeparture: "PARTENZA",
    fieldArrival: "ARRIVO",
    fieldDate: "DATA",
    fieldPassenger: "DOCENTE",
    fieldOwner: "PASSEGGERO",
    ownerPlaceholder: "+ il tuo nome",
    ownerEditHint: "Clicca per personalizzare",
    openInMaps: "Apri in Mappe",
  },
  en: {
    tagline: "Type the prof, find the room.",
    metaDescription:
      "Type the professor or course, instantly find the room: real-time Politecnico schedules, boarding-pass style.",
    searchPlaceholder: "Professor or course…",
    clearSearchLabel: "Clear search",
    reloadTitle: "Refresh data",
    langToggleLabel: "IT",
    langToggleTitle: "Passa all'italiano",
    loadingToday: "Loading today's schedule…",
    updatedAt: (time: string) => `Data refreshed at ${time}`,
    loadFailed: "Couldn't reach PoliAule data. Try again with the refresh button.",
    searchingNext: "Looking for the next lesson…",
    noResultsToday: (q: string) => `No lessons today for "${q}". `,
    noResultsWeek: (q: string) => `No lessons found for "${q}" in the next 7 days.`,
    findNextBtn: "Find the next lesson",
    nextLessonHeading: (d: string) => `Next lesson: ${d}`,
    sharedLinkExpired: "This shared link is no longer valid: the lesson isn't within the next 7 days.",
    sharedLessonGone: "The shared lesson is no longer available: it may have been moved or cancelled.",
    lessonNoLongerScheduled: "This lesson is no longer scheduled. Try searching again.",
    boardingPassLabel: "Boarding pass",
    shareLesson: "Share this lesson",
    shareHint: "Scan or tap to share",
    linkCopied: "Link copied!",
    statusBoarding: "BOARDING",
    statusFlying: "IN FLIGHT",
    statusLanded: "LANDED",
    countdownSuffix: (m: number) => ` — in ${m} min`,
    fieldFlight: "FLIGHT",
    fieldGate: "GATE",
    fieldSeat: "SEAT",
    fieldDeparture: "DEPART",
    fieldArrival: "ARRIVE",
    fieldDate: "DATE",
    fieldPassenger: "PROF",
    fieldOwner: "PASSENGER",
    ownerPlaceholder: "+ your name",
    ownerEditHint: "Click to personalize",
    openInMaps: "Open in Maps",
  },
} satisfies Record<Lang, Record<string, unknown>>;

// Prefer a previously chosen language; otherwise guess from the browser locale, defaulting to English.
function detectInitial(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "it" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("it") ? "it" : "en";
}

let current: Lang = detectInitial();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

export function t() {
  return dict[current];
}
