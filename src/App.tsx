import { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import LevelUpAnimation from '@/components/gamification/LevelUpAnimation';
import AddVerseModal from '@/components/library/AddVerseModal';
import DashboardPage from '@/pages/DashboardPage';
import HomePage from '@/pages/HomePage';
import ReviewPage from '@/pages/ReviewPage';
import ProfilePage from '@/pages/ProfilePage';
import { useAuth } from '@/hooks/useAuth';
import { useVerses } from '@/hooks/useVerses';
import { useCollections } from '@/hooks/useCollections';
import { useGamification } from '@/hooks/useGamification';
import { useTheme } from '@/hooks/useTheme';
import { useInputMode } from '@/hooks/useInputMode';
import { useDrip } from '@/hooks/useDrip';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-warmBrown-900 flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-2xl font-bold text-warmBrown-700 dark:text-parchment-200 mb-2">Bible Memory</p>
        <p className="text-warmBrown-400 dark:text-parchment-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { uid, loading: authLoading, isAnonymous, linkGoogle, signOut } = useAuth();
  const { verses, loading: versesLoading, addVerse, addVersesBatch, updateVerseFsrs, updateVerseCollections, updateVerseActive, removeVerse } = useVerses(uid);
  const { collections, loading: collectionsLoading, addCollection, updateCollection, removeCollection } = useCollections(uid);
  const { profile, loading: profileLoading, leveledUp, recordReview, dismissLevelUp } = useGamification(uid);
  const { preference: themePreference, setTheme } = useTheme();
  const { inputMode, setInputMode, clozeRate, setClozeRate } = useInputMode();

  // Add Verse Modal state (lifted to app level for the nav + button)
  const [showAddVerse, setShowAddVerse] = useState(false);

  // Process drip-feed logic for collections
  useDrip({
    collections,
    verses,
    onUpdateVerseActive: updateVerseActive,
    onUpdateCollection: updateCollection,
  });

  // Drip-aware wrapper for addVerse: if adding to a drip-feed collection,
  // respect the drip cursor to determine whether the verse should be active.
  // Also updates the collection's verseOrder.
  const handleAddVerse = useCallback(
    async (
      verseData: Parameters<typeof addVerse>[0],
      options?: { collectionIds?: string[] }
    ) => {
      const collIds = options?.collectionIds ?? [];
      const dripColl = collIds.length > 0
        ? collections.find((c) => collIds.includes(c.id) && c.dripRate && c.dripRate > 0)
        : undefined;

      let shouldBeActive = true;
      if (dripColl) {
        const cursor = dripColl.dripCursor ?? 0;
        const currentLen = dripColl.verseOrder.length;
        if (cursor === 0 && currentLen === 0) {
          // Fresh drip collection — this is the first verse, part of initial batch
          shouldBeActive = true; // index 0 < dripRate is always true
        } else {
          // Collection already has verses — new verse goes past cursor, inactive
          shouldBeActive = currentLen < cursor;
        }
      }

      const result = await addVerse(verseData, { collectionIds: collIds, active: shouldBeActive });

      // Update verseOrder on each selected collection
      if (result) {
        for (const collId of collIds) {
          const coll = collections.find((c) => c.id === collId);
          if (coll) {
            const newOrder = [...coll.verseOrder, result.id];
            const collUpdates: Record<string, unknown> = { verseOrder: newOrder };
            // If fresh drip collection, initialize cursor to dripRate
            if (dripColl && collId === dripColl.id && (dripColl.dripCursor ?? 0) === 0 && coll.verseOrder.length === 0) {
              collUpdates.dripCursor = Math.min(dripColl.dripRate!, newOrder.length);
              collUpdates.dripLastChecked = new Date().toISOString().split('T')[0];
            }
            await updateCollection(collId, collUpdates);
          }
        }
      }
      return result;
    },
    [addVerse, collections, updateCollection]
  );

  // Drip-aware wrapper for addVersesBatch: for drip-feed collections,
  // only the first dripRate verses are active (initial batch), the rest inactive.
  // Also updates each collection's verseOrder.
  const handleAddVersesBatch = useCallback(
    async (
      versesData: Parameters<typeof addVersesBatch>[0],
      options?: { collectionIds?: string[] }
    ) => {
      const collIds = options?.collectionIds ?? [];
      const dripColl = collIds.length > 0
        ? collections.find((c) => collIds.includes(c.id) && c.dripRate && c.dripRate > 0)
        : undefined;

      const createdIds: string[] = [];

      if (dripColl) {
        const cursor = dripColl.dripCursor ?? 0;
        const currentLen = dripColl.verseOrder.length;
        const dripRate = dripColl.dripRate!;

        // Determine how many of the NEW verses should be active:
        // - Fresh collection (cursor=0, empty): activate the first dripRate
        // - Existing collection: activate only if position < cursor
        let activeCount: number;
        if (cursor === 0 && currentLen === 0) {
          // Initial batch: first dripRate verses are active
          activeCount = Math.min(dripRate, versesData.length);
        } else {
          // Subsequent adds: all go past the cursor, none active
          activeCount = Math.max(0, cursor - currentLen);
        }

        // Add verses one by one to control active per-verse
        for (let i = 0; i < versesData.length; i++) {
          const shouldBeActive = i < activeCount;
          const result = await addVerse(versesData[i], {
            collectionIds: collIds,
            active: shouldBeActive,
          });
          if (result) createdIds.push(result.id);
        }
      } else {
        // No drip mode — add all as active
        const results = await addVersesBatch(versesData, { collectionIds: collIds, active: true });
        if (results) {
          for (const v of results) createdIds.push(v.id);
        }
      }

      // Update verseOrder on each selected collection
      for (const collId of collIds) {
        const coll = collections.find((c) => c.id === collId);
        if (coll) {
          const newOrder = [...coll.verseOrder, ...createdIds];
          const collUpdates: Record<string, unknown> = { verseOrder: newOrder };
          // If fresh drip collection, initialize cursor
          if (dripColl && collId === dripColl.id && (dripColl.dripCursor ?? 0) === 0 && coll.verseOrder.length === 0) {
            const initialActive = Math.min(dripColl.dripRate!, createdIds.length);
            collUpdates.dripCursor = initialActive;
            collUpdates.dripLastChecked = new Date().toISOString().split('T')[0];
          }
          await updateCollection(collId, collUpdates);
        }
      }

      return createdIds;
    },
    [addVerse, addVersesBatch, collections, updateCollection]
  );

  // When a queued (inactive) verse is manually reviewed, activate it and
  // advance the drip cursor so the next verse in line also becomes active.
  const handleActivateReviewedVerse = useCallback(
    async (verseId: string) => {
      const verse = verses.find((v) => v.id === verseId);
      if (!verse || verse.active !== false) return; // already active, nothing to do

      // Activate the reviewed verse
      await updateVerseActive(verseId, true);

      // For each drip-feed collection this verse belongs to, activate the next queued verse
      for (const collId of verse.collectionIds) {
        const coll = collections.find((c) => c.id === collId);
        if (!coll || !coll.dripRate || coll.dripRate <= 0) continue;

        const cursor = coll.dripCursor ?? 0;
        if (cursor >= coll.verseOrder.length) continue; // no more verses to activate

        // The verse at the cursor is the next in drip order — activate it
        const nextVerseId = coll.verseOrder[cursor];
        if (nextVerseId && nextVerseId !== verseId) {
          await updateVerseActive(nextVerseId, true);
        }

        // Advance the cursor
        await updateCollection(collId, { dripCursor: cursor + 1 });
      }
    },
    [verses, collections, updateVerseActive, updateCollection]
  );

  // When deleting a collection, also delete all verses that belong to it
  const handleRemoveCollection = useCallback(
    async (collectionId: string) => {
      const versesInCollection = verses.filter((v) =>
        v.collectionIds.includes(collectionId)
      );
      for (const verse of versesInCollection) {
        await removeVerse(verse.id);
      }
      await removeCollection(collectionId);
    },
    [verses, removeVerse, removeCollection]
  );

  const isLoading = authLoading || versesLoading || collectionsLoading || profileLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Routes>
        <Route element={<AppShell onAddPress={() => setShowAddVerse(true)} />}>
          <Route
            index
            element={
              <DashboardPage
                verses={verses}
                collections={collections}
                profile={profile}
              />
            }
          />
          <Route
            path="/library"
            element={
              <HomePage
                verses={verses}
                collections={collections}
                onRemoveVerse={removeVerse}
                onUpdateVerseCollections={updateVerseCollections}
                onAddCollection={addCollection}
                onUpdateCollection={updateCollection}
                onRemoveCollection={handleRemoveCollection}
              />
            }
          />
          <Route
            path="/review"
            element={
              <ReviewPage
                verses={verses}
                collections={collections}
                inputMode={inputMode}
                clozeRate={clozeRate}
                onUpdateFsrs={updateVerseFsrs}
                onRecordReview={recordReview}
                onActivateVerse={handleActivateReviewedVerse}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                profile={profile}
                verses={verses}
                isAnonymous={isAnonymous}
                onSignIn={linkGoogle}
                onSignOut={signOut}
                themePreference={themePreference}
                onSetTheme={setTheme}
                inputMode={inputMode}
                onSetInputMode={setInputMode}
                clozeRate={clozeRate}
                onSetClozeRate={setClozeRate}
              />
            }
          />
        </Route>
      </Routes>

      {/* Add Verse Modal (app-level, triggered from nav + button) */}
      <AddVerseModal
        open={showAddVerse}
        onClose={() => setShowAddVerse(false)}
        onAdd={handleAddVerse}
        onAddBatch={handleAddVersesBatch}
        collections={collections}
      />

      <LevelUpAnimation
        show={leveledUp}
        level={profile.level}
        onDismiss={dismissLevelUp}
      />
    </>
  );
}
