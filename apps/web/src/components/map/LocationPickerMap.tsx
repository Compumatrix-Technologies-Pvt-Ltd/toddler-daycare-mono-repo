"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { safeMoveMap } from "./mapUtils";

interface LocationPickerMapProps {
  lat?: number;
  lng?: number;
  street?: string;
  city?: string;
  locked?: boolean;
  onLocationChange: (lat: number, lng: number, addressHint?: string) => void;
  className?: string;
}

export default function LocationPickerMap({
  lat,
  lng,
  street,
  city,
  locked = false,
  onLocationChange,
  className = "w-full h-full min-h-[300px]",
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isInternalMoveRef = useRef(false);
  const lockedRef = useRef(locked);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const [isLocating, setIsLocating] = useState(false);
  const [locateNotice, setLocateNotice] = useState<string | null>(null);

  // Custom Green Pin Icon matching Figma design (#16A34A circle with white dot + label)
  const createPinIcon = (label: string) => {
    return L.divIcon({
      className: "custom-leaflet-pin",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            background-color: #16A34A;
            border: 3.5px solid #FFFFFF;
            box-shadow: 0 4px 12px rgba(22, 163, 74, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s ease;
          ">
            <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: #FFFFFF;"></div>
          </div>
          <div style="
            margin-top: 3px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(4px);
            border: 1px solid #E5DDD2;
            padding: 2px 8px;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
            font-size: 11px;
            font-weight: 700;
            color: #1E1B18;
            white-space: nowrap;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            pointer-events: none;
          ">
            ${label || "My Daycare"}
          </div>
        </div>
      `,
    });
  };

  // Redirect to GPS current location function
  const goToCurrentLocation = (isAuto = false) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      if (!isAuto) {
        setLocateNotice("Geolocation is not supported by your browser");
        setTimeout(() => setLocateNotice(null), 3500);
      }
      return;
    }

    setIsLocating(true);
    setLocateNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        if (lockedRef.current) return;
        const currentLat = parseFloat(position.coords.latitude.toFixed(6));
        const currentLng = parseFloat(position.coords.longitude.toFixed(6));

        isInternalMoveRef.current = true;
        if (markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
          markerRef.current.setIcon(createPinIcon(street || city || "Current Location"));
        }
        if (mapInstanceRef.current) {
          safeMoveMap(mapInstanceRef.current, [currentLat, currentLng], 15, 1.2);
        }
        onLocationChangeRef.current(currentLat, currentLng);
      },
      (error) => {
        setIsLocating(false);
        if (!isAuto) {
          const msg =
            error.code === error.PERMISSION_DENIED
              ? "Location permission denied. Please allow location access in your browser."
              : "Unable to detect your current location.";
          setLocateNotice(msg);
          setTimeout(() => setLocateNotice(null), 4000);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Setup Leaflet map instance with OpenStreetMap tiles
  const setupMap = (
    container: HTMLElement,
    center: [number, number] = [0, 0],
    zoom = 2
  ): L.Map => {
    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: "center",
    }).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    return map;
  };

  // Load leaflet-control-geocoder script/CSS once on the client and attach search control
  const attachGeocoderControl = (
    map: L.Map,
    marker: L.Marker,
    onSelect: (lat: number, lng: number, addressHint?: string) => void
  ): (() => void) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return () => {};
    }

    (window as unknown as { L?: typeof L }).L = L;

    let cancelled = false;

    const addControl = () => {
      if (cancelled) return;
      const LeafletControl = (
        window as unknown as { L?: { Control?: { geocoder?: (opts: Record<string, unknown>) => L.Control } } }
      ).L?.Control;

      const mapWithInternals = map as unknown as {
        _hasGeocoderControl?: boolean;
        _controlCorners?: Record<string, HTMLElement>;
      };

      if (
        !LeafletControl?.geocoder ||
        mapInstanceRef.current !== map ||
        !mapWithInternals._controlCorners ||
        mapWithInternals._hasGeocoderControl
      ) {
        return;
      }

      mapWithInternals._hasGeocoderControl = true;

      const geocoder = LeafletControl.geocoder({
        defaultMarkGeocode: false,
        position: "topleft",
      });

      (geocoder as unknown as L.Evented).on("markgeocode", (e: unknown) => {
        if (lockedRef.current) return;
        const event = e as { geocode?: { name?: string; center?: { lat: number; lng: number } } };
        const center = event.geocode?.center;
        if (!center) return;

        const nextLat = parseFloat(center.lat.toFixed(6));
        const nextLng = parseFloat(center.lng.toFixed(6));
        marker.setLatLng([nextLat, nextLng]);
        safeMoveMap(map, [nextLat, nextLng], 15, 0.8);
        isInternalMoveRef.current = true;
        onSelect(nextLat, nextLng, event.geocode?.name);
      });

      geocoder.addTo(map);
    };

    const cssId = "leaflet-control-geocoder-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css";
      document.head.appendChild(link);
    }

    const windowLeaflet = (window as unknown as { L?: { Control?: { geocoder?: unknown } } }).L;
    const leafletWithControl = L as unknown as { Control?: { geocoder?: unknown } };
    if (windowLeaflet?.Control?.geocoder || leafletWithControl.Control?.geocoder) {
      addControl();
      return () => {
        cancelled = true;
      };
    }

    const scriptId = "leaflet-control-geocoder-js";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", addControl, { once: true });
      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", addControl);
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js";
    script.async = true;
    script.addEventListener("load", addControl, { once: true });
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", addControl);
    };
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized on this container
    if (!mapInstanceRef.current) {
      const hasValidCoords =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat !== 0 &&
        lng !== 0;

      const initialLat = hasValidCoords ? (lat as number) : 0;
      const initialLng = hasValidCoords ? (lng as number) : 0;
      const initialZoom = hasValidCoords ? 14 : 2;

      const map = setupMap(mapContainerRef.current, [initialLat, initialLng], initialZoom);

      // Create marker (draggable only when not locked)
      const marker = L.marker([initialLat, initialLng], {
        draggable: !lockedRef.current,
        icon: createPinIcon(street || city || "Daycare Pin"),
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      const cleanupGeocoder = attachGeocoderControl(map, marker, (nextLat, nextLng, addressHint) => {
        onLocationChangeRef.current(nextLat, nextLng, addressHint);
      });

      // On Marker Drag
      marker.on("dragend", () => {
        if (lockedRef.current) return;
        const position = marker.getLatLng();
        isInternalMoveRef.current = true;
        onLocationChangeRef.current(
          parseFloat(position.lat.toFixed(6)),
          parseFloat(position.lng.toFixed(6))
        );
      });

      // On Map Click - move pin to clicked location
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (lockedRef.current) return;
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        isInternalMoveRef.current = true;
        onLocationChangeRef.current(
          parseFloat(clickLat.toFixed(6)),
          parseFloat(clickLng.toFixed(6))
        );
      });

      // For new registration (no coordinates saved yet): automatically request current location
      if (!hasValidCoords && !lockedRef.current) {
        goToCurrentLocation(true);
      }

      // Safely invalidate size after layout mounts
      const resizeTimer = setTimeout(() => {
        if (
          mapInstanceRef.current &&
          mapContainerRef.current &&
          (mapContainerRef.current as any)._leaflet_id
        ) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {
            // Container unmounted
          }
        }
      }, 250);

      return () => {
        cleanupGeocoder();
        clearTimeout(resizeTimer);
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {
            // Cleanup
          }
          mapInstanceRef.current = null;
          markerRef.current = null;
        }
      };
    }
  }, []);

  // Sync locked state with map view, marker dragging, zoom & geocoder controls
  useEffect(() => {
    lockedRef.current = locked;
    const map = mapInstanceRef.current;
    if (map) {
      if (locked) {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.touchZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
      } else {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
        map.doubleClickZoom.enable();
        map.touchZoom.enable();
        map.boxZoom.enable();
        map.keyboard.enable();
      }
    }
    if (markerRef.current) {
      if (locked) {
        markerRef.current.dragging?.disable();
      } else {
        markerRef.current.dragging?.enable();
      }
    }
    if (mapContainerRef.current) {
      const geocoderEl = mapContainerRef.current.querySelector(
        ".leaflet-control-geocoder"
      ) as HTMLElement | null;
      if (geocoderEl) {
        geocoderEl.style.display = locked ? "none" : "";
      }
      const zoomEl = mapContainerRef.current.querySelector(
        ".leaflet-control-zoom"
      ) as HTMLElement | null;
      if (zoomEl) {
        zoomEl.style.display = locked ? "none" : "";
      }
    }
  }, [locked]);

  // Update marker position and map center when props change from external updates (e.g. Geocoding)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
      return;
    }

    const validLat = lat as number;
    const validLng = lng as number;

    // Keep pin label in sync with current street/city
    markerRef.current.setIcon(createPinIcon(street || city || "Daycare Pin"));

    // If change came from internal pin drag/click, do not re-pan map
    if (isInternalMoveRef.current) {
      isInternalMoveRef.current = false;
      return;
    }

    // External change (e.g. searching address) -> update marker coordinate and fly map
    markerRef.current.setLatLng([validLat, validLng]);
    safeMoveMap(mapInstanceRef.current, [validLat, validLng], 15, 0.8);
  }, [lat, lng, street, city]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* GPS Location Control Icon (hidden when location is fixed/locked) */}
      {!locked && (
      <div className="absolute top-3.5 right-3.5 z-[1000] flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => goToCurrentLocation(false)}
          disabled={isLocating}
          title="Current GPS Location"
          aria-label="Current GPS Location"
          className="w-11 h-11 rounded-full bg-white hover:bg-[#F9F7F4] active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.15)] border border-[#E5DDD2] text-[#15803D] flex items-center justify-center transition-all cursor-pointer group"
        >
          {isLocating ? (
            <svg
              className="animate-spin w-5 h-5 text-[#15803D]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-[#15803D] group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          )}
        </button>

        {locateNotice && (
          <div className="bg-[#1E1B18]/95 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg border border-white/10 max-w-[220px] text-right animate-in fade-in">
            {locateNotice}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
