import { navigate } from "../shared/router.js";
import {
  parseCoordinates,
  getEntriesForCategory,
  getBuildingEntries,
} from "./api.js";
import {
  getMapOptions,
  createTileOverlay,
  DEFAULT_ZOOM,
  DETAIL_ZOOM,
  DEFAULT_CENTER,
} from "../shared/map-config.js";

let map = null;
let entries = [];
let pinMarkers = [];
let textMarkers = [];

function createTextMarkerContent(textContent) {
  let element = document.createElement("p");

  element.className = "map-marker-text";
  element.textContent = textContent;

  return element;
}

function createPinMarker(position, title, shortcut) {
  let star = document.createElement("div");

  star.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <use href="/assets/images/symbol-defs.svg#star"></use>
    </svg>`;

  let pin = new google.maps.marker.PinElement({
    scale: 1.5,
    background: "var(--color-primary)",
    borderColor: "var(--color-white)",
    glyphColor: "var(--color-white)",
    glyph: star.firstElementChild,
  });

  let marker = new google.maps.marker.AdvancedMarkerElement({
    position,
    map,
    content: pin.element,
    title,
    gmpClickable: true,
  });

  marker.addEventListener("gmp-click", () => {
    navigate({ entry: shortcut });
  });

  return marker;
}

function clearPinMarkers() {
  for (let marker of pinMarkers) {
    marker.map = null;
  }

  pinMarkers = [];
}

export function initMap(entriesData) {
  entries = entriesData;

  let mapEl = document.getElementById("map");

  map = new google.maps.Map(mapEl, getMapOptions());
  map.overlayMapTypes.push(createTileOverlay());

  createBuildingTextMarkers();
}

function createBuildingTextMarkers() {
  let buildings = getBuildingEntries(entries);

  for (let entry of buildings) {
    let coords = parseCoordinates(entry.location);

    if (!coords) continue;

    let marker = new google.maps.marker.AdvancedMarkerElement({
      position: coords,
      map,
      content: createTextMarkerContent(entry.entry_title),
      gmpClickable: true,
      collisionBehavior:
        google.maps.CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
    });

    marker.addEventListener("gmp-click", () => {
      navigate({ entry: entry.shortcut });
    });

    textMarkers.push(marker);
  }
}

export function updateMarkers(route) {
  clearPinMarkers();

  let coords = [];

  if (route.markers.length > 0) {
    for (let category of route.markers) {
      let matches = getEntriesForCategory(category, entries);

      for (let match of matches) {
        let position = parseCoordinates(match.location);

        if (!position) continue;

        coords.push(position);
        pinMarkers.push(
          createPinMarker(position, match.entry_title, match.shortcut),
        );
      }
    }
  } else if (route.entry) {
    let entry = entries.find((e) => e.shortcut === route.entry);

    if (entry) {
      let position = parseCoordinates(entry.location);

      if (position) {
        coords.push(position);
        pinMarkers.push(
          createPinMarker(position, entry.entry_title, entry.shortcut),
        );
      }
    }
  }

  if (coords.length === 1) {
    map.setZoom(DETAIL_ZOOM);
    map.setCenter(coords[0]);
  } else if (coords.length > 1) {
    let bounds = new google.maps.LatLngBounds();

    for (let c of coords) bounds.extend(c);

    map.fitBounds(bounds, 60);
  } else {
    map.setZoom(DEFAULT_ZOOM);
  }
}
