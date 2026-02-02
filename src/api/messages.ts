/**
 * API functions for team messages operations
 * Pure functions that interact with Supabase including realtime subscriptions
 */

import { supabase } from '@/integrations/supabase/client';
import type { TeamMessage, TeamMessageInsert, TeamMessageUpdate, Profile } from '@/types/database';
import { ApiError } from '@/lib/errors';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Team message with sender profile information
 */
export interface TeamMessageWithProfile extends TeamMessage {
  profiles?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

const attachSenderProfiles = async (messages: TeamMessage[]): Promise<TeamMessageWithProfile[]> => {
  if (messages.length === 0) return messages as TeamMessageWithProfile[];

  const userIds = Array.from(new Set(messages.map((msg) => msg.sender_id).filter(Boolean)));
  if (userIds.length === 0) return messages as TeamMessageWithProfile[];

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, avatar_url')
    .in('user_id', userIds);

  if (profilesError || !profilesData) {
    return messages as TeamMessageWithProfile[];
  }

  const profileMap = new Map<string, Profile>();
  profilesData.forEach((profile) => {
    if (profile.user_id) {
      profileMap.set(profile.user_id, profile as Profile);
    }
  });

  return messages.map((message) => {
    const senderProfile = profileMap.get(message.sender_id);

    return {
      ...message,
      profiles: senderProfile
        ? {
            full_name: senderProfile.full_name,
            email: senderProfile.email,
            avatar_url: senderProfile.avatar_url,
          }
        : undefined,
    };
  });
};

/**
 * Team messages API functions
 */
export const messagesApi = {
  /**
   * List messages with optional filters
   */
  async list(filters?: {
    userId?: string;
    recipientId?: string;
    isGroupMessage?: boolean;
    limit?: number;
  }): Promise<TeamMessageWithProfile[]> {
    try {
      let query = supabase
        .from('team_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.userId) {
        query = query.eq('sender_id', filters.userId);
      }

      if (filters?.recipientId) {
        query = query.eq('recipient_id', filters.recipientId);
      }

      if (filters?.isGroupMessage !== undefined) {
        if (filters.isGroupMessage) {
          query = query.is('recipient_id', null);
        } else {
          query = query.not('recipient_id', 'is', null);
        }
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw new ApiError(error.message, error.code, error.details);
      return await attachSenderProfiles((data || []) as TeamMessage[]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الرسائل', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get conversation between two users
   */
  async getConversation(userId1: string, userId2: string, limit: number = 50): Promise<TeamMessageWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`
        )
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw new ApiError(error.message, error.code, error.details);
      return await attachSenderProfiles((data || []) as TeamMessage[]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل المحادثة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get group messages
   */
  async getGroupMessages(limit: number = 100): Promise<TeamMessageWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .is('recipient_id', null)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw new ApiError(error.message, error.code, error.details);
      return await attachSenderProfiles((data || []) as TeamMessage[]);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل رسائل المجموعة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get message by ID
   */
  async getById(id: string): Promise<TeamMessage> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الرسالة غير موجودة', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل الرسالة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Send a message (create)
   */
  async send(message: TeamMessageInsert): Promise<TeamMessage> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('فشل في إرسال الرسالة', 'CREATE_FAILED');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في إرسال الرسالة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Update message
   */
  async update(id: string, updates: TeamMessageUpdate): Promise<TeamMessage> {
    try {
      const { data, error } = await supabase
        .from('team_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new ApiError(error.message, error.code, error.details);
      if (!data) throw new ApiError('الرسالة غير موجودة', 'NOT_FOUND');

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث الرسالة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Mark message as read
   */
  async markAsRead(id: string): Promise<TeamMessage> {
    try {
      return await this.update(id, { is_read: true });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحديث حالة القراءة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Delete message
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_messages')
        .delete()
        .eq('id', id);

      if (error) throw new ApiError(error.message, error.code, error.details);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في حذف الرسالة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Get unread messages count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('team_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) throw new ApiError(error.message, error.code, error.details);
      return count || 0;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('فشل في تحميل عدد الرسائل غير المقروءة', 'UNKNOWN_ERROR');
    }
  },

  /**
   * Subscribe to new messages (realtime)
   * Returns a channel that must be unsubscribed when done
   */
  subscribeToMessages(
    callback: (message: TeamMessage) => void,
    filter?: {
      userId?: string;
      isGroupMessage?: boolean;
    }
  ): RealtimeChannel {
    let channel = supabase
      .channel('team_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
        },
        (payload) => {
          const newMessage = payload.new as TeamMessage;

          // Apply filters
          if (filter?.userId && newMessage.recipient_id !== filter.userId && newMessage.sender_id !== filter.userId) {
            return;
          }

          if (filter?.isGroupMessage !== undefined) {
            const isGroup = newMessage.recipient_id === null;
            if (filter.isGroupMessage !== isGroup) {
              return;
            }
          }

          callback(newMessage);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Subscribe to group messages only
   */
  subscribeToGroupMessages(callback: (message: TeamMessage) => void): RealtimeChannel {
    return this.subscribeToMessages(callback, { isGroupMessage: true });
  },

  /**
   * Subscribe to direct messages for a specific user
   */
  subscribeToDirectMessages(userId: string, callback: (message: TeamMessage) => void): RealtimeChannel {
    return this.subscribeToMessages(callback, { userId, isGroupMessage: false });
  },
};
