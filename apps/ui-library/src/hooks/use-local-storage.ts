"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * SSR-safe persisted string state. Renders `initial` on the server and first
 * client paint, then hydrates from localStorage after mount to avoid a mismatch.
 */
export function useLocalStorage<T extends string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        setValue(stored as T);
      }
    } catch {
      // localStorage may be unavailable (private mode); keep the initial value.
    }
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Ignore write failures — the in-memory value still updates.
      }
    },
    [key],
  );

  return [value, set] as const;
}
