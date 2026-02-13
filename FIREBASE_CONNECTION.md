# Firebase Configuration Guide

This guide walks you through setting up the Firebase project for the Bible Memory app. The app uses **Firebase Auth** (anonymous + Google sign-in) and **Cloud Firestore** for data storage.

Your `.env` is already populated with the Firebase config values. The steps below cover what needs to be enabled/configured in the Firebase Console.

---

## 1. Enable Authentication Providers

Go to: **Firebase Console > Authentication > Sign-in method**

Enable the following providers:

### Anonymous

1. Click **Anonymous** in the provider list.
2. Toggle **Enable** on.
3. Click **Save**.

This is required -- the app auto-signs in anonymously on first load.

### Google

1. Click **Google** in the provider list.
2. Toggle **Enable** on.
3. Set a **Project support email** (your email).
4. Click **Save**.

This is used for optional sign-in to sync data across devices.

---

## 2. Create the Firestore Database

Go to: **Firebase Console > Firestore Database**

1. Click **Create database**.
2. Choose **Start in test mode** for now (we'll tighten rules in step 3).
3. Select a Cloud Firestore location close to your users (e.g., `us-central1` or `us-east1`). This cannot be changed later.
4. Click **Enable**.

---

## 3. Set Firestore Security Rules

Go to: **Firebase Console > Firestore Database > Rules**

Replace the default rules with:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

This ensures:
- Authenticated users (anonymous or Google) can only access their own `users/{uid}/` subcollections.
- No one can read or write anyone else's data.
- No access to any other top-level collections.

---

## 4. Create Firestore Indexes (if needed)

The app uses `orderBy('createdAt', 'desc')` queries on the `verses` and `collections` subcollections. Firestore may auto-create these indexes, but if you see console errors like `FAILED_PRECONDITION: The query requires an index`, follow the link in the error message to create it, or manually add them:

Go to: **Firebase Console > Firestore Database > Indexes**

Add composite indexes if prompted:

| Collection path                  | Fields indexed         | Query scope |
|----------------------------------|------------------------|-------------|
| `users/{uid}/verses`             | `createdAt` Descending | Collection  |
| `users/{uid}/collections`        | `createdAt` Descending | Collection  |

In practice, single-field indexes are created automatically and these queries should work out of the box.

---

## 5. Add Authorized Domains (for Google Sign-In)

Go to: **Firebase Console > Authentication > Settings > Authorized domains**

Make sure the following domains are listed:
- `localhost` (already added by default)
- Your production domain, when deployed (e.g., `bible-memory.web.app`)

---

## 6. Verify `.env` Values

Your `.env` should already have these filled in from the Firebase Console (**Project settings > General > Your apps > Web app**):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

If you haven't registered a web app yet:
1. Go to **Project settings > General**.
2. Under **Your apps**, click the web icon (`</>`).
3. Register the app with a nickname (e.g., "Bible Memory Web").
4. Copy the `firebaseConfig` values into your `.env`.

---

## Firestore Data Structure

For reference, the app stores data under `users/{uid}/` with three subcollections:

```
users/
  {uid}/
    verses/
      {verseId}
        reference: "John 3:16"     # canonical ESV reference
        bookName: "John"
        text: "For God so loved..."  # cached ESV text
        collectionIds: ["abc123"]
        fsrsCard: { ... }           # ts-fsrs Card object
        createdAt: 1707782400000

    collections/
      {collectionId}
        name: "Romans Road"
        description: "Key salvation verses"
        verseOrder: ["verseId1", "verseId2"]
        createdAt: 1707782400000

    profile/
      main
        streak: 5
        lastReviewDate: "2026-02-12"
        xp: 450
        level: 2
        totalVersesReviewed: 38
        createdAt: 1707782400000
```

---

## Checklist

- [ ] Anonymous auth provider enabled
- [ ] Google auth provider enabled
- [ ] Firestore database created
- [ ] Security rules published
- [ ] `.env` values populated
- [ ] App runs locally with `npm run dev` and can sign in
