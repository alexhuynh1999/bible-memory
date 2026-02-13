# Handoff to Next Agent

## Quick Start

```bash
nvm use 20
npm install
npm run dev        # http://localhost:5173
npm run build      # Type-check + production build
```

Environment is already configured -- `.env` has Firebase + ESV API keys populated. See `.env.example` for reference.

## What Has Been Built

The entire app MVP is functional and building cleanly. All 6 original phases are complete, plus 13 tweaks and a recent round of UX/UI refinements.

**Core (Phases 1-6):**
- **Auth**: Anonymous auth on load + optional Google sign-in with account linking
- **Library**: Add verses via ESV API, view in tabs (All/Due/Collections), create collections
- **Review**: Mode selection, typing input, self-grade with FSRS integration
- **Gamification**: XP, levels (with level-up animation), streak tracking
- **PWA**: Service worker, manifest, offline Firestore persistence

**Tweaks (all implemented):**
- **Tweak 1 — Add to Collections + Passage Ranges**: Verses can be assigned to a collection when adding (single-select). Passage ranges (e.g. "Psalm 23", "Genesis 1:1-5") are auto-split verse-by-verse. Existing verses can be assigned to collections via a checkbox picker on `VerseCard`.
- **Tweak 2 — Restructured Review Workflow**: 2-step flow: choose scope (Library / Collection) then mode (SRS Due / Random / Sequential). Types: `ReviewScope = 'library' | 'collection'`, `ReviewMode`.
- **Tweak 3 — First Letter Mode + Fill in Blank**: New `FirstLetterInput.tsx` component (type first letter to reveal words). Old first-letter behavior renamed to "Fill in the Blank". `InputMode = 'full' | 'firstLetter' | 'fillBlank'`.
- **Tweak 4 — Diminishing XP**: `dailyReviewLog` on `UserProfile` tracks per-verse reviews. Repeated reviews of the same verse yield halved XP (10→5→2→1→0). Better ratings award the differential.
- **Tweak 5 — Dark Mode**: `darkMode: 'class'` in Tailwind. `useTheme` hook manages light/dark/system preference. All components have `dark:` variants. Theme toggle on Profile page.
- **Tweak 6 — Drip-Feed**: Collections can have `dripRate` / `dripPeriod`. Verses have `active: boolean`. Drip-aware add wrappers in `App.tsx` control which verses start active. `useDrip` hook activates queued verses over time.
- **Tweak 7 — Dashboard + 5-Tab Navigation**: Restructured navigation from 3 tabs to 5 tabs: Home, Library, + (Add), Review, Profile. New `DashboardPage` at `/` shows user summary (level, XP, streak, stats, review CTA, quick links). Library page moved to `/library` and stripped to only verse/collection content. The + button is a prominent center FAB in the bottom nav that opens the AddVerseModal (lifted to `App.tsx`). `AppShell` passes `onAddPress` callback through to `BottomNav`.
- **Tweak 8 — Persistent Typing Mode Setting**: Typing mode (Full Text / First Letter / Fill in Blank) is now a persistent setting on the Profile page instead of being selected during each review session. `useInputMode` hook stores the preference in localStorage (default: `firstLetter`). The typing mode picker was removed from the Review page's mode-selection step; `ReviewPage` receives `inputMode` as a prop from `App.tsx`.
- **Tweak 9 — Dark Mode Color Scheme Fixes**: Added synchronous inline `<script>` in `index.html` that reads theme preference from localStorage and applies the `dark` class + `color-scheme` property before first paint (no flash). `useTheme` also sets `document.documentElement.style.colorScheme`. CSS base layer sets `color-scheme: light` on `html` and `color-scheme: dark` on `html.dark`. Body has `transition-colors duration-200` for smooth theme switching. Scrollbar is globally hidden via CSS (`display: none` for WebKit, `scrollbar-width: none` for Firefox on `*`).
- **Tweak 10 — VerseCard 3-Dot Menu**: Replaced the hover-only action buttons on `VerseCard` with an always-visible 3-dot vertical menu (matching `CollectionCard` pattern). Dropdown has "Collections" and "Delete" options. Uses `useRef` + outside-click-to-close. Works on mobile.
- **Tweak 11 — Tap-to-Review from Library**: Clicking a verse card in the Library navigates to `/review?verseId=<id>`. `ReviewPage` reads the `verseId` URL search param via `useSearchParams` and auto-starts a single-verse review session, skipping scope/mode selection. `VerseCard` accepts an `onClick` prop; the 3-dot menu, dropdown, and collection picker all call `e.stopPropagation()` to avoid triggering navigation.
- **Tweak 12 — First Letter Mode Improvements**: Unrevealed words now show the correct number of underscores matching actual character count (e.g. "beginning" → `_________`), with punctuation preserved (e.g. "God," → `___,`). After 3+ wrong guesses on a word, a "Need help? Reveal this word" button appears. Clicking it auto-reveals the word with an amber highlight instead of the olive used for correct recalls. Helped words send `'?'` in the typed output so grading can distinguish them.
- **Tweak 13 — Manual Review Drip Activation**: When a queued (inactive) verse is reviewed via tap-to-review, `handleActivateReviewedVerse` in `App.tsx` activates it and advances the drip cursor for each of its drip-feed collections, also activating the next verse in drip order. This is called from `ReviewPage.handleGrade` when `currentVerse.active === false`.

