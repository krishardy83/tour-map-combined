import { navigate, getVirtualTourStopUrl } from "../shared/router.js";
import { initPersistentDrawer } from "../shared/drawer-utils.js";

const SIDEBAR_KEY = "mvt-sidebar-expanded";

let stops = [];
let contentEl, navEl, progressEl;
let drawerController;

export function initDrawer(stopsData) {
  stops = stopsData;
  drawerController = initPersistentDrawer({ storageKey: SIDEBAR_KEY });
  contentEl = drawerController.contentEl;
  navEl = drawerController.navEl;
  progressEl = document.getElementById("drawer-progress");

  document.getElementById("btn-menu").addEventListener("click", () => {
    navigate();
  });

  document.getElementById("btn-prev").addEventListener("click", () => {
    let btn = document.getElementById("btn-prev");
    let stop = btn.dataset.stop;
    let highlight = btn.dataset.highlight;
    if (!stop) return;
    navigate({ stop, highlight: highlight !== "" ? Number(highlight) : null });
  });

  document.getElementById("btn-next").addEventListener("click", () => {
    let btn = document.getElementById("btn-next");
    if (btn.dataset.finish === "true") {
      showConclusion();
      return;
    }
    let stop = btn.dataset.stop;
    let highlight = btn.dataset.highlight;
    if (!stop) return;
    navigate({ stop, highlight: highlight !== "" ? Number(highlight) : null });
  });
}

function isDesktop() {
  return window.innerWidth > 768;
}

export function showOverview() {
  navEl.classList.add("hidden");

  if (isDesktop()) {
    drawerController.openDrawer();
  }

  contentEl.innerHTML = `
    <ul class="stop-list">
      ${stops
        .map(
          (stop) => `
        <li>
          <a href="${getVirtualTourStopUrl(stop.stopNumber)}" class="stop-item" data-stop="${stop.stopNumber}">
            <span class="stop-badge">${stop.stopNumber}</span>
            <div>
              <h2 class="stop-name">${stop.title}</h2>
              <span class="stop-category">${stop.categoryName}</span>
            </div>
          </a>
        </li>
      `,
        )
        .join("")}
    </ul>
  `;

  contentEl.querySelectorAll(".stop-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      navigate({ stop: item.dataset.stop });
    });
  });
}

function getNavigationTargets(stopNumber, highlightIndex) {
  let stopIdx = stops.findIndex((s) => s.stopNumber === stopNumber);
  if (stopIdx === -1) return { prev: null, next: null };

  let stop = stops[stopIdx];
  let isHighlight = highlightIndex !== null;

  let prev = null;
  let next = null;

  // Previous
  if (isHighlight && highlightIndex > 0) {
    prev = { stop: stopNumber, highlight: highlightIndex - 1 };
  } else if (isHighlight && highlightIndex === 0) {
    prev = { stop: stopNumber, highlight: null };
  } else if (!isHighlight && stopIdx > 0) {
    let prevStop = stops[stopIdx - 1];
    if (prevStop.highlights.length > 0) {
      prev = {
        stop: prevStop.stopNumber,
        highlight: prevStop.highlights.length - 1,
      };
    } else {
      prev = { stop: prevStop.stopNumber, highlight: null };
    }
  }

  // Next
  if (!isHighlight && stop.highlights.length > 0) {
    next = { stop: stopNumber, highlight: 0 };
  } else if (isHighlight && highlightIndex < stop.highlights.length - 1) {
    next = { stop: stopNumber, highlight: highlightIndex + 1 };
  } else if (stopIdx < stops.length - 1) {
    let isLastHighlight =
      !isHighlight || highlightIndex === stop.highlights.length - 1;
    if (isLastHighlight) {
      next = { stop: stops[stopIdx + 1].stopNumber, highlight: null };
    }
  }

  return { prev, next };
}

