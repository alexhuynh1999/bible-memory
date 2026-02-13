# Bible Memory App - Agent Guidelines

## Project Overview

A PWA for memorizing Bible verses using spaced repetition (FSRS algorithm). Built with React + TypeScript + Tailwind CSS + Firebase + Vite.

## Tech Stack

- **Runtime**: Node.js v20 (use `nvm use 20` or check `.nvmrc`)
- **Package Manager**: npm (with project-level `.npmrc` pointing to public registry)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v3 with custom warm/cozy theme
- **Routing**: React Router v6 (client-side)
- **Backend**: Firebase (Auth + Firestore)
- **Spaced Repetition**: ts-fsrs (FSRS-6.0 algorithm)
- **Animations**: Framer Motion
- **PWA**: vite-plugin-pwa with Workbox

## Project Structure

```
src/
  main.tsx            # Entry point, BrowserRouter wraps App
  App.tsx             # Routes + global providers (auth, data hooks)
  index.css           # Tailwind imports + custom component classes
  vite-env.d.ts       # Env var types
  types/index.ts      # All TypeScript types + gamification utilities
  lib/
    firebase.ts       # Firebase init, auth helpers, Firestore offline persistence
    bibleApi.ts       # ESV API client (api.esv.org), reference helpers
    fsrs.ts           # ts-fsrs wrapper (createNewCard, scheduleReview, isDue, daysUntilDue)
  hooks/
    useAuth.ts        # Anonymous auth on load, Google sign-in, account linking
    useVerses.ts      # CRUD for verses in Firestore (real-time via onSnapshot)
    useCollections.ts # CRUD for collections in Firestore
    useGamification.ts # XP, level, streak tracking
    useInputMode.ts   # Typing mode preference (localStorage, default: firstLetter)
  components/
    layout/
      AppShell.tsx    # Max-width container + Outlet
      BottomNav.tsx   # 5-tab nav: Home, Library, +, Review, Profile
    library/
      VerseCard.tsx   # Individual verse display with due indicator
      AddVerseModal.tsx # Search Bible API, preview, add to library
      CollectionCard.tsx # Collection summary with verse count
    review/
      TypingInput.tsx # Full-text and first-letter typing modes
      SelfGrade.tsx   # 4-button FSRS grade (Again/Hard/Good/Easy)
      ReviewComplete.tsx # Session summary
    gamification/
      XPBar.tsx       # Level progress bar
      StreakCounter.tsx # Streak display
      LevelUpAnimation.tsx # Framer Motion celebration overlay
  pages/
    DashboardPage.tsx # Home view — level, XP, streak, stats, review CTA
    HomePage.tsx      # Library view — verses + collections tabs (All/Due/Collections)
    ReviewPage.tsx    # Mode selection -> typing -> grading -> complete
    ProfilePage.tsx   # Stats overview, Google sign-in, account management
```

## Key Conventions

### TypeScript

- Strict mode enabled (`tsconfig.app.json`)
- Path alias: `@/*` maps to `src/*`
- All data types in `src/types/index.ts`
- Use `Grade` (not `Rating`) for FSRS review grades -- `Grade` excludes `Rating.Manual`
- FSRS `Card` objects are stored directly in Firestore verse docs

### Styling

- **Theme**: Cozy/warm palette defined in `tailwind.config.js`
  - Primary backgrounds: `parchment-50` through `parchment-900`
  - Primary text/accents: `warmBrown-50` through `warmBrown-900`
  - Highlights: `amber-*`
- **Fonts**: Lora (serif, for verse text) + Inter (sans, for UI)
- **Component classes**: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input-field` (defined in `index.css`)
- Use Tailwind utility classes for all styling
- Rounded corners (`rounded-xl`, `rounded-2xl`) for the cozy feel

### Data Model (Firestore)

- `users/{uid}/verses/{verseId}` -- verse data + FSRS card state
- `users/{uid}/collections/{collectionId}` -- named groupings
- `users/{uid}/profile/main` -- single doc for XP, streak, level

### Auth Strategy

- App auto-signs in anonymously on load
- Optional Google sign-in via `linkWithPopup` (migrates anonymous data)
- All data hooks take `uid: string | null` parameter

### Bible API (ESV)

- Uses the ESV API at `https://api.esv.org/v3`
- API key in `VITE_ESV_API_KEY` env var, sent as `Authorization: Token <key>` header
- Two endpoints used:
  - `/passage/text/?q=John 3:16` -- fetches plain text of a passage
  - `/passage/search/?q=keyword` -- searches ESV text by keyword/phrase
- References use natural language (e.g., "John 3:16", "Psalm 23:1-6", "Genesis 1-3")
- The API returns a `canonical` reference (e.g., "John 3:16") which is stored as `verse.reference`
- `bibleApi.ts` exports `getPassage()`, `searchVerses()`, and `getBookName()` helper
- ESV copyright notice required on pages displaying text (the "(ESV)" short copyright is included by default)

### Review Flow

1. User picks mode (SRS due / Random / Collection / Sequential) and input mode (Full / First Letter)
2. For each verse: show reference -> user types -> reveal answer -> self-grade (Again/Hard/Good/Easy)
3. Grade maps to FSRS `Grade` enum, updates card via `scheduler.next(card, now, grade)`
4. XP awarded per review (10 base + bonus for Good/Easy)

### Gamification

- XP formula: `xpForLevel(n) = 100 * n * (n + 1) / 2`
- Level derived from XP: `levelFromXp(xp)`
- Streak: consecutive days with at least one review
- Level-up triggers `LevelUpAnimation` overlay

## Environment Variables

Required in `.env` (see `.env.example`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ESV_API_KEY`

## Commands

```bash
nvm use 20          # Ensure correct Node version
npm install         # Install dependencies
npm run dev         # Start dev server
npm run build       # Type-check + production build
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

## Status

- [x] Phase 1: Project scaffolding, dependencies, config, types, lib wrappers, layout, theme
- [x] Phase 2: Auth (anonymous + Google sign-in + linking)
- [x] Phase 3: Library (verse CRUD, collections, Add Verse modal, Home page)
- [x] Phase 4: Review system (mode selection, typing input, self-grade, FSRS integration)
- [x] Phase 5: Gamification (XP, levels, streak, level-up animation)
- [x] Phase 6: PWA (vite-plugin-pwa configured, service worker, manifest)
- [ ] Polish: Error boundaries, loading skeleton animations, empty state illustrations
- [ ] Testing: Unit tests, integration tests
- [ ] Deployment: Firebase Hosting or similar
