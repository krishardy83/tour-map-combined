const ROUTE_CHANGE_EVENT = "routechange";

export function getRoute() {
  let params = new URLSearchParams(window.location.search);
  let expandedParsed = params.getAll("expanded").filter(Boolean);
  let markersParsed = params.getAll("markers").filter(Boolean);

  return {
    stop: params.get("stop") || null,
    highlight: params.has("highlight") ? Number(params.get("highlight")) : null,
    entry: params.get("entry") || null,
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

  if (stop !== null) {
    params.set("stop", String(stop));
  }

  if (highlight !== null) {
    params.set("highlight", String(highlight));
  }

  if (entry) {
    params.set("entry", entry);
  }

  expanded.filter(Boolean).forEach((value) => params.append("expanded", value));

  markers.filter(Boolean).forEach((value) => params.append("markers", value));

  let search = params.toString();
  let url = search
    ? `${window.location.pathname}?${search}`
    : window.location.pathname;

  window.history.pushState(null, "", url);
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
}

export function onRouteChange(callback) {
  window.addEventListener(ROUTE_CHANGE_EVENT, callback);
}

window.addEventListener("popstate", () => {
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT));
});
