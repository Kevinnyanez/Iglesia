import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { requireSupabaseClient } from './supabase/client';
import type { AppUser } from '../types/models';

export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

async function ensureCurrentUserProfile(): Promise<AppUser | null> {
  const supabase = requireSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('users')
    .select('id, email, name, avatar, church_id, is_platform_admin, can_create_community')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (existingProfileError) throw existingProfileError;
  if (existingProfile) {
    return existingProfile as AppUser;
  }

  const fallbackName =
    (typeof authData.user.user_metadata?.name === 'string' && authData.user.user_metadata.name) ||
    authData.user.email?.split('@')[0] ||
    'Usuario';

  const { data: insertedProfile, error: insertError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email ?? '',
      name: fallbackName,
      avatar: null,
      church_id: null,
      is_platform_admin: false,
      can_create_community: false,
    })
    .select('id, email, name, avatar, church_id, is_platform_admin, can_create_community')
    .single();

  if (insertError) {
    // Do not block auth session if profile auto-provision is blocked by RLS/policies.
    return null;
  }
  return insertedProfile as AppUser;
}

export const authService = {
  async signUp(payload: SignUpPayload) {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
        },
      },
    });

    if (error) throw error;
    if (data.user && data.session) {
      await ensureCurrentUserProfile();
    }
    return data;
  },

  async signIn(payload: SignInPayload) {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword(payload);
    if (error) throw error;
    await ensureCurrentUserProfile();
    return data;
  },

  async signOut() {
    const supabase = requireSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const supabase = requireSupabaseClient();
    return supabase.auth.onAuthStateChange(callback);
  },

  async getCurrentProfile(): Promise<AppUser | null> {
    return ensureCurrentUserProfile();
  },
};
