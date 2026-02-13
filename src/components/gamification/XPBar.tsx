import { xpForLevel } from '@/types';

interface XPBarProps {
  xp: number;
  level: number;
}

export default function XPBar({ xp, level }: XPBarProps) {
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progress = xpNeeded > 0 ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-warmBrown-700 dark:text-parchment-200">
          Level {level}
        </span>
        <span className="text-xs text-warmBrown-500 dark:text-parchment-400">
          {xpInLevel} / {xpNeeded} XP
        </span>
      </div>
      <div className="w-full h-3 bg-parchment-200 dark:bg-warmBrown-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-olive-500 dark:to-olive-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
