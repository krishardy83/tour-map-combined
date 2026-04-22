import { getRoute, navigate } from "../shared/router.js";
import { initPersistentDrawer } from "../shared/drawer-utils.js";
import {
  getCategories,
  getVisitorQuickLinks,
  getLocationCategories,
  getEntriesForCategory,
} from "./api.js";

const SIDEBAR_KEY = "mcm-sidebar-expanded";

let entries = [];
let contentEl;
let navEl;
let drawerController;

export function initDrawer(entriesData) {
  entries = entriesData;
  drawerController = initPersistentDrawer({ storageKey: SIDEBAR_KEY });
  contentEl = drawerController.contentEl;
  navEl = drawerController.navEl;
}

export function toggleDrawer() {
  drawerController.toggleDrawer();
}

export function ensureDrawerOpen() {
  if (!drawerController.isOpen()) {
    setTimeout(drawerController.openDrawer, 500);
  }
}

function renderCategoryGroup(title, categories, route) {
  if (categories.length === 0) return "";

  const sectionsHtml = categories
    .map((category) => renderAccordion(category, route))
    .join("");

  return `
    <h2 class="category-group-title">${title}</h2>
    ${sectionsHtml}
  `;
}

function renderAccordion(category, route) {
  const categoryEntries = getEntriesForCategory(category, entries);
  const isExpanded = route.expanded.includes(category);
  const hasActiveMarker = route.markers.includes(category);

  const entriesHtml = categoryEntries
    .map(
      (entry) =>
        `<li><a href="?entry=${encodeURIComponent(entry.shortcut)}" class="accordion-link" data-shortcut="${entry.shortcut}">${entry.entry_title}</a></li>`,
    )
    .join("");

  return `
    <details class="accordion" data-category="${category}" ${isExpanded ? "open" : ""}>
      <summary class="accordion-trigger">
        ${category}
        <svg class="accordion-icon" width="20" height="20" aria-hidden="true">
          <use href="/assets/images/symbol-defs.svg#down"></use>
        </svg>
      </summary>
      <div class="accordion-body">
        <button type="button" class="accordion-toggle-all" data-category="${category}">
          ${hasActiveMarker ? "Hide" : "Show"} all
        </button>
        <ul class="accordion-list">${entriesHtml}</ul>
      </div>
    </details>
  `;
}

export function showOverview() {
  navEl.classList.add("hidden");
  const route = getRoute();
  const categories = getCategories(entries);
  const visitorLinks = getVisitorQuickLinks(categories);
  const locationCats = getLocationCategories(categories);

  contentEl.innerHTML = `
    <h1 class="hidden">All locations and buildings</h1>
    ${renderCategoryGroup("Visitor Quick Links", visitorLinks, route)}
    ${renderCategoryGroup("Locations", locationCats, route)}
  `;

  bindAccordionEvents();
}

function bindAccordionEvents() {
  contentEl.querySelectorAll(".accordion").forEach((details) => {
    details.addEventListener("toggle", () => {
      const category = details.dataset.category;
      const route = getRoute();
      const expanded = details.open
        ? [...route.expanded, category]
        : route.expanded.filter((c) => c !== category);

      navigate({ expanded, markers: route.markers });
    });
  });

  contentEl.querySelectorAll(".accordion-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate({ entry: link.dataset.shortcut });
    });
  });

  contentEl.querySelectorAll(".accordion-toggle-all").forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.category;
      const route = getRoute();

      const isActive = route.markers.includes(category);
      const markers = isActive
        ? route.markers.filter((m) => m !== category)
        : [...route.markers, category];

      btn.textContent = isActive ? "Show all" : "Hide all";

      if (!isActive && window.innerWidth < 640) {
        drawerController.closeDrawer();
      }

      navigate({ expanded: route.expanded, markers });
    });
  });
}
