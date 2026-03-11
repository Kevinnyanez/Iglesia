import { useState, type FormEvent } from 'react';
import type { PostType, PostVisibility } from '../types/models';
import { useCreatePost } from '../hooks/usePosts';
import { useMyCommunities } from '../hooks/useCommunity';

interface PostComposerProps {
  initialVerseReference?: string;
  initialContent?: string;
  initialPostType?: PostType;
  initialVisibility?: PostVisibility;
  initialCommunityId?: string;
  fixedVerseReference?: string;
  hideVerseReference?: boolean;
  fixedPostType?: PostType;
  fixedVisibility?: PostVisibility;
  hideMediaUrl?: boolean;
  hideAdvancedOptions?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
}

export function PostComposer({
  initialVerseReference = '',
  initialContent = '',
  initialPostType = 'reflection',
  initialVisibility = 'global',
  initialCommunityId = '',
  fixedVerseReference,
  hideVerseReference = false,
  fixedPostType,
  fixedVisibility,
  hideMediaUrl = false,
  hideAdvancedOptions = false,
  submitLabel = 'Publicar',
  onSuccess,
}: PostComposerProps) {
  const [verseReference, setVerseReference] = useState(initialVerseReference);
  const [content, setContent] = useState(initialContent);
  const [visibility, setVisibility] = useState<PostVisibility>(fixedVisibility ?? initialVisibility);
  const [postType, setPostType] = useState<PostType>(fixedPostType ?? initialPostType);
  const [mediaUrl, setMediaUrl] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [communityId, setCommunityId] = useState(initialCommunityId);
  const createPost = useCreatePost();
  const { data: communities = [] } = useMyCommunities();
  const hasCommunities = Boolean(initialCommunityId || communities.length > 0);
  const activeVisibility = fixedVisibility ?? visibility;
  const activePostType = fixedPostType ?? postType;
  const activeVerseReference = fixedVerseReference ?? verseReference;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedMediaUrl = hideMediaUrl ? '' : mediaUrl;
    const inferredMediaType = normalizedMediaUrl.match(/\.(mp4|webm|ogg)$/i) ? 'video' : normalizedMediaUrl ? 'image' : null;
    await createPost.mutateAsync({
      verse_reference: activeVerseReference,
      content,
      visibility: hasCommunities ? activeVisibility : 'global',
      post_type: activePostType,
      media_url: normalizedMediaUrl || null,
      media_type: inferredMediaType,
      comments_enabled: commentsEnabled,
      church_id:
        hasCommunities && activeVisibility === 'church'
          ? initialCommunityId || communityId || communities[0]?.id || null
          : null,
    });
    setVerseReference('');
    setContent('');
    setMediaUrl('');
    setCommentsEnabled(true);
    onSuccess?.();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <textarea
        className="min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Comparte tu reflexión (opcional)..."
      />
      <div className="grid grid-cols-1 gap-2">
        {hideVerseReference ? null : (
          <input
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={verseReference}
            onChange={(event) => setVerseReference(event.target.value)}
            placeholder="Versículo (opcional)"
          />
        )}
        {hideMediaUrl ? null : (
          <input
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={mediaUrl}
            onChange={(event) => setMediaUrl(event.target.value)}
            placeholder="Media URL opcional"
          />
        )}
      </div>
      {hideAdvancedOptions ? null : (
        <div className="flex flex-wrap items-center gap-2">
          {!fixedPostType ? (
            <select
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={postType}
              onChange={(event) => setPostType(event.target.value as PostType)}
            >
              <option value="reflection">Reflexión</option>
              <option value="prayer_request">Oración</option>
              <option value="testimony">Testimonio</option>
              <option value="question">Pregunta</option>
            </select>
          ) : null}
          {!fixedVisibility && hasCommunities ? (
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 text-xs shadow-sm">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-full font-medium transition ${
                  visibility === 'church'
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setVisibility('church')}
              >
                Comunidad
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-full font-medium transition ${
                  visibility === 'global'
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setVisibility('global')}
              >
                Global
              </button>
            </div>
          ) : null}
          {activeVisibility === 'church' && !fixedVisibility && communities.length > 1 ? (
            <select
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={communityId}
              onChange={(event) => setCommunityId(event.target.value)}
            >
              <option value="">Comunidad</option>
              {communities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          ) : null}
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={commentsEnabled} onChange={(event) => setCommentsEnabled(event.target.checked)} />
            Comentarios
          </label>
        </div>
      )}
      <button
        type="submit"
        className="btn-primary min-h-11 w-full rounded-xl"
        disabled={createPost.isPending}
      >
        {createPost.isPending ? 'Publicando...' : submitLabel}
      </button>
    </form>
  );
}
