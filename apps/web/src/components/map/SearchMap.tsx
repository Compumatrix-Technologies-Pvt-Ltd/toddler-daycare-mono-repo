"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Kita } from "../../types";
import { isValidLatLng, safeMoveMap } from "./mapUtils";

interface SearchMapProps {
  kitas: Kita[];
  activeKita?: Kita | null;
  onSelectKita: (id: string) => void;
  onClearFocus?: () => void;
  className?: string;
  userLocation?: { lat: number; lng: number } | null;
  catchmentRadius?: number;
}

// Map kitas to realistic coordinates (use real lat/lng if provided, fallback to Berlin spread)
const getCoordinatesForKita = (kita: Kita, index: number): [number, number] => {
  if (
    kita.coordinates &&
    isValidLatLng(kita.coordinates.lat, kita.coordinates.lng) &&
    (kita.coordinates.lat !== 0 || kita.coordinates.lng !== 0)
  ) {
    return [kita.coordinates.lat as number, kita.coordinates.lng as number];
  }

  // Fallback coordinates around the registered cluster
  const baseCoordinates: [number, number][] = [
    [20.571046, 74.94637],
    [20.567825, 74.94705],
    [20.575000, 74.95000],
    [52.5413, 13.4135], // Prenzlauer Berg
    [52.5200, 13.4050], // Mitte
    [52.5163, 13.4545], // Friedrichshain
  ];

  return baseCoordinates[index % baseCoordinates.length];
};

