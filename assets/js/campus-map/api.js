const DATA_URL = "https://cascade.messiah.edu/campus-map/_data/campus-map.json";

const VISITOR_QUICK_LINKS = [
  "Admissions",
  "Parking",
  "College Entrances",
  "Guest Services",
];

export async function fetchEntries() {
  let response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch campus map data: ${response.status}`);
  }

  let json = await response.json();

  return json.items.filter((entry) => String(entry.live) === "1");
}

export function getCategories(entries) {
  let seen = new Set();

  return entries
    .filter((entry) => entry.category_name?.length > 0)
    .reduce((categories, entry) => {
      if (!seen.has(entry.category_name)) {
        seen.add(entry.category_name);
        categories.push(entry.category_name);
      }
      return categories;
    }, []);
}

export function getVisitorQuickLinks(categories) {
  return categories.filter((cat) => VISITOR_QUICK_LINKS.includes(cat));
}

export function getLocationCategories(categories) {
  return categories.filter((cat) => !VISITOR_QUICK_LINKS.includes(cat));
}

export function getEntriesForCategory(category, entries) {
  return entries.filter((entry) => entry.category_name === category);
}

export function getEntryByShortcut(entries, shortcut) {
  return entries.find((entry) => entry.shortcut === shortcut);
}

export function getEntriesInBuilding(entry, entries) {
  return entries.filter(
    (e) =>
      e.parent_building === entry.entry_id ||
      e.parent_building_id === entry.entry_id,
  );
}

export function parseCoordinates(location) {
  if (!location || location.length === 0) return null;

  let [lat, lng] = location.split(",").map(Number);

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return { lat, lng };
}

export function getGalleryImages(entry) {
  return [
    entry.image_1_required,
    entry.image_2_optional,
    entry.image_3_optional,
    entry.image_4_optional,
  ].filter((img) => img?.length > 0);
}

export function getAdjacentEntries(shortcut, entries) {
  let current = getEntryByShortcut(entries, shortcut);
  if (!current) return { prev: null, next: null };

  let sameCategory = entries.filter(
    (e) => e.category_name === current.category_name,
  );
  let idx = sameCategory.findIndex((e) => e.shortcut === shortcut);

  return {
    prev: idx > 0 ? sameCategory[idx - 1] : null,
    next: idx < sameCategory.length - 1 ? sameCategory[idx + 1] : null,
  };
}

export function getGoogleMapsUrl(location) {
  return `https://maps.google.com?saddr=Current+Location&daddr=${location}`;
}

export function getBuildingEntries(entries) {
  return entries.filter(
    (entry) => entry.building2 === "yes" && entry.location?.length > 0,
  );
}
