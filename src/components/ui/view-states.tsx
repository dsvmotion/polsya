import type { ReactNode } from 'react';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StateTone = 'neutral' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<StateTone, string> = {
  neutral: 'state-panel-neutral',
  success: 'state-panel-success',
  warning: 'state-panel-warning',
  danger: 'state-panel-danger',
};

interface BaseStateProps {
  title: string;
  description?: string;
  className?: string;
  action?: ReactNode;
  tone?: StateTone;
}

interface EmptyStateProps extends BaseStateProps {
  icon?: LucideIcon;
}

export function LoadingState({
  title = 'Loading...',
  description,
  className,
}: Omit<BaseStateProps, 'tone' | 'action'>) {
  return (
    <div className={cn('state-panel state-panel-neutral', className)}>
      <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-400" />
      <p className="mt-2 text-sm font-medium text-gray-800">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  className,
  action,
  tone = 'neutral',
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className={cn('state-panel', TONE_CLASS[tone], className)}>
      <Icon className="mx-auto h-5 w-5 text-gray-400" />
      <p className="mt-2 text-sm font-medium text-gray-800">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  className,
  action,
}: Omit<BaseStateProps, 'tone'>) {
  return (
    <div className={cn('state-panel state-panel-danger', className)}>
      <AlertCircle className="mx-auto h-5 w-5 text-red-500" />
      <p className="mt-2 text-sm font-medium text-gray-900">{title}</p>
      {description ? <p className="mt-1 text-xs text-gray-600">{description}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}
