import { useState } from 'react';
import type { Collection } from '@/types';

interface CollectionSettingsProps {
  collection: Collection;
  onUpdate: (collectionId: string, updates: Partial<Collection>) => Promise<void>;
  onClose: () => void;
}

export default function CollectionSettings({ collection, onUpdate, onClose }: CollectionSettingsProps) {
  const [dripEnabled, setDripEnabled] = useState(!!collection.dripRate);
  const [dripRate, setDripRate] = useState(collection.dripRate ?? 3);
  const [dripPeriod, setDripPeriod] = useState<'day' | 'week'>(collection.dripPeriod ?? 'day');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dripEnabled) {
        await onUpdate(collection.id, {
          dripRate,
          dripPeriod,
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-warmBrown-700 dark:text-parchment-200">Add</span>
            <input
              type="number"
              min={1}
              max={50}
              value={dripRate}
              onChange={(e) => setDripRate(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field !w-16 text-center !px-2"
            />
            <span className="text-sm text-warmBrown-700 dark:text-parchment-200">new verses per</span>
            <select
              value={dripPeriod}
              onChange={(e) => setDripPeriod(e.target.value as 'day' | 'week')}
              className="input-field !w-24 !px-2"
            >
              <option value="day">day</option>
              <option value="week">week</option>
            </select>
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
