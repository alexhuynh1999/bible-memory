import { useEffect, useCallback } from 'react';
import type { Collection, Verse } from '@/types';

interface UseDripProps {
  collections: Collection[];
  verses: Verse[];
  onUpdateVerseActive: (verseId: string, active: boolean) => Promise<void>;
  onUpdateCollection: (collectionId: string, updates: Partial<Collection>) => Promise<void>;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  const diffMs = b.getTime() - a.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Hook that processes drip-feed logic for collections on mount / when data changes.
 * For each collection with a dripRate, calculates how many new verses should be
 * activated since the last check and activates them.
 */
export function useDrip({
  collections,
  verses,
  onUpdateVerseActive,
  onUpdateCollection,
}: UseDripProps) {
  const processDrip = useCallback(async () => {
    const today = todayStr();
    for (const coll of collections) {
      if (!coll.dripRate || coll.dripRate <= 0) continue;

      const period = coll.dripPeriod ?? 'day';
      const cursor = coll.dripCursor ?? 0;
      const lastChecked = coll.dripLastChecked ?? '';

      // If already checked today, skip
      if (lastChecked === today) continue;

      // Get verses in this collection, ordered by verseOrder
      const collVerses = coll.verseOrder
        .map((id) => verses.find((v) => v.id === id))
        .filter(Boolean) as Verse[];

      if (collVerses.length === 0) continue;

      // Calculate how many periods have elapsed since last check
      let periodsElapsed = 1; // at least 1 if we haven't checked today
      if (lastChecked) {
        const days = daysBetween(lastChecked, today);
        if (period === 'week') {
          periodsElapsed = Math.max(1, Math.floor(days / 7));
        } else {
          periodsElapsed = Math.max(1, days);
        }
      }

      // How many new verses to activate
      const newVersesToActivate = coll.dripRate * periodsElapsed;
      const endIndex = Math.min(cursor + newVersesToActivate, collVerses.length);

      // Activate verses from cursor to endIndex
      for (let i = cursor; i < endIndex; i++) {
        const verse = collVerses[i];
        if (verse && !verse.active) {
          await onUpdateVerseActive(verse.id, true);
        }
      }

      // Update the collection's drip cursor and last checked date
      await onUpdateCollection(coll.id, {
        dripCursor: endIndex,
        dripLastChecked: today,
      });
    }
  }, [collections, verses, onUpdateVerseActive, onUpdateCollection]);

  // Run drip processing on mount and when collections/verses change
  useEffect(() => {
    const hasDripCollections = collections.some((c) => c.dripRate && c.dripRate > 0);
    if (hasDripCollections) {
      processDrip();
    }
  }, [processDrip, collections]);
}
