/**
 * React Query hooks for team messages operations
 * Provides type-safe hooks with caching, realtime subscriptions, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { messagesApi, type TeamMessageWithProfile } from '@/api/messages';
import type { TeamMessage, TeamMessageInsert, TeamMessageUpdate } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/errors';

/**
 * Hook to fetch list of messages
 */
export function useMessages(filters?: {
  userId?: string;
  recipientId?: string;
  isGroupMessage?: boolean;
  limit?: number;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.messages.list(filters),
    queryFn: () => messagesApi.list(filters),
    enabled: !!user,
  });
}

/**
 * Hook to fetch conversation between two users with realtime updates and aggressive caching
 */
export function useConversation(userId1: string | undefined, userId2: string | undefined, limit?: number) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.messages.conversation(userId1!, userId2!),
    queryFn: () => messagesApi.getConversation(userId1!, userId2!, limit),
    enabled: !!userId1 && !!userId2,
    staleTime: 1000 * 60 * 30, // 30 minutes - keep conversation cached longer
    gcTime: 1000 * 60 * 60 * 2, // 2 hours - keep in memory for quick access
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnReconnect: true, // Refetch when connection restored
  });

  // Subscribe to realtime updates for this conversation
  useEffect(() => {
    if (!userId1 || !userId2) return;

    const channel = messagesApi.subscribeToMessages(
      (newMessage) => {
        // Only update if message is part of this conversation
        if (
          (newMessage.sender_id === userId1 && newMessage.recipient_id === userId2) ||
          (newMessage.sender_id === userId2 && newMessage.recipient_id === userId1)
        ) {
          // Optimistically add message to cache
          queryClient.setQueryData<TeamMessageWithProfile[]>(
            queryKeys.messages.conversation(userId1, userId2),
            (old) => {
              if (!old) return old;
              // Check if message already exists to avoid duplicates
              if (old.some(msg => msg.id === newMessage.id)) return old;
              return [...old, newMessage as TeamMessageWithProfile];
            }
          );
        }
      },
      { userId: userId1 }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [userId1, userId2, queryClient]);

  return query;
}

/**
 * Hook to fetch group messages with realtime updates
 */
export function useGroupMessages(limit?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeMessages, setRealtimeMessages] = useState<TeamMessage[]>([]);

  const query = useQuery({
    queryKey: queryKeys.messages.list({ isGroupMessage: true }),
    queryFn: () => messagesApi.getGroupMessages(limit),
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = messagesApi.subscribeToGroupMessages((newMessage) => {
      // Add to realtime messages
      setRealtimeMessages(prev => [...prev, newMessage]);

      // Invalidate query to refetch with full data
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list({ isGroupMessage: true }),
      });
    });

    return () => {
      channel.unsubscribe();
      setRealtimeMessages([]);
    };
  }, [user, queryClient]);

  return {
    ...query,
    realtimeMessages,
  };
}

/**
 * Hook to fetch direct messages for a user with realtime updates
 */
export function useDirectMessages(userId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeMessages, setRealtimeMessages] = useState<TeamMessage[]>([]);

  const query = useQuery({
    queryKey: queryKeys.messages.list({ userId, isGroupMessage: false }),
    queryFn: () => messagesApi.list({ userId, isGroupMessage: false }),
    enabled: !!user && !!userId,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !userId) return;

    const channel = messagesApi.subscribeToDirectMessages(userId, (newMessage) => {
      setRealtimeMessages(prev => [...prev, newMessage]);

      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list({ userId, isGroupMessage: false }),
      });
    });

    return () => {
      channel.unsubscribe();
      setRealtimeMessages([]);
    };
  }, [user, userId, queryClient]);

  return {
    ...query,
    realtimeMessages,
  };
}

/**
 * Hook to fetch single message by ID
 */
export function useMessage(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.messages.all, 'detail', id],
    queryFn: () => messagesApi.getById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to fetch unread messages count
 */
export function useUnreadCount(userId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.messages.unread(userId!),
    queryFn: () => messagesApi.getUnreadCount(userId!),
    enabled: !!user && !!userId,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}

