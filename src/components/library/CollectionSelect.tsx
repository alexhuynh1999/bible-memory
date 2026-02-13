import { useState, useRef, useEffect } from 'react';
import type { Collection } from '@/types';

interface CollectionSelectProps {
  collections: Collection[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  /** Optional: show verse count next to each collection */
  verseCounts?: Record<string, number>;
}

export default function CollectionSelect({
  collections,
  selectedId,
  onChange,
  placeholder = 'Search collections...',
  verseCounts,
}: CollectionSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = collections.find((c) => c.id === selectedId) ?? null;

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input / selected display */}
      <div
        className="input-field flex items-center gap-2 cursor-pointer !py-2"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {selected && !isOpen ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-warmBrown-800 dark:text-parchment-100 truncate">
              {selected.name}
            </span>
            <button
              onClick={handleClear}
              className="flex-shrink-0 text-warmBrown-400 hover:text-warmBrown-600 dark:text-parchment-400 dark:hover:text-parchment-200 p-0.5"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm text-warmBrown-800 dark:text-parchment-100 placeholder-warmBrown-400 dark:placeholder-warmBrown-500"
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-warmBrown-800 border border-parchment-200 dark:border-warmBrown-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((coll) => {
              const isSelected = coll.id === selectedId;
              const count = verseCounts?.[coll.id];
              return (
                <button
                  key={coll.id}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-warmBrown-50 dark:bg-warmBrown-700 text-warmBrown-800 dark:text-parchment-100'
                      : 'text-warmBrown-700 dark:text-parchment-200 hover:bg-parchment-50 dark:hover:bg-warmBrown-700'
                  }`}
                  onClick={() => handleSelect(coll.id)}
                >
                  <span className="text-sm font-medium truncate">{coll.name}</span>
                  {count !== undefined && (
                    <span className="text-xs text-warmBrown-400 dark:text-parchment-400 flex-shrink-0 ml-2">
                      {count} verse{count !== 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-3 text-sm text-warmBrown-400 dark:text-parchment-500 text-center">
              No collections found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
