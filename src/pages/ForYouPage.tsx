import { MobileVerticalFeed } from '../components/MobileVerticalFeed';
import { useForYouFeed, useRealtimePosts } from '../hooks/usePosts';

export function ForYouPage() {
  useRealtimePosts();
  const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useForYouFeed();
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return <div className="grid h-dvh place-items-center bg-black text-slate-100">Cargando feed...</div>;
  }

  if (error) {
    return <div className="grid h-dvh place-items-center bg-black px-6 text-center text-red-200">No fue posible cargar este feed.</div>;
  }

  return (
    <MobileVerticalFeed
      posts={posts}
      hasNextPage={Boolean(hasNextPage)}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={() => fetchNextPage()}
    />
  );
}
