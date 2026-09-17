// App entry point: wires up the search box, results dropdown, and ticket view,
// and owns all mutable session state (loaded dates/lessons, current query/lesson).
import "./style.css";
import { fetchAvailableDates, getOccupationsForDate } from "./api.ts";
import { flattenLessons, formatDate } from "./lessons.ts";
import type { Lesson } from "./lessons.ts";
import { searchLessons, matchRanges, mergeRanges } from "./search.ts";
import { renderTicket, updateTicketStatus } from "./ticket.ts";
import { decodeShareParams } from "./share.ts";
import { getLang, setLang, t } from "./i18n.ts";

const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
const searchClearBtn = document.querySelector<HTMLButtonElement>("#search-clear-btn")!;
const resultsList = document.querySelector<HTMLUListElement>("#results-list")!;
const messageEl = document.querySelector<HTMLDivElement>("#message")!;
const ticketContainer = document.querySelector<HTMLDivElement>("#ticket-container")!;
const reloadBtn = document.querySelector<HTMLButtonElement>("#reload-btn")!;
const langToggleBtn = document.querySelector<HTMLButtonElement>("#lang-toggle-btn")!;
const introTagline = document.querySelector<HTMLParagraphElement>(".intro p")!;
const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]')!;
const updatedAtEl = document.querySelector<HTMLParagraphElement>("#updated-at")!;

let availableDates: string[] = [];
let todayDate = "";
const lessonsByDate = new Map<string, Lesson[]>();
const generatedAtByDate = new Map<string, string>();
let currentQuery = "";
let currentLesson: Lesson | null = null;
let activeIndex = -1;

// Fetches + flattens one date's occupancy data and caches it in lessonsByDate/generatedAtByDate.
async function loadDate(date: string, forceRefresh = false): Promise<Lesson[]> {
  const data = await getOccupationsForDate(date, forceRefresh);
  const lessons = flattenLessons(data);
  lessonsByDate.set(date, lessons);
  generatedAtByDate.set(date, data.generated_at);
  if (date === todayDate) showFreshness();
  return lessons;
}

function showFreshness() {
  const generatedAt = generatedAtByDate.get(todayDate);
  if (!generatedAt) return;
  const d = new Date(generatedAt);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  updatedAtEl.textContent = t().updatedAt(time);
  updatedAtEl.hidden = false;
}

function showMessage(text: string, loading = false) {
  messageEl.replaceChildren();
  if (loading) {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    messageEl.append(spinner);
  }
  messageEl.append(document.createTextNode(text));
  messageEl.hidden = false;
}

function hideMessage() {
  messageEl.hidden = true;
}

function clearTicket() {
  currentLesson = null;
  ticketContainer.innerHTML = "";
}

function showTicket(lesson: Lesson) {
  currentLesson = lesson;
  closeResultsList();
  hideMessage();
  renderTicket(ticketContainer, lesson);
  ticketContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function formatDateHeading(date: string): string {
  return t().nextLessonHeading(formatDate(date));
}

function applyStaticTexts() {
  document.documentElement.lang = getLang();
  metaDescription.content = t().metaDescription;
  introTagline.textContent = t().tagline;
  searchInput.placeholder = t().searchPlaceholder;
  searchInput.setAttribute("aria-label", t().searchPlaceholder);
  reloadBtn.title = t().reloadTitle;
  reloadBtn.setAttribute("aria-label", t().reloadTitle);
  searchClearBtn.setAttribute("aria-label", t().clearSearchLabel);
  langToggleBtn.textContent = t().langToggleLabel;
  langToggleBtn.title = t().langToggleTitle;
  langToggleBtn.setAttribute("aria-label", t().langToggleTitle);
}

function appendHighlighted(el: HTMLElement, text: string, query: string) {
  const ranges = mergeRanges(matchRanges(text, query));
  if (ranges.length === 0) {
    el.append(text);
    return;
  }
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) el.append(text.slice(cursor, start));
    const mark = document.createElement("mark");
    mark.textContent = text.slice(start, end);
    el.append(mark);
    cursor = end;
  }
  if (cursor < text.length) el.append(text.slice(cursor));
}

function closeResultsList() {
  resultsList.hidden = true;
  resultsList.innerHTML = "";
  activeIndex = -1;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
}

function getOptionEls(): HTMLLIElement[] {
  return Array.from(resultsList.querySelectorAll<HTMLLIElement>(".results-list__item"));
}

function setActiveIndex(index: number) {
  const options = getOptionEls();
  if (options.length === 0) return;
  activeIndex = ((index % options.length) + options.length) % options.length;
  options.forEach((opt, i) => {
    opt.classList.toggle("active", i === activeIndex);
    opt.setAttribute("aria-selected", String(i === activeIndex));
  });
  searchInput.setAttribute("aria-activedescendant", options[activeIndex].id);
  options[activeIndex].scrollIntoView({ block: "nearest" });
}

function renderResultsList(lessons: Lesson[], query: string, dateHeading?: string) {
  resultsList.innerHTML = "";
  clearTicket();
  activeIndex = -1;

  if (dateHeading) {
    const heading = document.createElement("li");
    heading.className = "results-list__date";
    heading.setAttribute("role", "presentation");
    heading.textContent = dateHeading;
    resultsList.append(heading);
  }

  lessons.forEach((lesson, i) => {
    const li = document.createElement("li");
    li.className = "results-list__item";
    li.id = `result-item-${i}`;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", "false");

    const course = document.createElement("span");
    course.className = "results-list__course";
    appendHighlighted(course, lesson.course, query);

    const professors = document.createElement("span");
    professors.className = "results-list__professors";
    appendHighlighted(professors, lesson.professors.join(", "), query);

    const time = document.createElement("span");
    time.className = "results-list__time";
    time.textContent = `${lesson.inizio}–${lesson.fine}`;

    li.append(course, professors, time);
    li.addEventListener("click", () => showTicket(lesson));
    li.addEventListener("mouseenter", () => setActiveIndex(i));
    resultsList.append(li);
  });

  resultsList.hidden = lessons.length === 0;
  searchInput.setAttribute("aria-expanded", String(lessons.length > 0));
}

