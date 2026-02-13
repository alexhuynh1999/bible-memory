import { useState, useRef, useEffect } from 'react';
import type { InputMode } from '@/types';
import FirstLetterInput from './FirstLetterInput';
import FillBlankInput from './FillBlankInput';

interface TypingInputProps {
  verseText: string;
  mode: InputMode;
  clozeRate?: number;
  onComplete: (typed: string) => void;
}

export default function TypingInput({ verseText, mode, clozeRate, onComplete }: TypingInputProps) {
  if (mode === 'firstLetter') {
    return <FirstLetterInput verseText={verseText} onComplete={onComplete} />;
  }

  if (mode === 'fillBlank') {
    return <FillBlankInput verseText={verseText} clozeRate={clozeRate} onComplete={onComplete} />;
  }

  // "full" mode uses a textarea
  return <FullTextInput verseText={verseText} onComplete={onComplete} />;
}

function FullTextInput({ verseText: _verseText, onComplete }: { verseText: string; onComplete: (typed: string) => void }) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type the verse from memory..."
        className="input-field min-h-[120px] font-serif resize-none caret-transparent"
        rows={4}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-warmBrown-400 dark:text-parchment-400">
          Type the full verse · Cmd+Enter to submit
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
