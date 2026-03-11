import type { Church } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

export const churchService = {
  async listChurches(): Promise<Church[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('churches')
      .select('id, name, city, country, is_private, created_by')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Church[];
  },

  async getCurrentUserChurch(): Promise<Church | null> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return null;

    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership?.community_id) return null;

    const { data: church, error: churchError } = await supabase
      .from('churches')
      .select('id, name, city, country, is_private, created_by')
      .eq('id', membership.community_id)
      .single();
    if (churchError) throw churchError;

    return church as Church;
  },
};
