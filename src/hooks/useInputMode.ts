import { useState, useEffect, useCallback } from 'react';
import type { InputMode } from '@/types';

const STORAGE_KEY = 'bible-memory-input-mode';

function getSavedInputMode(): InputMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'full' || saved === 'firstLetter' || saved === 'fillBlank') return saved;
  } catch {
    // localStorage not available
  }
  return 'firstLetter'; // default
}

export function useInputMode() {
  const [inputMode, setInputModeState] = useState<InputMode>(getSavedInputMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, inputMode);
    } catch {
      // localStorage not available
    }
  }, [inputMode]);

  const setInputMode = useCallback((mode: InputMode) => {
    setInputModeState(mode);
  }, []);

  return {
    inputMode,
    setInputMode,
  };
}
