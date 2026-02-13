import { useState, useEffect, useCallback } from 'react';
import type { InputMode } from '@/types';

const MODE_KEY = 'bible-memory-input-mode';
const CLOZE_KEY = 'bible-memory-cloze-rate';
const DEFAULT_CLOZE_RATE = 30;

function getSavedInputMode(): InputMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'full' || saved === 'firstLetter' || saved === 'fillBlank') return saved;
  } catch {
    // localStorage not available
  }
  return 'firstLetter'; // default
}

function getSavedClozeRate(): number {
  try {
    const saved = localStorage.getItem(CLOZE_KEY);
      if (saved !== null) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n >= 30 && n <= 70) return n;
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_CLOZE_RATE;
}

export function useInputMode() {
  const [inputMode, setInputModeState] = useState<InputMode>(getSavedInputMode);
  const [clozeRate, setClozeRateState] = useState<number>(getSavedClozeRate);

  useEffect(() => {
    try { localStorage.setItem(MODE_KEY, inputMode); } catch { /* noop */ }
  }, [inputMode]);

  useEffect(() => {
    try { localStorage.setItem(CLOZE_KEY, String(clozeRate)); } catch { /* noop */ }
  }, [clozeRate]);

  const setInputMode = useCallback((mode: InputMode) => {
    setInputModeState(mode);
  }, []);

  const setClozeRate = useCallback((rate: number) => {
    setClozeRateState(Math.max(30, Math.min(70, Math.round(rate))));
  }, []);

  return {
    inputMode,
    setInputMode,
    clozeRate,
    setClozeRate,
  };
}
