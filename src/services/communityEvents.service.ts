import type { CommunityEvent } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

async function assertCommunityAdmin(communityId: string, userId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.role !== 'admin') {
    throw new Error('Solo los administradores pueden gestionar eventos');
  }
}

export interface CreateCommunityEventPayload {
  community_id: string;
  title: string;
  event_date: string;
  event_time?: string | null;
  place?: string | null;
  description?: string | null;
}

export const communityEventsService = {
  async fetchByCommunity(communityId: string): Promise<CommunityEvent[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('community_events')
      .select('*')
      .eq('community_id', communityId)
      .order('event_date', { ascending: true });
    if (error) throw error;
    return (data ?? []) as CommunityEvent[];
  },

  async create(payload: CreateCommunityEventPayload): Promise<CommunityEvent> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(payload.community_id, user.id);

    const { data, error } = await supabase
      .from('community_events')
      .insert({
        community_id: payload.community_id,
        title: payload.title.trim(),
        event_date: payload.event_date,
        event_time: payload.event_time?.trim() || null,
        place: payload.place?.trim() || null,
        description: payload.description?.trim() || null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as CommunityEvent;
  },

  async delete(eventId: string, communityId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(communityId, user.id);

    const { error } = await supabase
      .from('community_events')
      .delete()
      .eq('id', eventId)
      .eq('community_id', communityId);
    if (error) throw error;
  },
};
