"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";
import { caretakerApi } from "@/utils/caretakerApi";

// Dynamically import Leaflet Map to ensure zero SSR / "window is not defined" issues
const LocationPickerMap = dynamic(
  () => import("../map/LocationPickerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#FAF8F5] text-[#7A6E62] text-[13px] font-medium">
        <svg className="animate-spin h-5 w-5 text-[#15803D] mr-2.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Loading Leaflet Map...</span>
      </div>
    ),
  }
);

// Helper to parse street, house number, postcode, and city for strict MongoDB schema
function parseAddressComponents(rawStreet: string, rawCity: string) {
  const streetTrimmed = (rawStreet || "").trim();
  // Extract house number if at the end of the street string (e.g. "Stargarder Straße 14" -> "Stargarder Straße", "14")
  const houseMatch = streetTrimmed.match(/^(.*?)(?:\s+(\d+[a-zA-Z\/-]*))?$/);
  const streetName = houseMatch && houseMatch[1] ? houseMatch[1].trim() : streetTrimmed;
  const houseNumber = houseMatch && houseMatch[2] ? houseMatch[2].trim() : "1";

  const cityTrimmed = (rawCity || "").trim();
  // Extract postcode if at beginning of city string (e.g. "10437 Berlin" -> "10437", "Berlin")
  const cityMatch = cityTrimmed.match(/^(\d{4,5})?\s*(.*)$/);
  const postcode = cityMatch && cityMatch[1] ? cityMatch[1].trim() : "10437";
  const cityName = cityMatch && cityMatch[2] && cityMatch[2].trim() ? cityMatch[2].trim() : "Berlin";

  return {
    street: streetName || "Daycare Street",
    houseNumber: houseNumber || "1",
    postcode: postcode || "10437",
    city: cityName || "Berlin",
  };
}

