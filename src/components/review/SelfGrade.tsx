import { motion } from 'framer-motion';
import { Rating, type Grade } from '@/lib/fsrs';
import type { InputMode } from '@/types';

interface SelfGradeProps {
  verseText: string;
  displayRef: string;
  userInput: string;
  inputMode: InputMode;
  onGrade: (grade: Grade) => void;
}

const grades: { rating: Grade; label: string; desc: string; color: string }[] = [
  {
    rating: Rating.Again,
    label: 'Again',
    desc: 'Forgot completely',
    color: 'bg-parchment-100 text-warmBrown-600 border-parchment-300 hover:bg-parchment-200 dark:bg-warmBrown-700/60 dark:text-parchment-300 dark:border-warmBrown-600 dark:hover:bg-warmBrown-700',
  },
  {
    rating: Rating.Hard,
    label: 'Hard',
    desc: 'Barely recalled',
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-800/50',
  },
  {
    rating: Rating.Good,
    label: 'Good',
    desc: 'Recalled with effort',
    color: 'bg-olive-50 text-olive-700 border-olive-200 hover:bg-olive-100 dark:bg-olive-800/40 dark:text-olive-200 dark:border-olive-600 dark:hover:bg-olive-700/50',
  },
  {
    rating: Rating.Easy,
    label: 'Easy',
    desc: 'Perfect recall',
    color: 'bg-olive-100 text-olive-800 border-olive-300 hover:bg-olive-200 dark:bg-olive-700/50 dark:text-olive-100 dark:border-olive-500 dark:hover:bg-olive-600/50',
  },
];

export default function SelfGrade({ verseText, displayRef, userInput, inputMode, onGrade }: SelfGradeProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Show the actual verse */}
      <div className="card !bg-parchment-50 dark:!bg-warmBrown-700">
        <p className="font-serif font-semibold text-warmBrown-800 dark:text-parchment-100 mb-2">{displayRef}</p>
        <p className="font-serif italic text-warmBrown-700 dark:text-parchment-200 leading-relaxed">
          &ldquo;{verseText}&rdquo;
        </p>
      </div>

      {/* Show what user typed (skip for first-letter mode — raw letters aren't useful) */}
      {userInput && inputMode !== 'firstLetter' && (
        <div className="card !bg-white/50 dark:!bg-warmBrown-800/50">
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400 mb-1 font-medium">
            Your {inputMode === 'full' ? 'answer' : 'fill-in'}:
          </p>
          <p className="font-serif text-warmBrown-600 dark:text-parchment-300 text-sm">{userInput}</p>
        </div>
      )}

      {/* Grade buttons */}
      <div>
        <p className="text-sm font-medium text-warmBrown-700 dark:text-parchment-200 mb-2">How well did you remember?</p>
        <div className="grid grid-cols-2 gap-2">
          {grades.map((g) => (
            <motion.button
              key={g.rating}
              className={`border rounded-xl p-3 text-left transition-colors ${g.color}`}
              onClick={() => onGrade(g.rating)}
              whileTap={{ scale: 0.97 }}
            >
              <p className="font-semibold text-sm">{g.label}</p>
              <p className="text-xs opacity-75">{g.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
