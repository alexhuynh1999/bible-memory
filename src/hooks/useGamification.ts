import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, DailyReviewEntry } from '@/types';
import { levelFromXp, xpForRating } from '@/types';

const DEFAULT_PROFILE: UserProfile = {
  streak: 0,
  lastReviewDate: '',
  xp: 0,
  level: 0,
  totalVersesReviewed: 0,
  createdAt: Date.now(),
};

function profileDoc(uid: string) {
  return doc(db, 'users', uid, 'profile', 'main');
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate diminishing XP for a verse re-review.
 * First review of a verse today: full XP based on rating.
 * Subsequent reviews: XP halved each time (10 -> 5 -> 2 -> 1 -> 0).
 * If a previous attempt was imperfect and current is perfect: award the difference.
 */
function calculateDiminishedXp(
  rating: number,
  entry: DailyReviewEntry | undefined
): number {
  const fullXp = xpForRating(rating);

  if (!entry) {
    // First review of this verse today
    return fullXp;
  }

  // Already reviewed before today
  const prevBestXp = xpForRating(entry.maxRating);

  if (rating > entry.maxRating) {
    // Better rating than before: award the difference between full XP at new rating
    // and what was already earned at the best rating
    const bonusDiff = fullXp - prevBestXp;
    return Math.max(bonusDiff, 0);
  }

  // Same or worse rating: diminishing returns
  // Halve for each subsequent review: base -> base/2 -> base/4 -> ...
  const reviewCount = entry.count;
  const diminished = Math.floor(fullXp / Math.pow(2, reviewCount));
  return diminished; // Will naturally reach 0
}

export function useGamification(uid: string | null) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [leveledUp, setLeveledUp] = useState(false);

  useEffect(() => {
    if (!uid) {
      setProfile(DEFAULT_PROFILE);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(profileDoc(uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Reset dailyReviewLog if the day changed
        if (data.lastReviewDate !== todayStr()) {
          data.dailyReviewLog = {};
        }
        setProfile(data);
      } else {
        // Initialize profile
        setDoc(profileDoc(uid), DEFAULT_PROFILE);
        setProfile(DEFAULT_PROFILE);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  /** Record a review and update XP, streak, etc. */
  const recordReview = useCallback(
    async (rating: number, verseId: string) => {
      if (!uid) return;

      const today = todayStr();
      const yesterday = yesterdayStr();

      // Get or reset the daily review log
      let dailyLog: Record<string, DailyReviewEntry> = {};
      if (profile.lastReviewDate === today && profile.dailyReviewLog) {
        dailyLog = { ...profile.dailyReviewLog };
      }

      // Calculate XP with diminishing returns
      const existingEntry = dailyLog[verseId];
      const earnedXp = calculateDiminishedXp(rating, existingEntry);
      const newXp = profile.xp + earnedXp;
      const oldLevel = profile.level;
      const newLevel = levelFromXp(newXp);

      // Update the daily log entry for this verse
      dailyLog[verseId] = {
        count: (existingEntry?.count ?? 0) + 1,
        maxRating: Math.max(existingEntry?.maxRating ?? 0, rating),
        totalXpEarned: (existingEntry?.totalXpEarned ?? 0) + earnedXp,
      };

      // Update streak
      let newStreak = profile.streak;
      if (profile.lastReviewDate === today) {
        // Already reviewed today, no streak change
      } else if (profile.lastReviewDate === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1; // Reset streak
      }

      const updates: UserProfile = {
        ...profile,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastReviewDate: today,
        totalVersesReviewed: profile.totalVersesReviewed + 1,
        dailyReviewLog: dailyLog,
      };

      await setDoc(profileDoc(uid), updates);

      if (newLevel > oldLevel) {
        setLeveledUp(true);
      }
    },
    [uid, profile]
  );

  const dismissLevelUp = useCallback(() => {
    setLeveledUp(false);
  }, []);

  return {
    profile,
    loading,
    leveledUp,
    recordReview,
    dismissLevelUp,
  };
}
