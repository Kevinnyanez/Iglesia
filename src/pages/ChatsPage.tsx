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
    <div className="mx-auto max-w-4xl space-y-4 p-4 pb-24">
      <h1 className="text-xl font-semibold text-slate-900">Chats</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Chat de comunidad</h2>
        <select
          className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            className="btn-primary px-3"
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
                  : 'border border-indigo-200 bg-white text-[var(--text-secondary)] hover:bg-indigo-50'
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
  );
}
