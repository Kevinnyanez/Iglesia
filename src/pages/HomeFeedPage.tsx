import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InfiniteScrollTrigger } from '../components/InfiniteScrollTrigger';
import { PostComposer } from '../components/PostComposer';
import { PostList } from '../components/PostList';
import { useAuth } from '../hooks/useAuth';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useCommunitiesFeed, useHomeFeed, useRealtimePosts } from '../hooks/usePosts';
import { useMyCommunities } from '../hooks/useCommunity';

export function HomeFeedPage() {
  useRealtimePosts();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isDailyVerseFlow, setIsDailyVerseFlow] = useState(false);
  const [initialVerseReference, setInitialVerseReference] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [feedMode, setFeedMode] = useState<'global' | 'community'>('community');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: dailyVerse } = useDailyVerse();
  const allFeed = useHomeFeed();
  const communitiesFeed = useCommunitiesFeed();
  const { data: myCommunities = [] } = useMyCommunities();

  const activeFeed = feedMode === 'global' ? allFeed : communitiesFeed;
  const posts = activeFeed.data?.pages.flatMap((page) => page.items) ?? [];

  const openGenericComposer = () => {
    setIsDailyVerseFlow(false);
    setInitialVerseReference('');
    setInitialContent('');
    setIsComposerOpen(true);
  };

  const openDailyReflectionComposer = () => {
    if (!dailyVerse) return;
    setIsDailyVerseFlow(true);
    setInitialVerseReference(dailyVerse.reference);
    setInitialContent('');
    setIsComposerOpen(true);
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || user?.email?.split('@')[0] || 'amigo';

  return (
    <div className="pb-24 md:pb-6">
      {/* Header sticky - minimalista */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 md:max-w-5xl">
          <h1 className="mb-3 text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Inicio</h1>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <section className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                  feedMode === 'global'
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setFeedMode('global')}
              >
                Global
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition sm:px-4 sm:py-2 ${
                  feedMode === 'community'
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setFeedMode('community')}
              >
                Comunidad
              </button>
            </section>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[var(--primary)] shadow-sm transition hover:bg-slate-50 sm:px-4 sm:py-2"
              onClick={() => {
                if (myCommunities.length > 0) {
                  navigate(`/community/${myCommunities[0].id}`);
                } else {
                  navigate('/church');
                }
              }}
            >
              {myCommunities.length > 0 ? 'Mi comunidad' : 'Buscar comunidad'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-4 md:max-w-5xl md:px-4">
        {/* Versículo del día - banner destacado */}
        {dailyVerse ? (
          <section className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-800 p-4 text-white shadow-sm sm:p-5">
            <div className="mb-2 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100">
              Versículo del día
            </div>
            <p className="text-base font-semibold text-white sm:text-lg">{dailyVerse.reference}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-100 sm:text-[15px]">{dailyVerse.text}</p>
            <button
              type="button"
              onClick={openDailyReflectionComposer}
              className="btn-secondary mt-4 rounded-full"
            >
              ¿Qué te pareció el versículo de hoy?
            </button>
          </section>
        ) : null}
        <section className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={openGenericComposer}
            className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-100"
          >
            {`Hola ${firstName}, comparte un versículo con los demás...`}
          </button>
        </section>
        {activeFeed.isLoading ? <p className="py-4 text-center text-sm text-slate-600">Cargando publicaciones...</p> : null}
        {activeFeed.error ? <p className="py-4 text-center text-sm text-red-600">No fue posible cargar el feed.</p> : null}
        <PostList posts={posts} />
        <InfiniteScrollTrigger
          hasNextPage={Boolean(activeFeed.hasNextPage)}
          isFetchingNextPage={activeFeed.isFetchingNextPage}
          onLoadMore={() => void activeFeed.fetchNextPage()}
        />

        {isComposerOpen ? (
          <div className="modal-overlay fixed inset-0 z-50 flex items-end bg-black/50 p-3 sm:items-center sm:justify-center">
            <div className="modal-content w-full max-w-xl rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Crear publicación</h2>
                <button
                  type="button"
                  className="btn-ghost px-2"
                  onClick={() => setIsComposerOpen(false)}
                >
                  Cerrar
                </button>
              </div>
              {isDailyVerseFlow && initialVerseReference ? (
                <div className="mb-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Versículo del día: {initialVerseReference}
                </div>
              ) : null}
              <PostComposer
                initialVerseReference={initialVerseReference}
                initialContent={initialContent}
                fixedVerseReference={isDailyVerseFlow ? initialVerseReference : undefined}
                initialVisibility={feedMode === 'community' ? 'church' : 'global'}
                fixedPostType="reflection"
                hideMediaUrl
                submitLabel="Publicar"
                onSuccess={() => setIsComposerOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
