"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Kita } from "../types";

// Dynamic import with ssr: false to prevent Leaflet SSR issues
const SearchMap = dynamic(
  () => import("./map/SearchMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[220px] sm:min-h-[280px] lg:min-h-[300px] flex items-center justify-center bg-[#FAF8F5] text-[#7A6E62] text-xs">
        <svg className="animate-spin h-5 w-5 text-[#A12D3A] mr-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Loading Interactive Map...</span>
      </div>
    ),
  }
);

interface MapSectionProps {
  kitas: Kita[];
  activeKita?: Kita | null;
  onSelectKita: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  catchmentRadius?: number;
}

export function MapSection({
  kitas,
  activeKita,
  onSelectKita,
  userLocation,
  catchmentRadius,
}: MapSectionProps) {
  return (
    <div className="relative w-full h-[220px] sm:h-[280px] lg:h-[300px] rounded-2xl overflow-hidden border border-[#E5DDD2] shadow-xs bg-[#E9E7E2]">
      <SearchMap
        kitas={kitas}
        activeKita={activeKita}
        onSelectKita={onSelectKita}
        className="w-full h-full"
        userLocation={userLocation}
        catchmentRadius={catchmentRadius}
      />
    </div>
  );
}
