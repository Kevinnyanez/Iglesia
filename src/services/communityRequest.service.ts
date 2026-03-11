import type { CommunityRequest } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

export interface SubmitCommunityRequestPayload {
  name: string;
  description?: string;
  city: string;
  country: string;
  location?: string;
}

async function requireAuthUser() {
  const supabase = requireSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('User is not authenticated');
  return user;
}

async function assertPlatformAdmin(userId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.from('users').select('is_platform_admin').eq('id', userId).single();
  if (error) throw error;
  if (!data?.is_platform_admin) throw new Error('Only platform admins can perform this action');
}

export const communityRequestService = {
  async submitRequest(payload: SubmitCommunityRequestPayload): Promise<CommunityRequest> {
    const supabase = requireSupabaseClient();
    const user = await requireAuthUser();

    const { data, error } = await supabase
      .from('community_requests')
      .insert({
        name: payload.name,
        description: payload.description?.trim() || null,
        city: payload.city,
        country: payload.country,
        location: payload.location?.trim() || null,
        requested_by: user.id,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as CommunityRequest;
  },

  async fetchUserRequests(): Promise<CommunityRequest[]> {
    const supabase = requireSupabaseClient();
    const user = await requireAuthUser();

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    const query = supabase.from('community_requests').select('*').order('created_at', { ascending: false });
    const response = profile.is_platform_admin ? await query : await query.eq('requested_by', user.id);
    if (response.error) throw response.error;
    return (response.data ?? []) as CommunityRequest[];
  },

  async approveRequest(requestId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const user = await requireAuthUser();
    await assertPlatformAdmin(user.id);

    const { data: request, error: requestError } = await supabase
      .from('community_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    if (requestError) throw requestError;
    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    const { data: church, error: churchError } = await supabase
      .from('churches')
      .insert({
        name: request.name,
        description: request.description ?? null,
        city: request.city,
        country: request.country,
        location: request.location ?? null,
        is_private: true,
        created_by: request.requested_by,
      })
      .select('id')
      .single();
    if (churchError) throw churchError;

    const { error: membershipError } = await supabase.from('community_members').insert({
      community_id: church.id,
      user_id: request.requested_by,
      role: 'admin',
    });
    if (membershipError && membershipError.code !== '23505') throw membershipError;

    const { error: updateError } = await supabase.from('community_requests').update({ status: 'approved' }).eq('id', requestId);
    if (updateError) throw updateError;
  },

  async rejectRequest(requestId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const user = await requireAuthUser();
    await assertPlatformAdmin(user.id);

    const { error } = await supabase.from('community_requests').update({ status: 'rejected' }).eq('id', requestId);
    if (error) throw error;
  },
};
