import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fromTable } from '@/integrations/supabase/helpers';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeNotification, NotificationType } from '@/types/creative-notification';

// --- Row type (snake_case from DB) ---
interface NotificationRow {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

function toNotification(row: NotificationRow): CreativeNotification {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    entityType: row.entity_type,
    entityId: row.entity_id,
    isRead: row.is_read,
    actionUrl: row.action_url,
    createdAt: row.created_at,
  };
}

const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
  unreadCount: (userId: string) => ['notifications', 'unread-count', userId] as const,
};

export function useNotifications() {
  const queryClient = useQueryClient();
  // Get current user ID from auth
  const { data: sessionData } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: Infinity,
  });
  const userId = sessionData?.id;

  // Fetch recent 50 notifications
  const query = useQuery<CreativeNotification[]>({
    queryKey: notificationKeys.all(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await fromTable('creative_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return ((data ?? []) as NotificationRow[]).map(toNotification);
    },
    enabled: !!userId,
  });

  // Realtime subscription for new notifications
  // queryClient is excluded from deps — it's a stable singleton from context
  // and including it could cause unnecessary resubscriptions.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'creative_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: notificationKeys.all(userId) });
          queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return query;
}

export function useUnreadCount() {
  const { data: sessionData } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: Infinity,
  });
  const userId = sessionData?.id;

  return useQuery<number>({
    queryKey: notificationKeys.unreadCount(userId ?? ''),
    queryFn: async () => {
      const { count, error } = await fromTable('creative_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!userId,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await fromTable('creative_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await fromTable('creative_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
