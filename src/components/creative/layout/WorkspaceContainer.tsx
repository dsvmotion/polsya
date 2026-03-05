import { cn } from '@/lib/utils';

interface WorkspaceContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Optional page title displayed above the content */
  title?: string;
  /** Optional description below the title */
  description?: string;
  /** Optional actions rendered to the right of the title */
  actions?: React.ReactNode;
  /** If true, removes default padding (useful for full-bleed views like maps) */
  fullBleed?: boolean;
}

/**
 * WorkspaceContainer — main canvas area for creative pages.
 * Provides consistent page structure with title, description, and actions.
 */
export function WorkspaceContainer({
  children,
  className,
  title,
  description,
  actions,
  fullBleed = false,
}: WorkspaceContainerProps) {
  return (
    <div className={cn('flex flex-col min-h-full', className)}>
      {/* Page header */}
      {(title || actions) && (
        <div className={cn('flex items-start justify-between gap-4', !fullBleed && 'px-6 pt-6 pb-4')}>
          <div className="min-w-0">
            {title && (
              <h1 className="text-2xl font-semibold tracking-tight truncate">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      <div className={cn('flex-1', !fullBleed && 'px-6 pb-6')}>
        {children}
      </div>
    </div>
  );
}
