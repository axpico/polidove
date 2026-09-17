// Search-results dropdown: renders lesson matches, tracks the active item for
// keyboard/mouse navigation, and owns the search input's related ARIA attributes.
import type { Lesson } from "./lessons.ts";
import { matchRanges, mergeRanges } from "./search.ts";
import { t } from "./i18n.ts";

export interface ResultsList {
  render(lessons: Lesson[], query: string, dateHeading?: string): void;
  close(): void;
  reopenIfPopulated(): void;
  hasOptions(): boolean;
  moveActive(delta: number): void;
  selectActive(): void;
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

export function createResultsList(
  listEl: HTMLUListElement,
  inputEl: HTMLInputElement,
  onSelect: (lesson: Lesson) => void,
): ResultsList {
  let activeIndex = -1;

  function getOptionEls(): HTMLLIElement[] {
    return Array.from(listEl.querySelectorAll<HTMLLIElement>(".results-list__item"));
  }

  function setActiveIndex(index: number) {
    const options = getOptionEls();
    if (options.length === 0) return;
    activeIndex = ((index % options.length) + options.length) % options.length;
    options.forEach((opt, i) => {
      opt.classList.toggle("active", i === activeIndex);
      opt.setAttribute("aria-selected", String(i === activeIndex));
    });
    inputEl.setAttribute("aria-activedescendant", options[activeIndex].id);
    options[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function close() {
    listEl.hidden = true;
    listEl.classList.remove("results-list--open");
    listEl.innerHTML = "";
    activeIndex = -1;
    inputEl.setAttribute("aria-expanded", "false");
    inputEl.removeAttribute("aria-activedescendant");
  }

  function render(lessons: Lesson[], query: string, dateHeading?: string) {
    listEl.innerHTML = "";
    activeIndex = -1;

    const heading = document.createElement("li");
    heading.className = "results-list__date";
    heading.setAttribute("role", "presentation");
    heading.textContent = dateHeading ?? t().resultsCount(lessons.length);
    listEl.append(heading);

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
      li.addEventListener("click", () => onSelect(lesson));
      li.addEventListener("mouseenter", () => setActiveIndex(i));
      listEl.append(li);
    });

    listEl.hidden = lessons.length === 0;
    listEl.classList.toggle("results-list--open", lessons.length > 0);
    inputEl.setAttribute("aria-expanded", String(lessons.length > 0));
  }

  function reopenIfPopulated() {
    if (getOptionEls().length > 0) {
      listEl.hidden = false;
      listEl.classList.add("results-list--open");
    }
  }

  function selectActive() {
    const options = getOptionEls();
    if (options.length === 0) return;
    options[activeIndex >= 0 ? activeIndex : 0].click();
  }

  return {
    render,
    close,
    reopenIfPopulated,
    hasOptions: () => getOptionEls().length > 0,
    moveActive: (delta) => setActiveIndex(activeIndex + delta),
    selectActive,
  };
}
