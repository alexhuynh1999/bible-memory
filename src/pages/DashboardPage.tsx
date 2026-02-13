import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import XPBar from '@/components/gamification/XPBar';
import StreakCounter from '@/components/gamification/StreakCounter';
import { isDue } from '@/lib/fsrs';
import type { Verse, Collection, UserProfile } from '@/types';

interface DashboardPageProps {
  verses: Verse[];
  collections: Collection[];
  profile: UserProfile;
}

export default function DashboardPage({
  verses,
  collections,
  profile,
}: DashboardPageProps) {
  const navigate = useNavigate();

  const dueVerses = verses.filter((v) => v.active !== false && isDue(v.fsrsCard));
  const activeVerses = verses.filter((v) => v.active !== false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 font-serif">
            Bible Memory
          </h1>
          <StreakCounter streak={profile.streak} />
        </div>
        <XPBar xp={profile.xp} level={profile.level} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center !py-4">
          <p className="text-3xl font-bold text-warmBrown-700 dark:text-parchment-200">{activeVerses.length}</p>
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400 mt-1">Active Verses</p>
        </div>
        <div className="card text-center !py-4">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{dueVerses.length}</p>
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400 mt-1">Due for Review</p>
        </div>
        <div className="card text-center !py-4">
          <p className="text-3xl font-bold text-warmBrown-700 dark:text-parchment-200">{collections.length}</p>
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400 mt-1">Collections</p>
        </div>
        <div className="card text-center !py-4">
          <p className="text-3xl font-bold text-warmBrown-700 dark:text-parchment-200">{profile.totalVersesReviewed}</p>
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400 mt-1">Total Reviews</p>
        </div>
      </div>

      {/* Review CTA */}
      {dueVerses.length > 0 && (
        <motion.button
          className="w-full bg-gradient-to-r from-warmBrown-600 to-warmBrown-700 dark:from-olive-600 dark:to-olive-500
                     text-white dark:text-parchment-100 rounded-2xl p-4 text-left shadow-lg"
          onClick={() => navigate('/review')}
          whileTap={{ scale: 0.98 }}
        >
          <p className="font-semibold text-lg">Ready to Review</p>
          <p className="text-warmBrown-200 dark:text-olive-200 text-sm">
            {dueVerses.length} verse{dueVerses.length !== 1 ? 's' : ''} waiting for you
          </p>
        </motion.button>
      )}

      {/* Recent Activity / Level Progress */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warmBrown-800 dark:text-parchment-100">Progress</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-warmBrown-500 dark:text-parchment-400">Level</span>
            <span className="font-semibold text-warmBrown-700 dark:text-parchment-200">{profile.level}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-warmBrown-500 dark:text-parchment-400">Total XP</span>
            <span className="font-semibold text-warmBrown-700 dark:text-parchment-200">{profile.xp}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-warmBrown-500 dark:text-parchment-400">Streak</span>
            <span className="font-semibold text-warmBrown-700 dark:text-parchment-200">
              {profile.streak} day{profile.streak !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-warmBrown-500 dark:text-parchment-400">Verses in Library</span>
            <span className="font-semibold text-warmBrown-700 dark:text-parchment-200">{verses.length}</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          className="card flex items-center gap-3 !py-3 hover:shadow-md transition-shadow"
          onClick={() => navigate('/library')}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-warmBrown-100 dark:bg-warmBrown-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-warmBrown-600 dark:text-parchment-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-semibold text-warmBrown-800 dark:text-parchment-100 text-sm">Library</p>
            <p className="text-xs text-warmBrown-400 dark:text-parchment-500">{verses.length} verses</p>
          </div>
        </motion.button>

        <motion.button
          className="card flex items-center gap-3 !py-3 hover:shadow-md transition-shadow"
          onClick={() => navigate('/review')}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-olive-900/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600 dark:text-olive-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>
          <div className="text-left">
            <p className="font-semibold text-warmBrown-800 dark:text-parchment-100 text-sm">Review</p>
            <p className="text-xs text-warmBrown-400 dark:text-parchment-500">{dueVerses.length} due</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
