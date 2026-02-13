import { useState, useRef, useEffect } from 'react';
import { daysUntilDue } from '@/lib/fsrs';
import type { Verse, Collection } from '@/types';

interface VerseCardProps {
  verse: Verse;
  collections?: Collection[];
  onClick?: (id: string) => void;
  onRemove?: (id: string) => void;
  onUpdateCollections?: (verseId: string, collectionIds: string[]) => Promise<void>;
  onToggleStarred?: (verseId: string) => void;
}

export default function VerseCard({ verse, collections, onClick, onRemove, onUpdateCollections, onToggleStarred }: VerseCardProps) {
  const days = daysUntilDue(verse.fsrsCard);
  const isDueNow = days <= 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCollPicker, setShowCollPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const toggleCollection = async (collId: string) => {
    if (!onUpdateCollections) return;
    const newIds = verse.collectionIds.includes(collId)
      ? verse.collectionIds.filter((id) => id !== collId)
      : [...verse.collectionIds, collId];
    await onUpdateCollections(verse.id, newIds);
  };

  // Get collection names for display
  const collectionNames = collections
    ? verse.collectionIds
        .map((id) => collections.find((c) => c.id === id)?.name)
        .filter(Boolean)
    : [];

  const hasActions = onRemove || (collections && collections.length > 0 && onUpdateCollections);

  return (
    <div className={`card relative ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}`}
      onClick={() => onClick?.(verse.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Star toggle */}
          {onToggleStarred && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStarred(verse.id);
              }}
              className="flex-shrink-0 mt-0.5 p-0.5 transition-colors"
              aria-label={verse.starred ? 'Unstar verse' : 'Star verse'}
            >
              <svg
                className={`w-5 h-5 ${
                  verse.starred
                    ? 'text-amber-500 dark:text-amber-400 fill-current'
                    : 'text-parchment-300 dark:text-warmBrown-600 hover:text-amber-400 dark:hover:text-amber-500'
                }`}
                viewBox="0 0 24 24"
                fill={verse.starred ? 'currentColor' : 'none'}
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-warmBrown-800 dark:text-parchment-100 text-base">
              {verse.reference}
            </h3>
            <p className="text-sm text-warmBrown-600 dark:text-parchment-300 mt-1 line-clamp-2 font-serif italic">
              {verse.text}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 mt-0.5 flex items-center gap-1.5">
          {!verse.active && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-parchment-200 text-warmBrown-500 dark:bg-warmBrown-700 dark:text-parchment-400">
              Queued
            </span>
          )}
          {verse.learningPhase === 'beginner' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Beginner
            </span>
          )}
          {verse.learningPhase === 'learning' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-olive-100 text-olive-700 dark:bg-olive-900/40 dark:text-olive-300">
              Learning
            </span>
          )}
          {isDueNow ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              Due
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-parchment-100 text-warmBrown-500 dark:bg-warmBrown-700 dark:text-parchment-400">
              {days}d
            </span>
          )}

          {/* 3-dot menu button */}
          {hasActions && (
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                className="text-warmBrown-400 hover:text-warmBrown-600 dark:text-parchment-400 dark:hover:text-parchment-200 p-1 rounded-lg hover:bg-parchment-100 dark:hover:bg-warmBrown-700 transition-colors"
                aria-label="Verse options"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-warmBrown-800 border border-parchment-200 dark:border-warmBrown-600 rounded-xl shadow-lg py-1 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {collections && collections.length > 0 && onUpdateCollections && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setShowCollPicker((prev) => !prev);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-warmBrown-700 dark:text-parchment-200 hover:bg-parchment-50 dark:hover:bg-warmBrown-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                      </svg>
                      Collections
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onRemove(verse.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collection tags */}
      {collectionNames.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {collectionNames.map((name) => (
            <span
              key={name}
              className="text-xs bg-parchment-100 text-warmBrown-500 dark:bg-warmBrown-700 dark:text-parchment-400 rounded-full px-2 py-0.5"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Collection picker (toggled from menu) */}
      {showCollPicker && collections && (
        <div className="mt-3 pt-3 border-t border-parchment-200 dark:border-warmBrown-600 space-y-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-warmBrown-500 dark:text-parchment-400">Collections:</p>
            <button
              onClick={() => setShowCollPicker(false)}
              className="text-warmBrown-400 hover:text-warmBrown-600 dark:text-parchment-400 dark:hover:text-parchment-200 p-0.5"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {collections.map((coll) => (
            <label
              key={coll.id}
              className="flex items-center gap-2 text-sm text-warmBrown-700 dark:text-parchment-200 cursor-pointer hover:bg-parchment-50 dark:hover:bg-warmBrown-700 rounded-lg px-2 py-1"
            >
              <input
                type="checkbox"
                checked={verse.collectionIds.includes(coll.id)}
                onChange={() => toggleCollection(coll.id)}
                className="rounded border-warmBrown-300 text-warmBrown-600 focus:ring-warmBrown-400"
              />
              {coll.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