function showNoResultsToday() {
  const query = currentQuery.trim();
  messageEl.innerHTML = "";
  const text = document.createElement("span");
  text.textContent = t().noResultsToday(query);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "next-lesson-btn";
  btn.textContent = t().findNextBtn;
  btn.addEventListener("click", () => searchNextLesson(query));
  messageEl.append(text, btn);
  messageEl.hidden = false;
}

// "Find the next lesson" fallback: walks the upcoming dates (today already came up empty)
// and stops at the first one with a match.
async function searchNextLesson(query: string) {
  showMessage(t().searchingNext, true);
  for (const date of availableDates.slice(1)) {
    const lessons = lessonsByDate.get(date) ?? (await loadDate(date));
    const matches = searchLessons(lessons, query);
    if (matches.length > 0) {
      hideMessage();
      renderResultsList(matches, query, formatDateHeading(date));
      return;
    }
  }
  showMessage(t().noResultsWeek(query));
}

function runSearch() {
  clearTicket();
  const query = currentQuery.trim();
  if (query.length < 2) {
    closeResultsList();
    hideMessage();
    return;
  }
  const matches = searchLessons(lessonsByDate.get(todayDate) ?? [], query);
  if (matches.length > 0) {
    hideMessage();
    renderResultsList(matches, query);
  } else {
    closeResultsList();
    showNoResultsToday();
  }
}

// Resolves a shared ticket link (?d=&r=) to a lesson and shows it, or explains why it can't.
async function tryShowSharedLesson(date: string, idrichiesta: number) {
  let lessons = lessonsByDate.get(date);
  if (!lessons) {
    if (!availableDates.includes(date)) {
      showMessage(t().sharedLinkExpired);
      return;
    }
    lessons = await loadDate(date);
  }
  const lesson = lessons.find((l) => l.idrichiesta === idrichiesta);
  if (!lesson) {
    showMessage(t().sharedLessonGone);
    return;
  }
  showTicket(lesson);
}

searchInput.addEventListener("input", () => {
  currentQuery = searchInput.value;
  searchClearBtn.hidden = currentQuery.length === 0;
  runSearch();
});

searchClearBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentQuery = "";
  searchClearBtn.hidden = true;
  closeResultsList();
  hideMessage();
  clearTicket();
  searchInput.focus();
});

searchInput.addEventListener("keydown", (e) => {
  if (resultsList.hidden || getOptionEls().length === 0) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setActiveIndex(activeIndex + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setActiveIndex(activeIndex - 1);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const options = getOptionEls();
    options[activeIndex >= 0 ? activeIndex : 0].click();
  } else if (e.key === "Escape") {
    closeResultsList();
  }
});

document.addEventListener("click", (e) => {
  if (!(e.target instanceof Node)) return;
  if (!resultsList.contains(e.target) && e.target !== searchInput) {
    closeResultsList();
  }
});

searchInput.addEventListener("focus", () => {
  if (getOptionEls().length > 0) resultsList.hidden = false;
});

reloadBtn.addEventListener("click", async () => {
  reloadBtn.disabled = true;
  reloadBtn.classList.add("spinning");
  try {
    // Re-fetch every date already loaded this session (not just today), so an open
    // "next lesson" result or shared ticket also gets fresh data.
    const dates = [...lessonsByDate.keys()];
    await Promise.all(dates.map((date) => loadDate(date, true)));

    if (currentLesson) {
      const refreshed = lessonsByDate.get(currentLesson.date) ?? [];
      const same = refreshed.find((l) => l.idrichiesta === currentLesson!.idrichiesta);
      if (same) {
        showTicket(same);
      } else {
        clearTicket();
        showMessage(t().lessonNoLongerScheduled);
      }
    } else if (currentQuery.trim().length >= 2) {
      runSearch();
    }
  } finally {
    reloadBtn.disabled = false;
    reloadBtn.classList.remove("spinning");
  }
});

setInterval(() => {
  if (currentLesson) updateTicketStatus(ticketContainer, currentLesson);
}, 30000);

langToggleBtn.addEventListener("click", () => {
  setLang(getLang() === "it" ? "en" : "it");
  applyStaticTexts();
  showFreshness();
  if (currentLesson) {
    showTicket(currentLesson);
  } else if (currentQuery.trim().length >= 2) {
    runSearch();
  }
});

async function init() {
  applyStaticTexts();
  showMessage(t().loadingToday, true);
  availableDates = await fetchAvailableDates(); // today first, then upcoming dates
  todayDate = availableDates[0];
  await loadDate(todayDate);
  hideMessage();

  const shared = decodeShareParams(location.search);
  if (shared) {
    await tryShowSharedLesson(shared.date, shared.idrichiesta);
  }

  // Skip autofocus on touch devices: it pops the virtual keyboard unprompted on load.
  if (matchMedia("(pointer: fine)").matches) searchInput.focus();
}

init().catch(() => {
  showMessage(t().loadFailed);
});
