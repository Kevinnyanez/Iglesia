import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface MessageItem {
  id: string;
  authorName?: string | null;
  content: string;
  createdAt: string;
  isMine: boolean;
}

interface MessageListProps {
  messages: MessageItem[];
}

export function MessageList({ messages }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: sortedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76,
    overscan: 6,
  });

  return (
    <div ref={parentRef} className="h-[55vh] overflow-auto px-3 py-2">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const message = sortedMessages[virtualItem.index];
          return (
            <div
              key={message.id}
              className={`absolute left-0 top-0 w-full p-2 ${message.isMine ? 'text-right' : 'text-left'}`}
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              <div
                className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  message.isMine ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {!message.isMine ? (
                  <div className="mb-1 text-[11px] font-semibold text-slate-600">{message.authorName ?? 'Usuario'}</div>
                ) : null}
                <div>{message.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
