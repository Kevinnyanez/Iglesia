import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSwipeable } from 'react-swipeable';
import { MobilePostSlide } from './MobilePostSlide';
import { CommentThread } from './CommentThread';
import { bibleService } from '../services/bible.service';
import { queryKeys } from '../utils/queryKeys';
import type { PostWithMeta } from '../types/models';

interface MobileVerticalFeedProps {
  posts: PostWithMeta[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => Promise<unknown>;
  enableSideSwipeNavigation?: boolean;
}

function prefetchPostMedia(post?: PostWithMeta) {
  if (!post?.media_url) return;
  if (post.media_type === 'image') {
    const img = new Image();
    img.src = post.media_url;
    return;
  }
  if (post.media_type === 'video') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'video';
    link.href = post.media_url;
    document.head.appendChild(link);
  }
}

export function MobileVerticalFeed({
  posts,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enableSideSwipeNavigation = true,
}: MobileVerticalFeedProps) {
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const activeIndex = useMemo(() => posts.findIndex((post) => post.id === activePostId), [activePostId, posts]);

  const scrollToIndex = useCallback((targetIndex: number) => {
    const container = containerRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(targetIndex, posts.length - 1));
    const targetElement = container.children.item(clamped) as HTMLElement | null;
    targetElement?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [posts.length]);

  const handlers = useSwipeable({
    onSwipedUp: () => {
      if (activeIndex >= 0) scrollToIndex(activeIndex + 1);
    },
    onSwipedDown: () => {
      if (activeIndex >= 0) scrollToIndex(activeIndex - 1);
    },
    onSwipedLeft: () => {
      if (!enableSideSwipeNavigation) return;
      const currentPost = posts[activeIndex];
      if (currentPost?.community?.id) {
        navigate(`/community/${currentPost.community.id}`);
      }
    },
    onSwipedRight: () => {
      if (!enableSideSwipeNavigation) return;
      navigate(-1);
    },
    trackMouse: false,
    preventScrollOnSwipe: false,
  });

  const onFeedScroll = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    const viewportMid = container.scrollTop + window.innerHeight / 2;
    for (let i = 0; i < container.children.length; i += 1) {
      const element = container.children.item(i) as HTMLElement | null;
      if (!element) continue;
      const start = element.offsetTop;
      const end = start + element.offsetHeight;
      if (viewportMid >= start && viewportMid <= end) {
        const post = posts[i];
        if (!post) return;
        setActivePostId(post.id);

        const nextPost = posts[i + 1];
        prefetchPostMedia(nextPost);
        if (nextPost?.verse_reference) {
          void queryClient.prefetchQuery({
            queryKey: queryKeys.bibleReference(nextPost.verse_reference),
            queryFn: () => bibleService.fetchVerseByReference(nextPost.verse_reference),
            staleTime: 5 * 60_000,
          });
        }

        if (hasNextPage && !isFetchingNextPage && i >= posts.length - 3) {
          await fetchNextPage();
        }
        break;
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, posts, queryClient]);

  return (
    <div {...handlers} className="relative h-full bg-black">
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-auto" onScroll={() => void onFeedScroll()}>
        {posts.map((post) => (
          <MobilePostSlide
            key={post.id}
            post={post}
            onOpenComments={() => setCommentsPostId(post.id)}
            onOpenCommunity={() => post.community?.id && navigate(`/community/${post.community.id}`)}
          />
        ))}
      </div>

      {commentsPostId ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-30 mx-auto max-w-md px-3">
          <div className="pointer-events-auto max-h-[45vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Comentarios</h3>
              <button className="text-sm text-slate-600" onClick={() => setCommentsPostId(null)}>
                Cerrar
              </button>
            </div>
            <CommentThread
              postId={commentsPostId}
              commentsEnabled={posts.find((post) => post.id === commentsPostId)?.comments_enabled ?? true}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
