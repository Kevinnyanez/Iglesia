export type PostVisibility = 'church' | 'global';
export type PostType = 'reflection' | 'prayer_request' | 'testimony' | 'question';
export type CommunityRole = 'admin' | 'moderator' | 'member';
export type GoalType = 'prayer' | 'bible' | 'meditation';

export interface Church {
  id: string;
  name: string;
  description?: string | null;
  city: string;
  country: string;
  location?: string | null;
  is_private: boolean;
  avatar_url?: string | null;
  banner_url?: string | null;
  created_by: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  church_id: string | null;
  is_platform_admin: boolean;
  can_create_community?: boolean;
}

export interface Post {
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
}

export interface PostWithMeta extends Post {
  author: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
  community: Pick<Church, 'id' | 'name'> | null;
  like_count: number;
  comment_count: number;
  has_liked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  author?: Pick<AppUser, 'id' | 'name' | 'avatar' | 'email'> | null;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  verse_reference: string;
  completed: boolean;
  date: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityRole;
  joined_at: string;
  user?: Pick<AppUser, 'id' | 'name' | 'email' | 'avatar'>;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  type: GoalType;
  target_minutes: number;
  target_days: number;
  created_at: string;
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  date: string;
  completed: boolean;
  minutes_done: number;
}

export interface CommunityMessage {
  id: string;
  community_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

export interface DirectChat {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  chat_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface CommunityRequest {
  id: string;
  name: string;
  description: string | null;
  city: string;
  country: string;
  location: string | null;
  requested_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface CommunityJoinRequest {
  id: string;
  community_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: Pick<AppUser, 'id' | 'name' | 'avatar'> | null;
}

export interface CommunityGoal {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string | null;
  type: 'prayer' | 'bible' | 'meditation';
  target_days: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export type MeetingSlot = { days: string[]; time: string };

export interface CommunityMeeting {
  id: string;
  community_id: string;
  title: string;
  schedule?: string;
  type: 'meeting' | 'prayer';
  slots: MeetingSlot[];
  created_at: string;
}

export interface CommunityEvent {
  id: string;
  community_id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  place: string | null;
  description: string | null;
  created_at: string;
}

export interface BibleBook {
  id: string;
  name: string;
}

export interface BibleChapter {
  id: string;
  book_id: string;
  chapter_number: number;
}

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
}
