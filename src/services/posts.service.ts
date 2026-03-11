import type { PostType, PostVisibility, PostWithMeta } from '../types/models';
import { notificationService } from './notification.service';
import { requireSupabaseClient } from './supabase/client';

export interface CreatePostPayload {
  verse_reference: string;
  content: string;
  visibility: PostVisibility;
  post_type: PostType | null;
  media_url?: string | null;
  media_type?: 'image' | 'video' | string | null;
  comments_enabled?: boolean;
  church_id?: string | null;
}

export interface FeedPage {
  items: PostWithMeta[];
  nextCursor: string | null;
}

const PAGE_SIZE = 10;
const FOR_YOU_FETCH_LIMIT = 120;

function calculateForYouScore(post: PostWithMeta): number {
  const createdAtMs = new Date(post.created_at).getTime();
  const nowMs = Date.now();
  const ageHours = Math.max(0, (nowMs - createdAtMs) / (1000 * 60 * 60));
  const ageFactor = ageHours * 0.8;
  return post.like_count * 3 + post.comment_count * 5 - ageFactor;
}

type RawPostRow = {
  id: string;
  author_id: string;
  church_id: string | null;
  verse_reference: string;
  content: string;
  visibility: PostVisibility;
  post_type: PostType;
  media_url: string | null;
  media_type: string | null;
  comments_enabled: boolean;
  created_at: string;
  users: { id: string; name: string; avatar: string | null; email?: string | null } | Array<{ id: string; name: string; avatar: string | null; email?: string | null }> | null;
  churches: { id: string; name: string } | Array<{ id: string; name: string }> | null;
  post_likes: Array<{ user_id: string }>;
  comments: Array<{ id: string }>;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapPostWithMeta(row: RawPostRow, currentUserId: string): PostWithMeta {
  const author = pickOne(row.users);
  const community = pickOne(row.churches);
  const authorName = author?.name?.trim() || author?.email?.split('@')[0] || 'Usuario';

  return {
    id: row.id,
    author_id: row.author_id,
    church_id: row.church_id,
    verse_reference: row.verse_reference,
    content: row.content,
    visibility: row.visibility,
    media_url: row.media_url,
    media_type: row.media_type,
    comments_enabled: row.comments_enabled,
    created_at: row.created_at,
    author: author
      ? {
          id: author.id,
          name: authorName,
          avatar: author.avatar ?? null,
        }
      : null,
    community: community ?? null,
    like_count: row.post_likes.length,
    comment_count: row.comments.length,
    post_type: row.post_type ?? 'reflection',
    has_liked: row.post_likes.some((like) => like.user_id === currentUserId),
  };
}

export const postsService = {
  async create(payload: CreatePostPayload): Promise<PostWithMeta> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        church_id: payload.church_id ?? null,
        verse_reference: payload.verse_reference,
        content: payload.content,
        visibility: payload.visibility,
        post_type: payload.post_type,
        media_url: payload.media_url ?? null,
        media_type: payload.media_type ?? null,
        comments_enabled: payload.comments_enabled ?? true,
      })
      .select(
        `
        id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
        users:author_id(id, name, email, avatar),
        churches:church_id(id, name),
        post_likes(user_id),
        comments(id)
      `,
      )
      .single();

    if (error) throw error;

    if (payload.visibility === 'church' && payload.church_id) {
      void notificationService.notifyEvent({
        type: 'new_church_post',
        communityId: payload.church_id,
        postId: data.id,
      });
    }

    return mapPostWithMeta(data as unknown as RawPostRow, user.id);
  },

  async listHomeFeed(cursor?: string): Promise<FeedPage> {
    const supabase = requireSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return { items: [], nextCursor: null };

    const currentUserId = userData.user.id;

    const { data: memberships, error: membershipsError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', currentUserId);
    if (membershipsError) throw membershipsError;

    const communityIds = memberships?.map((item) => item.community_id) ?? [];

    let query = supabase
      .from('posts')
      .select(
        `
        id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
        users:author_id(id, name, email, avatar),
        churches:church_id(id, name),
        post_likes(user_id),
        comments(id)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const baseResult = await query.eq('visibility', 'global');
    if (baseResult.error) throw baseResult.error;
    const globalRows = (baseResult.data ?? []) as unknown as RawPostRow[];

    let communityRows: RawPostRow[] = [];
    if (communityIds.length > 0) {
      let communityQuery = supabase
        .from('posts')
        .select(
          `
          id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
          users:author_id(id, name, email, avatar),
          churches:church_id(id, name),
          post_likes(user_id),
          comments(id)
        `,
        )
        .eq('visibility', 'church')
        .in('church_id', communityIds)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1);

      if (cursor) {
        communityQuery = communityQuery.lt('created_at', cursor);
      }

      const communityResult = await communityQuery;
      if (communityResult.error) throw communityResult.error;
      communityRows = (communityResult.data ?? []) as unknown as RawPostRow[];
    }

    const merged = [...globalRows, ...communityRows].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const dedupMap = new Map<string, RawPostRow>();
    for (const row of merged) {
      dedupMap.set(row.id, row);
    }
    const deduped = Array.from(dedupMap.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const pageRows = deduped.slice(0, PAGE_SIZE);
    const nextCursor = deduped.length > PAGE_SIZE ? pageRows[pageRows.length - 1].created_at : null;

    return {
      items: pageRows.map((row) => mapPostWithMeta(row, currentUserId)),
      nextCursor,
    };
  },

  async listCommunitiesOnlyFeed(cursor?: string): Promise<FeedPage> {
    const supabase = requireSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return { items: [], nextCursor: null };

    const currentUserId = userData.user.id;

    const { data: memberships, error: membershipsError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', currentUserId);
    if (membershipsError) throw membershipsError;

    const communityIds = memberships?.map((item) => item.community_id) ?? [];
    if (communityIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    let query = supabase
      .from('posts')
      .select(
        `
        id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
        users:author_id(id, name, email, avatar),
        churches:church_id(id, name),
        post_likes(user_id),
        comments(id)
      `,
      )
      .eq('visibility', 'church')
      .in('church_id', communityIds)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as RawPostRow[];
    const pageRows = rows.slice(0, PAGE_SIZE);
    const nextCursor = rows.length > PAGE_SIZE ? pageRows[pageRows.length - 1].created_at : null;

    return {
      items: pageRows.map((row) => mapPostWithMeta(row, currentUserId)),
      nextCursor,
    };
  },

  async listCommunityFeed(communityId: string, cursor?: string): Promise<FeedPage> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return { items: [], nextCursor: null };

    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) return { items: [], nextCursor: null };

    let query = supabase
      .from('posts')
      .select(
        `
        id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
        users:author_id(id, name, email, avatar),
        churches:church_id(id, name),
        post_likes(user_id),
        comments(id)
      `,
      )
      .eq('church_id', communityId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as RawPostRow[];
    const pageRows = rows.slice(0, PAGE_SIZE);
    const nextCursor = rows.length > PAGE_SIZE ? pageRows[pageRows.length - 1].created_at : null;

    return {
      items: pageRows.map((row) => mapPostWithMeta(row, user.id)),
      nextCursor,
    };
  },

  async listChurchFeed(churchId: string, cursor?: string): Promise<FeedPage> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return { items: [], nextCursor: null };

    let query = supabase
      .from('posts')
      .select(
        `
        id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
        users:author_id(id, name, email, avatar),
        churches:church_id(id, name),
        post_likes(user_id),
        comments(id)
      `,
      )
      .eq('church_id', churchId)
      .eq('visibility', 'church')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as RawPostRow[];
    const pageRows = rows.slice(0, PAGE_SIZE);
    const nextCursor = rows.length > PAGE_SIZE ? pageRows[pageRows.length - 1].created_at : null;

    return {
      items: pageRows.map((row) => mapPostWithMeta(row, user.id)),
      nextCursor,
    };
  },

  async listGlobalFeed(cursor?: string): Promise<FeedPage> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return { items: [], nextCursor: null };

    let query = supabase
      .from('posts')
      .select(
        `
        id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
        users:author_id(id, name, email, avatar),
        churches:church_id(id, name),
        post_likes(user_id),
        comments(id)
      `,
      )
      .eq('visibility', 'global')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as unknown as RawPostRow[];
    const pageRows = rows.slice(0, PAGE_SIZE);
    const nextCursor = rows.length > PAGE_SIZE ? pageRows[pageRows.length - 1].created_at : null;

    return {
      items: pageRows.map((row) => mapPostWithMeta(row, user.id)),
      nextCursor,
    };
  },

  async listForYou(cursor?: string): Promise<FeedPage> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) return { items: [], nextCursor: null };

    const { data: memberships, error: membershipsError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);
    if (membershipsError) throw membershipsError;
    const communityIds = memberships?.map((item) => item.community_id) ?? [];

    let query = supabase
      .from('posts')
      .select(
        `
        id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
        users:author_id(id, name, email, avatar),
        churches:church_id(id, name),
        post_likes(user_id),
        comments(id)
      `,
      )
      .order('created_at', { ascending: false })
      .limit(FOR_YOU_FETCH_LIMIT);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const globalResult = await query.eq('visibility', 'global');
    if (globalResult.error) throw globalResult.error;
    const globalRows = (globalResult.data ?? []) as unknown as RawPostRow[];

    let communityRows: RawPostRow[] = [];
    if (communityIds.length > 0) {
      let communityQuery = supabase
        .from('posts')
        .select(
          `
          id, author_id, church_id, verse_reference, content, visibility, post_type, media_url, media_type, comments_enabled, created_at,
          users:author_id(id, name, email, avatar),
          churches:church_id(id, name),
          post_likes(user_id),
          comments(id)
        `,
        )
        .eq('visibility', 'church')
        .in('church_id', communityIds)
        .order('created_at', { ascending: false })
        .limit(FOR_YOU_FETCH_LIMIT);
      if (cursor) {
        communityQuery = communityQuery.lt('created_at', cursor);
      }
      const communityResult = await communityQuery;
      if (communityResult.error) throw communityResult.error;
      communityRows = (communityResult.data ?? []) as unknown as RawPostRow[];
    }

    const allRows = [...globalRows, ...communityRows];
    const mapped = allRows.map((row) => mapPostWithMeta(row, user.id));
    mapped.sort((a, b) => {
      const scoreDiff = calculateForYouScore(b) - calculateForYouScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return b.created_at.localeCompare(a.created_at);
    });

    const pageItems = mapped.slice(0, PAGE_SIZE);
    const nextCursor = mapped.length > PAGE_SIZE ? pageItems[pageItems.length - 1].created_at : null;
    return { items: pageItems, nextCursor };
  },

  async likePost(postId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { error } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: user.id,
    });
    if (error && error.code !== '23505') throw error;
  },

  async unlikePost(postId: string): Promise<void> {
    const supabase = requireSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User is not authenticated');

    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    if (error) throw error;
  },
};
