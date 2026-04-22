import { navigate } from "../shared/router.js";
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
    const btn = document.getElementById("btn-prev");
    const stop = btn.dataset.stop;
    const highlight = btn.dataset.highlight;
    if (!stop) return;
    navigate({ stop, highlight: highlight !== "" ? Number(highlight) : null });
  });

  document.getElementById("btn-next").addEventListener("click", () => {
    const btn = document.getElementById("btn-next");
    if (btn.dataset.finish === "true") {
      showConclusion();
      return;
    }
    const stop = btn.dataset.stop;
    const highlight = btn.dataset.highlight;
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
          <a href="${window.location.pathname}?stop=${stop.stopNumber}" class="stop-item" data-stop="${stop.stopNumber}">
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
  const stopIdx = stops.findIndex((s) => s.stopNumber === stopNumber);
  if (stopIdx === -1) return { prev: null, next: null };

  const stop = stops[stopIdx];
  const isHighlight = highlightIndex !== null;

  let prev = null;
  let next = null;

  // Previous
  if (isHighlight && highlightIndex > 0) {
    prev = { stop: stopNumber, highlight: highlightIndex - 1 };
  } else if (isHighlight && highlightIndex === 0) {
    prev = { stop: stopNumber, highlight: null };
  } else if (!isHighlight && stopIdx > 0) {
    const prevStop = stops[stopIdx - 1];
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
    const isLastHighlight =
      !isHighlight || highlightIndex === stop.highlights.length - 1;
    if (isLastHighlight) {
      next = { stop: stops[stopIdx + 1].stopNumber, highlight: null };
    }
  }

  return { prev, next };
}

export function showStop(stopNumber, highlightIndex = null) {
  const stopIdx = stops.findIndex((s) => s.stopNumber === stopNumber);
  if (stopIdx === -1) return;

  const stop = stops[stopIdx];

  navEl.classList.remove("hidden");
  drawerController.openDrawer();

  progressEl.textContent = `Stop ${stopIdx + 1} of ${stops.length}`;

  const isHighlight = highlightIndex !== null;
  const entry = isHighlight ? stop.highlights[highlightIndex] : stop;
  if (!entry) return;

  const { prev, next } = getNavigationTargets(stopNumber, highlightIndex);

  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");

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

  const bannerHtml = entry.banner
    ? `<figure class="drawer-banner"><img src="${entry.banner}" alt="${entry.title}" width="448" height="298"></figure>`
    : "";

  const labelHtml = isHighlight
    ? `<span class="label -teal">Stop ${stopNumber}</span><span class="label -purple">Stop highlight</span>`
    : `<span class="label -teal">Stop ${stopNumber}</span>`;

  const highlightsHtml =
    !isHighlight && stop.highlights.length > 0
      ? `
      <h2 class="subtitle">Stop Highlights</h2>
      <ul>
        ${stop.highlights
          .map(
            (h, i) => `
          <li>
            <a href="${window.location.pathname}?stop=${stopNumber}&highlight=${i}" class="link" data-stop="${stopNumber}" data-highlight="${i}">
              ${h.title}
            </a>
          </li>
        `,
          )
          .join("")}
      </ul>
    `
      : "";

  const backHtml = isHighlight
    ? `<button class="button -primary" data-stop="${stopNumber}">Return to Stop Home</button>`
    : "";

  contentEl.innerHTML = `
    ${bannerHtml}
    <div class="drawer-body">
      <div class="drawer-labels">${labelHtml}</div>
      <div class="title-group">
        <h1 class="title">${entry.title}</h1>
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

  const backBtn = contentEl.querySelector(".button");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      navigate({ stop: backBtn.dataset.stop });
    });
  }

  contentEl.scrollTop = 0;
}

function showConclusion() {
  progressEl.textContent = "Tour Complete";

  const btnNext = document.getElementById("btn-next");
  btnNext.disabled = true;
  btnNext.classList.remove("-primary");
  btnNext.classList.add("-secondary");
  btnNext.dataset.finish = "";
  btnNext.innerHTML = `Finish <svg width="20" height="20" aria-hidden="true"><use href="/assets/images/symbol-defs.svg#next"></use></svg>`;

  const categories = [...new Set(stops.map((s) => s.categoryName))];
  const categoryList = categories.slice(0, 4).join(", ");

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
