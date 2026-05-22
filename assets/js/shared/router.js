const ROUTE_CHANGE_EVENT = "routechange";
const CAMPUS_MAP_BASE_PATH = "/campus-map";
const VIRTUAL_TOUR_BASE_PATH = "/virtual-tour";

let campusMapSlugByEntry = new Map();
let campusMapEntryBySlug = new Map();

let virtualTourStopSlugByStop = new Map();
let virtualTourStopBySlug = new Map();
let virtualTourHighlightSlugByKey = new Map();
let virtualTourHighlightBySlugKey = new Map();

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function firstNonEmptyString(...values) {
  for (let value of values) {
    let text = String(value || "").trim();
    if (text) return text;
  }

  return "";
}

function createUniqueSlug(value, used) {
  let base = slugify(value) || "item";
  let slug = base;
  let index = 2;

  while (used.has(slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }

  used.add(slug);
  return slug;
}

function getHighlightKey(stop, highlight) {
  return `${String(stop)}::${String(highlight)}`;
}

function getHighlightSlugKey(stopSlug, highlightSlug) {
  return `${stopSlug}::${highlightSlug}`;
}

function getCampusMapEntryFromPath(pathname) {
  if (!pathname.startsWith(CAMPUS_MAP_BASE_PATH)) return null;

  let trimmed = pathname.slice(CAMPUS_MAP_BASE_PATH.length).replace(/^\/+/, "");
  if (!trimmed) return null;

  let [entry] = trimmed.split("/");
  if (!entry) return null;

  let token = decodeURIComponent(entry);
  return campusMapEntryBySlug.get(token) || token;
}

function getVirtualTourRouteFromPath(pathname) {
  if (!pathname.startsWith(VIRTUAL_TOUR_BASE_PATH)) {
    return { stop: null, highlight: null, mediaAsset: null };
  }

  let trimmed = pathname
    .slice(VIRTUAL_TOUR_BASE_PATH.length)
    .replace(/^\/+|\/+$/g, "");

  if (!trimmed) {
    return { stop: null, highlight: null, mediaAsset: null };
  }

  let [stopSegment, highlightSegment] = trimmed.split("/");
  let stopSlug = stopSegment ? decodeURIComponent(stopSegment) : "";
  let stop = virtualTourStopBySlug.get(stopSlug) || null;

  if (!stop) {
    return { stop: null, highlight: null, mediaAsset: null };
  }

  let mediaAsset = normalizeMediaAsset(window.location.hash);

  if (!highlightSegment) {
    return { stop, highlight: null, mediaAsset };
  }

  let highlightSlug = decodeURIComponent(highlightSegment);
  let highlight = virtualTourHighlightBySlugKey.get(
    getHighlightSlugKey(stopSlug, highlightSlug),
  );

  return {
    stop,
    highlight: Number.isInteger(highlight) ? highlight : null,
    mediaAsset,
  };
}

function normalizeMediaAsset(value) {
  let text = String(value || "").trim().replace(/^#+/, "");
  if (!text) return null;
  return `#${text}`;
}

function buildNavigateUrl(pathname, search, hash = "") {
  let url = new URL(pathname, window.location.origin);
  url.search = search ? `?${search}` : "";
  url.hash = hash ? hash.replace(/^#+/, "") : "";
  return `${url.pathname}${url.search}${url.hash}`;
}

export function getCampusMapEntryUrl(entry = null) {
  let entryToken = String(entry || "");
  let slug = campusMapSlugByEntry.get(entryToken) || entryToken;

  return entry
    ? `${CAMPUS_MAP_BASE_PATH}/${encodeURIComponent(slug)}`
    : `${CAMPUS_MAP_BASE_PATH}/`;
}

export function getVirtualTourStopUrl(stop = null, highlight = null) {
  if (!stop) return `${VIRTUAL_TOUR_BASE_PATH}/`;

  let stopValue = String(stop);
  let stopSlug = virtualTourStopSlugByStop.get(stopValue) || slugify(stopValue);
  let stopUrl = `${VIRTUAL_TOUR_BASE_PATH}/${encodeURIComponent(stopSlug)}`;

  if (highlight !== null && highlight !== undefined && highlight !== "") {
    let highlightValue = String(highlight);
    let highlightSlug =
      virtualTourHighlightSlugByKey.get(
        getHighlightKey(stopValue, highlightValue),
      ) || slugify(highlightValue);

    return `${stopUrl}/${encodeURIComponent(highlightSlug)}`;
  }

  return stopUrl;
}

export function setVirtualTourRouteData(stops = []) {
  let usedStopSlugs = new Set();

  virtualTourStopSlugByStop = new Map();
  virtualTourStopBySlug = new Map();
  virtualTourHighlightSlugByKey = new Map();
  virtualTourHighlightBySlugKey = new Map();

  for (let stop of stops) {
    let stopId = String(stop.stopNumber);
    let stopSlugSource = firstNonEmptyString(stop.slug, stop.title, stopId);
    let stopSlug = createUniqueSlug(stopSlugSource, usedStopSlugs);

    virtualTourStopSlugByStop.set(stopId, stopSlug);
    virtualTourStopBySlug.set(stopSlug, stopId);

    let usedHighlightSlugs = new Set();

    stop.highlights.forEach((highlight, index) => {
      let highlightSlugSource = firstNonEmptyString(
        highlight.slug,
        highlight.title,
        `${stopId}-${index}`,
      );
      let highlightSlug = createUniqueSlug(
        highlightSlugSource,
        usedHighlightSlugs,
      );
      let highlightKey = getHighlightKey(stopId, index);
      let highlightSlugKey = getHighlightSlugKey(stopSlug, highlightSlug);

      virtualTourHighlightSlugByKey.set(highlightKey, highlightSlug);
      virtualTourHighlightBySlugKey.set(highlightSlugKey, index);
    });
  }
}

export function setCampusMapRouteData(entries = []) {
  let usedSlugs = new Set();

  campusMapSlugByEntry = new Map();
  campusMapEntryBySlug = new Map();

  for (let entry of entries) {
    let entryId = String(entry.shortcut || "");
    if (!entryId) continue;

    let entrySlugSource = firstNonEmptyString(
      entry.slug,
      entry.entry_title,
      entryId,
    );
    let entrySlug = createUniqueSlug(entrySlugSource, usedSlugs);
    campusMapSlugByEntry.set(entryId, entrySlug);
    campusMapEntryBySlug.set(entrySlug, entryId);
  }
}

export function getRoute() {
  let params = new URLSearchParams(window.location.search);
  let expandedParsed = params.getAll("expanded").filter(Boolean);
  let markersParsed = params.getAll("markers").filter(Boolean);
  let entryFromPath = getCampusMapEntryFromPath(window.location.pathname);
  let virtualTourRoute = getVirtualTourRouteFromPath(window.location.pathname);

  return {
    stop: virtualTourRoute.stop,
    highlight: virtualTourRoute.highlight,
    mediaAsset: virtualTourRoute.mediaAsset,
    entry: entryFromPath,
    expanded: expandedParsed,
    markers: markersParsed,
  };
}

export function navigate(updates = {}) {
  let {
    stop = null,
    highlight = null,
    mediaAsset = null,
    entry = null,
    expanded = [],
    markers = [],
  } = updates;

  let params = new URLSearchParams();
  let isCampusMapPath =
    window.location.pathname.startsWith(CAMPUS_MAP_BASE_PATH);
  let isVirtualTourPath = window.location.pathname.startsWith(
    VIRTUAL_TOUR_BASE_PATH,
  );

  expanded.filter(Boolean).forEach((value) => params.append("expanded", value));
  markers.filter(Boolean).forEach((value) => params.append("markers", value));

  let search = params.toString();
  let hash = "";
  let pathname = window.location.pathname;

  if (isCampusMapPath) {
    pathname = getCampusMapEntryUrl(entry);
  } else if (isVirtualTourPath) {
    pathname = getVirtualTourStopUrl(stop, highlight);
    hash = normalizeMediaAsset(mediaAsset) || "";
  }

  let url = buildNavigateUrl(pathname, search, hash);
  window.history.pushState(null, "", url);
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
}

export function onRouteChange(callback) {
  window.addEventListener(ROUTE_CHANGE_EVENT, callback);
}

window.addEventListener("popstate", () => {
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
});
