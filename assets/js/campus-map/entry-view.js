import { navigate, getCampusMapEntryUrl } from "../shared/router.js";
import { toggleDrawer } from "./drawer.js";
import {
  getEntryByShortcut,
  getEntriesInBuilding,
  getAdjacentEntries,
  getGalleryImages,
  getGoogleMapsUrl,
} from "./api.js";

let entries = [];
let contentEl, navEl, btnPrev, btnNext;

export function initEntryView(entriesData) {
  entries = entriesData;
  contentEl = document.getElementById("drawer-content");
  navEl = document.getElementById("drawer-nav");
  btnPrev = document.getElementById("btn-prev");
  btnNext = document.getElementById("btn-next");

  document.getElementById("btn-menu").addEventListener("click", () => {
    navigate({ entry: null });
  });

  btnPrev.addEventListener("click", () => {
    let shortcut = btnPrev.dataset.shortcut;

    if (shortcut) navigate({ entry: shortcut });
  });

  btnNext.addEventListener("click", () => {
    let shortcut = btnNext.dataset.shortcut;

    if (shortcut) navigate({ entry: shortcut });
  });
}

function getCoverUrl(image) {
  return image?.length > 0 ? image : "";
}

export function showEntry(shortcut) {
  let entry = getEntryByShortcut(entries, shortcut);

  document.title = entry
    ? `${entry.entry_title} - Messiah University Campus Map`
    : "Not Found - Messiah University Campus Map";

  if (!entry) {
    contentEl.innerHTML = `
      <div class="drawer-body">
        <h1 class="title">Not Found</h1>
        <p>The entry you are looking for doesn't exist.</p>
      </div>
    `;
    navEl.classList.remove("hidden");
    btnPrev.disabled = true;
    btnPrev.dataset.shortcut = "";
    btnNext.disabled = true;
    btnNext.dataset.shortcut = "";
    return;
  }

  let images = getGalleryImages(entry);
  let hasGallery = images.length > 1;
  let locationsInside = getEntriesInBuilding(entry, entries);
  let coverUrl = getCoverUrl(entry.image_1_required);

  let coverHtml = coverUrl
    ? `<figure class="drawer-banner"><img src="${coverUrl}" alt="${entry.entry_title}" width="448" height="298"></figure>`
    : "";

  let directionsHtml =
    entry.location?.length > 0
      ? `<a href="${getGoogleMapsUrl(entry.location)}" target="_blank" rel="noopener nofollow noreferrer" class="title-directions" aria-label="Get directions to ${entry.entry_title}">
          <svg width="24" height="24"><use href="/assets/images/symbol-defs.svg#map-pin"></use></svg>
        </a>`
      : "";

  let galleryHtml = hasGallery
    ? `
      <h2 class="subtitle">Gallery</h2>
      <figure class="gallery">
        ${images
          .map(
            (image, index) =>
              `<a href="${image}" data-fancybox="gallery">
                <img src="${image}" alt="Image ${index + 1} of ${entry.entry_title}" width="300" height="300" loading="lazy" decoding="async">
              </a>`,
          )
          .join("")}
      </figure>`
    : "";

  let buildingsHtml =
    locationsInside.length > 0
      ? `<h2 class="subtitle">Locations in This Building</h2>
      <ul>
        ${locationsInside
          .map(
            (loc) =>
              `<li><a href="${getCampusMapEntryUrl(loc.shortcut)}" data-shortcut="${loc.shortcut}" class="link">${loc.entry_title}</a></li>`,
          )
          .join("")}
      </ul>`
      : "";

  contentEl.innerHTML = `
    ${coverHtml}

    <article class="drawer-body">
      ${locationsInside.length > 0 ? `<div class="drawer-labels"><span class="label -teal">Building</span></div>` : ""}
      <header class="title-group">
        <h1 class="title">${entry.entry_title}</h1>
        ${directionsHtml}
      </header>
      <p>${entry.description}</p>
      
      <button type="button" class="button -primary md" id="view-on-map">
        <svg width="20" height="20"><use href="/assets/images/symbol-defs.svg#eye"></use></svg>
        View on the map
      </button>
      
      ${galleryHtml}
      ${buildingsHtml}
    </article>
  `;

  bindOverviewLinks();

  let { prev, next } = getAdjacentEntries(shortcut, entries);

  navEl.classList.remove("hidden");

  btnPrev.disabled = !prev;
  btnPrev.dataset.shortcut = prev?.shortcut ?? "";

  btnNext.disabled = !next;
  btnNext.dataset.shortcut = next?.shortcut ?? "";

  contentEl.querySelectorAll("[data-shortcut]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate({ entry: link.dataset.shortcut });
    });
  });

  let viewMapBtn = document.getElementById("view-on-map");

  if (viewMapBtn) {
    viewMapBtn.addEventListener("click", toggleDrawer);
  }

  contentEl.scrollTop = 0;
}

function bindOverviewLinks() {
  contentEl.querySelectorAll("[data-overview]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate({ entry: null });
    });
  });
}
