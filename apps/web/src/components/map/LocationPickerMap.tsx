"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

interface LocationPickerMapProps {
  lat?: number;
  lng?: number;
  street?: string;
  city?: string;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export default function LocationPickerMap({
  lat,
  lng,
  street,
  city,
  onLocationChange,
  className = "w-full h-full min-h-[300px]",
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const isInternalMoveRef = useRef(false);

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
        const currentLat = parseFloat(position.coords.latitude.toFixed(6));
        const currentLng = parseFloat(position.coords.longitude.toFixed(6));

        isInternalMoveRef.current = true;
        if (markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
          markerRef.current.setIcon(createPinIcon(street || city || "Current Location"));
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([currentLat, currentLng], 15, {
            duration: 1.2,
          });
        }
        onLocationChange(currentLat, currentLng);
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized on this container
    if (!mapInstanceRef.current) {
      const hasValidCoords =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat !== 0 &&
        lng !== 0;

      const initialLat = hasValidCoords ? (lat as number) : 20.567825;
      const initialLng = hasValidCoords ? (lng as number) : 74.94705;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: hasValidCoords ? 14 : 12,
        zoomControl: true,
        scrollWheelZoom: "center",
      });

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
      const fallbackTileUrl =
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      const fallbackAttribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

      if (mapboxToken) {
        const isRetina = typeof window !== "undefined" && window.devicePixelRatio > 1;
        const mapboxLayer = L.tileLayer(
          `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/512/{z}/{x}/{y}${isRetina ? "@2x" : ""}?access_token=${mapboxToken}`,
          {
            attribution:
              '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            tileSize: 512,
            zoomOffset: -1,
            maxZoom: 22,
          }
        );

        mapboxLayer.on("tileerror", () => {
          if (!map.hasLayer(mapboxLayer)) return;
          map.removeLayer(mapboxLayer);
          L.tileLayer(fallbackTileUrl, {
            attribution: fallbackAttribution,
            subdomains: "abcd",
            maxZoom: 19,
          }).addTo(map);
        });

        mapboxLayer.addTo(map);
      } else {
        L.tileLayer(fallbackTileUrl, {
          attribution: fallbackAttribution,
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);
      }

      // Create draggable marker
      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: createPinIcon(street || city || "Daycare Pin"),
      }).addTo(map);

      // On Marker Drag
      marker.on("dragend", () => {
        const position = marker.getLatLng();
        isInternalMoveRef.current = true;
        onLocationChange(
          parseFloat(position.lat.toFixed(6)),
          parseFloat(position.lng.toFixed(6))
        );
      });

      // On Map Click - move pin to clicked location
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        isInternalMoveRef.current = true;
        onLocationChange(
          parseFloat(clickLat.toFixed(6)),
          parseFloat(clickLng.toFixed(6))
        );
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // For new registration (no coordinates saved yet): automatically request current location
      if (!hasValidCoords) {
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
    mapInstanceRef.current.flyTo([validLat, validLng], 15, {
      duration: 0.8,
    });
  }, [lat, lng, street, city]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* GPS Location Control Icon */}
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
    </div>
  );
}
