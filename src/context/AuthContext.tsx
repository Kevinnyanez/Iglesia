import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authService } from '../services/auth.service';
import type { AppUser } from '../types/models';
import { getSupabaseClient } from '../services/supabase/client';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setIsLoading(false);
      return;
    }

    authService
      .getSession()
      .then((activeSession) => {
        setSession(activeSession);
      })
      .catch(() => {
        setSession(null);
      })
      .finally(async () => {
        try {
          const profile = await authService.getCurrentProfile();
          setUser(profile);
        } catch {
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setUser(null);
        return;
      }
      authService.getCurrentProfile().then(setUser).catch(() => setUser(null));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    const profile = await authService.getCurrentProfile();
    setUser(profile);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isLoading,
      signIn: async (payload) => {
        await authService.signIn(payload);
        await refreshProfile();
      },
      signUp: async (payload) => {
        await authService.signUp(payload);
        await refreshProfile();
      },
      signOut: async () => {
        await authService.signOut();
        setUser(null);
        setSession(null);
      },
      refreshProfile,
    }),
    [isLoading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
