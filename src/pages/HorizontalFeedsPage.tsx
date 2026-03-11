import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { MobileVerticalFeed } from '../components/MobileVerticalFeed';
import { useCurrentUserChurch } from '../hooks/useChurch';
import { useCommunityFeed, useForYouFeed, useGlobalFeed, useRealtimePosts } from '../hooks/usePosts';

type FeedTab = 'for-you' | 'global' | 'community';

const tabs: Array<{ key: FeedTab; label: string }> = [
  { key: 'for-you', label: 'Para ti' },
  { key: 'global', label: 'Global' },
  { key: 'community', label: 'Comunidad' },
];

export function HorizontalFeedsPage() {
  useRealtimePosts();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: currentChurch } = useCurrentUserChurch();
  const [activeTab, setActiveTab] = useState<FeedTab>((searchParams.get('feed') as FeedTab | null) ?? 'for-you');
  const containerRef = useRef<HTMLDivElement | null>(null);

  const forYou = useForYouFeed();
  const global = useGlobalFeed();
  const community = useCommunityFeed(currentChurch?.id);

  const feeds = {
    'for-you': {
      posts: forYou.data?.pages.flatMap((page) => page.items) ?? [],
      hasNextPage: Boolean(forYou.hasNextPage),
      isFetchingNextPage: forYou.isFetchingNextPage,
      fetchNextPage: () => forYou.fetchNextPage(),
    },
    global: {
      posts: global.data?.pages.flatMap((page) => page.items) ?? [],
      hasNextPage: Boolean(global.hasNextPage),
      isFetchingNextPage: global.isFetchingNextPage,
      fetchNextPage: () => global.fetchNextPage(),
    },
    community: {
      posts: community.data?.pages.flatMap((page) => page.items) ?? [],
      hasNextPage: Boolean(community.hasNextPage),
      isFetchingNextPage: community.isFetchingNextPage,
      fetchNextPage: () => community.fetchNextPage(),
    },
  };

  const goToTab = (nextTab: FeedTab) => {
    setActiveTab(nextTab);
    const nextSearch = new URLSearchParams(searchParams);
    nextSearch.set('feed', nextTab);
    setSearchParams(nextSearch, { replace: true });
    const index = tabs.findIndex((tab) => tab.key === nextTab);
    const container = containerRef.current;
    if (!container) return;
    const target = container.children.item(index) as HTMLElement | null;
    target?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
      const next = tabs[currentIndex + 1];
      if (next) goToTab(next.key);
    },
    onSwipedRight: () => {
      const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
      const prev = tabs[currentIndex - 1];
      if (prev) goToTab(prev.key);
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.key === activeTab);
    if (index < 0) return;
    const container = containerRef.current;
    if (!container) return;
    const target = container.children.item(index) as HTMLElement | null;
    target?.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
  }, [activeTab]);

  return (
    <div className="relative h-dvh bg-black text-white md:mx-auto md:max-w-md md:rounded-2xl md:border md:border-slate-200">
      <div className="absolute inset-x-0 top-0 z-20 flex justify-center gap-2 bg-gradient-to-b from-black/75 to-transparent px-4 py-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => goToTab(tab.key)}
            className={`min-h-10 rounded-full px-3 py-2 text-sm ${activeTab === tab.key ? 'bg-white text-slate-900' : 'bg-white/20 text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div {...handlers} ref={containerRef} className="flex h-dvh snap-x snap-mandatory overflow-x-auto">
        <section className="h-dvh w-full shrink-0 snap-start">
          <MobileVerticalFeed {...feeds['for-you']} enableSideSwipeNavigation={false} />
        </section>
        <section className="h-dvh w-full shrink-0 snap-start">
          <MobileVerticalFeed {...feeds.global} enableSideSwipeNavigation={false} />
        </section>
        <section className="h-dvh w-full shrink-0 snap-start">
          {currentChurch ? (
            <MobileVerticalFeed {...feeds.community} enableSideSwipeNavigation={false} />
          ) : (
            <div className="grid h-dvh place-items-center px-6 text-center text-slate-200">
              Únete a una comunidad para ver el feed comunitario.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
