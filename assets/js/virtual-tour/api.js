const JSON_URL =
  "https://cascade-prod.messiah.edu/campus-map/_data/virtual-tour.json";

function normalizeEntry(raw) {
  let [lat, lng] = (raw.stop_location || "0,0").split(",").map(Number);

  return {
    stopNumber: raw.stop_number || "",
    title: raw.entry_title || "",
    description: raw.stop_description || "",
    banner: raw.banner_image || "",
    panorama: raw.stop_pano_image_url || "",
    coordinates: { lat, lng },
    categoryId: raw.category_id || "",
    categoryName: raw.category_name || "",
  };
}

export async function fetchStops() {
  let response = await fetch(JSON_URL);

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  let data = await response.json();
  let stops = new Map();

  for (let raw of data.directory_data) {
    if (raw.live !== "1") continue;

    let entry = normalizeEntry(raw);
    let isHighlight = raw.building_highlight === "yes";
    let key = entry.stopNumber;

    if (!stops.has(key)) {
      stops.set(key, { main: null, highlights: [] });
    }

    let record = stops.get(key);

    if (isHighlight) {
      record.highlights.push(entry);
    } else if (entry.categoryId && entry.categoryName) {
      record.main = entry;
    }
  }

  // Remove entries with no main stop and sort numerically
  let sorted = [...stops.entries()]
    .filter(([, value]) => value.main !== null)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, value]) => ({
      ...value.main,
      highlights: value.highlights,
    }));

  return sorted;
}
