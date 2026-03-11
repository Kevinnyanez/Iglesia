import { memo } from 'react';
import type { PostWithMeta } from '../types/models';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useBibleReference } from '../hooks/useBibleReference';
import { useLikePost, useUnlikePost } from '../hooks/usePosts';

interface MobilePostSlideProps {
  post: PostWithMeta;
  onOpenComments: () => void;
  onOpenCommunity: () => void;
}

function MobilePostSlideComponent({ post, onOpenComments, onOpenCommunity }: MobilePostSlideProps) {
  const { data: dailyVerse } = useDailyVerse();
  const { data: verseData, isError: verseError } = useBibleReference(post.verse_reference);
  const likeMutation = useLikePost();
  const unlikeMutation = useUnlikePost();
  const isDailyVersePost = Boolean(dailyVerse?.reference && post.verse_reference === dailyVerse.reference);
  const displayContent = post.content;

  return (
    <article className="relative flex h-dvh w-full snap-start flex-col justify-end overflow-hidden bg-slate-950 text-white">
      {post.media_url && post.media_type === 'image' ? (
        <img src={post.media_url} alt="media" className="absolute inset-0 h-full w-full object-cover opacity-55" />
      ) : null}
      {post.media_url && post.media_type === 'video' ? (
        <video src={post.media_url} className="absolute inset-0 h-full w-full object-cover opacity-55" autoPlay loop muted playsInline />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="relative z-10 flex gap-3 p-4 pb-7">
        <div className="flex-1">
          <div className="mb-1 text-sm font-semibold">{post.author?.name?.trim() || `Usuario ${post.author_id.slice(0, 6)}`}</div>
          <button className="mb-2 text-xs text-sky-200 underline" onClick={onOpenCommunity}>
            {post.community?.name ?? 'Comunidad'}
          </button>
          {displayContent ? (
            <p className="mb-3 line-clamp-6 text-[15px] leading-relaxed">{displayContent}</p>
          ) : null}
          {post.verse_reference ? (
            <div className="mb-2 rounded-lg bg-black/30 p-2 text-sm">
              <div className="text-xs font-medium text-amber-300">{post.verse_reference}</div>
              <div className="mt-1 line-clamp-4 text-slate-100">
                {verseData?.text ?? (verseError ? 'No fue posible cargar el versículo.' : 'Cargando versículo...')}
              </div>
            </div>
          ) : null}
          {isDailyVersePost ? (
            <div className="mb-2 inline-flex rounded-full border border-amber-300/50 bg-amber-300/20 px-2 py-1 text-[11px] font-medium text-amber-100">
              Versiculo del dia
            </div>
          ) : null}
        </div>

        <aside className="flex w-16 flex-col items-center justify-end gap-4 pb-4">
          <button
            className={`min-h-11 min-w-11 rounded-full px-2 py-2 ${
              post.has_liked ? 'bg-rose-500/90 text-white' : 'bg-white/20 text-white'
            }`}
            onClick={() => (post.has_liked ? unlikeMutation.mutate(post.id) : likeMutation.mutate(post.id))}
            aria-label={post.has_liked ? 'Quitar me gusta' : 'Me gusta'}
          >
            <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5" fill={post.has_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-6.7-4.4-9.2-8C.6 10.2 1.3 6.7 4.2 5.3c2.1-1 4.5-.3 5.8 1.6 1.3-1.9 3.7-2.6 5.8-1.6 2.9 1.4 3.6 4.9 1.4 7.7C18.7 16.6 12 21 12 21z" />
            </svg>
          </button>
          <span className="text-xs">{post.like_count}</span>
          <button className="min-h-11 min-w-11 rounded-full bg-white/20 px-3 py-2 text-xs" onClick={onOpenComments}>
            Coment
          </button>
          <span className="text-xs">{post.comment_count}</span>
          <button
            className="min-h-11 min-w-11 rounded-full bg-white/20 px-3 py-2 text-xs"
            onClick={() => void navigator.share?.({ title: 'Iglesias', text: post.content })}
          >
            Compartir
          </button>
        </aside>
      </div>
    </article>
  );
}

export const MobilePostSlide = memo(
  MobilePostSlideComponent,
  (prev, next) =>
    prev.post.id === next.post.id &&
    prev.post.has_liked === next.post.has_liked &&
    prev.post.like_count === next.post.like_count &&
    prev.post.comment_count === next.post.comment_count &&
    prev.post.content === next.post.content &&
    prev.post.media_url === next.post.media_url &&
    prev.post.media_type === next.post.media_type &&
    prev.post.verse_reference === next.post.verse_reference,
);
