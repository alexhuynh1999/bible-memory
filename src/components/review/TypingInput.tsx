import { useState, useRef, useEffect } from 'react';
import type { InputMode } from '@/types';
import FirstLetterInput from './FirstLetterInput';

interface TypingInputProps {
  verseText: string;
  mode: InputMode;
  onComplete: (typed: string) => void;
}

export default function TypingInput({ verseText, mode, onComplete }: TypingInputProps) {
  // Delegate to FirstLetterInput for the new first-letter mode
  if (mode === 'firstLetter') {
    return <FirstLetterInput verseText={verseText} onComplete={onComplete} />;
  }

  // "full" and "fillBlank" modes use a textarea
  return <TextAreaInput verseText={verseText} mode={mode} onComplete={onComplete} />;
}

function TextAreaInput({ verseText, mode, onComplete }: { verseText: string; mode: 'full' | 'fillBlank'; onComplete: (typed: string) => void }) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // For fill-in-the-blank mode, generate the hint text (old first-letter behavior)
  const words = verseText.split(/\s+/);
  const hintText = words
    .map((word) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9']/g, '');
      if (cleanWord.length === 0) return word;
      return word[0] + '_'.repeat(cleanWord.length - 1) + word.slice(cleanWord.length);
    })
    .join(' ');

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  if (submitted) return null;

  return (
    <div className="space-y-3">
      {mode === 'fillBlank' && (
        <p className="font-serif text-warmBrown-400 dark:text-parchment-500 text-sm leading-relaxed tracking-wide">
          {hintText}
        </p>
      )}

      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          mode === 'full'
            ? 'Type the verse from memory...'
            : 'Fill in the missing letters...'
        }
        className="input-field min-h-[120px] font-serif resize-none caret-transparent"
        rows={4}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-warmBrown-400 dark:text-parchment-400">
          {mode === 'full' ? 'Type the full verse' : 'Fill in the blanks'} · Cmd+Enter to submit
        </p>
        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={!input.trim()}
        >
          Check
        </button>
      </div>
    </div>
  );
}
