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
 * Hook to fetch conversation between two users
 */
export function useConversation(userId1: string | undefined, userId2: string | undefined, limit?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId1 || !userId2) return;

    const channel = messagesApi.subscribeToDirectMessages(userId1, (newMessage) => {
      const isRelevant =
        (newMessage.sender_id === userId1 && newMessage.recipient_id === userId2) ||
        (newMessage.sender_id === userId2 && newMessage.recipient_id === userId1);

      if (isRelevant) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.conversation(userId1, userId2),
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userId1, userId2, queryClient]);

  return useQuery({
    queryKey: queryKeys.messages.conversation(userId1!, userId2!),
    queryFn: () => messagesApi.getConversation(userId1!, userId2!, limit),
    enabled: !!userId1 && !!userId2,
  });
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
 * Mutation hook to send a message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (message: TeamMessageInsert) => messagesApi.send(message),

    // Optimistic update
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.lists() });

      // Snapshot previous value
      const listKey = queryKeys.messages.list({ isGroupMessage: newMessage.recipient_id === null });
      const conversationKey = newMessage.recipient_id
        ? queryKeys.messages.conversation(newMessage.sender_id, newMessage.recipient_id)
        : null;

      if (conversationKey) {
        await queryClient.cancelQueries({ queryKey: conversationKey });
      }

      const previousMessages = queryClient.getQueryData<TeamMessageWithProfile[]>(listKey);
      const previousConversation = conversationKey
        ? queryClient.getQueryData<TeamMessageWithProfile[]>(conversationKey)
        : undefined;

      // Optimistically update cache
      const optimisticMessage: Partial<TeamMessageWithProfile> = {
        ...newMessage,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        is_read: false,
      };

      if (previousMessages) {
        queryClient.setQueryData(
          listKey,
          [...previousMessages, optimisticMessage as TeamMessageWithProfile]
        );
      }

      if (conversationKey && previousConversation) {
        queryClient.setQueryData(
          conversationKey,
          [...previousConversation, optimisticMessage as TeamMessageWithProfile]
        );
      }

      return { previousMessages, previousConversation, listKey, conversationKey };
    },

    onError: (error, newMessage, context) => {
      // Rollback on error
      if (context && context.previousMessages) {
        queryClient.setQueryData(context.listKey, context.previousMessages);
      }

      if (context && context.conversationKey && context.previousConversation) {
        queryClient.setQueryData(context.conversationKey, context.previousConversation);
      }

      toast({
        title: 'خطأ',
        description: handleApiError(error),
        variant: 'destructive',
      });
    },

    onSettled: (_data, _error, _variables, context) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });
      if (context?.conversationKey) {
        queryClient.invalidateQueries({ queryKey: context.conversationKey });
      }
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
