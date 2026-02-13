import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';

// ─── FSRS Configuration ─────────────────────────────────────

const params = generatorParameters({
  request_retention: 0.9,   // Target 90% recall probability
  maximum_interval: 365,    // Max 1 year between reviews
  enable_fuzz: true,        // Add slight randomization to intervals
});

const scheduler = fsrs(params);

// ─── Exports ────────────────────────────────────────────────

export { Rating };
export type { Grade };

/**
 * Sanitize a Card for Firestore storage.
 * Firestore rejects `undefined` values, so we convert them to `null`.
 */
export function cardForFirestore(card: Card): Record<string, unknown> {
  return JSON.parse(JSON.stringify(card, (_key, value) => value === undefined ? null : value));
}

/**
 * Rehydrate a Card from Firestore back into a proper Card object.
 * Converts `null` back to `undefined` for the `last_review` field.
 */
export function cardFromFirestore(data: Record<string, unknown>): Card {
  return {
    ...data,
    last_review: data.last_review ?? undefined,
  } as Card;
}

/** Create a fresh FSRS card for a newly added verse */
export function createNewCard(): Card {
  return createEmptyCard(new Date());
}

/**
 * Schedule the next review for a card based on the user's grade.
 * Returns the updated card.
 *
 * Grades (excludes Manual=0):
 *   1 = Again (forgot)
 *   2 = Hard  (barely remembered)
 *   3 = Good  (remembered with effort)
 *   4 = Easy  (effortlessly remembered)
 */
export function scheduleReview(card: Card, grade: Grade): Card {
  const result = scheduler.next(card, new Date(), grade);
  return result.card;
}

/**
 * Check if a card is due for review.
 */
export function isDue(card: Card): boolean {
  const now = new Date();
  const due = new Date(card.due);
  return due <= now;
}

/**
 * Get the number of days until a card is due.
 * Negative means overdue.
 */
export function daysUntilDue(card: Card): number {
  const now = new Date();
  const due = new Date(card.due);
  const diffMs = due.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
