import { fetchStops } from "./api.js";
import { getRoute, onRouteChange } from "../shared/router.js";
import { initMap as initGoogleMap, showMap } from "./map.js";
import { initDrawer, showOverview, showStop } from "./drawer.js";
import { initPanorama, showPanorama, hidePanorama } from "./stop-view.js";
import { showError } from "../shared/utils.js";

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

function tryInit(stops) {
  initGoogleMap(stops);
  initDrawer(stops);
  initPanorama(stops);

  onRouteChange(handleRouteChange);
  handleRouteChange();
}

window.addEventListener("google-maps-ready", loadData);
