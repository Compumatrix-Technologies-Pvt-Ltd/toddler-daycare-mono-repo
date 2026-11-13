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

export type DaycareAreaType = "urban" | "rural";

export interface AreaClassificationResult {
  areaType: DaycareAreaType;
  catchmentRadiusKm: number;
  areaLabel: string;
  source: "openstreetmap" | "fallback";
}

/**
 * Classifies an address or map position into Urban (3 km reach) or Rural (10 km reach)
 * using OpenStreetMap Nominatim metadata, boundary tags, and place types.
 */
export function classifyAreaFromOsm(data?: {
  type?: string;
  class?: string;
  addresstype?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
}): AreaClassificationResult {
  const a = data?.address || {};
  const osmType = String(data?.type || data?.addresstype || "").toLowerCase();
  const fullText = `${data?.display_name || ""} ${Object.values(a).join(" ")}`.toLowerCase();

  // 1. Explicit rural address keys from OpenStreetMap hierarchy
  const ruralAddressKeys = [
    "village",
    "hamlet",
    "isolated_dwelling",
    "farm",
    "croft",
    "locality",
    "allotments",
  ];
  const hasRuralAddress = ruralAddressKeys.some((k) => Boolean(a[k]));

  // 2. Rural place/landuse types in OpenStreetMap
  const ruralOsmTypes = [
    "village",
    "hamlet",
    "isolated_dwelling",
    "farm",
    "farmland",
    "meadow",
    "forest",
    "wood",
    "nature_reserve",
    "rural",
    "allotments",
    "locality",
  ];
  const hasRuralType = ruralOsmTypes.includes(osmType);

  // 3. Known rural settlement keywords (checked before generic urban types)
  const ruralKeywords = [
    "village", "hamlet", "rural", "countryside", "farm", "ranch",
    "dorf", "weiler", "landkreis", "ländlich", "bauernhof", "siedlung", "hof ", "gut ",
    "mehunbare", "chalisgaon", "gaon", "wadi", "kheda", "gram", "taluka", "dehat", "tehsil"
  ];

  const hasRuralText = ruralKeywords.some((kw) => {
    if (kw.length <= 4) {
      const rx = new RegExp(`(?:^|[^a-zäöüß])${kw}(?:[^a-zäöüß]|$)`, "i");
      return rx.test(fullText);
    }
    return fullText.includes(kw);
  }) || /(?:^|[^a-zäöüß])\w*dorf(?:[^a-zäöüß]|$)/i.test(fullText);

  // If explicit rural indicator or settlement keyword matches -> Rural (10 km)
  if (hasRuralAddress || hasRuralType || hasRuralText) {
    const label = a.village || a.hamlet || a.locality || a.county || "Rural Area";
    return {
      areaType: "rural",
      catchmentRadiusKm: 10,
      areaLabel: label,
      source: "openstreetmap",
    };
  }

  // 4. Urban settlement indicators: true metropolitan cities and city districts
  const urbanAddressKeys = [
    "city",
    "city_district",
    "suburb",
    "quarter",
    "neighbourhood",
    "borough",
  ];
  const hasUrbanAddress = urbanAddressKeys.some((k) => Boolean(a[k]));
  const hasUrbanType = ["city", "suburb"].includes(osmType);

  if (hasUrbanAddress || hasUrbanType) {
    const label = a.city_district || a.quarter || a.suburb || a.city || "Urban Area";
    return {
      areaType: "urban",
      catchmentRadiusKm: 3,
      areaLabel: label,
      source: "openstreetmap",
    };
  }

  // 5. Default fallback based on whether county/state exists without a city
  if (a.county && !a.city) {
    return {
      areaType: "rural",
      catchmentRadiusKm: 10,
      areaLabel: a.county || "Rural Area",
      source: "openstreetmap",
    };
  }

  return {
    areaType: "urban",
    catchmentRadiusKm: 3,
    areaLabel: "Urban Area",
    source: "openstreetmap",
  };
}

/**
 * Offline / fallback classifier for daycare locations based on street, city, and postcode strings.
 */
export function detectAreaTypeFromLocation(loc?: {
  street?: string;
  city?: string;
  postcode?: string;
  areaType?: DaycareAreaType;
  catchmentRadiusKm?: number;
}): AreaClassificationResult {
  if (loc?.areaType === "rural" || loc?.areaType === "urban") {
    return {
      areaType: loc.areaType,
      catchmentRadiusKm: loc.catchmentRadiusKm || (loc.areaType === "rural" ? 10 : 3),
      areaLabel: loc.areaType === "rural" ? "Rural Area" : "Urban Area",
      source: "fallback",
    };
  }

  const text = `${loc?.street || ""} ${loc?.city || ""} ${loc?.postcode || ""}`.toLowerCase();
  const ruralKeywords = [
    "village", "hamlet", "rural", "countryside", "farm", "ranch",
    "dorf", "weiler", "landkreis", "ländlich", "bauernhof", "siedlung", "hof ", "gut ",
    "mehunbare", "chalisgaon", "gaon", "wadi", "kheda", "gram", "taluka", "dehat", "tehsil"
  ];
  const isRural = ruralKeywords.some((kw) => {
    if (kw.length <= 4) {
      const rx = new RegExp(`(?:^|[^a-zäöüß])${kw}(?:[^a-zäöüß]|$)`, "i");
      return rx.test(text);
    }
    return text.includes(kw);
  }) || /(?:^|[^a-zäöüß])\w*dorf(?:[^a-zäöüß]|$)/i.test(text);

  return {
    areaType: isRural ? "rural" : "urban",
    catchmentRadiusKm: isRural ? 10 : 3,
    areaLabel: isRural ? "Rural Area" : "Urban Area",
    source: "fallback",
  };
}



