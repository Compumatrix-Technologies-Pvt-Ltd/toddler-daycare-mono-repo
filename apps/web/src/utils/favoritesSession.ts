"use client";

import { useState, useEffect, useCallback } from "react";

export const FAVORITES_SESSION_KEY = "toddler_session_favorites";

// Default seed favorites matching Figma initial state (Kita Sunshine, Kleine Strolche, Kinderparadies Pankow)
const DEFAULT_FAVORITES: Record<string, boolean> = {
  "1": true,
  "2": true,
  "3": true,
};

export function getSessionFavorites(): Record<string, boolean> {
  if (typeof window === "undefined") {
    return DEFAULT_FAVORITES;
  }
  try {
    const raw = sessionStorage.getItem(FAVORITES_SESSION_KEY);
    if (!raw) {
      sessionStorage.setItem(
        FAVORITES_SESSION_KEY,
        JSON.stringify(DEFAULT_FAVORITES)
      );
      return DEFAULT_FAVORITES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading favorites from sessionStorage:", e);
    return DEFAULT_FAVORITES;
  }
}

export function saveSessionFavorites(favorites: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FAVORITES_SESSION_KEY, JSON.stringify(favorites));
    // Dispatch custom event to sync all listeners in the same window/session
    window.dispatchEvent(
      new CustomEvent("toddler_favorites_changed", { detail: favorites })
    );
  } catch (e) {
    console.error("Error saving favorites to sessionStorage:", e);
  }
}

export function toggleSessionFavorite(id: string): Record<string, boolean> {
  const current = getSessionFavorites();
  const next = { ...current, [id]: !current[id] };
  saveSessionFavorites(next);
  return next;
}

export function clearSessionFavorites(): void {
  saveSessionFavorites({});
}

export function useSessionFavorites() {
  const [favorites, setFavoritesState] = useState<Record<string, boolean>>(
    () => getSessionFavorites()
  );

  useEffect(() => {
    // Initial sync
    setFavoritesState(getSessionFavorites());

    const handleSync = () => {
      setFavoritesState(getSessionFavorites());
    };

    window.addEventListener("toddler_favorites_changed", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("toddler_favorites_changed", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const toggleFavorite = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const updated = toggleSessionFavorite(id);
    setFavoritesState(updated);
  }, []);

  const removeFavorite = useCallback((id: string) => {
    const current = getSessionFavorites();
    const updated = { ...current, [id]: false };
    saveSessionFavorites(updated);
    setFavoritesState(updated);
  }, []);

  const clearFavorites = useCallback(() => {
    clearSessionFavorites();
    setFavoritesState({});
  }, []);

  return {
    favorites,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
}
