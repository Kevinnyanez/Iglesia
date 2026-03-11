import type { CommunityGoal } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

export interface CreateCommunityGoalPayload {
  community_id: string;
  title: string;
  description?: string;
  type: 'prayer' | 'bible' | 'meditation';
  target_days: number;
  start_date?: string;
  end_date?: string;
}

async function assertCommunityAdmin(communityId: string, userId: string) {
  const supabase = requireSupabaseClient();
  const { data } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!data || data.role !== 'admin') {
    throw new Error('Solo los administradores pueden crear metas comunitarias');
  }
}

export const communityGoalsService = {
  async fetchByCommunity(communityId: string): Promise<CommunityGoal[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('community_goals')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CommunityGoal[];
  },

  async create(payload: CreateCommunityGoalPayload): Promise<CommunityGoal> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(payload.community_id, user.id);

    const { data, error } = await supabase
      .from('community_goals')
      .insert({
        community_id: payload.community_id,
        created_by: user.id,
        title: payload.title,
        description: payload.description?.trim() || null,
        type: payload.type,
        target_days: payload.target_days,
        start_date: payload.start_date || null,
        end_date: payload.end_date || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as CommunityGoal;
  },

  async delete(goalId: string, communityId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(communityId, user.id);

    const { error } = await supabase.from('community_goals').delete().eq('id', goalId).eq('community_id', communityId);
    if (error) throw error;
  },
};
