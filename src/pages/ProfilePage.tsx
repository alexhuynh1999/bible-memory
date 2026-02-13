import XPBar from '@/components/gamification/XPBar';
import StreakCounter from '@/components/gamification/StreakCounter';
import type { UserProfile, Verse, InputMode } from '@/types';
import type { ThemePreference } from '@/hooks/useTheme';

interface ProfilePageProps {
  profile: UserProfile;
  verses: Verse[];
  isAnonymous: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  themePreference: ThemePreference;
  onSetTheme: (pref: ThemePreference) => void;
  inputMode: InputMode;
  onSetInputMode: (mode: InputMode) => void;
}

export default function ProfilePage({
  profile,
  verses,
  isAnonymous,
  onSignIn,
  onSignOut,
  themePreference,
  onSetTheme,
  inputMode,
  onSetInputMode,
}: ProfilePageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 font-serif">Profile</h1>

      {/* Stats Overview */}
      <div className="card space-y-4">
        <XPBar xp={profile.xp} level={profile.level} />
        <StreakCounter streak={profile.streak} />

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-parchment-50 dark:bg-warmBrown-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-warmBrown-700 dark:text-parchment-200">{profile.totalVersesReviewed}</p>
            <p className="text-xs text-warmBrown-500 dark:text-parchment-400">Total Reviews</p>
          </div>
          <div className="bg-parchment-50 dark:bg-warmBrown-700 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-warmBrown-700 dark:text-parchment-200">{verses.length}</p>
            <p className="text-xs text-warmBrown-500 dark:text-parchment-400">Verses in Library</p>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warmBrown-800 dark:text-parchment-100">Appearance</h2>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as ThemePreference[]).map((pref) => (
            <button
              key={pref}
              className={`flex-1 border rounded-xl py-2.5 px-3 text-sm font-medium transition-colors ${
                themePreference === pref
                  ? 'border-warmBrown-500 bg-warmBrown-50 text-warmBrown-800 dark:bg-warmBrown-600 dark:text-parchment-100 dark:border-warmBrown-400'
                  : 'border-parchment-200 text-warmBrown-500 hover:border-warmBrown-300 dark:border-warmBrown-600 dark:text-parchment-400 dark:hover:border-warmBrown-500'
              }`}
              onClick={() => onSetTheme(pref)}
            >
              {pref === 'light' && '☀️ '}
              {pref === 'dark' && '🌙 '}
              {pref === 'system' && '💻 '}
              {pref.charAt(0).toUpperCase() + pref.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Typing Mode */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warmBrown-800 dark:text-parchment-100">Typing Mode</h2>
        <p className="text-sm text-warmBrown-500 dark:text-parchment-400">
          Choose how you type verses during review sessions.
        </p>
        <div className="space-y-2">
          {([
            { value: 'firstLetter' as const, label: 'First Letter', desc: 'Type the first letter of each word to reveal it' },
            { value: 'full' as const, label: 'Full Text', desc: 'Type the entire verse from memory' },
            { value: 'fillBlank' as const, label: 'Fill in Blank', desc: 'See first letters as hints, fill in the rest' },
          ]).map((opt) => (
            <button
              key={opt.value}
              className={`w-full border rounded-xl p-3 text-left transition-colors ${
                inputMode === opt.value
                  ? 'border-warmBrown-500 bg-warmBrown-50 text-warmBrown-800 dark:bg-warmBrown-600 dark:text-parchment-100 dark:border-warmBrown-400'
                  : 'border-parchment-200 text-warmBrown-500 hover:border-warmBrown-300 dark:border-warmBrown-600 dark:text-parchment-400 dark:hover:border-warmBrown-500'
              }`}
              onClick={() => onSetInputMode(opt.value)}
            >
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs mt-0.5 opacity-75">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warmBrown-800 dark:text-parchment-100">Account</h2>

        {isAnonymous ? (
          <div>
            <p className="text-sm text-warmBrown-500 dark:text-parchment-400 mb-3">
              Sign in with Google to sync your verses across devices and keep your progress safe.
            </p>
            <button onClick={onSignIn} className="btn-primary w-full flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-warmBrown-500 dark:text-parchment-400 mb-3">
              You're signed in. Your progress syncs across devices.
            </p>
            <button onClick={onSignOut} className="btn-secondary w-full">
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="text-center text-xs text-warmBrown-400 dark:text-parchment-500 pb-4">
        <p>Bible Memory v0.1.0</p>
        <p className="mt-1">Powered by FSRS spaced repetition</p>
      </div>
    </div>
  );
}
