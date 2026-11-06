"use client";

import React from "react";
import Image from "next/image";
import { Kita } from "../types";

interface MapSectionProps {
  kitas: Kita[];
  activeKita: Kita;
  onSelectKita: (id: string) => void;
}

export function MapSection({
  kitas,
  activeKita,
  onSelectKita,
}: MapSectionProps) {
  return (
    <div className="relative w-full h-[220px] sm:h-[280px] lg:h-[300px] rounded-2xl overflow-hidden border border-[#E5DDD2] shadow-xs bg-[#E9E7E2]">
      <Image
        src="/assets/map.png"
        alt="Berlin Map"
        fill
        className="object-cover"
        priority
      />

      {/* Map Markers Overlay */}
      {kitas.map((kita) => {
        const isActive = kita.id === activeKita.id;

        if (isActive) {
          return (
            <div
              key={kita.id}
              style={{ top: kita.coordinates.top, left: kita.coordinates.left }}
              className="absolute -translate-x-1/2 -translate-y-full z-20 group transition-all duration-300 max-w-[200px]"
            >
              <div className="relative flex items-center gap-1.5 sm:gap-2 bg-white border border-[#D5C9B8] px-2.5 sm:px-3.5 py-1.5 rounded-xl shadow-md cursor-pointer transform hover:scale-105 transition-transform after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-white">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#A12D3A] text-white flex items-center justify-center shrink-0">
                  <svg
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-[#1E1B18] leading-tight truncate">
                    {kita.name}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-[#7A6E62] truncate">
                    {kita.location}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={kita.id}
            onClick={() => onSelectKita(kita.id)}
            style={{ top: kita.coordinates.top, left: kita.coordinates.left }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform z-10"
            title={kita.name}
          >
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#7D5A00] text-[#FDE047] flex items-center justify-center shadow-md border border-white/80">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
