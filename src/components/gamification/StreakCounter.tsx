interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2 bg-amber-50 dark:bg-olive-900/30 border border-amber-200 dark:border-olive-700 rounded-xl px-4 py-2">
      <span className="text-2xl">
        {streak > 0 ? '🔥' : '💤'}
      </span>
      <div>
        <p className="text-sm font-semibold text-warmBrown-800 dark:text-parchment-100">
          {streak} day{streak !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-warmBrown-500 dark:text-parchment-400">
          {streak > 0 ? 'Keep it going!' : 'Start your streak today'}
        </p>
      </div>
    </div>
  );
}
