import { CommentThread } from './CommentThread';
import { useDailyVerse } from '../hooks/useDailyVerse';
import { useBibleReference } from '../hooks/useBibleReference';
import { useLikePost, useUnlikePost } from '../hooks/usePosts';
import type { PostWithMeta } from '../types/models';
import { formatTimeAgo } from '../utils/date';

interface PostListProps {
  posts: PostWithMeta[];
}

export function PostList({ posts }: PostListProps) {
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const { data: dailyVerse } = useDailyVerse();

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <PostListItem
          key={post.id}
          post={post}
          dailyVerseReference={dailyVerse?.reference ?? null}
          likePost={likePost}
          unlikePost={unlikePost}
        />
      ))}
    </ul>
  );
}

interface PostListItemProps {
  post: PostWithMeta;
  dailyVerseReference: string | null;
  likePost: ReturnType<typeof useLikePost>;
  unlikePost: ReturnType<typeof useUnlikePost>;
}

function PostListItem({ post, dailyVerseReference, likePost, unlikePost }: PostListItemProps) {
  const isDailyVersePost = Boolean(dailyVerseReference && post.verse_reference === dailyVerseReference);
  const displayContent = post.content;
  const commentInputId = `comment-input-${post.id}`;
  const { data: verseData, isError: verseError } = useBibleReference(post.verse_reference || '');

  return (
    <li className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span className="uppercase tracking-wide">{post.verse_reference}</span>
        <span>{post.community?.name ?? 'Sin comunidad'}</span>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">
          {post.author?.name?.trim() || `Usuario ${post.author_id.slice(0, 6)}`}
        </div>
        <div className="text-xs text-slate-500">{formatTimeAgo(post.created_at)}</div>
      </div>
      {isDailyVersePost ? (
        <div className="mb-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
          Versiculo del dia
        </div>
      ) : null}
      {displayContent ? (
        <p className="mb-3 text-[16px] leading-7 text-slate-900 md:text-[17px]">{displayContent}</p>
      ) : null}
      {post.verse_reference ? (
        <div className="mb-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {post.verse_reference}
          </div>
          <div className="mt-1 text-[13px] leading-relaxed text-slate-800">
            {verseData?.text ?? (verseError ? 'No fue posible cargar el versículo.' : 'Cargando versículo...')}
          </div>
        </div>
      ) : null}
      {post.media_url && post.media_type === 'image' ? (
        <img src={post.media_url} alt="Adjunto" className="mt-3 w-full rounded-md object-cover" />
      ) : null}
      {post.media_url && post.media_type === 'video' ? (
        <video src={post.media_url} controls className="mt-3 w-full rounded-md" />
      ) : null}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <button
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-3 transition ${
              post.has_liked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => (post.has_liked ? unlikePost.mutate(post.id) : likePost.mutate(post.id))}
            aria-label={post.has_liked ? 'Quitar me gusta' : 'Me gusta'}
          >
            <span aria-hidden className={`text-base leading-none ${post.has_liked ? 'text-rose-600' : 'text-slate-400'}`}>
              ❤
            </span>
            <span className="text-sm font-medium">{post.like_count}</span>
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-slate-600 transition hover:bg-slate-50"
            onClick={() => {
              const input = document.getElementById(commentInputId) as HTMLInputElement | null;
              input?.focus();
              input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            aria-label="Comentar publicación"
          >
            <span aria-hidden>💬</span>
            <span className="text-sm font-medium">{post.comment_count}</span>
          </button>
        </div>
      </div>
      <div className="mt-3 border-t border-slate-200/80 pt-3">
        <CommentThread postId={post.id} commentsEnabled={post.comments_enabled} inputId={commentInputId} />
      </div>
    </li>
  );
}
