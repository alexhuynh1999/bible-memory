import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VerseCard from '@/components/library/VerseCard';
import CollectionCard from '@/components/library/CollectionCard';
import CollectionSettings from '@/components/library/CollectionSettings';
import { isDue } from '@/lib/fsrs';
import { compareReferences } from '@/lib/bibleApi';
import type { Verse, Collection } from '@/types';

interface HomePageProps {
  verses: Verse[];
  collections: Collection[];
  onRemoveVerse: (id: string) => void;
  onUpdateVerseCollections: (verseId: string, collectionIds: string[]) => Promise<void>;
  onToggleStarred: (verseId: string) => void;
  onAddCollection: (name: string, description?: string) => Promise<unknown>;
  onUpdateCollection: (collectionId: string, updates: Partial<Collection>) => Promise<void>;
  onRemoveCollection: (id: string) => void;
}

type ViewTab = 'all' | 'collections' | 'due';

export default function HomePage({
  verses,
  collections,
  onRemoveVerse,
  onUpdateVerseCollections,
  onToggleStarred,
  onAddCollection,
  onUpdateCollection,
  onRemoveCollection,
}: HomePageProps) {
  const navigate = useNavigate();
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollName, setNewCollName] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [settingsCollectionId, setSettingsCollectionId] = useState<string | null>(null);
  const [viewCollectionId, setViewCollectionId] = useState<string | null>(null);

  const [reviewPromptVerseId, setReviewPromptVerseId] = useState<string | null>(null);

  const dueVerses = verses.filter((v) => v.active !== false && isDue(v.fsrsCard));

  const handleCreateCollection = async () => {
    if (!newCollName.trim()) return;
    await onAddCollection(newCollName.trim());
    setNewCollName('');
    setShowNewCollection(false);
  };

  const filteredVerses = activeTab === 'due' ? dueVerses : verses;

  // ─── Collection Detail View ──────────────────────────────
  if (viewCollectionId) {
    const viewCollection = collections.find((c) => c.id === viewCollectionId);
    const collectionVerses = verses
      .filter((v) => v.collectionIds.includes(viewCollectionId))
      .sort((a, b) => compareReferences(a.reference, b.reference));

    return (
      <div className="space-y-5">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <button onClick={() => setViewCollectionId(null)} className="btn-ghost !p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 font-serif">
              {viewCollection?.name ?? 'Collection'}
            </h1>
            {viewCollection?.description && (
              <p className="text-xs text-warmBrown-500 dark:text-parchment-400">{viewCollection.description}</p>
            )}
          </div>
        </div>

        {/* Verse count summary */}
        <p className="text-sm text-warmBrown-500 dark:text-parchment-400">
          {collectionVerses.length} verse{collectionVerses.length !== 1 ? 's' : ''}
        </p>

        {/* Verse list */}
        <div className="space-y-3">
          <AnimatePresence>
            {collectionVerses.map((verse) => (
              <motion.div
                key={verse.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <VerseCard
                  verse={verse}
                  collections={collections}
                  onClick={(id) => {
                    const idx = collectionVerses.findIndex((v) => v.id === id);
                    const isLast = idx >= 0 && idx === collectionVerses.length - 1;
                    if (isLast) {
                      navigate(`/review?verseId=${id}`);
                    } else {
                      setReviewPromptVerseId(id);
                    }
                  }}
                  onRemove={onRemoveVerse}
                  onUpdateCollections={onUpdateVerseCollections}
                  onToggleStarred={onToggleStarred}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {collectionVerses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-warmBrown-400 dark:text-parchment-500 text-lg mb-2">No verses in this collection</p>
              <p className="text-warmBrown-300 dark:text-warmBrown-500 text-sm">
                Add verses and assign them to this collection.
              </p>
            </div>
          )}
        </div>

        {/* Review prompt overlay */}
        <AnimatePresence>
          {reviewPromptVerseId && (() => {
            const promptVerse = collectionVerses.find((v) => v.id === reviewPromptVerseId);
            const startIdx = collectionVerses.findIndex((v) => v.id === reviewPromptVerseId);
            const remainingCount = startIdx >= 0 ? collectionVerses.length - startIdx : 0;
            return (
              <motion.div
                key="review-prompt"
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/40 dark:bg-black/60"
                  onClick={() => setReviewPromptVerseId(null)}
                />
                {/* Popup */}
                <motion.div
                  className="relative w-full max-w-sm mx-auto bg-white dark:bg-warmBrown-800 rounded-2xl p-5 space-y-4 shadow-xl"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                >
                  <div className="text-center">
                    <p className="font-serif font-semibold text-warmBrown-800 dark:text-parchment-100">
                      {promptVerse?.reference ?? 'Review'}
                    </p>
                    <p className="text-xs text-warmBrown-500 dark:text-parchment-400 mt-0.5">
                      How would you like to review?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      className="w-full border border-parchment-200 dark:border-warmBrown-600 rounded-xl p-4 text-left transition-colors hover:border-warmBrown-300 dark:hover:border-warmBrown-500 flex items-center gap-3"
                      onClick={() => {
                        setReviewPromptVerseId(null);
                        navigate(`/review?verseId=${reviewPromptVerseId}`);
                      }}
                    >
                      <span className="text-2xl">📖</span>
                      <div>
                        <p className="font-medium text-sm text-warmBrown-800 dark:text-parchment-100">This Verse</p>
                        <p className="text-xs text-warmBrown-500 dark:text-parchment-400">Review just this verse</p>
                      </div>
                    </button>
                    {remainingCount > 1 && (
                      <button
                        className="w-full border border-parchment-200 dark:border-warmBrown-600 rounded-xl p-4 text-left transition-colors hover:border-warmBrown-300 dark:hover:border-warmBrown-500 flex items-center gap-3"
                        onClick={() => {
                          setReviewPromptVerseId(null);
                          navigate(
                            `/review?collectionId=${viewCollectionId}&startVerseId=${reviewPromptVerseId}&mode=sequential`
                          );
                        }}
                      >
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="font-medium text-sm text-warmBrown-800 dark:text-parchment-100">In Order</p>
                          <p className="text-xs text-warmBrown-500 dark:text-parchment-400">
                            Continuous from here ({remainingCount} verse{remainingCount !== 1 ? 's' : ''})
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setReviewPromptVerseId(null)}
                    className="w-full text-sm text-warmBrown-500 dark:text-parchment-400 py-2 hover:text-warmBrown-700 dark:hover:text-parchment-200 transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <h1 className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 font-serif">
        Library
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-parchment-100 dark:bg-warmBrown-800 rounded-xl p-1">
        {(['all', 'due', 'collections'] as ViewTab[]).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-warmBrown-700 text-warmBrown-800 dark:text-parchment-100 shadow-sm'
                : 'text-warmBrown-500 dark:text-parchment-400 hover:text-warmBrown-700 dark:hover:text-parchment-200'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'All Verses' : tab === 'due' ? `Due (${dueVerses.length})` : 'Collections'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'collections' ? (
        <div className="space-y-3">
          {settingsCollectionId && (
            <CollectionSettings
              collection={collections.find((c) => c.id === settingsCollectionId)!}
              onUpdate={onUpdateCollection}
              onClose={() => setSettingsCollectionId(null)}
            />
          )}
          {collections
            .filter((c) => c.id !== settingsCollectionId)
            .map((coll) => (
              <CollectionCard
                key={coll.id}
                collection={coll}
                verses={verses}
                onClick={(id) => setViewCollectionId(id)}
                onRemove={onRemoveCollection}
                onOpenSettings={(id) => setSettingsCollectionId(id)}
              />
          ))}

          {showNewCollection ? (
            <div className="card space-y-3">
              <input
                type="text"
                value={newCollName}
                onChange={(e) => setNewCollName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                placeholder="Collection name"
                className="input-field"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleCreateCollection} className="btn-primary flex-1" disabled={!newCollName.trim()}>
                  Create
                </button>
                <button onClick={() => setShowNewCollection(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCollection(true)}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Collection
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredVerses.map((verse) => (
              <motion.div
                key={verse.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <VerseCard
                  verse={verse}
                  collections={collections}
                  onClick={(id) => navigate(`/review?verseId=${id}`)}
                  onRemove={onRemoveVerse}
                  onUpdateCollections={onUpdateVerseCollections}
                  onToggleStarred={onToggleStarred}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredVerses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-warmBrown-400 dark:text-parchment-500 text-lg mb-2">
                {activeTab === 'due' ? 'No verses due for review!' : 'No verses yet'}
              </p>
              <p className="text-warmBrown-300 dark:text-warmBrown-500 text-sm">
                {activeTab === 'due'
                  ? 'Great job keeping up with your reviews.'
                  : 'Tap the + button to add your first verse.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
