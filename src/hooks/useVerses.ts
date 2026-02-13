import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNewCard, cardForFirestore, cardFromFirestore } from '@/lib/fsrs';
import type { Verse } from '@/types';
import type { Card } from 'ts-fsrs';

function versesCollection(uid: string) {
  return collection(db, 'users', uid, 'verses');
}

export function useVerses(uid: string | null) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setVerses([]);
      setLoading(false);
      return;
    }

    const q = query(versesCollection(uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          ...raw,
          id: d.id,
          active: raw.active ?? true, // backward compat: default to true
          fsrsCard: cardFromFirestore(raw.fsrsCard as Record<string, unknown>),
        } as Verse;
      });
      setVerses(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  const addVerse = useCallback(
    async (
      verseData: Omit<Verse, 'id' | 'fsrsCard' | 'createdAt' | 'collectionIds' | 'active'>,
      options?: { collectionIds?: string[]; active?: boolean }
    ) => {
      if (!uid) return;
      const docRef = doc(versesCollection(uid));
      const fsrsCard = createNewCard();
      const verse: Verse = {
        ...verseData,
        id: docRef.id,
        collectionIds: options?.collectionIds ?? [],
        active: options?.active ?? true,
        fsrsCard,
        createdAt: Date.now(),
      };
      // Serialize for Firestore (converts undefined to null, Dates to strings)
      await setDoc(docRef, { ...verse, fsrsCard: cardForFirestore(fsrsCard) });
      return verse;
    },
    [uid]
  );

  const addVersesBatch = useCallback(
    async (
      versesData: Omit<Verse, 'id' | 'fsrsCard' | 'createdAt' | 'collectionIds' | 'active'>[],
      options?: { collectionIds?: string[]; active?: boolean }
    ) => {
      if (!uid) return;
      const created: Verse[] = [];
      for (const verseData of versesData) {
        const docRef = doc(versesCollection(uid));
        const fsrsCard = createNewCard();
        const verse: Verse = {
          ...verseData,
          id: docRef.id,
          collectionIds: options?.collectionIds ?? [],
          active: options?.active ?? true,
          fsrsCard,
          createdAt: Date.now(),
        };
        await setDoc(docRef, { ...verse, fsrsCard: cardForFirestore(fsrsCard) });
        created.push(verse);
      }
      return created;
    },
    [uid]
  );

  const updateVerseFsrs = useCallback(
    async (verseId: string, updatedCard: Card) => {
      if (!uid) return;
      const docRef = doc(versesCollection(uid), verseId);
      await setDoc(docRef, { fsrsCard: cardForFirestore(updatedCard) }, { merge: true });
    },
    [uid]
  );

  const updateVerseCollections = useCallback(
    async (verseId: string, collectionIds: string[]) => {
      if (!uid) return;
      const docRef = doc(versesCollection(uid), verseId);
      await setDoc(docRef, { collectionIds }, { merge: true });
    },
    [uid]
  );

  const updateVerseActive = useCallback(
    async (verseId: string, active: boolean) => {
      if (!uid) return;
      const docRef = doc(versesCollection(uid), verseId);
      await setDoc(docRef, { active }, { merge: true });
    },
    [uid]
  );

  const removeVerse = useCallback(
    async (verseId: string) => {
      if (!uid) return;
      await deleteDoc(doc(versesCollection(uid), verseId));
    },
    [uid]
  );

  return {
    verses,
    loading,
    addVerse,
    addVersesBatch,
    updateVerseFsrs,
    updateVerseCollections,
    updateVerseActive,
    removeVerse,
  };
}
