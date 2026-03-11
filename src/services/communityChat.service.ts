import type { RealtimeChannel } from '@supabase/supabase-js';
import type { CommunityMessage } from '../types/models';
import { requireSupabaseClient } from './supabase/client';

export const communityChatService = {
  async fetchMessages(communityId: string, limit = 50): Promise<CommunityMessage[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('community_messages')
      .select('id, community_id, author_id, content, created_at, users:author_id(id, name, avatar)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((item) => ({
      id: item.id,
      community_id: item.community_id,
      author_id: item.author_id,
      content: item.content,
      created_at: item.created_at,
      author: Array.isArray(item.users) ? item.users[0] : item.users,
    }));
  },

  async sendMessage(communityId: string, content: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) {
      throw new Error('Only community members can send messages');
    }

    const { error } = await supabase.from('community_messages').insert({
      community_id: communityId,
      author_id: user.id,
      content,
    });
    if (error) throw error;
  },

  subscribeToMessages(communityId: string, onChange: () => void): RealtimeChannel {
    const supabase = requireSupabaseClient();
    return supabase
      .channel(`community-messages-${communityId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_messages', filter: `community_id=eq.${communityId}` },
        onChange,
      )
      .subscribe();
  },
};
