"use client";

import React from "react";
import { Kita } from "../types";
import { KitaCard } from "./KitaCard";

interface KitaListProps {
  kitas: Kita[];
  selectedKitaId: string;
  favorites: Record<string, boolean>;
  onSelectKita: (id: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenInquiry: (id: string, e: React.MouseEvent) => void;
  onOpenGallery?: (kita: Kita) => void;
}

export function KitaList({
  kitas,
  selectedKitaId,
  favorites,
  onSelectKita,
  onToggleFavorite,
  onOpenInquiry,
  onOpenGallery,
}: KitaListProps) {
  return (
    <div className="space-y-4 max-h-[860px] overflow-y-auto pr-3 kita-scrollbar">
      {kitas.map((kita) => (
        <KitaCard
          key={kita.id}
          kita={kita}
          isSelected={kita.id === selectedKitaId}
          isFavorite={favorites[kita.id] ?? false}
          onSelect={() => onSelectKita(kita.id)}
          onToggleFavorite={(e) => onToggleFavorite(kita.id, e)}
          onOpenInquiry={(e) => onOpenInquiry(kita.id, e)}
          onOpenGallery={() => onOpenGallery && onOpenGallery(kita)}
        />
      ))}
    </div>
  );
}
