const ROUTE_CHANGE_EVENT = "routechange";
const CAMPUS_MAP_BASE_PATH = "/campus-map";
const VIRTUAL_TOUR_BASE_PATH = "/virtual-tour";
const STOP_PREFIX = "stop-";
const HIGHLIGHT_PREFIX = "highlight-";

function getCampusMapEntryFromPath(pathname) {
  if (!pathname.startsWith(CAMPUS_MAP_BASE_PATH)) return null;

  let trimmed = pathname.slice(CAMPUS_MAP_BASE_PATH.length).replace(/^\/+/, "");
  if (!trimmed) return null;

  let [entry] = trimmed.split("/");
  return entry ? decodeURIComponent(entry) : null;
}

function getVirtualTourRouteFromPath(pathname) {
  if (!pathname.startsWith(VIRTUAL_TOUR_BASE_PATH)) {
    return { stop: null, highlight: null };
  }

  let trimmed = pathname
    .slice(VIRTUAL_TOUR_BASE_PATH.length)
    .replace(/^\/+|\/+$/g, "");

  if (!trimmed) {
    return { stop: null, highlight: null };
  }

  let [stopSegment, highlightSegment] = trimmed.split("/");
  let stopToken = stopSegment ? decodeURIComponent(stopSegment) : "";
  let highlightToken = highlightSegment ? decodeURIComponent(highlightSegment) : "";
  let stop = stopToken.startsWith(STOP_PREFIX)
    ? stopToken.slice(STOP_PREFIX.length)
    : stopToken;
  let highlightRaw = highlightToken.startsWith(HIGHLIGHT_PREFIX)
    ? highlightToken.slice(HIGHLIGHT_PREFIX.length)
    : highlightToken;
  let highlight = highlightRaw !== "" ? Number(highlightRaw) : null;

  return {
    stop,
    highlight: Number.isInteger(highlight) ? highlight : null,
  };
}

export function getCampusMapEntryUrl(entry = null) {
  return entry
    ? `${CAMPUS_MAP_BASE_PATH}/${encodeURIComponent(entry)}`
    : `${CAMPUS_MAP_BASE_PATH}/`;
}

export function getVirtualTourStopUrl(stop = null, highlight = null) {
  if (!stop) return `${VIRTUAL_TOUR_BASE_PATH}/`;

  let stopValue = String(stop);
  if (stopValue.startsWith(STOP_PREFIX)) {
    stopValue = stopValue.slice(STOP_PREFIX.length);
  }

  let stopUrl = `${VIRTUAL_TOUR_BASE_PATH}/${encodeURIComponent(`${STOP_PREFIX}${stopValue}`)}`;

  if (highlight !== null && highlight !== undefined && highlight !== "") {
    let highlightValue = String(highlight);
    if (highlightValue.startsWith(HIGHLIGHT_PREFIX)) {
      highlightValue = highlightValue.slice(HIGHLIGHT_PREFIX.length);
    }

    return `${stopUrl}/${encodeURIComponent(`${HIGHLIGHT_PREFIX}${highlightValue}`)}`;
  }

  return stopUrl;
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
    entry: entryFromPath,
    expanded: expandedParsed,
    markers: markersParsed,
  };
}

export function navigate(updates = {}) {
  let {
    stop = null,
    highlight = null,
    entry = null,
    expanded = [],
    markers = [],
  } = updates;

  let params = new URLSearchParams();
  let isCampusMapPath = window.location.pathname.startsWith(CAMPUS_MAP_BASE_PATH);
  let isVirtualTourPath = window.location.pathname.startsWith(VIRTUAL_TOUR_BASE_PATH);

  expanded.filter(Boolean).forEach((value) => params.append("expanded", value));

  markers.filter(Boolean).forEach((value) => params.append("markers", value));

  let search = params.toString();
  let pathname = window.location.pathname;

  if (isCampusMapPath) {
    pathname = getCampusMapEntryUrl(entry);
  } else if (isVirtualTourPath) {
    pathname = getVirtualTourStopUrl(stop, highlight);
  }

  let url = search ? `${pathname}?${search}` : pathname;

  window.history.pushState(null, "", url);
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
}

export function onRouteChange(callback) {
  window.addEventListener(ROUTE_CHANGE_EVENT, callback);
}

window.addEventListener("popstate", () => {
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
});