**Recent UX/UI Refinements:**
- **Hidden text cursor in Review**: `caret-transparent` applied to the textarea in `TypingInput.tsx` and the hidden input in `FirstLetterInput.tsx` to remove the blinking caret during review.
- **First-letter input hidden from grading screen**: `SelfGrade.tsx` no longer shows the "Your first letters:" section when `inputMode === 'firstLetter'` — the raw letter output wasn't useful feedback.
- **Pull-to-refresh disabled**: `overscroll-behavior: none` on the `html` element prevents the browser's native pull-to-refresh gesture.
- **Contained layout (no page-level scroll)**: `AppShell.tsx` uses `h-[100dvh] overflow-hidden` on the outer div and `overflow-y-auto` on the `main` content area. Content only scrolls when it overflows; no scrolling when everything fits on screen.
- **Random Selection scope removed**: The "Random Selection" option was removed from the Review page scope picker (it was redundant since the next step offers a Random mode). `ReviewScope` is now `'library' | 'collection'`.
- **Collection detail view**: Clicking a collection card in Library > Collections opens a detail view showing all verses in that collection, sorted in biblical order. Uses a `viewCollectionId` state in `HomePage.tsx`.
- **Biblical verse ordering**: `compareReferences()` in `bibleApi.ts` sorts verses by canonical Bible book order (66-book lookup table), then chapter, then verse number. Used in the collection detail view.
- **Add Verse modal resets on close**: A `useEffect` in `AddVerseModal.tsx` calls `handleReset()` when `open` becomes `false`, clearing all search data.
- **Searchable collection selector**: New `CollectionSelect.tsx` component — a searchable single-select dropdown. Used in both `AddVerseModal` (replaced multi-select toggle buttons) and `ReviewPage` scope picker (replaced button list). Supports optional verse counts per collection.
- **Japandi color palette**: Complete theme overhaul (see "Color Palette" section below).

## Color Palette (Japandi Theme)

The app uses a Japandi-inspired warm/natural color palette defined in `tailwind.config.js`. Four custom color scales:

| Scale | Role | Key Values |
|-------|------|------------|
| `parchment` | Warm neutral backgrounds, surfaces, borders | 50: #F6F1E8 (Soft Rice), 100: #EAE4DA (Warm Linen), 300: #C9BEAF (Washed Taupe/borders), 500: #9E9488 (Fog/disabled) |
| `warmBrown` | Primary brand, text, dark-mode surfaces | 600: #9C6B4F (Clay Brown — PRIMARY), 700: #5E3E31 (Deep Umber — hover), 800: #2A2622 (Dark surface), 900: #1F1C19 (Dark bg) |
| `amber` | Accent — warm sandstone/gold | 400: #C2A878 (Warm Sandstone), used for accent highlights and warm tones |
| `olive` | Secondary — muted olive/sage green | 500: #7A846A (Muted Olive), used for positive states, dark-mode primary buttons, progress bars |

**Dark mode color strategy:**
- Primary buttons (`btn-primary`): olive-500 background with warmBrown-900 text
- Focus rings: olive-400
- XP/progress bars: olive gradient
- Streak counter: olive border/bg
- Review grade buttons (Good/Easy): olive backgrounds with stronger opacity
- The BottomNav center FAB: olive-500

**Review grade buttons (SelfGrade.tsx):**
- Again: muted parchment/warmBrown (neutral retry)
- Hard: amber/sandstone (warm effort)
- Good: olive (positive)
- Easy: deeper olive (confident mastery)

