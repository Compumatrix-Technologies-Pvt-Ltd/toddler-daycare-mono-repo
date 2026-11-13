"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "../../i18n/LanguageContext";
import { useCaretaker } from "../../context/CaretakerContext";
import { caretakerApi } from "@/utils/caretakerApi";
import {
  formatPostcodeCity,
  formatStreetDisplay,
  parseAddressComponents,
  parseNominatimAddress,
  classifyAreaFromOsm,
  detectAreaTypeFromLocation,
  type AreaClassificationResult,
} from "../map/mapUtils";

// Dynamically import Leaflet Map to ensure zero SSR / "window is not defined" issues
function LocationMapFallback() {
  const { t } = useLanguage();
  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#FAF8F5] text-[#7A6E62] text-[13px] font-medium">
      <svg className="animate-spin h-5 w-5 text-[#15803D] mr-2.5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span>{t.caretakerProfile.location.mapLoading || "Loading Leaflet Map..."}</span>
    </div>
  );
}

const LocationPickerMap = dynamic(
  () => import("../map/LocationPickerMap"),
  {
    ssr: false,
    loading: () => <LocationMapFallback />,
  }
);

export function PinLocationCard() {
  const { t } = useLanguage();
  const { profile, updateProfile, syncFromBackendDaycare } = useCaretaker();

  const [street, setStreet] = useState(profile.street || "");
  const [city, setCity] = useState(profile.city || "");
  const [lat, setLat] = useState(profile.lat || "");
  const [lng, setLng] = useState(profile.lng || "");

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialPinned = Boolean(profile.isLocationPinned && profile.lat && profile.lng);
  const [hasValidated, setHasValidated] = useState(initialPinned);
  const [hasSavedLocation, setHasSavedLocation] = useState(initialPinned);
  const [isEditingLocation, setIsEditingLocation] = useState(!initialPinned);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [areaClassification, setAreaClassification] = useState<AreaClassificationResult | null>(() => {
    if (profile.street || profile.city) {
      return detectAreaTypeFromLocation({
        street: profile.street,
        city: profile.city,
      });
    }
    return null;
  });

  const savedSnapshotRef = useRef<{ street: string; city: string; lat: string; lng: string } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with CaretakerContext (only when not actively editing a saved location)
  useEffect(() => {
    if (hasSavedLocation && isEditingLocation) return;
    setStreet(profile.street || "");
    setCity(profile.city || "");
    setLat(profile.lat || "");
    setLng(profile.lng || "");
    setHasValidated(Boolean(profile.isLocationPinned && profile.lat && profile.lng));
  }, [profile.street, profile.city, profile.lat, profile.lng, profile.isLocationPinned, hasSavedLocation, isEditingLocation]);

  // Lock location map whenever the full profile form is saved
  useEffect(() => {
    const handleProfileSaved = () => {
      setHasSavedLocation(true);
      setIsEditingLocation(false);
      savedSnapshotRef.current = {
        street: profile.street || street,
        city: profile.city || city,
        lat: profile.lat || lat,
        lng: profile.lng || lng,
      };
    };
    window.addEventListener("daycare-profile-saved", handleProfileSaved);
    return () => window.removeEventListener("daycare-profile-saved", handleProfileSaved);
  }, [profile.street, profile.city, profile.lat, profile.lng, street, city, lat, lng]);

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

            const loadedStreet = formatStreetDisplay(loc.street, loc.houseNumber);
            const loadedCity = formatPostcodeCity(loc.postcode, loc.city);

            if (loadedStreet) setStreet(loadedStreet);
            if (loadedCity) setCity(loadedCity);

            const area = detectAreaTypeFromLocation({
              street: loc.street,
              city: loc.city,
              postcode: loc.postcode,
              areaType: loc.areaType,
              catchmentRadiusKm: loc.catchmentRadiusKm,
            });
            setAreaClassification(area);

            savedSnapshotRef.current = {
              street: loadedStreet || profile.street || "",
              city: loadedCity || profile.city || "",
              lat: loadedLat,
              lng: loadedLng,
            };
            setHasSavedLocation(true);
            setIsEditingLocation(false);

            updateProfile({
              street: loadedStreet || profile.street,
              city: loadedCity || profile.city,
              lat: loadedLat,
              lng: loadedLng,
              areaType: area.areaType,
              catchmentRadiusKm: area.catchmentRadiusKm,
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
  ): Promise<boolean> => {
    const token = caretakerApi.getToken();
    if (!token) return false;

    try {
      setIsSaving(true);
      const parsed = parseAddressComponents(targetStreet, targetCity);
      const currentArea = areaClassification || detectAreaTypeFromLocation({
        street: targetStreet,
        city: targetCity,
      });

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
          areaType: currentArea.areaType,
          catchmentRadiusKm: currentArea.catchmentRadiusKm,
        })
      );

      const updated = await caretakerApi.updateDaycare(formData);
      if (updated) {
        const savedDoc = updated?.data || updated;
        syncFromBackendDaycare(savedDoc);
        savedSnapshotRef.current = {
          street: targetStreet,
          city: targetCity,
          lat: String(targetLat),
          lng: String(targetLng),
        };
        setHasSavedLocation(true);
        setIsEditingLocation(false);
        return true;
      }
      return false;
    } catch {
      // If daycare is not yet created, values are staged in CaretakerContext and saved upon full profile creation
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // 1. SELECTING PIN ON MAP -> SHOW IN FIELD (Reverse Geocoding)
  // =========================================================================
  const handleMapLocationChange = async (
    newLat: number,
    newLng: number,
    addressHint?: string
  ) => {
    if (hasSavedLocation && !isEditingLocation) return;
    const latStr = String(newLat);
    const lngStr = String(newLng);
    setLat(latStr);
    setLng(lngStr);
    setHasValidated(true);
    setIsReverseGeocoding(true);

    const rawMapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
    const mapboxToken = rawMapboxToken?.startsWith("pk.") ? rawMapboxToken : undefined;

    try {
      let resolvedStreet = "";
      let resolvedCity = "";

      // Try Mapbox Reverse Geocoding first (including POIs, buildings, hospitals, landmarks)
      if (mapboxToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${newLng},${newLat}.json?access_token=${mapboxToken}&types=poi,address,neighborhood,locality,place&language=de,en&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const isPoi = Array.isArray(feature.place_type) && feature.place_type.includes("poi");
          if (isPoi) {
            const poiTitle = feature.text || "";
            const poiStreet = feature.properties?.address || "";
            resolvedStreet = [poiTitle, poiStreet].filter(Boolean).join(", ").trim();
          } else {
            const streetPart = feature.text || "";
            const housePart = feature.address ? ` ${feature.address}` : "";
            resolvedStreet = `${streetPart}${housePart}`.trim();
          }

          // Context gives postcode and city
          const postcodeObj = feature.context?.find((c: any) => c.id.startsWith("postcode"));
          const placeObj = feature.context?.find((c: any) => c.id.startsWith("place") || c.id.startsWith("locality"));
          const postcode = postcodeObj?.text || "";
          const cityName = placeObj?.text || "";
          resolvedCity = formatPostcodeCity(postcode, cityName);
        }
      }

      // Fallback to OpenStreetMap Nominatim Reverse Geocoding (zoom=18 resolves buildings/hospitals/POIs)
      let resolvedArea: AreaClassificationResult | null = null;
      if (!resolvedStreet || !resolvedCity) {
        const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1&namedetails=1`;
        const res = await fetch(osmUrl, {
          headers: { "Accept-Language": "de,en" },
        });
        const data = await res.json();

        const parsedOsm = parseNominatimAddress(data);
        if (!resolvedStreet && parsedOsm.streetLabel) {
          resolvedStreet = parsedOsm.streetLabel;
        }
        if (!resolvedCity && parsedOsm.cityLabel) {
          resolvedCity = parsedOsm.cityLabel;
        }
        resolvedArea = classifyAreaFromOsm(data);
        setAreaClassification(resolvedArea);
      }

      if (!resolvedStreet && addressHint) {
        resolvedStreet = addressHint.split(",").slice(0, 2).map((s) => s.trim()).join(", ");
      }

      // Update input fields if address resolved
      const finalStreet = resolvedStreet || street;
      const finalCity = resolvedCity || city;

      if (!resolvedArea) {
        resolvedArea = detectAreaTypeFromLocation({
          street: finalStreet,
          city: finalCity,
        });
        setAreaClassification(resolvedArea);
      }

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
        areaType: resolvedArea.areaType,
        catchmentRadiusKm: resolvedArea.catchmentRadiusKm,
        isLocationPinned: true,
      });

      if (!hasSavedLocation) {
        await persistLocationToDb(newLat, newLng, finalStreet, finalCity);
      }
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

      if (!hasSavedLocation) {
        await persistLocationToDb(newLat, newLng, street, city);
      }
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

    const rawMapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
    const mapboxToken = rawMapboxToken?.startsWith("pk.") ? rawMapboxToken : undefined;

    try {
      let foundLat: number | null = null;
      let foundLng: number | null = null;
      let formattedPlace = "";
      let resolvedLookupArea = areaClassification;

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

      // 2. Fallback to OpenStreetMap Nominatim (includes buildings, hospitals, landmarks, POIs)
      if (foundLat === null || foundLng === null) {
        const osmUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          fullQuery
        )}&addressdetails=1&namedetails=1&limit=1`;
        const res = await fetch(osmUrl, {
          headers: { "Accept-Language": "de,en" },
        });
        const data = await res.json();

        resolvedLookupArea = areaClassification;
        if (Array.isArray(data) && data.length > 0) {
          foundLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          foundLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
          formattedPlace = data[0].display_name || "";
          resolvedLookupArea = classifyAreaFromOsm(data[0]);
          setAreaClassification(resolvedLookupArea);
        }
      }

      if (foundLat !== null && foundLng !== null) {
        if (!resolvedLookupArea) {
          resolvedLookupArea = detectAreaTypeFromLocation({ street, city });
          setAreaClassification(resolvedLookupArea);
        }
        const latStr = String(foundLat);
        const lngStr = String(foundLng);

        setLat(latStr);
        setLng(lngStr);
        setHasValidated(true);
        setStatusMessage({
          type: "success",
          text: formattedPlace
            ? `Found & pinned: ${formattedPlace}`
            : `Found & pinned: Lat ${foundLat.toFixed(4)}, Lng ${foundLng.toFixed(4)}`,
        });

        updateProfile({
          street,
          city,
          lat: latStr,
          lng: lngStr,
          areaType: resolvedLookupArea.areaType,
          catchmentRadiusKm: resolvedLookupArea.catchmentRadiusKm,
          isLocationPinned: true,
        });

        if (!hasSavedLocation) {
          await persistLocationToDb(foundLat, foundLng, street, city);
        }
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

  const handleStartChangeLocation = () => {
    savedSnapshotRef.current = { street, city, lat, lng };
    setStatusMessage(null);
    setIsEditingLocation(true);
  };

  const handleCancelChangeLocation = () => {
    const snap = savedSnapshotRef.current;
    if (snap) {
      setStreet(snap.street);
      setCity(snap.city);
      setLat(snap.lat);
      setLng(snap.lng);
      updateProfile({
        street: snap.street,
        city: snap.city,
        lat: snap.lat,
        lng: snap.lng,
        isLocationPinned: Boolean(snap.lat && snap.lng),
      });
    }
    setStatusMessage(null);
    setIsEditingLocation(false);
  };

  const handleSaveChangedLocation = async () => {
    const nextLat = parseFloat(lat);
    const nextLng = parseFloat(lng);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng) || nextLat === 0 || nextLng === 0) {
      setStatusMessage({
        type: "error",
        text: "Please pin a valid location on the map before saving.",
      });
      return;
    }
    const saved = await persistLocationToDb(nextLat, nextLng, street, city);
    if (saved) {
      setStatusMessage({
        type: "success",
        text: t.caretakerProfile.location.reviewNotice,
      });
    }
  };

  const parsedLat = parseFloat(lat) || 0;
  const parsedLng = parseFloat(lng) || 0;
  const isLocked = hasSavedLocation && !isEditingLocation;

  return (
    <div className="bg-white rounded-[24px] border border-[#E5DDD2] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-4 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
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
              <span>{t.caretakerProfile.location.updatingFromPin || "Updating address fields from map pin..."}</span>
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
                  disabled={isLocked}
                  onChange={handleStreetChange}
                  placeholder={t.caretakerProfile.location.streetPlaceholder}
                  className={`w-full h-[48px] px-4 rounded-xl border border-[#E5DDD2] text-[15px] text-[#1E1B18] placeholder:text-[#A89E90] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all ${
                    isLocked ? "bg-[#F3EFE8] opacity-80 cursor-not-allowed" : "bg-[#FAF8F5]/60"
                  }`}
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
                  disabled={isLocked}
                  onChange={handleCityChange}
                  placeholder={t.caretakerProfile.location.postcodeCityPlaceholder}
                  className={`w-full h-[48px] px-4 rounded-xl border border-[#E5DDD2] text-[15px] text-[#1E1B18] placeholder:text-[#A89E90] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-all ${
                    isLocked ? "bg-[#F3EFE8] opacity-80 cursor-not-allowed" : "bg-[#FAF8F5]/60"
                  }`}
                />
              </div>
            </div>

            {/* OpenStreetMap Area Classification */}
            {areaClassification && (
              <div className="p-3.5 rounded-xl border border-[#E5DDD2] bg-[#FAF8F5] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      areaClassification.areaType === "rural"
                        ? "bg-[#FEF3C7] text-[#92400E]"
                        : "bg-[#DCFCE7] text-[#166534]"
                    }`}
                  >
                    {areaClassification.areaType === "rural" ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18l-4 5h8l-4-5zm0 5l-6 6h12l-6-6zm0 6l-7 7h14l-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#1E1B18] flex items-center gap-2 flex-wrap">
                      <span>
                        {areaClassification.areaType === "rural"
                          ? t.caretakerProfile.location.ruralDetected.replace("{radius}", String(areaClassification.catchmentRadiusKm))
                          : t.caretakerProfile.location.urbanDetected.replace("{radius}", String(areaClassification.catchmentRadiusKm))}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#E5DDD2] text-[#7A6E62]">
                        OSM
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A6E62] mt-0.5 truncate">
                      {t.caretakerProfile.location.osmNotice}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Fixed -> Change Location | Editing -> Lookup + Save for Review / Cancel */}
            {isLocked ? (
              <button
                type="button"
                onClick={handleStartChangeLocation}
                className="w-full h-[48px] rounded-xl border-2 border-[#A12D3A] bg-white hover:bg-[#FAF7F2] active:scale-[0.99] text-[#A12D3A] font-semibold text-[15px] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{ fontFamily: "var(--font-plus-jakarta)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>{t.caretakerProfile.location.changeButton}</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={isLookingUp || isSaving}
                  className="w-full h-[48px] rounded-xl bg-[#A12D3A] hover:bg-[#88222E] active:scale-[0.99] text-white font-semibold text-[15px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer pt-0.5 disabled:opacity-75"
                  style={{ fontFamily: "var(--font-plus-jakarta)" }}
                >
                  {isLookingUp ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>{t.caretakerProfile.location.searchingMap || "Searching & Updating Map..."}</span>
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

                {hasSavedLocation && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleSaveChangedLocation}
                      disabled={isSaving || isLookingUp}
                      className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-semibold text-[14px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {isSaving ? (
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span>{t.caretakerProfile.location.saveLocationButton}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelChangeLocation}
                      disabled={isSaving}
                      className="sm:w-auto min-h-[46px] px-4 rounded-xl border border-[#D5C9B8] bg-white hover:bg-[#FAF7F2] text-[#4B3E2F] font-semibold text-[14px] transition-all cursor-pointer"
                    >
                      {t.caretakerProfile.location.cancelChangeButton}
                    </button>
                  </div>
                )}
              </div>
            )}
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
        <div className="lg:col-span-7 relative isolate h-[280px] sm:h-[380px] lg:h-[420px] rounded-2xl overflow-hidden border border-[#E5DDD2] bg-[#E9E7E2] shadow-inner">
          {/* Real Leaflet Map */}
          <LocationPickerMap
            lat={parsedLat}
            lng={parsedLng}
            street={street}
            city={city}
            locked={isLocked}
            onLocationChange={handleMapLocationChange}
            className="w-full h-full"
          />

          {/* Top Pill Overlay: Lat/Lng Validated / Fixed */}
          <div className="absolute top-3.5 left-14 z-1000 flex items-center gap-2 max-w-[calc(100%-8.5rem)] bg-[#1E1B18]/90 backdrop-blur-md text-white text-[11px] sm:text-[12px] font-mono font-medium px-3 sm:px-3.5 py-1.5 rounded-full shadow-md border border-white/10 pointer-events-none truncate">
            <svg className="w-3.5 h-3.5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {parsedLat !== 0 && parsedLng !== 0 ? (
              <span>Lat {parsedLat.toFixed(4)} · Lng {parsedLng.toFixed(4)}</span>
            ) : (
              <span className="font-sans text-[11px] text-[#D1D5DB]">{t.caretakerProfile.location.notSet || "Location not set"}</span>
            )}
            <span className={`w-1.5 h-1.5 rounded-full ${hasValidated ? "bg-[#22C55E]" : "bg-[#F59E0B]"}`} />
            <span className="text-[#86EFAC] font-sans text-[11px] font-semibold">
              {isLocked
                ? t.caretakerProfile.location.lockedBadge
                : hasValidated
                  ? t.caretakerProfile.location.validatedBadge
                  : t.caretakerProfile.location.setPin || "Set Pin"}
            </span>
          </div>

          {/* Bottom Tooltip Card */}
          <div className="absolute bottom-4 left-4 right-4 z-1000 bg-white/95 backdrop-blur-sm border border-[#E5DDD2] rounded-xl px-3.5 py-2.5 shadow-md flex items-start gap-2.5 pointer-events-none">
            <svg className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-[12px] text-[#5C5043] leading-snug">
              {isLocked ? t.caretakerProfile.location.lockedTooltip : t.caretakerProfile.location.dragTooltip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
