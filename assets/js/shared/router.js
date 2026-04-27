const ROUTE_CHANGE_EVENT = "routechange";
const CAMPUS_MAP_BASE_PATH = "/campus-map";

function getCampusMapEntryFromPath(pathname) {
  if (!pathname.startsWith(CAMPUS_MAP_BASE_PATH)) return null;

  let trimmed = pathname.slice(CAMPUS_MAP_BASE_PATH.length).replace(/^\/+/, "");
  if (!trimmed) return null;

  let [entry] = trimmed.split("/");
  return entry ? decodeURIComponent(entry) : null;
}

export function getCampusMapEntryUrl(entry = null) {
  return entry
    ? `${CAMPUS_MAP_BASE_PATH}/${encodeURIComponent(entry)}`
    : `${CAMPUS_MAP_BASE_PATH}/`;
}

export function getRoute() {
  let params = new URLSearchParams(window.location.search);
  let expandedParsed = params.getAll("expanded").filter(Boolean);
  let markersParsed = params.getAll("markers").filter(Boolean);
  let entryFromPath = getCampusMapEntryFromPath(window.location.pathname);

  return {
    stop: params.get("stop") || null,
    highlight: params.has("highlight") ? Number(params.get("highlight")) : null,
    entry: entryFromPath || params.get("entry") || null,
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

  if (stop !== null) {
    params.set("stop", String(stop));
  }

  if (highlight !== null) {
    params.set("highlight", String(highlight));
  }

  if (entry && !isCampusMapPath) {
    params.set("entry", entry);
  }

  expanded.filter(Boolean).forEach((value) => params.append("expanded", value));

  markers.filter(Boolean).forEach((value) => params.append("markers", value));

  let search = params.toString();
  let pathname = isCampusMapPath
    ? getCampusMapEntryUrl(entry)
    : window.location.pathname;
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
