import { useMemo } from 'react';
import { useCreatePost } from '../hooks/usePosts';
import { useMyCommunities, useJoinCommunity } from '../hooks/useCommunity';
import { useSendCommunityMessage } from '../hooks/useCommunityChat';

export function DevTestPanel() {
  const { data: communities = [] } = useMyCommunities();
  const createPost = useCreatePost();
  const joinCommunity = useJoinCommunity();
  const firstCommunity = useMemo(() => communities[0], [communities]);
  const sendMessage = useSendCommunityMessage(firstCommunity?.id ?? '');

  if (!import.meta.env.DEV) return null;

  return (
    <section className="rounded-xl border border-dashed border-orange-300 bg-orange-50 p-3">
      <h3 className="mb-2 text-sm font-semibold text-orange-900">Modo de prueba (DEV)</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          className="min-h-11 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white"
          onClick={() => firstCommunity && joinCommunity.mutate(firstCommunity.id)}
          disabled={!firstCommunity}
        >
          Mock join community
        </button>
        <button
          className="min-h-11 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white"
          onClick={() =>
            createPost.mutate({
              verse_reference: 'John 3:16',
              content: 'Post de prueba de desarrollo',
              visibility: 'global',
              post_type: 'reflection',
              media_url: null,
              media_type: null,
              comments_enabled: true,
            })
          }
        >
          Test post creation
        </button>
        <button
          className="min-h-11 rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white"
          onClick={() => firstCommunity && sendMessage.mutate('Mensaje de prueba desde modo dev')}
          disabled={!firstCommunity}
        >
          Test chat message
        </button>
      </div>
    </section>
  );
}
