import type { ReadingProgress } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

export interface MarkAsReadPayload {
  verse_reference: string;
  completed: boolean;
  date: string;
}

export const readingProgressService = {
  async listByCurrentUser(): Promise<ReadingProgress[]> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];

    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(200);

    if (error) throw error;
    return (data ?? []) as ReadingProgress[];
  },

  async markAsRead(payload: MarkAsReadPayload): Promise<ReadingProgress> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data, error } = await supabase
      .from('reading_progress')
      .upsert(
        {
          user_id: user.id,
          verse_reference: payload.verse_reference,
          completed: payload.completed,
          date: payload.date,
        },
        { onConflict: 'user_id,verse_reference,date' },
      )
      .select('*')
      .single();

    if (error) throw error;
    return data as ReadingProgress;
  },
};
