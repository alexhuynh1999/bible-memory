import { useState, useRef, useEffect } from 'react';
import type { Collection, Verse } from '@/types';

interface CollectionCardProps {
  collection: Collection;
  verses: Verse[];
  onClick: (id: string) => void;
  onRemove?: (id: string) => void;
  onOpenSettings?: (id: string) => void;
}

export default function CollectionCard({ collection, verses, onClick, onRemove, onOpenSettings }: CollectionCardProps) {
  const verseCount = verses.filter((v) => v.collectionIds.includes(collection.id)).length;
  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <div
      className="card cursor-pointer hover:shadow-md transition-shadow duration-200 relative"
      onClick={() => onClick(collection.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-warmBrown-800 dark:text-parchment-100">{collection.name}</h3>
          {collection.description && (
            <p className="text-xs text-warmBrown-500 dark:text-parchment-400 mt-0.5">{collection.description}</p>
          )}
          {collection.dripRate ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Drip: {collection.dripRate} per {collection.dripPeriod ?? 'day'}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-warmBrown-500 dark:text-parchment-400 bg-parchment-100 dark:bg-warmBrown-700 rounded-full px-2.5 py-0.5">
            {verseCount} verse{verseCount !== 1 ? 's' : ''}
          </span>

          {/* 3-dot menu button */}
          {(onRemove || onOpenSettings) && (
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                className="text-warmBrown-400 hover:text-warmBrown-600 dark:text-parchment-400 dark:hover:text-parchment-200 p-1 rounded-lg hover:bg-parchment-100 dark:hover:bg-warmBrown-700 transition-colors"
                aria-label="Collection options"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM10 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM11.5 15.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-warmBrown-800 border border-parchment-200 dark:border-warmBrown-600 rounded-xl shadow-lg py-1 min-w-[140px]">
                  {onOpenSettings && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onOpenSettings(collection.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-warmBrown-700 dark:text-parchment-200 hover:bg-parchment-50 dark:hover:bg-warmBrown-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      Settings
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onRemove(collection.id);
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
    </div>
  );
}