/**
 * Mutation hook to send a message with optimistic updates
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (message: TeamMessageInsert) => messagesApi.send(message),

    // Optimistic update for instant UI feedback
    onMutate: async (newMessage) => {
      const isGroupMessage = newMessage.recipient_id === null;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.lists() });

      // For direct messages, also cancel conversation queries
      if (!isGroupMessage && newMessage.sender_id && newMessage.recipient_id) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.messages.conversation(newMessage.sender_id, newMessage.recipient_id)
        });
      }

      // Snapshot previous values
      const previousMessages = queryClient.getQueryData<TeamMessageWithProfile[]>(
        queryKeys.messages.list({ isGroupMessage })
      );

      const previousConversation = !isGroupMessage && newMessage.sender_id && newMessage.recipient_id
        ? queryClient.getQueryData<TeamMessageWithProfile[]>(
          queryKeys.messages.conversation(newMessage.sender_id, newMessage.recipient_id)
        )
        : null;

      // Create optimistic message with temporary ID
      const optimisticMessage: TeamMessageWithProfile = {
        ...newMessage,
        id: `temp-${Date.now()}-${Math.random()}`,
        created_at: new Date().toISOString(),
        is_read: false,
        profiles: user ? {
          full_name: user.user_metadata?.full_name || null,
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || null,
        } : undefined,
      } as TeamMessageWithProfile;

      // Optimistically update messages list cache
      if (previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list({ isGroupMessage }),
          [...previousMessages, optimisticMessage]
        );
      }

      // Optimistically update conversation cache for instant feedback
      if (previousConversation && !isGroupMessage && newMessage.sender_id && newMessage.recipient_id) {
        queryClient.setQueryData(
          queryKeys.messages.conversation(newMessage.sender_id, newMessage.recipient_id),
          [...previousConversation, optimisticMessage]
        );
      }

      return { previousMessages, previousConversation, newMessage };
    },

    onError: (error, newMessage, context) => {
      const isGroupMessage = newMessage.recipient_id === null;

      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list({ isGroupMessage }),
          context.previousMessages
        );
      }

      if (context?.previousConversation && newMessage.sender_id && newMessage.recipient_id) {
        queryClient.setQueryData(
          queryKeys.messages.conversation(newMessage.sender_id, newMessage.recipient_id),
          context.previousConversation
        );
      }

      toast({
        title: 'خطأ',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },

    onSuccess: (data, newMessage) => {
      // Replace optimistic message with real one
      const isGroupMessage = newMessage.recipient_id === null;

      if (!isGroupMessage && newMessage.sender_id && newMessage.recipient_id) {
        queryClient.setQueryData<TeamMessageWithProfile[]>(
          queryKeys.messages.conversation(newMessage.sender_id, newMessage.recipient_id),
          (old) => {
            if (!old) return [data as TeamMessageWithProfile];
            // Remove temp message and add real one
            return [...old.filter(msg => !msg.id.toString().startsWith('temp-')), data as TeamMessageWithProfile];
          }
        );
      }
    },

    onSettled: () => {
      // Refetch in background to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });
    },
  });
}

/**
 * Mutation hook to update a message
 */
export function useUpdateMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TeamMessageUpdate }) =>
      messagesApi.update(id, updates),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الرسالة',
      });
    },

    onError: (error) => {
      toast({
        title: 'خطأ',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation hook to mark message as read
 */
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => messagesApi.markAsRead(id),

    onSuccess: (_, id) => {
      // Update cache optimistically
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });
      // Also invalidate unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}

/**
 * Mutation hook to delete a message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => messagesApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الرسالة',
      });
    },

    onError: (error) => {
      toast({
        title: 'خطأ',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },
  });
}

/**
 * Custom hook to handle realtime subscriptions
 * Subscribe to new messages and automatically update queries
 */
export function useRealtimeMessages(filter?: {
  userId?: string;
  isGroupMessage?: boolean;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const channel = messagesApi.subscribeToMessages(
      (newMessage) => {
        // Increment new messages count
        setNewMessagesCount(prev => prev + 1);

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });

        // If it's for the current user, update unread count
        if (newMessage.recipient_id === user.id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.messages.unread(user.id),
          });
        }
      },
      filter
    );

    return () => {
      channel.unsubscribe();
      setNewMessagesCount(0);
    };
  }, [user, filter, queryClient]);

  return {
    newMessagesCount,
    resetCount: () => setNewMessagesCount(0),
  };
}
