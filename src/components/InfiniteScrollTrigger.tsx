import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function InfiniteScrollTrigger({ hasNextPage, isFetchingNextPage, onLoadMore }: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div ref={ref} className="py-4 text-center text-sm text-slate-500">
      {isFetchingNextPage ? 'Cargando más publicaciones...' : hasNextPage ? 'Desliza para cargar más' : 'Fin del feed'}
    </div>
  );
}
