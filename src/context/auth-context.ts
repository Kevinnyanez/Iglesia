import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppUser } from '../types/models';
import type { SignInPayload, SignUpPayload } from '../services/auth.service';

export interface AuthContextValue {
  session: Session | null;
  user: AppUser | null;
  isLoading: boolean;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
