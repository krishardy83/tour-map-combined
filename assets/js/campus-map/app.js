import { fetchEntries } from "./api.js";
import { getRoute, onRouteChange } from "../shared/router.js";
import { initMap, updateMarkers } from "./map.js";
import { initDrawer, showOverview, ensureDrawerOpen } from "./drawer.js";
import { initEntryView, showEntry } from "./entry-view.js";
import { initSearch } from "./search.js";
import { showError } from "../shared/utils.js";

let currentEntry = undefined;

function handleRouteChange() {
  const route = getRoute();

  if (route.entry) {
    if (route.entry !== currentEntry) {
      showEntry(route.entry);
      ensureDrawerOpen();
    }
  } else {
    if (currentEntry !== null) {
      document.title = "Messiah University Campus Map";
      showOverview();
    }
  }

  currentEntry = route.entry;
  updateMarkers(route);
}

async function loadData() {
  try {
    tryInit(await fetchEntries());
  } catch (error) {
    showError(
      "Unable to Load Campus Map",
      "The campus map is temporarily unavailable. This is usually caused by a network or server issue. Please try again later.",
    );
  }
}

function tryInit(entries) {
  initMap(entries);
  initDrawer(entries);
  initEntryView(entries);
  initSearch(entries);

  onRouteChange(handleRouteChange);
  handleRouteChange();

  Fancybox.bind("[data-fancybox]", {});
}

window.addEventListener("google-maps-ready", loadData);
