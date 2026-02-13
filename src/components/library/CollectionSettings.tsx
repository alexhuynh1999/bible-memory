import { useState } from 'react';
import type { Collection } from '@/types';

interface CollectionSettingsProps {
  collection: Collection;
  onUpdate: (collectionId: string, updates: Partial<Collection>) => Promise<void>;
  onClose: () => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Migrate legacy dripPeriod to dripDays. */
function initDripDays(coll: Collection): number[] {
  if (coll.dripDays && coll.dripDays.length > 0) return coll.dripDays;
  if (coll.dripPeriod === 'week') return [1]; // legacy "weekly" → Monday only
  return ALL_DAYS; // legacy "daily" or default → every day
}

export default function CollectionSettings({ collection, onUpdate, onClose }: CollectionSettingsProps) {
  const [dripEnabled, setDripEnabled] = useState(!!collection.dripRate);
  const [dripRate, setDripRate] = useState(collection.dripRate ?? 3);
  const [dripDays, setDripDays] = useState<number[]>(() => initDripDays(collection));
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setDripDays((prev) => {
      if (prev.includes(day)) {
        // Don't allow deselecting the last day
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort();
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dripEnabled) {
        await onUpdate(collection.id, {
          dripRate,
          dripDays,
          ...(collection.dripCursor === undefined && { dripCursor: 0 }),
        });
      } else {
        // Disable drip -- set rate to 0 (can't delete fields with merge)
        await onUpdate(collection.id, {
          dripRate: 0,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-warmBrown-800 dark:text-parchment-100">
          {collection.name} — Settings
        </h3>
        <button
          onClick={onClose}
          className="text-warmBrown-400 hover:text-warmBrown-600 dark:text-parchment-400 dark:hover:text-parchment-200 p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drip feed toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={dripEnabled}
          onChange={(e) => setDripEnabled(e.target.checked)}
          className="rounded border-warmBrown-300 text-warmBrown-600 focus:ring-warmBrown-400 h-5 w-5"
        />
        <div>
          <p className="text-sm font-medium text-warmBrown-800 dark:text-parchment-100">Drip-Feed Mode</p>
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400">
            Gradually add verses to your review queue
          </p>
        </div>
      </label>

      {dripEnabled && (
        <div className="space-y-3 pl-8">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-warmBrown-700 dark:text-parchment-200">Add</span>
            <input
              type="number"
              min={1}
              max={50}
              value={dripRate}
              onChange={(e) => setDripRate(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field !w-16 text-center !px-2"
            />
            <span className="text-sm text-warmBrown-700 dark:text-parchment-200">new verse{dripRate !== 1 ? 's' : ''} on</span>
          </div>

          {/* Day-of-week picker */}
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, idx) => {
              const isSelected = dripDays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`w-9 h-9 rounded-full text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-warmBrown-600 text-white dark:bg-olive-500 dark:text-warmBrown-900'
                      : 'bg-parchment-100 text-warmBrown-400 hover:bg-parchment-200 dark:bg-warmBrown-700 dark:text-parchment-500 dark:hover:bg-warmBrown-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {collection.dripCursor !== undefined && (
            <p className="text-xs text-warmBrown-400 dark:text-parchment-500">
              {collection.dripCursor} of {collection.verseOrder.length} verses activated so far
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </div>
  );
}
