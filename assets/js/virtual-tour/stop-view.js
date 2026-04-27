let stops = [];
let currentFrame, prevFrame, nextFrame;

export function initPanorama(stopsData) {
  stops = stopsData;
  currentFrame = document.getElementById("pano-current");
  prevFrame = document.getElementById("pano-prev");
  nextFrame = document.getElementById("pano-next");
}

function findEntry(stopNumber, highlightIndex) {
  let stop = stops.find((s) => s.stopNumber === stopNumber);
  if (!stop) return null;

  if (highlightIndex !== null && stop.highlights[highlightIndex]) {
    return stop.highlights[highlightIndex];
  }
  return stop;
}

function getAdjacentEntries(stopNumber, highlightIndex) {
  let stopIdx = stops.findIndex((s) => s.stopNumber === stopNumber);
  if (stopIdx === -1) return { prevEntry: null, nextEntry: null };

  let stop = stops[stopIdx];
  let isHighlight = highlightIndex !== null;

  let prevEntry = null;
  let nextEntry = null;

  // Previous
  if (isHighlight && highlightIndex > 0) {
    prevEntry = stop.highlights[highlightIndex - 1];
  } else if (isHighlight && highlightIndex === 0) {
    prevEntry = stop;
  } else if (!isHighlight && stopIdx > 0) {
    let prevStop = stops[stopIdx - 1];
    prevEntry =
      prevStop.highlights.length > 0
        ? prevStop.highlights[prevStop.highlights.length - 1]
        : prevStop;
  }

  // Next
  if (!isHighlight && stop.highlights.length > 0) {
    nextEntry = stop.highlights[0];
  } else if (isHighlight && highlightIndex < stop.highlights.length - 1) {
    nextEntry = stop.highlights[highlightIndex + 1];
  } else {
    let isLast = !isHighlight || highlightIndex === stop.highlights.length - 1;
    if (isLast && stopIdx < stops.length - 1) {
      nextEntry = stops[stopIdx + 1];
    }
  }

  return { prevEntry, nextEntry };
}

export function showPanorama(stopNumber, highlightIndex = null) {
  let entry = findEntry(stopNumber, highlightIndex);
  if (!entry) return;

  let container = document.getElementById("panorama-container");
  container.classList.remove("hidden");
  document.getElementById("map").classList.add("hidden");

  let { prevEntry, nextEntry } = getAdjacentEntries(stopNumber, highlightIndex);

  currentFrame.classList.remove("hidden");
  currentFrame.src = entry.panorama || "";

  prevFrame.src = prevEntry?.panorama || "";
  nextFrame.src = nextEntry?.panorama || "";
}

export function hidePanorama() {
  document.getElementById("panorama-container").classList.add("hidden");
  document.getElementById("map").classList.remove("hidden");

  currentFrame.src = "";
  prevFrame.src = "";
  nextFrame.src = "";
}

export function swapToPrev() {
  let temp = nextFrame;
  nextFrame = currentFrame;
  currentFrame = prevFrame;
  prevFrame = temp;

  nextFrame.classList.add("hidden");
  prevFrame.classList.add("hidden");
  currentFrame.classList.remove("hidden");
}

export function swapToNext() {
  let temp = prevFrame;
  prevFrame = currentFrame;
  currentFrame = nextFrame;
  nextFrame = temp;

  prevFrame.classList.add("hidden");
  nextFrame.classList.add("hidden");
  currentFrame.classList.remove("hidden");
}
