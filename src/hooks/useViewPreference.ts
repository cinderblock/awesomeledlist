import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "awesomeledlist:viewPreferences";

type ViewPreferences = Record<string, "table" | "tile">;

function getStoredPreferences(): ViewPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ViewPreferences;
    }
  } catch {
    // Ignore storage errors
  }
  return {};
}

function savePreferences(prefs: ViewPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export function useViewPreference(
  categoryId: string,
  urlView: string | null
): [string, (view: string) => void] {
  const [preferences, setPreferences] = useState<ViewPreferences>(() => getStoredPreferences());

  // URL takes precedence over stored preference
  const currentView = urlView || preferences[categoryId] || "table";

  const setView = useCallback(
    (view: string) => {
      const newPrefs = { ...preferences, [categoryId]: view as "table" | "tile" };
      setPreferences(newPrefs);
      savePreferences(newPrefs);
    },
    [categoryId, preferences]
  );

  // Sync preferences from storage on mount (for multi-tab support)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setPreferences(JSON.parse(e.newValue) as ViewPreferences);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return [currentView, setView];
}
