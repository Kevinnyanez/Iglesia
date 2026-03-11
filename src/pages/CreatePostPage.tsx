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
    <div className="pb-24 md:pb-6">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 md:max-w-5xl">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Crear publicación</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-4 md:max-w-5xl md:px-4">
      <PostComposer
        initialVerseReference={initialVerseReference}
        initialContent={initialContent}
        initialPostType="reflection"
        initialVisibility={initialVisibility}
        initialCommunityId={initialCommunityId}
      />
      </div>
    </div>
  );
}
