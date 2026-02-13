import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { signInAnon, signInWithGoogle, onAuthChange, auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAnonymous: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setState({
          user,
          loading: false,
          isAnonymous: user.isAnonymous,
        });
      } else {
        // Auto sign-in anonymously
        try {
          await signInAnon();
          // onAuthChange will fire again with the new user
        } catch {
          setState({ user: null, loading: false, isAnonymous: true });
        }
      }
    });

    return unsubscribe;
  }, []);

  const linkGoogle = useCallback(async () => {
    try {
      const user = await signInWithGoogle();
      setState({
        user,
        loading: false,
        isAnonymous: false,
      });
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
  }, []);

  return {
    user: state.user,
    uid: state.user?.uid ?? null,
    loading: state.loading,
    isAnonymous: state.isAnonymous,
    linkGoogle,
    signOut,
  };
}
