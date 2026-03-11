import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityChatService } from '../services/communityChat.service';
import { queryKeys } from '../utils/queryKeys';
import { getSupabaseClient } from '../services/supabase/client';

export function useCommunityMessages(communityId?: string) {
  return useQuery({
    queryKey: queryKeys.communityMessages(communityId ?? ''),
    queryFn: () => communityChatService.fetchMessages(communityId as string),
    enabled: Boolean(communityId),
  });
}

export function useSendCommunityMessage(communityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => communityChatService.sendMessage(communityId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityMessages(communityId) });
    },
  });
}

export function useRealtimeCommunityMessages(communityId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!communityId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = communityChatService.subscribeToMessages(communityId, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityMessages(communityId) });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, queryClient]);
}
