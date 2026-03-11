import { requireSupabaseClient } from './supabase/client';

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
  const supabase = requireSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ avatar: avatarUrl })
    .eq('id', userId);
  if (error) throw error;
}
