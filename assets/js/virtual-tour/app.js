import { fetchStops } from "./api.js";
import {
  getRoute,
  navigate,
  slugify,
  onRouteChange,
  setVirtualTourRouteData,
} from "../shared/router.js";
import { initMap as initGoogleMap, showMap } from "./map.js";
import { initDrawer, showOverview, showStop } from "./drawer.js";
import { initPanorama, showPanorama, hidePanorama } from "./stop-view.js";
import { showError } from "../shared/utils.js";

let stops = [];

function normalizeLookup(value) {
  let text = String(value ?? "").trim();
  if (!text) return "";
  return slugify(text) || text.toLowerCase();
}

function buildCandidates(entry, fallback = "") {
  let candidates = new Set();

  [entry.slug, entry.title, fallback].forEach((value) => {
    let normalized = normalizeLookup(value);
    if (normalized) candidates.add(normalized);
  });

  return candidates;
}

function findStopByLocation(location) {
  let locationLookup = normalizeLookup(location);
  if (!locationLookup) return null;

  return (
    stops.find((stop) =>
      buildCandidates(stop, stop.stopNumber).has(locationLookup),
    ) || null
  );
}

function findHighlight(stop, highlight) {
  let highlightLookup = normalizeLookup(highlight);
  if (!highlightLookup) return null;

  for (let index = 0; index < stop.highlights.length; index += 1) {
    let entry = stop.highlights[index];

    if (buildCandidates(entry, index).has(highlightLookup)) {
      return index;
    }
  }

  return null;
}

function openStop(location, highlight = null) {
  if (stops.length === 0) return false;

  let stop = findStopByLocation(location);

  if (!stop) return false;

  navigate({
    stop: stop.stopNumber,
    highlight: findHighlight(stop, highlight),
  });

  return true;
}

window.openStop = openStop;

function handleRouteChange() {
  let { stop, highlight } = getRoute();

  if (stop) {
    showStop(stop, highlight);
    showPanorama(stop, highlight);
  } else {
    showOverview();
    hidePanorama();
    showMap();
  }
}

async function loadData() {
  try {
    tryInit(await fetchStops());
  } catch (error) {
    showError(
      "Unable to Start Virtual Tour",
      "The virtual tour is temporarily unavailable. This is usually caused by a network or server issue. Please try again later.",
    );
  }
}

function tryInit(stopsData) {
  stops = stopsData;
  setVirtualTourRouteData(stops);
  initGoogleMap(stops);
  initDrawer(stops);
  initPanorama(stops);

  onRouteChange(handleRouteChange);
  handleRouteChange();
}

window.addEventListener("google-maps-ready", loadData);
