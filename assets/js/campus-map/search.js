import { navigate } from "../shared/router.js";

let form = document.querySelector("[data-search]");
let input = form.querySelector("input");
let dropdown = form.querySelector("ul");

let entries = [];
let activeIndex = -1;
let results = [];

export function initSearch(entriesData) {
  entries = entriesData;

  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", handleKeydown);
  input.addEventListener("focus", handleInput);
  document.addEventListener("click", handleClickOutside);
  form.addEventListener("submit", handleSubmit);
}

function handleInput() {
  let query = input.value.trim();

  if (query.length === 0) {
    hideResults();
    return;
  }

  results = searchEntries(query, entries);
  activeIndex = -1;

  if (results.length === 0) {
    showEmptyState();
    return;
  }

  renderResults();
}

function searchEntries(query, entries) {
  let fields = ["keywords", "entry_title"];
  let term = query.toLowerCase().trim();

  if (term.length === 0) return [];

  let results = entries.filter((entry) =>
    fields.some((field) => entry[field]?.toLowerCase().includes(term)),
  );

  let seen = new Set();

  return results.filter((entry) => {
    if (seen.has(entry.entry_title)) return false;
    seen.add(entry.entry_title);
    return true;
  });
}

function handleKeydown(event) {
  if (dropdown.hidden || results.length === 0) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, results.length - 1);
      updateActiveResult();
      break;

    case "ArrowUp":
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      updateActiveResult();
      break;

    case "Enter":
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        selectResult(results[activeIndex]);
      }
      break;

    case "Escape":
      hideResults();
      input.blur();
      break;
  }
}

function handleClickOutside(event) {
  if (!event.target.closest("[data-search]")) {
    hideResults();
  }
}

function renderResults() {
  dropdown.innerHTML = results
    .map(
      (entry, index) => `
        <li
          class="search-result"
          role="option"
          id="search-result-${index}"
          data-index="${index}"
          aria-selected="${index === activeIndex}"
        >
          <span class="search-result-title">${entry.entry_title}</span>
          <span class="search-result-category">${entry.category_name}</span>
        </li>
      `,
    )
    .join("");

  dropdown.hidden = false;
  input.setAttribute("aria-expanded", "true");

  dropdown.querySelectorAll(".search-result").forEach((item) => {
    item.addEventListener("click", () => {
      let index = Number(item.dataset.index);
      selectResult(results[index]);
    });

    item.addEventListener("mouseenter", () => {
      activeIndex = Number(item.dataset.index);
      updateActiveResult();
    });
  });
}

function showEmptyState() {
  dropdown.innerHTML = `<li class="search-no-results">No entries match your search.</li>`;
  dropdown.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function hideResults() {
  dropdown.hidden = true;
  dropdown.innerHTML = "";
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  activeIndex = -1;
}

function updateActiveResult() {
  dropdown.querySelectorAll(".search-result").forEach((item, index) => {
    let isActive = index === activeIndex;

    item.setAttribute("aria-selected", String(isActive));

    if (isActive) {
      item.scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", item.id);
    }
  });

  if (activeIndex === -1) {
    input.removeAttribute("aria-activedescendant");
  }
}

function selectResult(entry) {
  hideResults();
  input.value = "";
  navigate({ entry: entry.shortcut });
}

function handleSubmit(event) {
  event.preventDefault();
}
