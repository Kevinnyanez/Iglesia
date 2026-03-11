import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { commentsService, type CreateCommentPayload } from '../services/comments.service';
import { queryKeys } from '../utils/queryKeys';
import { getSupabaseClient } from '../services/supabase/client';

export function useComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: () => commentsService.listByPost(postId),
    enabled: Boolean(postId),
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => commentsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useRealtimeComments(postId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !postId) return;

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.comments(postId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);
}
