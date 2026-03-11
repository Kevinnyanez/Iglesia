import { requireSupabaseClient } from './supabase/client';

const AVATARS_BUCKET = 'avatars';
const BANNERS_BUCKET = 'banners';

function getFileExt(file: File): string {
  const mime = file.type;
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const supabase = requireSupabaseClient();
  const ext = getFileExt(file);
  const path = `users/${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCommunityAvatar(communityId: string, file: File): Promise<string> {
  const supabase = requireSupabaseClient();
  const ext = getFileExt(file);
  const path = `communities/${communityId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCommunityBanner(communityId: string, file: File): Promise<string> {
  const supabase = requireSupabaseClient();
  const ext = getFileExt(file);
  const path = `${communityId}/banner.${ext}`;

  const { error } = await supabase.storage.from(BANNERS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BANNERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
