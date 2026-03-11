import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { postsService, type CreatePostPayload } from '../services/posts.service';
import { queryKeys } from '../utils/queryKeys';
import { getSupabaseClient } from '../services/supabase/client';

export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.homeFeed,
    queryFn: ({ pageParam }) => postsService.listHomeFeed(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useChurchFeed(churchId?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.churchFeed(churchId),
    queryFn: ({ pageParam }) => postsService.listChurchFeed(churchId as string, pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(churchId),
  });
}

export function useGlobalFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.globalFeed,
    queryFn: ({ pageParam }) => postsService.listGlobalFeed(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCommunitiesFeed() {
  return useInfiniteQuery({
    queryKey: ['posts', 'communities-only'],
    queryFn: ({ pageParam }) => postsService.listCommunitiesOnlyFeed(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCommunityFeed(communityId?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.communityFeed(communityId ?? ''),
    queryFn: ({ pageParam }) => postsService.listCommunityFeed(communityId as string, pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(communityId),
  });
}

export function useForYouFeed() {
  return useInfiniteQuery({
    queryKey: queryKeys.forYouFeed,
    queryFn: ({ pageParam }) => postsService.listForYou(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePostPayload) => postsService.create(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homeFeed });
      queryClient.invalidateQueries({ queryKey: queryKeys.globalFeed });
      queryClient.invalidateQueries({ queryKey: ['posts', 'communities-only'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'church'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.forYouFeed });
      if (payload.church_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.communityFeed(payload.church_id) });
      }
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postsService.likePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homeFeed });
      queryClient.invalidateQueries({ queryKey: queryKeys.globalFeed });
      queryClient.invalidateQueries({ queryKey: queryKeys.forYouFeed });
      queryClient.invalidateQueries({ queryKey: ['posts', 'communities-only'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'community'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'church'] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postsService.unlikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homeFeed });
      queryClient.invalidateQueries({ queryKey: queryKeys.globalFeed });
      queryClient.invalidateQueries({ queryKey: queryKeys.forYouFeed });
      queryClient.invalidateQueries({ queryKey: ['posts', 'communities-only'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'community'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'church'] });
    },
  });
}

export function useRealtimePosts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel('posts-live-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.homeFeed });
        queryClient.invalidateQueries({ queryKey: queryKeys.globalFeed });
        queryClient.invalidateQueries({ queryKey: queryKeys.forYouFeed });
        queryClient.invalidateQueries({ predicate: (q) => (q.queryKey as string[])[0] === 'posts' });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
