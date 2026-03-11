import type { PostVisibility } from '../types/models';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PostComposer } from '../components/PostComposer';

export function CreatePostPage() {
  const [searchParams] = useSearchParams();
  const initialVerseReference = useMemo(() => searchParams.get('verse') ?? '', [searchParams]);
  const initialContent = useMemo(() => searchParams.get('content') ?? '', [searchParams]);
  const initialVisibility = useMemo(
    () => ((searchParams.get('visibility') as PostVisibility | null) ?? 'global'),
    [searchParams],
  );
  const initialCommunityId = useMemo(() => searchParams.get('communityId') ?? '', [searchParams]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      <h1 className="text-xl font-semibold text-slate-900">Crear publicación</h1>
      <PostComposer
        initialVerseReference={initialVerseReference}
        initialContent={initialContent}
        initialPostType="reflection"
        initialVisibility={initialVisibility}
        initialCommunityId={initialCommunityId}
      />
    </div>
  );
}
