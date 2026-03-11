import type { CommunityMeeting, MeetingSlot } from '../types/models';
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
    throw new Error('Solo los administradores pueden gestionar reuniones');
  }
}

export interface CreateCommunityMeetingPayload {
  community_id: string;
  title: string;
  type: 'meeting' | 'prayer';
  slots: MeetingSlot[];
}

function slotsToSchedule(slots: MeetingSlot[]): string {
  return slots
    .map((s) => s.days.map((d) => (d === 'Domingo' || d === 'Sábado' ? `${d}s` : d)).join(', ') + ' ' + s.time)
    .join(' · ');
}

export const communityMeetingsService = {
  async fetchByCommunity(communityId: string): Promise<CommunityMeeting[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('community_meetings')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data ?? []).map((row) => {
      let slots = (row.slots as MeetingSlot[] | null) ?? [];
      if (!Array.isArray(slots)) slots = [];
      const schedule = row.schedule as string | null;
      const scheduleStr = schedule ?? (slots.length > 0 ? slotsToSchedule(slots) : '');
      return {
        id: row.id,
        community_id: row.community_id,
        title: row.title,
        schedule: scheduleStr,
        type: (row.type as 'meeting' | 'prayer') ?? 'meeting',
        slots,
        created_at: row.created_at,
      } as CommunityMeeting;
    });
  },

  async create(payload: CreateCommunityMeetingPayload): Promise<CommunityMeeting> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(payload.community_id, user.id);

    const schedule = slotsToSchedule(payload.slots);

    const { data, error } = await supabase
      .from('community_meetings')
      .insert({
        community_id: payload.community_id,
        title: payload.title.trim(),
        type: payload.type,
        slots: payload.slots,
        schedule,
      })
      .select('*')
      .single();
    if (error) throw error;

    return {
      id: data.id,
      community_id: data.community_id,
      title: data.title,
      schedule: data.schedule,
      type: data.type,
      slots: (data.slots ?? []) as MeetingSlot[],
      created_at: data.created_at,
    } as CommunityMeeting;
  },

  async delete(meetingId: string, communityId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(communityId, user.id);

    const { error } = await supabase
      .from('community_meetings')
      .delete()
      .eq('id', meetingId)
      .eq('community_id', communityId);
    if (error) throw error;
  },
};
