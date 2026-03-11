import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { directChatService } from '../services/directChat.service';
import { queryKeys } from '../utils/queryKeys';
import { getSupabaseClient } from '../services/supabase/client';

export function useDirectChats() {
  return useQuery({
    queryKey: queryKeys.directChats,
    queryFn: () => directChatService.fetchChats(),
  });
}

export function useCreateDirectChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => directChatService.createChat(otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.directChats });
    },
  });
}

export function useDirectMessages(chatId?: string) {
  return useQuery({
    queryKey: queryKeys.directMessages(chatId ?? ''),
    queryFn: () => directChatService.fetchMessages(chatId as string),
    enabled: Boolean(chatId),
  });
}

export function useSendDirectMessage(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => directChatService.sendMessage(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.directMessages(chatId) });
    },
  });
}

export function useRealtimeDirectMessages(chatId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = directChatService.subscribeToMessages(chatId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.directMessages(chatId) });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);
}
