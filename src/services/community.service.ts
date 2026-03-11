import type { Church, CommunityMember, CommunityRole } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

export interface CreateCommunityPayload {
  name: string;
  description?: string;
  city: string;
  country: string;
  location?: string;
  is_private?: boolean;
}

export interface UpdateCommunityPayload {
  name?: string;
  description?: string;
  city?: string;
  country?: string;
  location?: string;
  avatar_url?: string | null;
  banner_url?: string | null;
}

async function assertCanCreateCommunity(userId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('is_platform_admin, can_create_community')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (!data?.is_platform_admin && !data?.can_create_community) {
    throw new Error('No tienes permiso para crear comunidades. Solicita al administrador.');
  }
}

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
    throw new Error('Only community admins can manage this community');
  }
}

export const communityService = {
  async createCommunity(payload: CreateCommunityPayload): Promise<Church> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCanCreateCommunity(user.id);

    const { data: community, error: communityError } = await supabase
      .from('churches')
      .insert({
        name: payload.name,
        description: payload.description?.trim() || null,
        city: payload.city,
        country: payload.country,
        location: payload.location?.trim() || null,
        is_private: payload.is_private ?? true,
        created_by: user.id,
      })
      .select('id, name, description, city, country, location, is_private, avatar_url, created_by')
      .single();
    if (communityError) throw communityError;

    const { error: membershipError } = await supabase.from('community_members').insert({
      community_id: community.id,
      user_id: user.id,
      role: 'admin',
    });
    if (membershipError && membershipError.code !== '23505') throw membershipError;

    return community as Church;
  },

  async joinCommunity(communityId: string, role: CommunityRole = 'member'): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data: church } = await supabase.from('churches').select('is_private').eq('id', communityId).single();
    if (church?.is_private) {
      const { error } = await supabase.from('community_join_requests').insert({
        community_id: communityId,
        user_id: user.id,
        status: 'pending',
      });
      if (error && error.code !== '23505') throw error;
      return;
    }

    const { error } = await supabase.from('community_members').insert({
      community_id: communityId,
      user_id: user.id,
      role,
    });
    if (error && error.code !== '23505') throw error;
  },

  async requestToJoinCommunity(communityId: string): Promise<void> {
    return this.joinCommunity(communityId);
  },

  async approveJoinRequest(requestId: string): Promise<string> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data: req, error: reqError } = await supabase
      .from('community_join_requests')
      .select('community_id, user_id')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();
    if (reqError || !req) throw new Error('Solicitud no encontrada');
    await assertCommunityAdmin(req.community_id, user.id);

    const { error: memberError } = await supabase.from('community_members').insert({
      community_id: req.community_id,
      user_id: req.user_id,
      role: 'member',
    });
    if (memberError && memberError.code !== '23505') throw memberError;

    const { error: updateError } = await supabase
      .from('community_join_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);
    if (updateError) throw updateError;
    return req.community_id;
  },

  async rejectJoinRequest(requestId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data: req } = await supabase.from('community_join_requests').select('community_id').eq('id', requestId).single();
    if (req) await assertCommunityAdmin(req.community_id, user.id);

    const { error } = await supabase.from('community_join_requests').update({ status: 'rejected' }).eq('id', requestId);
    if (error) throw error;
  },

  async getMyJoinRequestStatus(communityId: string): Promise<'member' | 'pending' | 'none'> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return 'none';

    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membership) return 'member';

    const { data: request } = await supabase
      .from('community_join_requests')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    return request ? 'pending' : 'none';
  },

  async fetchJoinRequests(communityId: string): Promise<{ id: string; user_id: string; status: string; created_at: string; user?: { id: string; name: string; avatar: string | null } }[]> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];
    await assertCommunityAdmin(communityId, user.id);

    const { data, error } = await supabase
      .from('community_join_requests')
      .select('id, user_id, status, created_at, users:user_id(id, name, avatar)')
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      status: r.status,
      created_at: r.created_at,
      user: Array.isArray(r.users) ? r.users[0] : r.users,
    }));
  },

  async leaveCommunity(communityId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);
    if (error) throw error;
  },

  async fetchUserCommunities(): Promise<Church[]> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];

    const { data, error } = await supabase
      .from('community_members')
      .select('churches:community_id(id, name, description, city, country, location, is_private, avatar_url, created_by)')
      .eq('user_id', user.id);
    if (error) throw error;

    return (data ?? [])
      .map((item) => (Array.isArray(item.churches) ? item.churches[0] : item.churches))
      .filter((value): value is Church => Boolean(value));
  },

  async fetchCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('community_members')
      .select('id, community_id, user_id, role, joined_at, users:user_id(id, name, email, avatar)')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true });
    if (error) throw error;

    return (data ?? []).map((item) => ({
      id: item.id,
      community_id: item.community_id,
      user_id: item.user_id,
      role: item.role as CommunityRole,
      joined_at: item.joined_at,
      user: Array.isArray(item.users) ? item.users[0] : (item.users ?? undefined),
    }));
  },

  async fetchCommunityById(communityId: string): Promise<Church | null> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('churches')
      .select('id, name, description, city, country, location, is_private, avatar_url, banner_url, created_by')
      .eq('id', communityId)
      .single();
    if (error) throw error;
    return (data as Church) ?? null;
  },

  async updateCommunity(communityId: string, payload: UpdateCommunityPayload): Promise<Church> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(communityId, user.id);

    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description?.trim() || null;
    if (payload.city !== undefined) updates.city = payload.city;
    if (payload.country !== undefined) updates.country = payload.country;
    if (payload.location !== undefined) updates.location = payload.location?.trim() || null;
    if (payload.avatar_url !== undefined) updates.avatar_url = payload.avatar_url?.trim() || null;
    if (payload.banner_url !== undefined) updates.banner_url = payload.banner_url?.trim() || null;

    const { data, error } = await supabase
      .from('churches')
      .update(updates)
      .eq('id', communityId)
      .select('id, name, description, city, country, location, is_private, avatar_url, banner_url, created_by')
      .single();
    if (error) throw error;
    return data as Church;
  },

  async listPublicCommunities(): Promise<(Church & { member_count: number })[]> {
    const supabase = requireSupabaseClient();
    const { data: churches, error } = await supabase
      .from('churches')
      .select('id, name, description, city, country, location, is_private, avatar_url, created_by')
      .order('name', { ascending: true });
    if (error) throw error;

    const withCount = await Promise.all(
      (churches ?? []).map(async (c) => {
        const { count } = await supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', c.id);
        return { ...c, member_count: count ?? 0 } as Church & { member_count: number };
      })
    );
    return withCount;
  },

  async updateMemberRole(communityId: string, targetUserId: string, role: CommunityRole): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(communityId, user.id);

    const { error } = await supabase
      .from('community_members')
      .update({ role })
      .eq('community_id', communityId)
      .eq('user_id', targetUserId);
    if (error) throw error;
  },

  async removeMember(communityId: string, targetUserId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    await assertCommunityAdmin(communityId, user.id);

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', targetUserId);
    if (error) throw error;
  },
};