export default function SearchMap({
  kitas,
  activeKita,
  onSelectKita,
  onClearFocus,
  className = "w-full h-full",
  userLocation,
  catchmentRadius = 3,
}: SearchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const isProgrammaticMoveRef = useRef<boolean>(false);
  const prevUserLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const onClearFocusRef = useRef(onClearFocus);
  const onSelectKitaRef = useRef(onSelectKita);

  useEffect(() => {
    onClearFocusRef.current = onClearFocus;
    onSelectKitaRef.current = onSelectKita;
  }, [onClearFocus, onSelectKita]);

  const createSunIcon = (isActive: boolean, kita: Kita) => {
    if (isActive) {
      // In focus:
      // The pin changes color to crimson red #A12D3A.
      // The name tag is placed NEXT TO the marker (to the right with margin-left: 8px), not above it.
      // Pin center is at [16, 20], anchor is [16, 20]. The exact location is 100% visible.
      return L.divIcon({
        className: "custom-active-sun-pin",
        iconSize: [260, 40],
        iconAnchor: [16, 20],
        html: `
          <div style="position: relative; display: flex; align-items: center; pointer-events: auto; z-index: 1000;">
            <!-- Marker in focus (changes color to #A12D3A) -->
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 9999px;
              background-color: #A12D3A;
              color: #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(161, 45, 58, 0.45);
              border: 2.5px solid #FFFFFF;
              cursor: pointer;
              flex-shrink: 0;
            ">
              <svg style="width: 17px; height: 17px;" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>

            <!-- Name Tag NEXT TO the marker (to the right, NOT above it) -->
            <div style="
              margin-left: 8px;
              background: #FFFFFF;
              border: 1px solid #D5C9B8;
              padding: 4px 10px;
              border-radius: 10px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.12);
              white-space: nowrap;
              pointer-events: auto;
              cursor: pointer;
            ">
              <div style="font-size: 11px; font-weight: 700; color: #1E1B18; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
                ${kita.name}
              </div>
              <div style="font-size: 10px; color: #7A6E62; overflow: hidden; text-overflow: ellipsis; max-width: 150px; margin-top: 1px;">
                ${kita.location}
              </div>
            </div>
          </div>
        `,
      });
    }

    return L.divIcon({
      className: "custom-sun-pin",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 9999px;
          background-color: #7D5A00;
          color: #FDE047;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(125, 90, 0, 0.35);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          <svg style="width: 16px; height: 16px;" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
          </svg>
        </div>
      `,
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] =
        userLocation && isValidLatLng(userLocation.lat, userLocation.lng)
          ? [userLocation.lat, userLocation.lng]
          : [20.571046, 74.94637];

      const activeCoords = activeKita
        ? getCoordinatesForKita(
            activeKita,
            kitas.findIndex((k) => k.id === activeKita.id)
          )
        : kitas.length > 0
          ? getCoordinatesForKita(kitas[0], 0)
          : defaultCenter;

      const map = L.map(mapContainerRef.current, {
        center: activeCoords,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: "center",
      });

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
      const hasValidMapboxToken = Boolean(mapboxToken && mapboxToken.startsWith("pk."));
      const osmTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      const osmAttribution =
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

      if (hasValidMapboxToken && mapboxToken) {
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
          L.tileLayer(osmTileUrl, {
            attribution: osmAttribution,
            maxZoom: 19,
          }).addTo(map);
        });

        mapboxLayer.addTo(map);
      } else {
        L.tileLayer(osmTileUrl, {
          attribution: osmAttribution,
          maxZoom: 19,
        }).addTo(map);
      }

      // Add zoom control to bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;

      // Safely invalidate size after layout mounts or mobile tab switches
      const resizeObserver =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(() => {
              if (mapInstanceRef.current && mapContainerRef.current) {
                const { offsetWidth, offsetHeight } = mapContainerRef.current;
                if (offsetWidth > 0 && offsetHeight > 0) {
                  try {
                    mapInstanceRef.current.invalidateSize({ animate: false });
                  } catch {
                    // Container was unmounted or destroyed
                  }
                }
              }
            })
          : null;

      if (resizeObserver && mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      const resizeTimer = setTimeout(() => {
        if (
          mapInstanceRef.current &&
          mapContainerRef.current &&
          (mapContainerRef.current as any)._leaflet_id
        ) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {
            // Container was unmounted or destroyed
          }
        }
      }, 250);

      return () => {
        clearTimeout(resizeTimer);
        resizeObserver?.disconnect();
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {
            // Container cleanup
          }
          mapInstanceRef.current = null;
          markersRef.current = {};
          userMarkerRef.current = null;
          radiusCircleRef.current = null;
        }
      };
    }
  }, []);

  // Synchronize daycare markers, user location pin, and radius circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove any markers that are no longer in kitas
    const currentIds = new Set(kitas.map((k) => k.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Create or update marker for each kita
    kitas.forEach((kita, idx) => {
      const coords = getCoordinatesForKita(kita, idx);
      const isActive = activeKita ? kita.id === activeKita.id : false;
      const icon = createSunIcon(isActive, kita);

      const handleClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectKitaRef.current?.(kita.id);
      };

      if (markersRef.current[kita.id]) {
        const marker = markersRef.current[kita.id];
        marker.setIcon(icon);
        marker.setLatLng(coords);
        marker.setZIndexOffset(isActive ? 1000 : 10);
        marker.off("click");
        marker.on("click", handleClick);
      } else {
        const marker = L.marker(coords, {
          icon,
          zIndexOffset: isActive ? 1000 : 10,
        }).addTo(map);

        marker.on("click", handleClick);
        markersRef.current[kita.id] = marker;
      }
    });

    // Render User Location & Catchment Radius Circle
    if (userLocation && isValidLatLng(userLocation.lat, userLocation.lng)) {
      const userLatLng: [number, number] = [userLocation.lat, userLocation.lng];
      const radiusMeters = (catchmentRadius || 3) * 1000;

      // Circle around parent's current location (applies urban / rural radius)
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng(userLatLng);
        radiusCircleRef.current.setRadius(radiusMeters);
      } else {
        radiusCircleRef.current = L.circle(userLatLng, {
          radius: radiusMeters,
          color: "#A12D3A",
          weight: 2,
          opacity: 0.8,
          fillColor: "#A12D3A",
          fillOpacity: 0.08,
          dashArray: "6, 6",
        }).addTo(map);
      }

      // User Marker
      const userIcon = L.divIcon({
        className: "parent-user-location-pin",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(37, 99, 235, 0.25); transform: scale(1.4);"></div>
            <div style="width: 18px; height: 18px; border-radius: 9999px; background: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4); display: flex; align-items: center; justify-content: center;">
              <div style="width: 5px; height: 5px; border-radius: 9999px; background: #FFFFFF;"></div>
            </div>
          </div>
        `,
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userLatLng);
      } else {
        userMarkerRef.current = L.marker(userLatLng, {
          icon: userIcon,
          zIndexOffset: 500,
        }).addTo(map);
        userMarkerRef.current.bindTooltip("Your Location", { permanent: false, direction: "top" });
      }

      // If user location changed or is newly searched, and no active daycare is in focus,
      // redirect / smoothly fly the map to parent's searched location
      const prevLoc = prevUserLocationRef.current;
      const isLocationChanged =
        !prevLoc ||
        Math.abs(prevLoc.lat - userLocation.lat) > 0.0001 ||
        Math.abs(prevLoc.lng - userLocation.lng) > 0.0001;

      if (isLocationChanged) {
        prevUserLocationRef.current = { lat: userLocation.lat, lng: userLocation.lng };
        if (!activeKita) {
          isProgrammaticMoveRef.current = true;
          // Zoom level 14 fits the catchment circle nicely
          const searchZoom = (catchmentRadius || 3) > 5 ? 12 : 14;
          safeMoveMap(map, userLatLng, searchZoom, 0.8);
          setTimeout(() => {
            isProgrammaticMoveRef.current = false;
          }, 900);
        }
      }
    } else {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    }

    // Pan / Fly to active daycare location with +4 zoom in
    if (activeKita) {
      const activeIdx = kitas.findIndex((k) => k.id === activeKita.id);
      const activeCoords = getCoordinatesForKita(
        activeKita,
        activeIdx >= 0 ? activeIdx : 0
      );
      isProgrammaticMoveRef.current = true;
      const currentZoom = map.getZoom() || 13;
      const targetZoom = Math.min(Math.max(currentZoom + 4, 16), 18);
      safeMoveMap(map, activeCoords, targetZoom, 0.8);
      setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 900);
    }
  }, [kitas, activeKita?.id, userLocation?.lat, userLocation?.lng, catchmentRadius]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