**FirstLetterInput highlights:**
- Correct reveal: olive-100 / olive-800/40 (dark)
- Helped reveal: amber-200 / amber-800/40 (dark)
- Wrong flash: warmBrown-200 / warmBrown-600/60 (dark)
- Current word ring: olive-400 in both modes

## Critical Patterns to Know

### Firestore + `undefined` Values

Firestore rejects `undefined` field values. This was a recurring bug. Two patterns are established:

1. **FSRS Card serialization**: `cardForFirestore()` / `cardFromFirestore()` in `src/lib/fsrs.ts` convert `undefined` to `null` on write and back on read. **Always use these** when reading/writing FSRS cards to Firestore.

2. **Optional fields**: When building objects for `setDoc()`, use conditional spread for optional fields:
   ```typescript
   // CORRECT
   const doc = { name, ...(description !== undefined && { description }) };
   // WRONG -- Firestore will reject this if description is undefined
   const doc = { name, description };
   ```

### FSRS Types

- Use `Grade` (not `Rating`) for review grades. `Grade` = `Rating` minus `Rating.Manual`.
- `Rating.Again=1, Rating.Hard=2, Rating.Good=3, Rating.Easy=4` are all valid `Grade` values.
- Use `scheduler.next(card, now, grade)` (not `scheduler.repeat()[rating]`) to avoid type issues.

### ESV API

- Base URL: `https://api.esv.org/v3`
- Auth: `Authorization: Token <VITE_ESV_API_KEY>`
- Accepts natural language references: "John 3:16", "Genesis 1:3-5", "Psalm 23" (full chapters)
- Returns `canonical` (normalized reference string) and `passages[]` (text array)
- `getPassageVerses(query)` is now the primary function — always fetches with verse numbers and splits into individual verses. Handles multi-chapter passages by detecting verse number resets at chapter boundaries.
- `getPassage(query)` still exists for fetching raw text without splitting.
- `compareReferences(refA, refB)` sorts verse references by canonical Bible book order → chapter → verse number.

### Drip-Feed System (important — has subtle coordination)

The drip-feed system spans multiple files and requires careful coordination:

1. **Adding verses to drip collections**: `App.tsx` has `handleAddVerse` / `handleAddVersesBatch` wrappers that check if a target collection has `dripRate > 0`. If so:
   - Fresh collection (cursor=0, empty): first `dripRate` verses are `active: true`, rest are `active: false`
   - Existing collection: new verses are appended past the cursor, so `active: false`
   - The wrapper also updates the collection's `verseOrder` array and initializes `dripCursor`

2. **Periodic activation**: `useDrip` hook runs on app load, checks each drip collection, calculates elapsed periods since `dripLastChecked`, and activates the next batch of verses by advancing `dripCursor`.

3. **Manual review activation**: When a queued verse is reviewed (via tap-to-review), `handleActivateReviewedVerse` in `App.tsx` activates that verse and advances the `dripCursor`, also activating the next verse at the cursor position. Called from `ReviewPage.handleGrade`.

4. **Filtering**: `DashboardPage.tsx` filters due verses with `v.active !== false && isDue(v.fsrsCard)`. `ReviewPage.tsx` filters with `verses.filter((v) => v.active !== false)` for the normal review flow (but allows inactive verses in single-verse mode via `verseId` param).

5. **Collection deletion**: `App.tsx`'s `handleRemoveCollection` deletes all verses belonging to the collection before removing the collection doc.

6. **`verseOrder` must be populated**: The drip hook relies on `coll.verseOrder` to find and order verses. If `verseOrder` is empty, drip logic is skipped entirely. The add wrappers in `App.tsx` handle this — do NOT bypass them by calling `addVerse`/`addVersesBatch` directly when collections are involved.

### Card Menus (VerseCard + CollectionCard)

Both `VerseCard.tsx` and `CollectionCard.tsx` use the same 3-dot vertical menu pattern: always-visible button, dropdown with action items, `useRef` + outside-click-to-close. No hover-based actions — works on mobile. `VerseCard` also has an `onClick` prop for tap-to-review; menu items call `e.stopPropagation()` to prevent triggering it.

### Single-Verse Review Flow

`ReviewPage` reads `?verseId=<id>` from URL search params. When present, it finds the verse (active or not), sets it as the sole review queue item, and jumps directly to the typing phase — skipping scope and mode selection. After grading, if the verse was inactive, `onActivateVerse` fires to handle drip activation.

