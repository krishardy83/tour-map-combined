export const DEFAULT_CENTER = { lat: 40.157204, lng: -76.988973 };
export const DEFAULT_ZOOM = 18;
export const DETAIL_ZOOM = 19;
export const MAP_MAX_ZOOM = 20;
export const TILE_SIZE = 256;

const TILE_BOUNDS = {
  15: [
    [9375, 9377],
    [12385, 12387],
  ],
  16: [
    [18750, 18754],
    [24771, 24774],
  ],
  17: [
    [37501, 37509],
    [49542, 49548],
  ],
  18: [
    [75003, 75018],
    [99085, 99097],
  ],
  19: [
    [150007, 150037],
    [198170, 198195],
  ],
  20: [
    [300015, 300075],
    [396340, 396390],
  ],
};

export function getMapOptions() {
  return {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    maxZoom: MAP_MAX_ZOOM,
    mapId: "campus-map",
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_BOTTOM,
    },
  };
}

export function createTileOverlay(tilePathPrefix = "/assets/tiles") {
  return new google.maps.ImageMapType({
    getTileUrl(coord, zoom) {
      let bounds = TILE_BOUNDS[zoom];

      if (
        !bounds ||
        coord.x < bounds[0][0] ||
        coord.x > bounds[0][1] ||
        coord.y < bounds[1][0] ||
        coord.y > bounds[1][1]
      ) {
        return null;
      }

      return `${tilePathPrefix}/${zoom}/tile_${coord.x}x${coord.y}.webp`;
    },
    tileSize: new google.maps.Size(TILE_SIZE, TILE_SIZE),
  });
}
