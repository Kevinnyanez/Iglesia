import type { RealtimeChannel } from '@supabase/supabase-js';
import type { DirectChat, DirectMessage } from '../types/models';
import { notificationService } from './notification.service';
import { requireSupabaseClient } from './supabase/client';

async function canUsersChat(userId: string, otherUserId: string): Promise<boolean> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', userId);
  if (error) throw error;
  const myCommunityIds = new Set((data ?? []).map((item) => item.community_id));
  if (myCommunityIds.size === 0) return false;

  const { data: otherData, error: otherError } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', otherUserId);
  if (otherError) throw otherError;

  return (otherData ?? []).some((item) => myCommunityIds.has(item.community_id));
}

export const directChatService = {
  async createChat(otherUserId: string): Promise<DirectChat> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');
    if (otherUserId === user.id) throw new Error('Cannot create chat with yourself');

    const allowed = await canUsersChat(user.id, otherUserId);
    if (!allowed) {
      throw new Error('Users must share at least one community');
    }

    const { data: existing, error: existingError } = await supabase
      .from('direct_chats')
      .select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return existing as DirectChat;
    }

    const user1Id = user.id < otherUserId ? user.id : otherUserId;
    const user2Id = user.id < otherUserId ? otherUserId : user.id;

    const { data, error } = await supabase
      .from('direct_chats')
      .insert({ user1_id: user1Id, user2_id: user2Id })
      .select('*')
      .single();
    if (error) throw error;
    return data as DirectChat;
  },

  async fetchChats(): Promise<DirectChat[]> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return [];

    const { data, error } = await supabase
      .from('direct_chats')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DirectChat[];
  },

  async sendMessage(chatId: string, content: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data: chat, error: chatError } = await supabase.from('direct_chats').select('*').eq('id', chatId).single();
    if (chatError) throw chatError;
    const isParticipant = chat.user1_id === user.id || chat.user2_id === user.id;
    if (!isParticipant) throw new Error('User is not participant of this chat');

    const { error } = await supabase.from('direct_messages').insert({
      chat_id: chatId,
      author_id: user.id,
      content,
    });
    if (error) throw error;

    const receiverUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
    void notificationService.notifyEvent({
      type: 'new_direct_message',
      chatId,
      receiverUserId,
    });
  },

  async fetchMessages(chatId: string, limit = 100): Promise<DirectMessage[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('direct_messages')
      .select('id, chat_id, author_id, content, created_at, users:author_id(id, name, avatar)')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;

    return (data ?? []).map((item) => ({
      id: item.id,
      chat_id: item.chat_id,
      author_id: item.author_id,
      content: item.content,
      created_at: item.created_at,
      author: Array.isArray(item.users) ? item.users[0] : item.users,
    }));
  },

  subscribeToMessages(chatId: string, onChange: () => void): RealtimeChannel {
    const supabase = requireSupabaseClient();
    return supabase
      .channel(`direct-messages-${chatId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `chat_id=eq.${chatId}` }, onChange)
      .subscribe();
  },
};
