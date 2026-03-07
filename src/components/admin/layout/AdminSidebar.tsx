import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
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
import {
  adminDashboardItem,
  adminNavGroups,
  adminBottomItems,
  type AdminNavItem,
  type AdminNavGroup,
} from './admin-nav-config';

interface AdminSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

function useIsActive(): (path: string) => boolean {
  const { pathname } = useLocation();
  return useCallback(
    (path: string) => {
      if (path === '/admin') return pathname === '/admin';
      return pathname.startsWith(path);
    },
    [pathname],
  );
}

function isGroupActive(group: AdminNavGroup, pathname: string): boolean {
  return group.items.some((item) => pathname.startsWith(item.path));
}

function buildInitialOpenState(
  groups: AdminNavGroup[],
  pathname: string,
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const group of groups) {
    state[group.label] = group.defaultOpen !== false || isGroupActive(group, pathname);
  }
  return state;
}

function NavButton({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate: (path: string) => void;
}) {
  const Icon = item.icon;

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
      {item.badge != null && (
        <span className="ml-auto text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </button>
  );
}

function NavGroupComponent({
  group,
  isOpen,
  onOpenChange,
  collapsed,
  isActive,
  onNavigate,
}: {
  group: AdminNavGroup;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}) {
  const GroupIcon = group.icon;
  const active = isGroupActive(group, useLocation().pathname);

  if (collapsed) {
    return (
      <div className="space-y-1 flex flex-col items-center">
        {group.items.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            collapsed
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors">
        <GroupIcon className={cn('h-3.5 w-3.5', active && 'text-sidebar-primary')} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronRight
          className={cn(
            'h-3 w-3 transition-transform',
            isOpen && 'rotate-90',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 mt-1">
        {group.items.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            collapsed={false}
            onNavigate={onNavigate}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AdminSidebar({
  open,
  onOpenChange,
  collapsed,
  onCollapsedChange,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = useIsActive();

  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(
    () => buildInitialOpenState(adminNavGroups, pathname),
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const sidebar = (
    <div
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border shrink-0">
        {!collapsed && (
          <span className="font-semibold text-sm text-sidebar-foreground flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">ADMIN</span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Scrollable nav */}
      <ScrollArea className="flex-1 py-2">
        <div className={cn('space-y-1', collapsed ? 'px-1 flex flex-col items-center' : 'px-2')}>
          {/* Dashboard */}
          <NavButton
            item={adminDashboardItem}
            isActive={isActive(adminDashboardItem.path)}
            collapsed={collapsed}
            onNavigate={handleNavigate}
          />

          <Separator className="my-2" />

          {/* Groups */}
          {adminNavGroups.map((group) => (
            <NavGroupComponent
              key={group.label}
              group={group}
              isOpen={groupOpen[group.label] ?? false}
              onOpenChange={(open) =>
                setGroupOpen((prev) => ({ ...prev, [group.label]: open }))
              }
              collapsed={collapsed}
              isActive={isActive}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Bottom items */}
      <div className={cn('border-t border-sidebar-border py-2', collapsed ? 'px-1' : 'px-2')}>
        {adminBottomItems.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={false}
            collapsed={collapsed}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0 z-30">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
          />
          <aside className="relative h-full w-60 bg-sidebar shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 text-sidebar-foreground/50"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}
