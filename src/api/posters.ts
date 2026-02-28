/**
 * API functions for marketing posters operations
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { Profile } from '@/types/database';

const POSTERS_BUCKET = 'marketing-posters';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export interface MarketingPoster {
  id: string;
  title: string;
  poster_date: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface MarketingPosterWithProfile extends MarketingPoster {
  uploader?: {
    full_name: string | null;
    email: string;
  };
}

export interface PosterInsert {
  title: string;
  poster_date: string;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
}

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_');

const attachUploaderProfiles = async (
  posters: MarketingPoster[]
): Promise<MarketingPosterWithProfile[]> => {
  if (posters.length === 0) return posters as MarketingPosterWithProfile[];

  const userIds = Array.from(new Set(posters.map((poster) => poster.uploaded_by).filter(Boolean)));
  if (userIds.length === 0) return posters as MarketingPosterWithProfile[];

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, full_name, email')
    .in('user_id', userIds);

  if (profilesError || !profilesData) {
    return posters as MarketingPosterWithProfile[];
  }

  const profileMap = new Map<string, Profile>();
  profilesData.forEach((profile) => {
    if (profile.user_id) {
      profileMap.set(profile.user_id, profile as Profile);
    }
  });

  return posters.map((poster) => {
    const uploaderProfile = profileMap.get(poster.uploaded_by);

    return {
      ...poster,
      uploader: uploaderProfile
        ? {
            full_name: uploaderProfile.full_name,
            email: uploaderProfile.email,
          }
        : undefined,
    };
  });
};

export const postersApi = {
  async uploadFile(file: File): Promise<{ path: string; fileName: string; fileSize: number }> {
    try {
      const safeName = sanitizeFilename(file.name || 'poster');
      const path = `${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from(POSTERS_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });

      if (error) throw new ApiError(error.message, error.code, error.details);

      return {
        path,
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل رفع الملصق', 'UPLOAD_FAILED');
    }
  },

  async createSignedUrl(fileUrl: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(POSTERS_BUCKET)
        .createSignedUrl(fileUrl, SIGNED_URL_TTL_SECONDS);

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data?.signedUrl) throw new ApiError('تعذر إنشاء رابط التحميل', 'SIGNED_URL_FAILED');

      return data.signedUrl;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('تعذر إنشاء رابط التحميل', 'SIGNED_URL_FAILED');
    }
  },

  async removeFile(path: string): Promise<void> {
    const { error } = await supabase.storage.from(POSTERS_BUCKET).remove([path]);
    if (error) {
      logger.warn('Failed to remove poster file from storage', { error: error.message, path });
    }
  },

  async list(filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<MarketingPosterWithProfile[]> {
    try {
      let query = supabase
        .from('marketing_posters')
        .select('*')
        .order('poster_date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('poster_date', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('poster_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw new ApiError(error.message, error.code, error.details);
      return await attachUploaderProfiles((data || []) as MarketingPoster[]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الملصقات', 'UNKNOWN_ERROR');
    }
  },

  async getById(id: string): Promise<MarketingPosterWithProfile> {
    try {
      const { data, error } = await supabase
        .from('marketing_posters')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الملصق غير موجود', 'NOT_FOUND');
      const [poster] = await attachUploaderProfiles([data as MarketingPoster]);
      return poster || (data as MarketingPosterWithProfile);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الملصق', 'UNKNOWN_ERROR');
    }
  },

  async create(poster: PosterInsert): Promise<MarketingPoster> {
    try {
      const { data, error } = await supabase
        .from('marketing_posters')
        .insert(poster)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إنشاء الملصق', 'CREATE_FAILED');
      return data as MarketingPoster;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إضافة الملصق', 'UNKNOWN_ERROR');
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('marketing_posters')
        .select('file_url')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        logger.warn('Failed to fetch poster before delete', { error: fetchError.message, posterId: id });
      }

      const { error } = await supabase
        .from('marketing_posters')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);

      if (existing?.file_url) {
        await postersApi.removeFile(existing.file_url);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف الملصق', 'UNKNOWN_ERROR');
    }
  },
};
