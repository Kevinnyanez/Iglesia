import { requireSupabaseClient } from './supabase/client';

export interface SavedVerse {
  id: string;
  user_id: string;
  verse_reference: string;
  note: string | null;
  created_at: string;
}

export interface SaveVersePayload {
  verse_reference: string;
  note?: string;
}

export const savedVersesService = {
  async fetchUserSavedVerses(): Promise<SavedVerse[]> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_verses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SavedVerse[];
  },

  async saveVerse(payload: SaveVersePayload): Promise<SavedVerse> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data, error } = await supabase
      .from('saved_verses')
      .insert({
        user_id: user.id,
        verse_reference: payload.verse_reference.trim(),
        note: payload.note?.trim() || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as SavedVerse;
  },

  async deleteSavedVerse(id: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const { error } = await supabase.from('saved_verses').delete().eq('id', id);
    if (error) throw error;
  },
};
