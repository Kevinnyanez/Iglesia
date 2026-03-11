import { useMemo, useState } from 'react';
import { CommunityChatPanel } from '../components/CommunityChatPanel';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { useAuth } from '../hooks/useAuth';
import { useCreateDirectChat, useDirectChats, useDirectMessages, useRealtimeDirectMessages, useSendDirectMessage } from '../hooks/useDirectChat';
import { useMyCommunities } from '../hooks/useCommunity';

export function ChatsPage() {
  const { user } = useAuth();
  const { data: communities = [] } = useMyCommunities();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [selectedChatId, setSelectedChatId] = useState<string>('');
  const [targetUserId, setTargetUserId] = useState('');
  const createChat = useCreateDirectChat();
  const { data: chats = [] } = useDirectChats();
  const { data: messages = [] } = useDirectMessages(selectedChatId || undefined);
  const sendDirectMessage = useSendDirectMessage(selectedChatId);
  useRealtimeDirectMessages(selectedChatId || undefined);

  const activeCommunityId = selectedCommunityId || communities[0]?.id || '';
  const directChatItems = useMemo(
    () =>
      chats.map((chat) => ({
        id: chat.id,
        title: chat.user1_id === user?.id ? chat.user2_id : chat.user1_id,
      })),
    [chats, user?.id],
  );

  return (
    <div className="pb-24 md:pb-6">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-4 md:max-w-5xl">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl md:text-2xl">Chats</h1>
        </div>
      </header>
      <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-4 md:max-w-5xl md:px-4">

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Chat de comunidad</h2>
        <select
          className="mb-3 w-full rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={activeCommunityId}
          onChange={(event) => setSelectedCommunityId(event.target.value)}
        >
          {communities.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
        {activeCommunityId ? (
          <CommunityChatPanel communityId={activeCommunityId} />
        ) : (
          <p className="text-sm text-slate-600">Únete a una comunidad para usar el chat grupal.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Mensajes directos</h2>
        <div className="mb-3 flex items-center gap-2">
          <input
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
            placeholder="ID del usuario para iniciar chat"
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            className="btn-primary shrink-0 rounded-full px-4 py-2.5"
            onClick={async () => {
              const chat = await createChat.mutateAsync(targetUserId);
              setSelectedChatId(chat.id);
              setTargetUserId('');
            }}
          >
            Iniciar
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {directChatItems.map((chat) => (
            <button
              key={chat.id}
              className={`btn px-3 py-1 ${
                selectedChatId === chat.id
                  ? 'border border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border border-slate-200 bg-white text-[var(--text-secondary)] hover:bg-slate-100'
              }`}
              onClick={() => setSelectedChatId(chat.id)}
            >
              {chat.title}
            </button>
          ))}
        </div>
        {selectedChatId ? (
          <>
            <MessageList
              messages={messages.map((message) => ({
                id: message.id,
                authorName: message.author?.name,
                content: message.content,
                createdAt: message.created_at,
                isMine: message.author_id === user?.id,
              }))}
            />
            <MessageInput onSend={(content) => sendDirectMessage.mutateAsync(content)} />
          </>
        ) : (
          <p className="text-sm text-slate-600">Selecciona un chat para ver mensajes.</p>
        )}
      </section>
      </div>
    </div>
  );
}
