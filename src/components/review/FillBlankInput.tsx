import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface FillBlankInputProps {
  verseText: string;
  clozeRate?: number;   // percentage of key words to blank (0–50, default 25)
  onComplete: (typed: string) => void;
}

interface BlankToken {
  display: string;       // the full word including punctuation
  letters: string;       // alphabetic characters only (lowercase, for comparison)
  isBlank: boolean;      // whether this word was randomly blanked out
  revealed: boolean;     // blank that has been correctly filled
  helped: boolean;       // revealed via "Need help?"
}

// Common English stop words — structural glue that is never blanked out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'so', 'yet',
  'in', 'on', 'at', 'to', 'of', 'by', 'up', 'as', 'is', 'was',
  'are', 'were', 'be', 'been', 'am', 'do', 'did', 'does', 'has', 'had',
  'have', 'he', 'she', 'it', 'i', 'we', 'they', 'you', 'his', 'her',
  'its', 'who', 'whom', 'that', 'this', 'with', 'from', 'not', 'no',
  'will', 'shall', 'may', 'can', 'if', 'then', 'than', 'when', 'into',
  'all', 'my', 'your', 'our', 'their', 'me', 'him', 'us', 'them',
  'which', 'what', 'there', 'out', 'about', 'also', 'each', 'own',
]);

