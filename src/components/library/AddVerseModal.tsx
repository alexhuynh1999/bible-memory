import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPassageVerses, getBookName } from '@/lib/bibleApi';
import CollectionSelect from './CollectionSelect';
import type { Verse, Collection } from '@/types';

interface AddVerseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    verse: Omit<Verse, 'id' | 'fsrsCard' | 'createdAt' | 'collectionIds' | 'active'>,
    options?: { collectionIds?: string[] }
  ) => Promise<unknown>;
  onAddBatch?: (
    verses: Omit<Verse, 'id' | 'fsrsCard' | 'createdAt' | 'collectionIds' | 'active'>[],
    options?: { collectionIds?: string[] }
  ) => Promise<unknown>;
  collections: Collection[];
}

export default function AddVerseModal({ open, onClose, onAdd, onAddBatch, collections }: AddVerseModalProps) {
  const [reference, setReference] = useState('');
  const [preview, setPreview] = useState<{ canonical: string; text: string } | null>(null);
  const [rangePreview, setRangePreview] = useState<{ canonical: string; verses: { reference: string; text: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!reference.trim()) return;

    setLoading(true);
    setError('');
    setPreview(null);
    setRangePreview(null);
    setAdded(false);

    try {
      // Always fetch with verse numbers so any passage (single verse,
      // range, or whole chapter) gets split verse-by-verse automatically.
      const result = await getPassageVerses(reference.trim());
      if (result.verses.length > 1) {
        setRangePreview(result);
      } else {
        // Single verse
        setPreview({
          canonical: result.verses[0]?.reference ?? result.canonical,
          text: result.verses[0]?.text ?? '',
        });
      }
    } catch {
      setError('Passage not found. Try a format like "John 3:16", "Psalm 23", or "Genesis 1:1-5".');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      const collectionIds = selectedCollectionId ? [selectedCollectionId] : undefined;
      if (rangePreview && onAddBatch) {
        // Batch add for passage ranges
        const versesData = rangePreview.verses.map((v) => ({
          reference: v.reference,
          bookName: getBookName(v.reference),
          text: v.text,
        }));
        await onAddBatch(versesData, { collectionIds });
      } else if (preview) {
        await onAdd(
          {
            reference: preview.canonical,
            bookName: getBookName(preview.canonical),
            text: preview.text,
          },
          { collectionIds }
        );
      }
      setAdded(true);
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1000);
    } catch {
      setError('Failed to add verse. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReference('');
    setPreview(null);
    setRangePreview(null);
    setError('');
    setAdded(false);
    setSelectedCollectionId(null);
  };

  // Wipe state when the modal closes
  useEffect(() => {
    if (!open) handleReset();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasPreview = preview || rangePreview;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-warmBrown-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg mx-auto sm:mx-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-warmBrown-800 dark:text-parchment-100">Add Verse</h2>
              <button
                onClick={onClose}
                className="text-warmBrown-400 hover:text-warmBrown-600 dark:text-parchment-400 dark:hover:text-parchment-200 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warmBrown-700 dark:text-parchment-200 mb-1">
                  Verse Reference
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder='e.g. John 3:16, Psalm 23, or Genesis 1:1-5'
                    className="input-field flex-1"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !reference.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '...' : 'Look Up'}
                  </button>
                </div>
                <p className="text-xs text-warmBrown-400 dark:text-parchment-400 mt-1">
                  ESV translation · Chapters and ranges are split verse-by-verse
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              {/* Single verse preview */}
              {preview && (
                <motion.div
                  className="card !bg-parchment-50 dark:!bg-warmBrown-700"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <p className="font-serif font-semibold text-warmBrown-800 dark:text-parchment-100 mb-2">
                    {preview.canonical}
                  </p>
                  <p className="font-serif italic text-warmBrown-600 dark:text-parchment-300 text-sm leading-relaxed">
                    &ldquo;{preview.text}&rdquo;
                  </p>
                </motion.div>
              )}

              {/* Range preview */}
              {rangePreview && (
                <motion.div
                  className="space-y-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <p className="text-sm font-medium text-warmBrown-700 dark:text-parchment-200">
                    {rangePreview.canonical} — {rangePreview.verses.length} verses
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {rangePreview.verses.map((v) => (
                      <div key={v.reference} className="card !bg-parchment-50 dark:!bg-warmBrown-700 !p-3">
                        <p className="font-serif font-semibold text-warmBrown-800 dark:text-parchment-100 text-sm">
                          {v.reference}
                        </p>
                        <p className="font-serif italic text-warmBrown-600 dark:text-parchment-300 text-xs leading-relaxed mt-1">
                          &ldquo;{v.text}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Collection picker */}
              {hasPreview && collections.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-warmBrown-700 dark:text-parchment-200">
                    Add to Collection (optional)
                  </label>
                  <CollectionSelect
                    collections={collections}
                    selectedId={selectedCollectionId}
                    onChange={setSelectedCollectionId}
                    placeholder="Search collections..."
                  />
                </div>
              )}

              {/* Add button */}
              {hasPreview && (
                <button
                  onClick={handleAdd}
                  disabled={loading || added}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {added
                    ? 'Added!'
                    : loading
                    ? 'Adding...'
                    : rangePreview
                    ? `Add ${rangePreview.verses.length} Verses`
                    : 'Add to Library'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
