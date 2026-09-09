'use client';

import { useEffect, useState } from 'react';

// ===== Constants =====
const DEFAULT_DEBOUNCE_DELAY_MS = 300;

// ===== Hook =====
export function useDebouncedValue<T>(
  value: T,
  delay: number = DEFAULT_DEBOUNCE_DELAY_MS
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
