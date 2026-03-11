import type { Comment } from '../types/models';
import { notificationService } from './notification.service';
import { requireSupabaseClient } from './supabase/client';

export interface CreateCommentPayload {
  post_id: string;
  content: string;
  parent_comment_id?: string | null;
}

export const commentsService = {
  async listByPost(postId: string): Promise<Comment[]> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        id, post_id, author_id, content, created_at, parent_comment_id,
        users:author_id(id, name, email, avatar)
      `,
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    const rows = (data ?? []) as Array<
      Comment & {
        users?: { id: string; name: string | null; email: string | null; avatar: string | null } | Array<{ id: string; name: string | null; email: string | null; avatar: string | null }> | null;
      }
    >;

    return rows.map((row) => {
      const authorRaw = Array.isArray(row.users) ? (row.users[0] ?? null) : (row.users ?? null);
      const authorName = authorRaw?.name?.trim() || authorRaw?.email?.split('@')[0] || 'Usuario';
      return {
        id: row.id,
        post_id: row.post_id,
        author_id: row.author_id,
        content: row.content,
        created_at: row.created_at,
        parent_comment_id: row.parent_comment_id,
        author: authorRaw
          ? {
              id: authorRaw.id,
              name: authorName,
              email: authorRaw.email ?? '',
              avatar: authorRaw.avatar ?? null,
            }
          : null,
      };
    });
  },

  async create(payload: CreateCommentPayload): Promise<Comment> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('comments_enabled')
      .eq('id', payload.post_id)
      .single();
    if (postError) throw postError;
    if (postData && postData.comments_enabled === false) {
      throw new Error('Comments are disabled for this post');
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: payload.post_id,
        author_id: user.id,
        content: payload.content,
        parent_comment_id: payload.parent_comment_id ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    const { data: postAuthor } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', payload.post_id)
      .single();
    if (postAuthor?.author_id && postAuthor.author_id !== user.id) {
      void notificationService.notifyEvent({
        type: 'new_comment',
        postId: payload.post_id,
        receiverUserId: postAuthor.author_id,
      });
    }

    return data as Comment;
  },
};
