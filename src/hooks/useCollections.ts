import { useState, useEffect, useCallback } from 'react';
import {
  collection as fbCollection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Collection } from '@/types';

function collectionsRef(uid: string) {
  return fbCollection(db, 'users', uid, 'collections');
}

export function useCollections(uid: string | null) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setCollections([]);
      setLoading(false);
      return;
    }

    const q = query(collectionsRef(uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Collection[];
      setCollections(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  const addCollection = useCallback(
    async (name: string, description?: string) => {
      if (!uid) return;
      const docRef = doc(collectionsRef(uid));
      const coll: Collection = {
        id: docRef.id,
        name,
        ...(description !== undefined && { description }),
        verseOrder: [],
        createdAt: Date.now(),
      };
      await setDoc(docRef, coll);
      return coll;
    },
    [uid]
  );

  const updateCollection = useCallback(
    async (collectionId: string, updates: Partial<Omit<Collection, 'id' | 'createdAt'>>) => {
      if (!uid) return;
      const docRef = doc(collectionsRef(uid), collectionId);
      // Filter out undefined values to avoid Firestore rejection
      const cleanUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      }
      await setDoc(docRef, cleanUpdates, { merge: true });
    },
    [uid]
  );

  const removeCollection = useCallback(
    async (collectionId: string) => {
      if (!uid) return;
      await deleteDoc(doc(collectionsRef(uid), collectionId));
    },
    [uid]
  );

  return {
    collections,
    loading,
    addCollection,
    updateCollection,
    removeCollection,
  };
}
