import { navigate } from "../shared/router.js";
import { getMapOptions, createTileOverlay } from "../shared/map-config.js";

let map = null;
let markers = [];
let resizeTimer = null;

function queueMapResize() {
  if (!map) return;
  if (document.getElementById("map").classList.contains("hidden")) return;

  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    google.maps.event.trigger(map, "resize");
  }, 180);
}

function createMarker(stop) {
  let marker = new google.maps.marker.AdvancedMarkerElement({
    position: stop.coordinates,
    map,
    content: new google.maps.marker.PinElement({
      scale: 1.5,
      background: "var(--color-primary)",
      borderColor: "var(--color-white)",
      glyphColor: "var(--color-white)",
      glyphText: stop.stopNumber,
    }),
    title: `Stop ${stop.stopNumber}`,
    gmpClickable: true,
  });

  marker.addEventListener("gmp-click", () => {
    navigate({ stop: stop.stopNumber });
  });

  return marker;
}

export function initMap(stops) {
  let mapEl = document.getElementById("map");

  map = new google.maps.Map(mapEl, getMapOptions());
  map.overlayMapTypes.push(createTileOverlay());

  markers = stops.map((stop) => createMarker(stop));
  window.addEventListener("drawer:toggle", queueMapResize);
}

export function showMap() {
  document.getElementById("map").classList.remove("hidden");
  document.getElementById("panorama-container").classList.add("hidden");

  if (map) {
    // Force a redraw after showing
    google.maps.event.trigger(map, "resize");
  }
}

export function hideMap() {
  document.getElementById("map").classList.add("hidden");
  document.getElementById("panorama-container").classList.remove("hidden");
}
