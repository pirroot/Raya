'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

type Theme = 'light' | 'dark' | 'system';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyTheme(theme: Theme, systemTheme: 'light' | 'dark') {
  const resolved = theme === 'system' ? systemTheme : theme;
  const root = document.documentElement;

  root.classList.remove('light', 'dark');

  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const initial = getInitialTheme();
    const system = getSystemTheme();
    setTheme(initial);
    setSystemTheme(system);
    setResolvedTheme(initial === 'system' ? system : initial);
    applyTheme(initial, system);
    setMounted(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const newSystem = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystem);
      if (theme === 'system') {
        setResolvedTheme(newSystem);
        applyTheme('system', newSystem);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const resolved = theme === 'system' ? systemTheme : theme;
    setResolvedTheme(resolved);
    applyTheme(theme, systemTheme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, systemTheme, mounted]);

  const setThemeWithValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const current = theme === 'system' ? systemTheme : theme;
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';
  const isSystem = theme === 'system';

  return {
    theme,
    systemTheme,
    resolvedTheme,
    setTheme: setThemeWithValue,
    toggleTheme,
    isDark,
    isLight,
    isSystem,
    mounted,
  };
}