### Collection Detail View

In `HomePage.tsx`, when `viewCollectionId` is set (by clicking a collection card), the component renders a detail view instead of the main library. Verses are filtered by collection membership and sorted via `compareReferences()` from `bibleApi.ts`. The view includes a back button, collection name/description, verse count, and the full verse list with tap-to-review support.

### Searchable Collection Selector

`CollectionSelect.tsx` is a reusable searchable single-select dropdown for collections. It accepts `collections`, `selectedId`, `onChange`, optional `placeholder`, and optional `verseCounts`. Used in both `AddVerseModal` (replacing old multi-select) and `ReviewPage` scope picker. Note: `AddVerseModal` now uses a single `selectedCollectionId: string | null` state instead of the old `selectedCollections: string[]` array.

### npm Registry

The global `~/.npmrc` points to a corporate Artifactory. The project has a local `.npmrc` that overrides to the public registry. **Do not delete `.npmrc` from the project root.**

## File Map (32 source files)

```
src/
  main.tsx                            # Entry point
  App.tsx                             # Routes + hooks wiring + drip-aware add/activate wrappers + AddVerseModal
  index.css                           # Tailwind + Japandi component classes (light + dark) + hidden scrollbar
  vite-env.d.ts                       # Env var types
  types/index.ts                      # All types + gamification utils
  lib/
    firebase.ts                       # Firebase init + auth helpers
    bibleApi.ts                       # ESV API client (getPassage, getPassageVerses, searchVerses, compareReferences)
    fsrs.ts                           # ts-fsrs wrapper + Firestore serialization
  hooks/
    useAuth.ts                        # Auth state management
    useVerses.ts                      # Verse CRUD (Firestore real-time)
    useCollections.ts                 # Collection CRUD
    useGamification.ts                # XP, level, streak, diminishing XP
    useTheme.ts                       # Light/dark/system theme + color-scheme management
    useInputMode.ts                   # Typing mode preference (localStorage, default: firstLetter)
    useDrip.ts                        # Drip-feed activation logic
  pages/
    DashboardPage.tsx                 # Home view — level, XP, streak, stats, review CTA, quick links
    HomePage.tsx                      # Library view — verses (tap to review) + collections tabs + collection detail view
    ReviewPage.tsx                    # Review flow (scope -> mode -> typing -> grade) + single-verse via ?verseId=
    ProfilePage.tsx                   # Stats + auth + theme toggle + typing mode setting
  components/
    layout/AppShell.tsx               # Shell with Outlet (100dvh contained layout), passes onAddPress to BottomNav
    layout/BottomNav.tsx              # 5-tab nav (Home, Library, +, Review, Profile)
    library/VerseCard.tsx             # Verse list item + 3-dot menu + tap-to-review onClick
    library/AddVerseModal.tsx         # Add verse modal + range splitting + single collection picker
    library/CollectionCard.tsx        # Collection list item + 3-dot menu
    library/CollectionSettings.tsx    # Drip-feed configuration UI
    library/CollectionSelect.tsx      # Searchable single-select dropdown for collections
    review/TypingInput.tsx            # Typing input router (full / firstLetter / fillBlank)
    review/FirstLetterInput.tsx       # Word-by-word first-letter reveal + accurate blanks + "Need help?"
    review/SelfGrade.tsx              # Grade buttons (Again/Hard/Good/Easy) — Japandi palette
    review/ReviewComplete.tsx         # Session summary
    gamification/XPBar.tsx            # XP progress bar (olive gradient in dark mode)
    gamification/StreakCounter.tsx     # Streak display (olive in dark mode)
    gamification/LevelUpAnimation.tsx # Level-up overlay
```

## Potential Polish Items

- [ ] Error boundaries around Firebase operations
- [ ] Loading skeleton animations for verse list
- [ ] Empty state illustrations
- [ ] Confirmation dialog before deleting collections (currently deletes immediately)
- [ ] Show drip progress on collection cards (e.g. "5 of 20 verses active")
- [ ] Allow reordering verses within a collection's `verseOrder`
- [ ] Unit tests and integration tests
- [ ] Deployment to Firebase Hosting

## Reference Documents

- `AGENTS.md` -- Project conventions and full architecture docs
- `FIREBASE_CONNECTION.md` -- Firebase Console setup guide (auth, Firestore, rules)
- `.cursor/plans/bible_memory_tweaks_*.plan.md` -- Original detailed implementation plan for all 6 tweaks
