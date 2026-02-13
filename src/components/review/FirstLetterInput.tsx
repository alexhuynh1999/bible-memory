import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface FirstLetterInputProps {
  verseText: string;
  onComplete: (typed: string) => void;
}

interface WordToken {
  word: string;          // the full word (letters only for comparison)
  display: string;       // the full word including trailing punctuation
  firstLetter: string;   // first alphabetic character (lowercase)
  revealed: boolean;
  helped: boolean;       // true if revealed via "Need help?"
}

function tokenize(text: string): WordToken[] {
  return text.split(/\s+/).filter(Boolean).map((raw) => {
    const firstAlpha = raw.match(/[a-zA-Z]/);
    return {
      word: raw,
      display: raw,
      firstLetter: firstAlpha ? firstAlpha[0].toLowerCase() : '',
      revealed: false,
      helped: false,
    };
  });
}

export default function FirstLetterInput({ verseText, onComplete }: FirstLetterInputProps) {
  const [tokens, setTokens] = useState<WordToken[]>(() => tokenize(verseText));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the hidden input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to current word
  useEffect(() => {
    const el = document.getElementById(`word-${currentIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIdx]);

  const advanceToNext = useCallback(
    (updated: WordToken[]) => {
      const nextIdx = currentIdx + 1;
      setWrongCount(0);
      if (nextIdx >= updated.length) {
        setCompleted(true);
        const typed = updated.map((t) => (t.helped ? '?' : t.firstLetter)).join(' ');
        onComplete(typed);
      } else {
        setCurrentIdx(nextIdx);
      }
    },
    [currentIdx, onComplete]
  );

  const handleHelp = useCallback(() => {
    if (completed || currentIdx >= tokens.length) return;
    const updated = [...tokens];
    updated[currentIdx] = { ...updated[currentIdx], revealed: true, helped: true };
    setTokens(updated);
    advanceToNext(updated);
    // Re-focus hidden input after clicking the help button
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [tokens, currentIdx, completed, advanceToNext]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (completed) return;
      if (currentIdx >= tokens.length) return;

      const key = e.key.toLowerCase();
      if (key.length !== 1 || !key.match(/[a-z]/)) return;

      e.preventDefault();
      const current = tokens[currentIdx];

      if (key === current.firstLetter) {
        // Correct! Reveal the word
        const updated = [...tokens];
        updated[currentIdx] = { ...updated[currentIdx], revealed: true };
        setTokens(updated);
        advanceToNext(updated);
      } else {
        // Wrong! Flash red and increment counter
        setWrongCount((prev) => prev + 1);
        setWrongFlash(true);
        setTimeout(() => setWrongFlash(false), 300);
      }
    },
    [tokens, currentIdx, completed, advanceToNext]
  );

  const showHelp = wrongCount >= 3 && !completed && currentIdx < tokens.length;

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute h-0 w-0 caret-transparent"
        onKeyDown={handleKeyDown}
        onBlur={() => !completed && inputRef.current?.focus()}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Type first letter of each word"
      />

      {/* Word tokens display */}
      <div
        className="flex flex-wrap gap-x-2 gap-y-1.5 min-h-[120px] p-3 rounded-xl border border-parchment-300 dark:border-warmBrown-600 bg-white dark:bg-warmBrown-800 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tokens.map((token, idx) => {
          const isCurrent = idx === currentIdx && !completed;
          const isRevealed = token.revealed;

          return (
            <motion.span
              key={idx}
              id={`word-${idx}`}
              className={`font-serif text-base transition-all duration-200 rounded-lg px-1.5 py-0.5 ${
                isRevealed
                  ? token.helped
                    ? 'text-warmBrown-700 dark:text-parchment-100 bg-amber-200 dark:bg-amber-800/40'
                    : 'text-warmBrown-700 dark:text-parchment-100 bg-olive-100 dark:bg-olive-800/40'
                  : isCurrent
                  ? wrongFlash
                    ? 'bg-warmBrown-200 dark:bg-warmBrown-600/60 text-warmBrown-700 dark:text-warmBrown-300'
                    : 'bg-olive-50 dark:bg-olive-900/40 text-warmBrown-500 dark:text-parchment-300 ring-2 ring-olive-400 dark:ring-olive-400'
                  : 'text-parchment-400 dark:text-warmBrown-500'
              }`}
              animate={
                isRevealed
                  ? { scale: [1.1, 1], opacity: 1 }
                  : wrongFlash && isCurrent
                  ? { x: [0, -4, 4, -4, 0] }
                  : {}
              }
              transition={{ duration: 0.2 }}
            >
              {isRevealed ? token.display : token.display.replace(/[a-zA-Z]/g, '_')}
            </motion.span>
          );
        })}
      </div>

      {/* Help button */}
      {showHelp && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleHelp}
          className="w-full text-sm font-medium text-amber-700 dark:text-olive-300 bg-amber-50 dark:bg-olive-900/30 border border-amber-200 dark:border-olive-700 rounded-xl py-2 px-4 hover:bg-amber-100 dark:hover:bg-olive-800/40 transition-colors"
        >
          Need help? Reveal this word
        </motion.button>
      )}

      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-warmBrown-400 dark:text-parchment-400">
          Type the first letter of each word · {tokens.filter((t) => t.revealed).length}/{tokens.length} words
        </p>
        {!completed && (
          <button
            onClick={() => {
              const typed = tokens
                .map((t, i) => (i < currentIdx ? (t.helped ? '?' : t.firstLetter) : '?'))
                .join(' ');
              onComplete(typed);
            }}
            className="btn-ghost text-xs !py-1 !px-3"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
