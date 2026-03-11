import { useNavigate } from 'react-router-dom';
import { Bell, GitBranch, AtSign, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreativeNotification, NotificationType } from '@/types/creative-notification';
import { NOTIFICATION_TYPE_COLORS } from '@/types/creative-notification';
import { timeAgo } from '@/lib/time-utils';

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  reminder: Bell,
  workflow: GitBranch,
  mention: AtSign,
  system: Info,
  ai_insight: Sparkles,
};

interface NotificationItemProps {
  notification: CreativeNotification;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const navigate = useNavigate();
  const Icon = NOTIFICATION_ICONS[notification.type];
  const colors = NOTIFICATION_TYPE_COLORS[notification.type];

  const handleClick = () => {
    onMarkRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`${notification.isRead ? '' : 'Unread: '}${notification.title}`}
      className={cn(
        'flex items-start gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-colors',
        'hover:bg-muted/60',
        !notification.isRead && 'bg-muted/30',
      )}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', colors.bg)}>
        <Icon className={cn('h-4 w-4', colors.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.isRead ? 'font-semibold' : 'font-medium')}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground/70 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}
