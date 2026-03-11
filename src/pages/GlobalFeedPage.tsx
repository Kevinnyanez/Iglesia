import { InfiniteScrollTrigger } from '../components/InfiniteScrollTrigger';
import { PostList } from '../components/PostList';
import { useGlobalFeed, useRealtimePosts } from '../hooks/usePosts';

export function GlobalFeedPage() {
  useRealtimePosts();
  const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useGlobalFeed();
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="pb-24 md:pb-6">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 md:max-w-5xl">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Comunidad global</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-4 md:max-w-5xl md:px-4">
        {isLoading ? <p className="py-4 text-center text-sm text-slate-600">Cargando publicaciones...</p> : null}
        {error ? <p className="py-4 text-center text-sm text-red-600">No fue posible cargar el feed global.</p> : null}
        <PostList posts={posts} />
        <InfiniteScrollTrigger
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      </div>
    </div>
  );
}
