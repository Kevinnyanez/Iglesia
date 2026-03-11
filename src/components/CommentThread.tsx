import { useState, type FormEvent } from 'react';
import { useComments, useCreateComment, useRealtimeComments } from '../hooks/useComments';
import { formatTimeAgo } from '../utils/date';

interface CommentThreadProps {
  postId: string;
  commentsEnabled: boolean;
  inputId?: string;
}

export function CommentThread({ postId, commentsEnabled, inputId }: CommentThreadProps) {
  useRealtimeComments(postId);
  const [content, setContent] = useState('');
  const { data: comments = [] } = useComments(postId);
  const createComment = useCreateComment(postId);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createComment.mutateAsync({
      post_id: postId,
      content,
    });
    setContent('');
  };

  return (
    <div className="rounded-xl bg-slate-50/70 p-3">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">Comentarios</h3>
      <ul className="space-y-2">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border border-slate-100 bg-white p-3 text-sm text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {comment.author?.name?.trim() || `Usuario ${comment.author_id.slice(0, 6)}`}
              </span>
              <span className="text-[11px] text-slate-400">{formatTimeAgo(comment.created_at)}</span>
            </div>
            {comment.content}
          </li>
        ))}
      </ul>
      {commentsEnabled ? (
        <form onSubmit={onSubmit} className="mt-3 flex gap-2">
          <input
            id={inputId}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Escribe un comentario"
            required
          />
          <button type="submit" className="btn-primary px-3">
            Enviar
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Los comentarios están deshabilitados por el autor.</p>
      )}
    </div>
  );
}
