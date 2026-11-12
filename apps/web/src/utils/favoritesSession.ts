"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export const FAVORITES_STORAGE_KEY = "toddler_favorites_30d_session";

// 30 Days in Milliseconds: 30 days * 24 hrs * 60 mins * 60 secs * 1000 ms = 2,592,000,000 ms
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface FavoritesSessionPayload {
  favorites: Record<string, boolean>;
  createdAt: number;
  expiresAt: number;
}

const EMPTY_FAVORITES: Record<string, boolean> = {};

/**
 * Retrieve the active 30-day session payload.
 * If expired (> 30 days old), automatically flushes storage and resets to empty.
 */
function getValidSessionPayload(): FavoritesSessionPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    // Check localStorage (persists for 30 days across browser restarts)
    let raw = localStorage.getItem(FAVORITES_STORAGE_KEY);

    // Fallback to check sessionStorage for backwards compatibility
    if (!raw) {
      raw = sessionStorage.getItem(FAVORITES_STORAGE_KEY);
    }

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    // If stored as legacy flat object without timestamp
    if (parsed && typeof parsed === "object" && !("expiresAt" in parsed)) {
      const now = Date.now();
      const legacyPayload: FavoritesSessionPayload = {
        favorites: parsed,
        createdAt: now,
        expiresAt: now + SESSION_TTL_MS,
      };
      saveSessionPayload(legacyPayload);
      return legacyPayload;
    }

    const payload = parsed as FavoritesSessionPayload;

    // Check 30-day expiration
    if (Date.now() > payload.expiresAt) {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      sessionStorage.removeItem(FAVORITES_STORAGE_KEY);
      return null;
    }

    return payload;
  } catch (e) {
    console.error("Error reading 30-day favorites session:", e);
    return null;
  }
}

/**
 * Persist the 30-day session payload to browser storage.
 */
function saveSessionPayload(payload: FavoritesSessionPayload): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(payload);
    localStorage.setItem(FAVORITES_STORAGE_KEY, serialized);
    sessionStorage.setItem(FAVORITES_STORAGE_KEY, serialized);

    // Broadcast change to other components & browser tabs
    window.dispatchEvent(
      new CustomEvent("toddler_favorites_changed", { detail: payload.favorites })
    );
  } catch (e) {
    console.error("Error saving 30-day favorites session:", e);
  }
}

/**
 * Get active favorites mapping from the 30-day session.
 */
export function getSessionFavorites(): Record<string, boolean> {
  const payload = getValidSessionPayload();
  if (!payload || !payload.favorites) {
    return EMPTY_FAVORITES;
  }

  // Purge legacy mock numeric keys ("1", "2", "3")
  const cleaned: Record<string, boolean> = {};
  for (const [key, val] of Object.entries(payload.favorites)) {
    if (key !== "1" && key !== "2" && key !== "3" && val) {
      cleaned[key] = true;
    }
  }
  return cleaned;
}

/**
 * Calculate the remaining days for this 30-day guest session.
 */
export function getDaysRemaining(): number {
  const payload = getValidSessionPayload();
  if (!payload) return 30;

  const msLeft = payload.expiresAt - Date.now();
  if (msLeft <= 0) return 0;

  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
}

/**
 * Save favorites with a sliding 30-day expiration window.
 */
export function saveSessionFavorites(favorites: Record<string, boolean>): void {
  if (typeof window === "undefined") return;

  const currentPayload = getValidSessionPayload();
  const now = Date.now();

  const cleanObject: Record<string, boolean> = {};
  for (const [key, val] of Object.entries(favorites)) {
    if (key !== "1" && key !== "2" && key !== "3" && val) {
      cleanObject[key] = true;
    }
  }

  const newPayload: FavoritesSessionPayload = {
    favorites: cleanObject,
    createdAt: currentPayload?.createdAt || now,
    expiresAt: now + SESSION_TTL_MS, // 30 days from update
  };

  saveSessionPayload(newPayload);
}

/**
 * Toggle favorite status in the 30-day session.
 */
export function toggleSessionFavorite(id: string): Record<string, boolean> {
  const current = getSessionFavorites();
  const next = { ...current };
  if (next[id]) {
    delete next[id];
  } else {
    next[id] = true;
  }
  saveSessionFavorites(next);
  return next;
}

/**
 * Remove a single daycare from the 30-day session favorites.
 */
export function removeSessionFavorite(id: string): Record<string, boolean> {
  const current = getSessionFavorites();
  const next = { ...current };
  delete next[id];
  saveSessionFavorites(next);
  return next;
}

/**
 * Remove any favorite IDs that are no longer present in the active approved daycares list.
 */
export function pruneSessionFavorites(validIds: Iterable<string>): Record<string, boolean> {
  const validSet = new Set(validIds);
  const current = getSessionFavorites();
  const next: Record<string, boolean> = {};
  let changed = false;

  for (const [id, active] of Object.entries(current)) {
    if (active && validSet.has(id)) {
      next[id] = true;
    } else if (active) {
      changed = true;
    }
  }

  if (changed) {
    saveSessionFavorites(next);
  }

  return next;
}

/**
 * Clear all favorites from the 30-day session.
 */
export function clearSessionFavorites(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      sessionStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  saveSessionFavorites({});
}

/**
 * React Hook for managing 30-day session favorites with real-time sync across components.
 */
export function useSessionFavorites() {
  const [favorites, setFavoritesState] = useState<Record<string, boolean>>(() =>
    getSessionFavorites()
  );
  const [daysRemaining, setDaysRemaining] = useState<number>(() =>
    getDaysRemaining()
  );

  useEffect(() => {
    // Initial sync
    setFavoritesState(getSessionFavorites());
    setDaysRemaining(getDaysRemaining());

    const handleSync = () => {
      setFavoritesState(getSessionFavorites());
      setDaysRemaining(getDaysRemaining());
    };

    window.addEventListener("toddler_favorites_changed", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener("toddler_favorites_changed", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const favoritesCount = useMemo(() => {
    return Object.keys(favorites).filter((key) => favorites[key]).length;
  }, [favorites]);

  const isFavorite = useCallback(
    (id: string) => {
      return Boolean(favorites[id]);
    },
    [favorites]
  );

  const toggleFavorite = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const updated = toggleSessionFavorite(id);
    setFavoritesState(updated);
    setDaysRemaining(getDaysRemaining());
  }, []);

  const removeFavorite = useCallback((id: string) => {
    const updated = removeSessionFavorite(id);
    setFavoritesState(updated);
    setDaysRemaining(getDaysRemaining());
  }, []);

  const clearFavorites = useCallback(() => {
    clearSessionFavorites();
    setFavoritesState({});
    setDaysRemaining(30);
  }, []);

  const pruneFavorites = useCallback((validIds: Iterable<string>) => {
    const updated = pruneSessionFavorites(validIds);
    setFavoritesState(updated);
    setDaysRemaining(getDaysRemaining());
  }, []);

  return {
    favorites,
    favoritesCount,
    daysRemaining,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
    pruneFavorites,
  };
}
