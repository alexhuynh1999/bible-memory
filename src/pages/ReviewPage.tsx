import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TypingInput from '@/components/review/TypingInput';
import SelfGrade from '@/components/review/SelfGrade';
import ReviewComplete from '@/components/review/ReviewComplete';
import CollectionSelect from '@/components/library/CollectionSelect';
import { isDue, scheduleReview, Rating, type Grade } from '@/lib/fsrs';
import { compareReferences } from '@/lib/bibleApi';
import { xpForRating } from '@/types';
import type { Verse, Collection, InputMode, LearningPhase, ReviewMode, ReviewScope } from '@/types';

interface ReviewPageProps {
  verses: Verse[];
  collections: Collection[];
  inputMode: InputMode;
  clozeRate?: number;
  onUpdateFsrs: (verseId: string, card: import('ts-fsrs').Card) => Promise<void>;
  onRecordReview: (rating: number, verseId: string) => Promise<number>;
  onActivateVerse?: (verseId: string) => Promise<void>;
  onAdvanceLearningPhase?: (verseId: string, phase: LearningPhase) => Promise<void>;
}

type ReviewPhase = 'scope' | 'mode' | 'typing' | 'grading' | 'complete';

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ReviewPage({
  verses,
  collections,
  inputMode,
  clozeRate = 25,
  onUpdateFsrs,
  onRecordReview,
  onActivateVerse,
  onAdvanceLearningPhase,
}: ReviewPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Only include active verses
  const activeVerses = useMemo(() => verses.filter((v) => v.active !== false), [verses]);

  // Setup state - step 1: scope, step 2: mode + input
  const [scope, setScope] = useState<ReviewScope>('starred');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [mode, setMode] = useState<ReviewMode>('srs');

  // Session state
  const [phase, setPhase] = useState<ReviewPhase>('scope');
  const [reviewQueue, setReviewQueue] = useState<Verse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [totalXp, setTotalXp] = useState(0);

  // Auto-start single-verse review if verseId is in URL
  useEffect(() => {
    const verseId = searchParams.get('verseId');
    if (!verseId) return;
    // Don't trigger if this is an "In Order" launch (has collectionId)
    if (searchParams.get('collectionId')) return;
    const verse = verses.find((v) => v.id === verseId);
    if (!verse) return;
    // Only auto-start once (when still at scope phase)
    if (phase !== 'scope') return;
    setReviewQueue([verse]);
    setCurrentIndex(0);
    setPhase('typing');
  }, [searchParams, verses, phase]);

  // Auto-start "In Order" review from collection detail view
  useEffect(() => {
    const collectionId = searchParams.get('collectionId');
    const startVerseId = searchParams.get('startVerseId');
    const urlMode = searchParams.get('mode');
    if (!collectionId || !startVerseId || urlMode !== 'sequential') return;
    if (phase !== 'scope') return;

    // Build queue: collection verses sorted by biblical order, starting from startVerseId
    const collVerses = verses
      .filter((v) => v.collectionIds.includes(collectionId))
      .sort((a, b) => compareReferences(a.reference, b.reference));

    const startIdx = collVerses.findIndex((v) => v.id === startVerseId);
    if (startIdx === -1) return;

    const queue = collVerses.slice(startIdx);
    if (queue.length === 0) return;

    setMode('sequential');
    setReviewQueue(queue);
    setCurrentIndex(0);
    setPhase('typing');
  }, [searchParams, verses, phase]);

  // Build the review queue based on scope + mode
  const buildQueue = useCallback(() => {
    let pool: Verse[] = [];

    // Step 1: determine pool from scope
    switch (scope) {
      case 'starred':
        pool = activeVerses.filter((v) => v.starred);
        break;
      case 'library':
        pool = [...activeVerses];
        break;
      case 'collection': {
        pool = activeVerses.filter((v) =>
          v.collectionIds.includes(selectedCollectionId)
        );
        break;
      }
    }

    // Step 2: apply mode
    let queue: Verse[] = [];
    switch (mode) {
      case 'srs':
        queue = pool.filter((v) => isDue(v.fsrsCard));
        queue = shuffleArray(queue);
        // If no due verses, fallback to all in pool
        if (queue.length === 0) queue = shuffleArray(pool);
        break;
      case 'random':
        queue = shuffleArray(pool);
        break;
      case 'sequential': {
        if (scope === 'collection') {
          const coll = collections.find((c) => c.id === selectedCollectionId);
          if (coll && coll.verseOrder.length > 0) {
            queue = coll.verseOrder
              .map((id) => pool.find((v) => v.id === id))
              .filter(Boolean) as Verse[];
          }
        }
        if (queue.length === 0) queue = pool; // fallback: creation order
        break;
      }
    }

    return queue;
  }, [scope, mode, activeVerses, selectedCollectionId, collections]);

  const startReview = () => {
    const queue = buildQueue();
    if (queue.length === 0) return;
    setReviewQueue(queue);
    setCurrentIndex(0);
    setPhase('typing');
  };

  const currentVerse = reviewQueue[currentIndex] ?? null;

  const handleTypingComplete = (typed: string) => {
    setUserInput(typed);
    if (mode === 'sequential' || currentVerse?.learningPhase === 'beginner') {
      // Continuous stream or beginner phase: auto-grade as Good and advance without grading screen
      handleGrade(Rating.Good as Grade);
    } else {
      setPhase('grading');
    }
  };

  const handleGrade = async (grade: Grade) => {
    if (!currentVerse) return;

    // Update FSRS card
    const updatedCard = scheduleReview(currentVerse.fsrsCard, grade);
    await onUpdateFsrs(currentVerse.id, updatedCard);

    // Record for gamification — returns actual XP after diminishing returns
    const earnedXp = await onRecordReview(grade, currentVerse.id);
    setTotalXp((prev) => prev + (earnedXp ?? xpForRating(grade)));

    // If the verse was queued (inactive), activate it and advance drip
    if (currentVerse.active === false && onActivateVerse) {
      await onActivateVerse(currentVerse.id);
    }

    // Advance learning phase if applicable
    if (onAdvanceLearningPhase) {
      if (currentVerse.learningPhase === 'beginner') {
        // Beginner always advances to learning after completion
        await onAdvanceLearningPhase(currentVerse.id, 'learning');
      } else if (currentVerse.learningPhase === 'learning' && grade >= Rating.Good) {
        // Learning advances to mastered on Good or Easy
        await onAdvanceLearningPhase(currentVerse.id, 'mastered');
      }
    }

    // Move to next verse or complete
    if (currentIndex + 1 < reviewQueue.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput('');
      setPhase('typing');
    } else {
      setPhase('complete');
    }
  };

  // Counts for UI
  const dueCount = useMemo(() => activeVerses.filter((v) => isDue(v.fsrsCard)).length, [activeVerses]);
  const starredCount = useMemo(() => activeVerses.filter((v) => v.starred).length, [activeVerses]);

  if (phase === 'complete') {
    return <ReviewComplete totalReviewed={currentIndex + 1} xpEarned={totalXp} />;
  }

  // ─── Step 1: Choose Scope ─────────────────────────────────
  if (phase === 'scope') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-ghost !p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 font-serif">Review</h1>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-warmBrown-700 dark:text-parchment-200">
            What do you want to review?
          </label>
          <div className="space-y-2">
            {[
              {
                value: 'starred' as const,
                label: 'Starred',
                desc: `${starredCount} verse${starredCount !== 1 ? 's' : ''}`,
                icon: '⭐',
              },
              {
                value: 'collection' as const,
                label: 'A Collection',
                desc: `${collections.length} collection${collections.length !== 1 ? 's' : ''}`,
                icon: '📁',
              },
              {
                value: 'library' as const,
                label: 'Entire Library',
                desc: `${activeVerses.length} verses · ${dueCount} due`,
                icon: '📚',
              },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`w-full border rounded-xl p-4 text-left transition-colors flex items-center gap-3 ${
                  scope === opt.value
                    ? 'border-warmBrown-500 bg-warmBrown-50 dark:bg-warmBrown-700 dark:border-warmBrown-400'
                    : 'border-parchment-200 hover:border-warmBrown-300 dark:border-warmBrown-600 dark:hover:border-warmBrown-500'
                }`}
                onClick={() => setScope(opt.value)}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="font-medium text-sm text-warmBrown-800 dark:text-parchment-100">{opt.label}</p>
                  <p className="text-xs text-warmBrown-500 dark:text-parchment-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Collection picker (inline if scope is collection) */}
        {scope === 'collection' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-warmBrown-700 dark:text-parchment-200">Choose a Collection</label>
            {collections.length > 0 ? (
              <CollectionSelect
                collections={collections}
                selectedId={selectedCollectionId || null}
                onChange={(id) => setSelectedCollectionId(id ?? '')}
                placeholder="Search collections..."
                verseCounts={Object.fromEntries(
                  collections.map((c) => [
                    c.id,
                    activeVerses.filter((v) => v.collectionIds.includes(c.id)).length,
                  ])
                )}
              />
            ) : (
              <p className="text-sm text-warmBrown-400 dark:text-parchment-500 text-center py-4">
                No collections yet. Create one from the Library.
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => {
            if (scope === 'starred') {
              // Starred scope: auto-random, skip mode selection
              setMode('random');
              const pool = activeVerses.filter((v) => v.starred);
              const queue = shuffleArray(pool);
              if (queue.length === 0) return;
              setReviewQueue(queue);
              setCurrentIndex(0);
              setPhase('typing');
            } else {
              setPhase('mode');
            }
          }}
          disabled={
            activeVerses.length === 0 ||
            (scope === 'collection' && !selectedCollectionId) ||
            (scope === 'starred' && starredCount === 0)
          }
          className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scope === 'starred' ? 'Start Review' : 'Next'}
        </button>
      </div>
    );
  }

  // ─── Step 2: Choose Mode + Input ──────────────────────────
  if (phase === 'mode') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('scope')} className="btn-ghost !p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 font-serif">Review Mode</h1>
        </div>

        {/* Review mode */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-warmBrown-700 dark:text-parchment-200">Review Order</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'srs' as const, label: 'SRS Due', desc: `${dueCount} due`, icon: '🧠' },
              { value: 'random' as const, label: 'Random', desc: 'Shuffle', icon: '🔀' },
              { value: 'sequential' as const, label: 'In Order', desc: 'Continuous', icon: '📋' },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`border rounded-xl p-3 text-center transition-colors ${
                  mode === opt.value
                    ? 'border-warmBrown-500 bg-warmBrown-50 dark:bg-warmBrown-700 dark:border-warmBrown-400'
                    : 'border-parchment-200 hover:border-warmBrown-300 dark:border-warmBrown-600 dark:hover:border-warmBrown-500'
                }`}
                onClick={() => setMode(opt.value)}
              >
                <p className="text-xl mb-1">{opt.icon}</p>
                <p className="font-medium text-xs text-warmBrown-800 dark:text-parchment-100">{opt.label}</p>
                <p className="text-[10px] text-warmBrown-500 dark:text-parchment-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startReview}
          className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={activeVerses.length === 0}
        >
          Start Review
        </button>
      </div>
    );
  }

  // ─── Active Review (typing or grading) ────────────────────
  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPhase('complete')}
          className="btn-ghost !p-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="w-full h-2 bg-parchment-200 dark:bg-warmBrown-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-olive-500 dark:bg-olive-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + (phase === 'grading' ? 0.5 : 0)) / reviewQueue.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <span className="text-sm text-warmBrown-500 dark:text-parchment-400 font-medium">
          {currentIndex + 1}/{reviewQueue.length}
        </span>
      </div>

      {/* Verse reference */}
      {currentVerse && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVerse.id + phase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {phase === 'typing' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="font-serif text-xl font-bold text-warmBrown-800 dark:text-parchment-100">
                    {currentVerse.reference}
                  </h2>
                  <p className="text-xs text-warmBrown-400 dark:text-parchment-500 mt-1">
                    {currentVerse.learningPhase === 'beginner'
                      ? 'Read along and follow the verse'
                      : currentVerse.learningPhase === 'learning'
                      ? 'Fill in the missing words'
                      : 'Recall this verse from memory'}
                  </p>
                  {currentVerse.learningPhase !== 'mastered' && (
                    <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      currentVerse.learningPhase === 'beginner'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-olive-100 text-olive-700 dark:bg-olive-900/40 dark:text-olive-300'
                    }`}>
                      {currentVerse.learningPhase === 'beginner' ? 'Beginner' : 'Learning'}
                    </span>
                  )}
                </div>
                <TypingInput
                  verseText={currentVerse.text}
                  mode={inputMode}
                  clozeRate={clozeRate}
                  learningPhase={currentVerse.learningPhase}
                  onComplete={handleTypingComplete}
                />
              </div>
            )}

            {phase === 'grading' && (
              <SelfGrade
                verseText={currentVerse.text}
                displayRef={currentVerse.reference}
                userInput={userInput}
                inputMode={inputMode}
                onGrade={handleGrade}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
