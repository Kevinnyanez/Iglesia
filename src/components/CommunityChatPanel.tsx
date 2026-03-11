import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { useAuth } from '../hooks/useAuth';
import { useCommunityMessages, useRealtimeCommunityMessages, useSendCommunityMessage } from '../hooks/useCommunityChat';

interface CommunityChatPanelProps {
  communityId: string;
}

export function CommunityChatPanel({ communityId }: CommunityChatPanelProps) {
  const { user } = useAuth();
  const { data: messages = [] } = useCommunityMessages(communityId);
  const sendMessage = useSendCommunityMessage(communityId);
  useRealtimeCommunityMessages(communityId);

  return (
    <>
      <MessageList
        messages={messages.map((m) => ({
          id: m.id,
          authorName: m.author?.name,
          content: m.content,
          createdAt: m.created_at,
          isMine: m.author_id === user?.id,
        }))}
      />
      <MessageInput onSend={(content) => sendMessage.mutateAsync(content)} />
    </>
  );
}