export function PinLocationCard() {
  const { t } = useLanguage();
  const { profile, updateProfile } = useCaretaker();

  const [street, setStreet] = useState(profile.street || "");
  const [city, setCity] = useState(profile.city || "");
  const [lat, setLat] = useState(profile.lat || "");
  const [lng, setLng] = useState(profile.lng || "");

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasValidated, setHasValidated] = useState(
    Boolean(profile.isLocationPinned && profile.lat && profile.lng)
  );
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with CaretakerContext
  useEffect(() => {
    setStreet(profile.street || "");
    setCity(profile.city || "");
    setLat(profile.lat || "");
    setLng(profile.lng || "");
    setHasValidated(Boolean(profile.isLocationPinned && profile.lat && profile.lng));
  }, [profile.street, profile.city, profile.lat, profile.lng, profile.isLocationPinned]);

  // Fetch saved location from MongoDB on initial mount
  useEffect(() => {
    const token = caretakerApi.getToken();
    if (!token) return;

    caretakerApi
      .getDaycare()
      .then((data) => {
        if (data.location) {
          const loc = data.location;
          if (loc.latitude && loc.longitude) {
            const loadedLat = String(loc.latitude);
            const loadedLng = String(loc.longitude);
            setLat(loadedLat);
            setLng(loadedLng);
            setHasValidated(true);

            const loadedStreet = loc.houseNumber ? `${loc.street} ${loc.houseNumber}` : loc.street;
            const loadedCity = loc.postcode ? `${loc.postcode} ${loc.city}` : loc.city;

            if (loadedStreet) setStreet(loadedStreet);
            if (loadedCity) setCity(loadedCity);

            updateProfile({
              street: loadedStreet || profile.street,
              city: loadedCity || profile.city,
              lat: loadedLat,
              lng: loadedLng,
              isLocationPinned: true,
            });
          }
        }
      })
      .catch(() => {
        // No existing daycare found yet; local draft coordinates remain active
      });
  }, []);

  // Helper to persist location coordinates to MongoDB
  const persistLocationToDb = async (
    targetLat: number,
    targetLng: number,
    targetStreet: string,
    targetCity: string
  ) => {
    const token = caretakerApi.getToken();
    if (!token) return;

    try {
      setIsSaving(true);
      const parsed = parseAddressComponents(targetStreet, targetCity);

      const formData = new FormData();
      formData.append(
        "location",
        JSON.stringify({
          latitude: targetLat,
          longitude: targetLng,
          street: parsed.street,
          houseNumber: parsed.houseNumber,
          postcode: parsed.postcode,
          city: parsed.city,
        })
      );

      await caretakerApi.updateDaycare(formData);
    } catch {
      // If daycare is not yet created, values are staged in CaretakerContext and saved upon full profile creation
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 1. SELECTING PIN ON MAP -> SHOW IN FIELD (Reverse Geocoding)
  // =========================================================================
  const handleMapLocationChange = async (newLat: number, newLng: number) => {
    const latStr = String(newLat);
    const lngStr = String(newLng);
    setLat(latStr);
    setLng(lngStr);
    setHasValidated(true);
    setIsReverseGeocoding(true);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

    try {
      let resolvedStreet = "";
      let resolvedCity = "";

      // Try Mapbox Reverse Geocoding first
      if (mapboxToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${newLng},${newLat}.json?access_token=${mapboxToken}&language=de,en&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const streetPart = feature.text || "";
          const housePart = feature.address ? ` ${feature.address}` : "";
          resolvedStreet = `${streetPart}${housePart}`.trim();

          // Context gives postcode and city
          const postcodeObj = feature.context?.find((c: any) => c.id.startsWith("postcode"));
          const placeObj = feature.context?.find((c: any) => c.id.startsWith("place") || c.id.startsWith("locality"));
          const postcode = postcodeObj?.text || "";
          const cityName = placeObj?.text || "Berlin";
          resolvedCity = `${postcode} ${cityName}`.trim();
        }
      }

      // Fallback to OpenStreetMap Nominatim Reverse Geocoding
      if (!resolvedStreet && !resolvedCity) {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&addressdetails=1`;
        const res = await fetch(osmUrl, {
          headers: { "Accept-Language": "de,en" },
        });
        const data = await res.json();

        if (data && data.address) {
          const a = data.address;
          const road = a.road || a.street || a.pedestrian || a.suburb || "";
          const houseNo = a.house_number ? ` ${a.house_number}` : "";
          resolvedStreet = `${road}${houseNo}`.trim();

          const postCode = a.postcode || "";
          const cityPlace = a.city || a.town || a.village || a.county || "Berlin";
          resolvedCity = `${postCode} ${cityPlace}`.trim();
        }
      }

      // Update input fields if address resolved
      const finalStreet = resolvedStreet || street;
      const finalCity = resolvedCity || city;

      if (resolvedStreet) setStreet(finalStreet);
      if (resolvedCity) setCity(finalCity);

      setStatusMessage({
        type: "success",
        text: `Pin placed: ${finalStreet}, ${finalCity}`,
      });

      updateProfile({
        street: finalStreet,
        city: finalCity,
        lat: latStr,
        lng: lngStr,
        isLocationPinned: true,
      });

      await persistLocationToDb(newLat, newLng, finalStreet, finalCity);
    } catch {
      setStatusMessage({
        type: "success",
        text: `Coordinates updated: Lat ${newLat.toFixed(4)}, Lng ${newLng.toFixed(4)}`,
      });

      updateProfile({
        lat: latStr,
        lng: lngStr,
        isLocationPinned: true,
      });

      await persistLocationToDb(newLat, newLng, street, city);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // =========================================================================
  // 2. SEARCH / FIELD INPUT -> SHOW IN MAP (Forward Geocoding)
  // =========================================================================
  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLookingUp(true);
    setStatusMessage(null);

    const fullQuery = [street, city].filter(Boolean).join(", ");
    if (!fullQuery.trim()) {
      setIsLookingUp(false);
      return;
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();

    try {
      let foundLat: number | null = null;
      let foundLng: number | null = null;
      let formattedPlace = "";

      // 1. Try Mapbox Forward Geocoding
      if (mapboxToken) {
        const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullQuery
        )}.json?access_token=${mapboxToken}&language=de,en&limit=1`;
        const res = await fetch(mbUrl);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          foundLng = parseFloat(feature.center[0].toFixed(6));
          foundLat = parseFloat(feature.center[1].toFixed(6));
          formattedPlace = feature.place_name || "";
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim
      if (foundLat === null || foundLng === null) {
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          fullQuery
        )}&limit=1`;
        const res = await fetch(osmUrl, {
          headers: { "Accept-Language": "de,en" },
        });
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          foundLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          foundLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
          formattedPlace = data[0].display_name || "";
        }
      }

      if (foundLat !== null && foundLng !== null) {
        const latStr = String(foundLat);
        const lngStr = String(foundLng);

        setLat(latStr);
        setLng(lngStr);
        setHasValidated(true);
        setStatusMessage({
          type: "success",
          text: `Found & pinned: Lat ${foundLat.toFixed(4)}, Lng ${foundLng.toFixed(4)}`,
        });

        updateProfile({
          street,
          city,
          lat: latStr,
          lng: lngStr,
          isLocationPinned: true,
        });

        await persistLocationToDb(foundLat, foundLng, street, city);
      } else {
        setStatusMessage({
          type: "error",
          text: "Address not found. Please check spelling or drag the map pin to your location.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Could not reach address search service. Please position the pin manually on the map.",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStreet(val);
    updateProfile({ street: val });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCity(val);
    updateProfile({ city: val });
  };

  const parsedLat = parseFloat(lat) || 0;
  const parsedLng = parseFloat(lng) || 0;

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================================ */}
        {/* Left Column: Form Inputs & Address Controls                  */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header with Green Bar */}
          <div className="flex items-start gap-3">
            <div className="w-1 h-7 bg-[#15803D] rounded-full shrink-0 mt-0.5" />
            <div>
              <h2
                className="text-[20px] sm:text-[22px] font-bold text-[#1E1B18] tracking-tight leading-tight"
                style={{ fontFamily: "var(--font-plus-jakarta)" }}
              >
                {t.caretakerProfile.location.title}
              </h2>
              <p className="text-[14px] text-[#7A6E62] mt-1.5 leading-relaxed">
                {t.caretakerProfile.location.subtitle}
              </p>
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-[13px] font-medium flex items-center gap-2 border transition-all ${
                statusMessage.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              {statusMessage.type === "success" ? (
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* Reverse Geocoding Detection Indicator */}
          {isReverseGeocoding && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[13px] flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Updating address fields from map pin...</span>
            </div>
          )}

          {/* Address Form */}
          <form onSubmit={handleLookup} className="space-y-4 pt-1">
            {/* Street & House Number */}
            <div>
              <label
                htmlFor="location-street"
                className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5"
              >
                {t.caretakerProfile.location.streetLabel}
              </label>
              <div className="relative">
                <input
                  id="location-street"
                  type="text"
                  value={street}
                  onChange={handleStreetChange}
                  placeholder={t.caretakerProfile.location.streetPlaceholder}
                  className="w-full h-[48px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#A89E90] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>
            </div>

            {/* Postcode & City */}
            <div>
              <label
                htmlFor="location-city"
                className="block text-[13px] font-semibold text-[#4B3E2F] mb-1.5"
              >
                {t.caretakerProfile.location.postcodeCityLabel}
              </label>
              <div className="relative">
                <input
                  id="location-city"
                  type="text"
                  value={city}
                  onChange={handleCityChange}
                  placeholder={t.caretakerProfile.location.postcodeCityPlaceholder}
                  className="w-full h-[48px] px-4 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5]/60 text-[15px] text-[#1E1B18] placeholder:text-[#A89E90] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all"
                />
              </div>
            </div>

            {/* Look up & Sync CTA Button */}
            <button
              type="submit"
              disabled={isLookingUp || isSaving}
              className="w-full h-[48px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white font-semibold text-[15px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5 disabled:opacity-75"
              style={{ fontFamily: "var(--font-plus-jakarta)" }}
            >
              {isLookingUp || isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Searching & Updating Map...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{t.caretakerProfile.location.lookupButton}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Tip for Caretaker */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5DDD2] flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[#7A6E62] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[12px] text-[#7A6E62] leading-snug">
              Tip: You can either search by typing your street & city above, or drag the green pin directly on the map. Both automatically stay in sync and save to your profile.
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Right Column: Interactive Leaflet Map Preview                */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 relative h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-[#E5DDD2] bg-[#E9E7E2] shadow-inner">
          {/* Real Leaflet Map */}
          <LocationPickerMap
            lat={parsedLat}
            lng={parsedLng}
            street={street}
            city={city}
            onLocationChange={handleMapLocationChange}
            className="w-full h-full"
          />

          {/* Top Pill Overlay: Lat/Lng Validated */}
          <div className="absolute top-4 left-4 z-1000 flex items-center gap-2 bg-[#1E1B18]/90 backdrop-blur-md text-white text-[12px] font-mono font-medium px-3.5 py-1.5 rounded-full shadow-md border border-white/10 pointer-events-none">
            <svg className="w-3.5 h-3.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {parsedLat !== 0 && parsedLng !== 0 ? (
              <span>Lat {parsedLat.toFixed(4)} · Lng {parsedLng.toFixed(4)}</span>
            ) : (
              <span className="font-sans text-[11px] text-[#D1D5DB]">Location not set</span>
            )}
            <span className={`w-1.5 h-1.5 rounded-full ${hasValidated ? "bg-[#22C55E]" : "bg-[#F59E0B]"}`} />
            <span className="text-[#86EFAC] font-sans text-[11px] font-semibold">
              {hasValidated ? t.caretakerProfile.location.validatedBadge : "Set Pin"}
            </span>
          </div>

          {/* Bottom Tooltip Card */}
          <div className="absolute bottom-4 left-4 right-4 z-1000 bg-white/95 backdrop-blur-sm border border-[#E5DDD2] rounded-xl px-3.5 py-2.5 shadow-md flex items-start gap-2.5 pointer-events-none">
            <svg className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[12px] text-[#5C5043] leading-snug">
              {t.caretakerProfile.location.dragTooltip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
