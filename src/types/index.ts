import type { Card } from 'ts-fsrs';

// ─── App Data Types ─────────────────────────────────────────

export type LearningPhase = 'beginner' | 'learning' | 'mastered';

export interface Verse {
  id: string;
  reference: string;       // canonical ESV reference, e.g. "John 3:16"
  bookName: string;        // e.g. "John"
  text: string;            // cached verse text (ESV)
  collectionIds: string[];
  fsrsCard: Card;
  active: boolean;         // whether the verse is in the SRS review stack (drip-feed)
  learningPhase: LearningPhase; // beginner -> learning -> mastered progression
  createdAt: number;       // timestamp ms
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  verseOrder: string[];    // ordered verse IDs for sequential review
  createdAt: number;       // timestamp ms
  // Drip-feed settings
  dripRate?: number;       // how many new verses to add per drip day
  dripPeriod?: 'day' | 'week'; // legacy — superseded by dripDays when set
  dripDays?: number[];     // days of the week to drip (0=Sun, 1=Mon, ..., 6=Sat)
  dripCursor?: number;     // index into verseOrder of next verse to activate
  dripLastChecked?: string; // YYYY-MM-DD of last drip check
}

export interface DailyReviewEntry {
  count: number;
  maxRating: number;
  totalXpEarned: number;
}

export interface UserProfile {
  streak: number;
  lastReviewDate: string;  // YYYY-MM-DD
  xp: number;
  level: number;
  totalVersesReviewed: number;
  createdAt: number;
  dailyReviewLog?: Record<string, DailyReviewEntry>; // keyed by verseId
}

// ─── Review Types ───────────────────────────────────────────

export type ReviewScope = 'library' | 'collection';

export type ReviewMode = 'srs' | 'random' | 'sequential';

export type InputMode = 'full' | 'firstLetter' | 'fillBlank';

export interface ReviewSessionConfig {
  scope: ReviewScope;
  mode: ReviewMode;
  collectionId?: string;   // required when scope is 'collection'
  inputMode: InputMode;
  includeReference?: boolean; // quiz on verse reference
}

export interface ReviewResult {
  verseId: string;
  rating: number;          // FSRS rating: 1=Again, 2=Hard, 3=Good, 4=Easy
  inputMode: InputMode;
  timeTakenMs: number;
}

// ─── Gamification ───────────────────────────────────────────

export const XP_PER_REVIEW = 10;
export const XP_BONUS_GOOD = 5;
export const XP_BONUS_EASY = 10;

/** XP required to reach a given level: 100 * n * (n + 1) / 2 */
export function xpForLevel(level: number): number {
  return 100 * level * (level + 1) / 2;
}

/** Calculate current level from total XP */
export function levelFromXp(xp: number): number {
  // Solve: 100 * n * (n+1) / 2 <= xp
  // 50n^2 + 50n <= xp
  // n <= (-50 + sqrt(2500 + 200*xp)) / 100
  let level = Math.floor((-50 + Math.sqrt(2500 + 200 * xp)) / 100);
  if (level < 0) level = 0;
  return level;
}

/** Calculate XP earned for a review based on rating */
export function xpForRating(rating: number): number {
  let xp = XP_PER_REVIEW;
  if (rating === 3) xp += XP_BONUS_GOOD;
  if (rating === 4) xp += XP_BONUS_EASY;
  return xp;
}
