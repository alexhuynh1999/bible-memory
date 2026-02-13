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
 * Count how many of the selected drip days fall in the range (afterDate, upToDate].
 * Both parameters are YYYY-MM-DD strings. dripDays is an array of day indices (0=Sun..6=Sat).
 */
function countDripDaysInRange(afterDate: string, upToDate: string, dripDays: number[]): number {
  const start = new Date(afterDate);
  const end = new Date(upToDate);
  let count = 0;
  // Start from the day AFTER afterDate
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= end) {
    if (dripDays.includes(cursor.getDay())) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
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

      const cursor = coll.dripCursor ?? 0;
      const lastChecked = coll.dripLastChecked ?? '';

      // If already checked today, skip
      if (lastChecked === today) continue;

      // Get verses in this collection, ordered by verseOrder
      const collVerses = coll.verseOrder
        .map((id) => verses.find((v) => v.id === id))
        .filter(Boolean) as Verse[];

      if (collVerses.length === 0) continue;

      // Calculate how many drip periods have elapsed since last check
      let periodsElapsed: number;

      if (coll.dripDays && coll.dripDays.length > 0) {
        // Day-of-week mode: count how many selected days fall between lastChecked and today
        if (lastChecked) {
          periodsElapsed = countDripDaysInRange(lastChecked, today, coll.dripDays);
        } else {
          // First ever check — drip if today is a drip day
          periodsElapsed = coll.dripDays.includes(new Date(today).getDay()) ? 1 : 0;
        }
      } else {
        // Legacy mode: use dripPeriod ('day' | 'week')
        const period = coll.dripPeriod ?? 'day';
        periodsElapsed = 1; // at least 1 if we haven't checked today
        if (lastChecked) {
          const days = daysBetween(lastChecked, today);
          if (period === 'week') {
            periodsElapsed = Math.max(1, Math.floor(days / 7));
          } else {
            periodsElapsed = Math.max(1, days);
          }
        }
      }

      if (periodsElapsed <= 0) {
        // Today is not a drip day — still mark as checked so we don't re-evaluate
        await onUpdateCollection(coll.id, { dripLastChecked: today });
        continue;
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
