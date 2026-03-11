import { InfiniteScrollTrigger } from '../components/InfiniteScrollTrigger';
import { PostList } from '../components/PostList';
import { useGlobalFeed, useRealtimePosts } from '../hooks/usePosts';

export function GlobalFeedPage() {
  useRealtimePosts();
  const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useGlobalFeed();
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Comunidad global</h1>
      {isLoading ? <p className="text-slate-700">Cargando publicaciones globales...</p> : null}
      {error ? <p className="text-red-600">No fue posible cargar el feed global.</p> : null}
      <PostList posts={posts} />
      <InfiniteScrollTrigger
        hasNextPage={Boolean(hasNextPage)}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => void fetchNextPage()}
      />
    </div>
  );
}
