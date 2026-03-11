import type { UserStreak } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

export const streakService = {
  async fetchCurrentUserStreak(): Promise<UserStreak | null> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_streaks')
      .select('user_id, current_streak, longest_streak, last_activity_date')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return (data as UserStreak | null) ?? null;
  },
};
