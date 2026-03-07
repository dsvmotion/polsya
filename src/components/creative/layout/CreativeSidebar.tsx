import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  X,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/creative/notifications/NotificationBell';
import {
  dashboardItem,
  navGroups,
  bottomNavItems,
  type NavItem,
  type NavGroup,
} from './sidebar-nav-config';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CreativeSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onOpenAiChat?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useIsActive(): (path: string) => boolean {
  const location = useLocation();
  return useCallback(
    (path: string) => {
      if (path === '/creative') return location.pathname === '/creative';
      return location.pathname.startsWith(path);
    },
    [location.pathname],
  );
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => {
    if (item.future) return false;
    if (item.path === '/creative') return pathname === '/creative';
    return pathname.startsWith(item.path);
  });
}

function buildInitialOpenState(
  groups: NavGroup[],
  pathname: string,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const group of groups) {
    const hasActiveChild = isGroupActive(group, pathname);
    state[group.label] = group.defaultOpen !== false || hasActiveChild;
  }
  return state;
}

// ---------------------------------------------------------------------------
// SidebarNavButton
// ---------------------------------------------------------------------------

function SidebarNavButton({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate: (path: string) => void;
}) {
  const Icon = item.icon;

  // Future item — muted, non-interactive
  if (item.future) {
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg text-sidebar-foreground/30 cursor-default select-none">
              <Icon className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label} — Coming soon
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-left text-sidebar-foreground/30 cursor-default select-none">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Coming soon
        </TooltipContent>
      </Tooltip>
    );
  }

  // Collapsed — tooltip-wrapped icon button
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onNavigate(item.path)}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded — button with icon + label
  return (
    <button
      onClick={() => onNavigate(item.path)}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
        isActive
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SidebarNavGroup
// ---------------------------------------------------------------------------

function SidebarNavGroup({
  group,
  isOpen,
  onOpenChange,
  collapsed,
  onNavigate,
  isActiveFn,
}: {
  group: NavGroup;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onNavigate: (path: string) => void;
  isActiveFn: (path: string) => boolean;
}) {
  const GroupIcon = group.icon;
  const groupHasActive = group.items.some(
    (item) => !item.future && isActiveFn(item.path),
  );

  // Collapsed mode — single icon button representing the whole group
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onOpenChange(true)}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              groupHasActive
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <GroupIcon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {group.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded mode — collapsible section
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      {/* Group header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <GroupIcon className="h-3.5 w-3.5 text-sidebar-foreground/50" />
          {group.path ? (
            <button
              onClick={() => onNavigate(group.path!)}
              className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              {group.label}
            </button>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </span>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <button className="h-5 w-5 flex items-center justify-center rounded text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <ChevronRightIcon
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isOpen && 'rotate-90',
              )}
            />
          </button>
        </CollapsibleTrigger>
      </div>

      {/* Group items */}
      <CollapsibleContent>
        <div className="flex flex-col gap-0.5">
          {group.items.map((item) => (
            <SidebarNavButton
              key={item.path}
              item={item}
              isActive={isActiveFn(item.path)}
              collapsed={false}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// CreativeSidebar
// ---------------------------------------------------------------------------

export function CreativeSidebar({
  open,
  onOpenChange,
  collapsed,
  onCollapsedChange,
  onOpenAiChat,
}: CreativeSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActiveFn = useIsActive();

  const [groupOpenState, setGroupOpenState] = useState<Record<string, boolean>>(
    () => buildInitialOpenState(navGroups, location.pathname),
  );

  // Auto-open group containing the active route when pathname changes
  useEffect(() => {
    setGroupOpenState((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const group of navGroups) {
        if (isGroupActive(group, location.pathname) && !prev[group.label]) {
          next[group.label] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleGroupExpandSidebar = (groupLabel: string) => {
    onCollapsedChange(false);
    setGroupOpenState((prev) => ({ ...prev, [groupLabel]: true }));
  };

  // ------- Sidebar content -------
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn('flex items-center h-14 px-4 border-b border-sidebar-border', collapsed && 'justify-center px-2')}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <img src="/polsya-logo-black.png" alt="Polsya" className="h-6 w-auto dark:hidden" />
            <img src="/polsya-logo-white.png" alt="Polsya" className="h-6 w-auto hidden dark:block" />
            <NotificationBell />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img src="/polsya-logo-black.png" alt="Polsya" className="h-6 w-auto dark:hidden" />
              <img src="/polsya-logo-white.png" alt="Polsya" className="h-6 w-auto hidden dark:block" />
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Creative</span>
            </div>
            <NotificationBell />
          </div>
        )}
      </div>

      {/* Main nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className={cn('flex flex-col', collapsed ? 'items-center gap-1' : 'gap-1')}>
          {/* Dashboard — standalone */}
          <SidebarNavButton
            item={dashboardItem}
            isActive={isActiveFn(dashboardItem.path)}
            collapsed={collapsed}
            onNavigate={handleNavigate}
          />

          <Separator className="my-2 bg-sidebar-border" />

          {/* Grouped nav */}
          <div className={cn('flex flex-col', collapsed ? 'gap-1 items-center' : 'gap-3')}>
            {navGroups.map((group) => (
              <SidebarNavGroup
                key={group.label}
                group={group}
                isOpen={groupOpenState[group.label] ?? true}
                onOpenChange={
                  collapsed
                    ? () => handleGroupExpandSidebar(group.label)
                    : (open) =>
                        setGroupOpenState((prev) => ({
                          ...prev,
                          [group.label]: open,
                        }))
                }
                collapsed={collapsed}
                onNavigate={handleNavigate}
                isActiveFn={isActiveFn}
              />
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className="mt-auto px-3 pb-3">
        <Separator className="mb-3 bg-sidebar-border" />
        <nav className={cn('flex flex-col gap-1', collapsed && 'items-center')}>
          {onOpenAiChat && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onOpenAiChat}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
                    'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    collapsed && 'justify-center w-10 h-10 px-0',
                  )}
                >
                  <MessageSquare className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">AI Assistant</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>AI Assistant</TooltipContent>
              )}
            </Tooltip>
          )}
          {bottomNavItems.map((item) => (
            <SidebarNavButton
              key={item.path}
              item={item}
              isActive={isActiveFn(item.path)}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex justify-center mt-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-xl animate-in slide-in-from-left duration-300">
            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground/50"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