function tokenize(text: string, rate: number): BlankToken[] {
  const words = text.split(/\s+/).filter(Boolean);

  // Identify key-word indices (not stop words)
  const keyIndices: number[] = [];
  words.forEach((raw, idx) => {
    const clean = raw.replace(/[^a-zA-Z']/g, '').toLowerCase();
    if (clean && !STOP_WORDS.has(clean)) keyIndices.push(idx);
  });

  // Blank the given percentage of key words (at least 1 if any key words exist)
  const targetBlanks = Math.max(1, Math.round(keyIndices.length * (rate / 100)));

  // Fisher-Yates shuffle on key indices to pick random ones
  const shuffled = [...keyIndices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const blankSet = new Set(shuffled.slice(0, targetBlanks));

  return words.map((raw, idx) => {
    const letters = raw.replace(/[^a-zA-Z']/g, '').toLowerCase();
    return {
      display: raw,
      letters,
      isBlank: blankSet.has(idx),
      revealed: !blankSet.has(idx),
      helped: false,
    };
  });
}

export default function FillBlankInput({ verseText, clozeRate = 25, onComplete }: FillBlankInputProps) {
  const [tokens, setTokens] = useState<BlankToken[]>(() => tokenize(verseText, clozeRate));
  const [currentIdx, setCurrentIdx] = useState<number>(-1); // index in tokens array
  const [typedWord, setTypedWord] = useState('');
  const [wrongFlash, setWrongFlash] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the first blank on mount
  const findNextBlank = useCallback((toks: BlankToken[], afterIdx: number): number => {
    for (let i = afterIdx + 1; i < toks.length; i++) {
      if (toks[i].isBlank && !toks[i].revealed) return i;
    }
    return -1;
  }, []);

  // Initialize to first blank
  useEffect(() => {
    const first = findNextBlank(tokens, -1);
    if (first >= 0) setCurrentIdx(first);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIdx]);

  // Scroll to current word
  useEffect(() => {
    if (currentIdx < 0) return;
    const el = document.getElementById(`fillblank-${currentIdx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentIdx]);

  // Count blanks for progress
  const blankCount = useMemo(() => tokens.filter((t) => t.isBlank).length, [tokens]);
  const filledCount = useMemo(() => tokens.filter((t) => t.isBlank && t.revealed).length, [tokens]);

  const finishSession = useCallback((finalTokens: BlankToken[]) => {
    setCompleted(true);
    const typed = finalTokens
      .filter((t) => t.isBlank)
      .map((t) => (t.helped ? '?' : t.letters))
      .join(' ');
    onComplete(typed);
  }, [onComplete]);

  const advanceToNext = useCallback(
    (updatedTokens: BlankToken[]) => {
      setWrongCount(0);
      setTypedWord('');
      const next = findNextBlank(updatedTokens, currentIdx);
      if (next === -1) {
        finishSession(updatedTokens);
      } else {
        setCurrentIdx(next);
      }
    },
    [currentIdx, findNextBlank, finishSession]
  );

  const handleSubmit = useCallback(() => {
    if (completed || currentIdx < 0) return;
    const current = tokens[currentIdx];
    const typed = typedWord.trim().replace(/[^a-zA-Z']/g, '').toLowerCase();

    if (typed === current.letters) {
      // Correct!
      const updated = [...tokens];
      updated[currentIdx] = { ...updated[currentIdx], revealed: true };
      setTokens(updated);
      advanceToNext(updated);
    } else {
      // Wrong — flash and increment counter
      setWrongCount((prev) => prev + 1);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 300);
    }
  }, [completed, currentIdx, tokens, typedWord, advanceToNext]);

  const handleHelp = useCallback(() => {
    if (completed || currentIdx < 0) return;
    const updated = [...tokens];
    updated[currentIdx] = { ...updated[currentIdx], revealed: true, helped: true };
    setTokens(updated);
    advanceToNext(updated);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [tokens, currentIdx, completed, advanceToNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const showHelp = wrongCount >= 3 && !completed && currentIdx >= 0;

  const currentToken = currentIdx >= 0 ? tokens[currentIdx] : null;
  const letterCount = currentToken ? currentToken.letters.length : 0;

  return (
    <div className="space-y-3">
      {/* Word tokens display */}
      <div
        className="flex flex-wrap gap-x-2 gap-y-1.5 min-h-[120px] p-3 rounded-xl border border-parchment-300 dark:border-warmBrown-600 bg-white dark:bg-warmBrown-800 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tokens.map((token, idx) => {
          const isCurrent = idx === currentIdx && !completed;
          const isRevealed = token.revealed;
          const isFutureBlank = token.isBlank && !token.revealed && !isCurrent;

          return (
            <motion.span
              key={idx}
              id={`fillblank-${idx}`}
              className={`font-serif text-base transition-all duration-200 rounded-lg px-1.5 py-0.5 ${
                isRevealed
                  ? token.isBlank
                    ? token.helped
                      ? 'text-warmBrown-700 dark:text-parchment-100 bg-amber-200 dark:bg-amber-800/40'
                      : 'text-warmBrown-700 dark:text-parchment-100 bg-olive-100 dark:bg-olive-800/40'
                    : 'text-warmBrown-700 dark:text-parchment-100'
                  : isCurrent
                  ? wrongFlash
                    ? 'bg-warmBrown-200 dark:bg-warmBrown-600/60 text-warmBrown-700 dark:text-warmBrown-300'
                    : 'bg-olive-50 dark:bg-olive-900/40 text-warmBrown-500 dark:text-parchment-300 ring-2 ring-olive-400 dark:ring-olive-400'
                  : isFutureBlank
                  ? 'text-parchment-400 dark:text-warmBrown-500'
                  : 'text-warmBrown-700 dark:text-parchment-100'
              }`}
              animate={
                isRevealed && token.isBlank
                  ? { scale: [1.1, 1], opacity: 1 }
                  : wrongFlash && isCurrent
                  ? { x: [0, -4, 4, -4, 0] }
                  : {}
              }
              transition={{ duration: 0.2 }}
            >
              {isRevealed || !token.isBlank
                ? token.display
                : token.display.replace(/[a-zA-Z]/g, '_')}
            </motion.span>
          );
        })}
      </div>

      {/* Text input for typing the word */}
      {!completed && currentIdx >= 0 && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={typedWord}
            onChange={(e) => setTypedWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${letterCount} letters`}
            className="input-field font-serif flex-1"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={handleSubmit}
            disabled={!typedWord.trim()}
            className="btn-primary !py-2 !px-4 disabled:opacity-50"
          >
            Enter
          </button>
        </div>
      )}

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
          Fill in the blanks · {filledCount}/{blankCount} words
        </p>
        {!completed && (
          <button
            onClick={() => {
              const typed = tokens
                .filter((t) => t.isBlank)
                .map((t) => (t.revealed ? (t.helped ? '?' : t.letters) : '?'))
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
