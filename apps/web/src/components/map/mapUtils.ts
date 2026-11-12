import type L from "leaflet";

/**
 * Validates that both latitude and longitude are finite numbers within WGS84 bounds.
 */
export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * Safely moves a Leaflet map to target coordinates.
 * When the map container has zero width/height (e.g. hidden inside a mobile tab),
 * `map.flyTo()` divides by zero viewport size and produces `LatLng(NaN, NaN)`.
 * In that state we fall back to `setView(..., { animate: false })`.
 */
export function safeMoveMap(
  map: L.Map,
  coords: [number, number],
  zoom: number,
  duration = 0.8
): void {
  const [lat, lng] = coords;
  if (!isValidLatLng(lat, lng)) return;

  const size = map.getSize();
  if (!size || size.x <= 0 || size.y <= 0) {
    map.setView([lat, lng], zoom, { animate: false });
    return;
  }

  map.flyTo([lat, lng], zoom, { animate: true, duration });
}

export interface ParsedGeocodeAddress {
  streetLabel: string;
  cityLabel: string;
}

/**
 * Extracts a rich human-readable address (including POI, hospital, building,
 * landmark/famous location, road + house number, and neighbourhood) from an
 * OpenStreetMap Nominatim `format=jsonv2` payload.
 */
export function parseNominatimAddress(data: {
  name?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
}): ParsedGeocodeAddress {
  const a = data?.address || {};

  const poiName = (
    data?.name ||
    a.hospital ||
    a.clinic ||
    a.healthcare ||
    a.building ||
    a.amenity ||
    a.tourism ||
    a.historic ||
    a.leisure ||
    a.attraction ||
    a.monument ||
    a.memorial ||
    a.public_building ||
    a.office ||
    a.shop ||
    a.mall ||
    a.school ||
    a.kindergarten ||
    a.university ||
    a.college ||
    a.railway ||
    a.station ||
    a.aeroway ||
    a.house_name ||
    ""
  ).trim();

  const road = (
    a.road ||
    a.pedestrian ||
    a.footway ||
    a.street ||
    a.path ||
    a.cycleway ||
    ""
  ).trim();
  const houseNo = a.house_number ? ` ${a.house_number.trim()}` : "";
  const roadWithNo = `${road}${houseNo}`.trim();
  const area = (a.neighbourhood || a.quarter || a.suburb || a.city_district || "").trim();

  const parts: string[] = [];
  if (poiName) parts.push(poiName);
  if (roadWithNo && roadWithNo.toLowerCase() !== poiName.toLowerCase()) {
    parts.push(roadWithNo);
  }
  if (!poiName && !a.house_number && area && area.toLowerCase() !== road.toLowerCase()) {
    parts.push(area);
  }

  let streetLabel = parts.join(", ").trim();
  if (!streetLabel && data?.display_name) {
    streetLabel = data.display_name
      .split(",")
      .slice(0, 2)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
  }

  const postCode = (a.postcode || "").trim();
  const cityPlace = (
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.county ||
    a.state_district ||
    a.state ||
    ""
  ).trim();
  const cityLabel = formatPostcodeCity(postCode, cityPlace);

  return { streetLabel, cityLabel };
}

/**
 * Formats street and optional house number without appending synthetic defaults.
 */
export function formatStreetDisplay(street?: string, houseNumber?: string): string {
  const s = (street || "").trim();
  const h = (houseNumber || "").trim();
  if (!s) return h;
  return h ? `${s} ${h}` : s;
}

/**
 * Formats postcode and city cleanly with a comma separator (e.g. "422006, Nashik").
 */
export function formatPostcodeCity(postcode?: string, city?: string): string {
  const p = (postcode || "").trim();
  const c = (city || "").trim();
  if (p && c) return `${p}, ${c}`;
  return p || c;
}

/**
 * Parses raw street & postcode/city input into backend location fields.
 * Supports 4-10 digit postcodes (e.g. 5-digit German, 6-digit Indian) and
 * comma or space separation without injecting fake house numbers or postcodes.
 */
export function parseAddressComponents(rawStreet: string, rawCity: string) {
  const streetTrimmed = (rawStreet || "").trim();
  const houseMatch = streetTrimmed.match(/^(.*?)(?:[,\s]+(\d+[a-zA-Z\/-]*))?$/);
  const streetName = houseMatch && houseMatch[1] ? houseMatch[1].trim() : streetTrimmed;
  const houseNumber = houseMatch && houseMatch[2] ? houseMatch[2].trim() : "";

  const cityTrimmed = (rawCity || "").trim();
  const cityMatch = cityTrimmed.match(/^(\d{4,10})?[\s,]*(.*)$/);
  const postcode = cityMatch && cityMatch[1] ? cityMatch[1].trim() : "";
  const cityName = cityMatch && cityMatch[2] ? cityMatch[2].trim() : "";

  return {
    street: streetName || "Daycare Street",
    houseNumber,
    postcode,
    city: cityName || "Berlin",
  };
}