export function showStop(stopNumber, highlightIndex = null) {
  let stopIdx = stops.findIndex((s) => s.stopNumber === stopNumber);
  if (stopIdx === -1) return;

  let stop = stops[stopIdx];

  navEl.classList.remove("hidden");
  drawerController.openDrawer();

  progressEl.textContent = `Stop ${stopIdx + 1} of ${stops.length}`;

  let isHighlight = highlightIndex !== null;
  let entry = isHighlight ? stop.highlights[highlightIndex] : stop;
  if (!entry) return;

  let { prev, next } = getNavigationTargets(stopNumber, highlightIndex);

  let btnPrev = document.getElementById("btn-prev");
  let btnNext = document.getElementById("btn-next");

  btnPrev.disabled = !prev;
  btnPrev.dataset.stop = prev?.stop ?? "";
  btnPrev.dataset.highlight = prev?.highlight ?? "";

  btnNext.classList.remove("-primary");
  btnNext.classList.add("-secondary");

  if (next) {
    btnNext.disabled = false;
    btnNext.dataset.stop = next.stop;
    btnNext.dataset.highlight = next.highlight ?? "";
    btnNext.dataset.finish = "";
    btnNext.innerHTML = `Next <svg width="20" height="20" aria-hidden="true"><use href="/assets/images/symbol-defs.svg#next"></use></svg>`;
  } else {
    btnNext.disabled = false;
    btnNext.dataset.stop = "";
    btnNext.dataset.highlight = "";
    btnNext.dataset.finish = "true";
    btnNext.classList.remove("-secondary");
    btnNext.classList.add("-primary");
    btnNext.innerHTML = `Finish <svg width="20" height="20" aria-hidden="true"><use href="/assets/images/symbol-defs.svg#next"></use></svg>`;
  }

  let bannerHtml = entry.banner
    ? `<figure class="drawer-banner"><img src="${entry.banner}" alt="${entry.title}" width="448" height="298"></figure>`
    : "";

  let labelHtml = isHighlight
    ? `<span class="label -teal">Stop ${stopNumber}</span><span class="label -purple">Stop highlight</span>`
    : `<span class="label -teal">Stop ${stopNumber}</span>`;

  let highlightsHtml =
    !isHighlight && stop.highlights.length > 0
      ? `
      <h2 class="subtitle">Stop Highlights</h2>
      <ul>
        ${stop.highlights
          .map(
            (h, i) => `
          <li>
            <a href="${getVirtualTourStopUrl(stopNumber, i)}" class="link" data-stop="${stopNumber}" data-highlight="${i}">
              ${h.title}
            </a>
          </li>
        `,
          )
          .join("")}
      </ul>
    `
      : "";

  let backHtml = isHighlight
    ? `<button class="button -primary" data-stop="${stopNumber}">Return to Stop Home</button>`
    : "";

  contentEl.innerHTML = `
    ${bannerHtml}
    <div class="drawer-body">
      <div class="drawer-labels">${labelHtml}</div>
      <div class="title-group">
        <h2 class="title">${entry.title}</h2>
      </div>
      <p>${entry.description}</p>
      ${highlightsHtml}
      ${backHtml}
    </div>
  `;

  contentEl.querySelectorAll(".link").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      navigate({
        stop: item.dataset.stop,
        highlight: Number(item.dataset.highlight),
      });
    });
  });

  let backBtn = contentEl.querySelector(".button");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      navigate({ stop: backBtn.dataset.stop });
    });
  }

  contentEl.scrollTop = 0;
}

function showConclusion() {
  progressEl.textContent = "Tour Complete";

  let btnNext = document.getElementById("btn-next");
  btnNext.disabled = true;
  btnNext.classList.remove("-primary");
  btnNext.classList.add("-secondary");
  btnNext.dataset.finish = "";
  btnNext.innerHTML = `Finish <svg width="20" height="20" aria-hidden="true"><use href="/assets/images/symbol-defs.svg#next"></use></svg>`;

  let categories = [...new Set(stops.map((s) => s.categoryName))];
  let categoryList = categories.slice(0, 4).join(", ");

  contentEl.innerHTML = `
    <div class="tour-conclusion">
      <svg width="32" height="32" aria-hidden="true">
        <use href="/assets/images/symbol-defs.svg#flag"></use>
      </svg>
      
      <h2 class="tour-conclusion-title">Tour Complete</h2>
      <p>
        You explored ${stops.length} stops across ${categories.length} areas of campus, including ${categoryList}.
      </p>

      <div class="tour-conclusion-ctas">
        <p class="tour-conclusion-prompt">Ready to experience it in person?</p>
        <a href="https://www.messiah.edu/visit" target="_blank" rel="noopener nofollow noreferrer" class="button -primary">
          Schedule a Visit
        </a>
        <a href="https://www.messiah.edu/request-info/" target="_blank" rel="noopener nofollow noreferrer" class="button -secondary">
          Request Info
        </a>
      </div>

      <button class="tour-conclusion-restart" data-overview>
        <svg width="20" height="20" aria-hidden="true">
          <use href="/assets/images/symbol-defs.svg#menu"></use>
        </svg>
        Browse all stops
      </button>
    </div>
  `;

  contentEl.querySelector("[data-overview]").addEventListener("click", () => {
    navigate();
  });

  contentEl.scrollTop = 0;
}
