import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'bible-memory-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // localStorage not available
  }
  return 'system';
}

function applyTheme(preference: ThemePreference) {
  const effectiveTheme = preference === 'system' ? getSystemTheme() : preference;
  const root = document.documentElement;
  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  // Set color-scheme so browser renders native elements (inputs, scrollbars) correctly
  root.style.colorScheme = effectiveTheme;
  // Update theme-color meta tag
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', effectiveTheme === 'dark' ? '#3e2f23' : '#78593a');
  }
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getSavedPreference);

  // Apply theme on mount and when preference changes
  useEffect(() => {
    applyTheme(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // localStorage not available
    }
  }, [preference]);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [preference]);

  const setTheme = useCallback((newPref: ThemePreference) => {
    setPreference(newPref);
  }, []);

  const effectiveTheme = preference === 'system' ? getSystemTheme() : preference;

  return {
    preference,
    effectiveTheme,
    setTheme,
  };
}
