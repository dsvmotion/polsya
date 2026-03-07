# UX-03: Console Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the flat 18-item sidebar into a grouped, collapsible navigation system using existing shadcn/ui sidebar primitives.

**Architecture:** Refactor `CreativeSidebar.tsx` — replace the flat `mainNavItems` array and custom `NavItem` component with typed `NavGroup[]` config rendered via shadcn's `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton`, and Radix `Collapsible`. No changes to `CreativeLayout.tsx`, `App.tsx`, or any page components.

**Tech Stack:** React 18, TypeScript, shadcn/ui sidebar primitives, Radix Collapsible, Lucide icons, Tailwind CSS, Vitest

**Design doc:** `docs/plans/2026-03-07-ux03-console-redesign-design.md`

---

### Task 1: Extract navigation config types and grouped data

**Files:**
- Create: `src/components/creative/layout/sidebar-nav-config.ts`

This task extracts all navigation data into a standalone config file with proper types. No rendering changes — the sidebar still works exactly as before after this task.

**Step 1: Create the nav config file with types and data**

Create `src/components/creative/layout/sidebar-nav-config.ts`:

```ts
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Search,
  Building2,
  Users,
  UserRound,
  Image,
  Kanban,
  Briefcase,
  FolderKanban,
  UserPlus,
  Sparkles,
  Zap,
  Layers,
  MessageCircle,
  Mail,
  Calendar,
  TrendingUp,
  BarChart3,
  LineChart,
  BrainCircuit,
  GitBranch,
  Download,
  GitMerge,
  BookOpen,
  Palette,
  CreditCard,
  Settings,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  /** When true, item renders muted with "Coming soon" tooltip and no navigation. */
  future?: boolean;
  /** Badge text/count shown next to the label (e.g. unread count). */
  badge?: string | number;
  /** Reserved for future CMD+K command palette integration. */
  command?: string;
}

export interface NavGroup {
  label: string;
  /** Icon shown as the group's representative in collapsed sidebar mode. */
  icon: LucideIcon;
  /** Optional landing page — clicking the group label navigates here. */
  path?: string;
  /** Whether the group starts expanded. Defaults to true if omitted. */
  defaultOpen?: boolean;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Standalone top-level item (no group)
// ---------------------------------------------------------------------------

export const dashboardItem: NavItem = {
  label: 'Dashboard',
  icon: LayoutDashboard,
  path: '/creative',
};

// ---------------------------------------------------------------------------
// Grouped navigation
// ---------------------------------------------------------------------------

export const navGroups: NavGroup[] = [
  {
    label: 'Discover',
    icon: Search,
    items: [
      { label: 'Local Businesses', icon: Search, path: '/creative/discover' },
      { label: 'Companies', icon: Building2, path: '/creative/companies', future: true },
      { label: 'People', icon: UserPlus, path: '/creative/people', future: true },
    ],
  },
  {
    label: 'Entities',
    icon: Building2,
    items: [
      { label: 'Clients', icon: Users, path: '/creative/clients' },
      { label: 'Contacts', icon: UserRound, path: '/creative/contacts' },
      { label: 'Portfolios', icon: Image, path: '/creative/portfolios' },
    ],
  },
  {
    label: 'Pipeline',
    icon: Kanban,
    items: [
      { label: 'Opportunities', icon: Briefcase, path: '/creative/opportunities' },
      { label: 'Projects', icon: FolderKanban, path: '/creative/projects' },
      { label: 'Leads', icon: UserPlus, path: '/creative/leads', future: true },
    ],
  },
  {
    label: 'Intelligence',
    icon: Sparkles,
    items: [
      { label: 'Signals', icon: Zap, path: '/creative/signals' },
      { label: 'Style Engine', icon: Sparkles, path: '/creative/style' },
      { label: 'Enrichment', icon: Layers, path: '/creative/enrichment' },
    ],
  },
  {
    label: 'Communication',
    icon: MessageCircle,
    items: [
      { label: 'Email', icon: Mail, path: '/creative/inbox' },
      { label: 'Calendar', icon: Calendar, path: '/creative/calendar' },
    ],
  },
  {
    label: 'Analytics',
    icon: TrendingUp,
    path: '/creative/analytics',
    items: [
      { label: 'Overview', icon: TrendingUp, path: '/creative/analytics' },
      { label: 'Reports', icon: BarChart3, path: '/creative/reports' },
      { label: 'Pipeline', icon: LineChart, path: '/creative/analytics/pipeline' },
      { label: 'AI Insights', icon: BrainCircuit, path: '/creative/analytics/ai-insights' },
    ],
  },
  {
    label: 'Operations',
    icon: GitBranch,
    defaultOpen: false,
    items: [
      { label: 'Workflows', icon: GitBranch, path: '/creative/workflows' },
      { label: 'Ingestion', icon: Download, path: '/creative/ingestion' },
      { label: 'Resolution', icon: GitMerge, path: '/creative/resolution' },
      { label: 'Knowledge Base', icon: BookOpen, path: '/creative/knowledge-base' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Bottom section (outside of grouped nav)
// ---------------------------------------------------------------------------

export const bottomNavItems: NavItem[] = [
  { label: 'Integrations', icon: Palette, path: '/integrations' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Settings', icon: Settings, path: '/profile' },
];
```

**Step 2: Verify the config file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `sidebar-nav-config.ts`

**Step 3: Commit**

```bash
git add src/components/creative/layout/sidebar-nav-config.ts
git commit -m "feat(ux03): extract sidebar nav config types and grouped data"
```

---

### Task 2: Refactor CreativeSidebar to use grouped navigation with shadcn primitives

**Files:**
- Modify: `src/components/creative/layout/CreativeSidebar.tsx` (full rewrite of lines 1-249)

This is the main refactor. Replace the flat nav rendering with grouped collapsible sections using shadcn sidebar primitives.

**Step 1: Rewrite CreativeSidebar.tsx**

Replace the entire file content with:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  CollapsibleContent,
  CollapsibleTrigger,
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
// Props (unchanged from before)
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

/** Check whether a path is the active route. */
function useIsActive() {
  const location = useLocation();
  return useCallback(
    (path: string) => {
      if (path === '/creative') return location.pathname === '/creative';
      return location.pathname.startsWith(path);
    },
    [location.pathname],
  );
}

/** Check whether any item in a group matches the current route. */
function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => {
    if (item.path === '/creative') return pathname === '/creative';
    return pathname.startsWith(item.path);
  });
}

/** Build the initial open state for all groups, auto-opening any group whose
 *  item matches the current route even if its defaultOpen is false. */
function buildInitialOpenState(groups: NavGroup[], pathname: string): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const group of groups) {
    const shouldDefault = group.defaultOpen !== false;
    const hasActiveChild = isGroupActive(group, pathname);
    state[group.label] = shouldDefault || hasActiveChild;
  }
  return state;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single nav item button — used for both grouped items and standalone items. */
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
  if (item.future) {
    // Future item: muted, non-navigable, "Coming soon" tooltip
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
              'text-sidebar-foreground/30 cursor-default select-none',
              collapsed && 'justify-center w-10 h-10 px-0',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Coming soon
        </TooltipContent>
      </Tooltip>
    );
  }

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
            <item.icon className="h-5 w-5" />
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
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

/** A collapsible nav group with header and children. */
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
  const groupHasActiveChild = group.items.some((item) => !item.future && isActiveFn(item.path));

  // In collapsed mode: show group icon. Clicking expands the sidebar.
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              // Expand sidebar and ensure this group is open
              onOpenChange(true);
            }}
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
              groupHasActiveChild
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <group.icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {group.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded mode: collapsible group
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div className="flex items-center">
        {/* Group label — navigable if group.path exists */}
        {group.path ? (
          <button
            onClick={() => onNavigate(group.path!)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex-1 text-left rounded-md transition-colors',
              'text-sidebar-foreground/50 hover:text-sidebar-foreground',
            )}
          >
            <group.icon className="h-3.5 w-3.5" />
            <span>{group.label}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 flex-1">
            <group.icon className="h-3.5 w-3.5" />
            <span>{group.label}</span>
          </div>
        )}

        {/* Chevron toggle */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-sidebar-foreground/40 hover:text-sidebar-foreground"
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isOpen && 'rotate-90',
              )}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <nav className="flex flex-col gap-0.5 mt-0.5">
          {group.items.map((item) => (
            <SidebarNavButton
              key={item.path}
              item={item}
              isActive={!item.future && isActiveFn(item.path)}
              collapsed={false}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main component
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
  const isActive = useIsActive();

  // Group open/close state — initialized from defaults + active-route auto-open
  const [groupOpenState, setGroupOpenState] = useState<Record<string, boolean>>(() =>
    buildInitialOpenState(navGroups, location.pathname),
  );

  // Auto-open group when route changes to an item inside a closed group
  useEffect(() => {
    setGroupOpenState((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const group of navGroups) {
        if (!prev[group.label] && isGroupActive(group, location.pathname)) {
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
    // Expand the sidebar and open this group
    onCollapsedChange(false);
    setGroupOpenState((prev) => ({ ...prev, [groupLabel]: true }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header — unchanged */}
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

      {/* Main nav — grouped */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className={cn('flex flex-col gap-3', collapsed && 'items-center gap-1')}>
          {/* Dashboard — standalone */}
          <SidebarNavButton
            item={dashboardItem}
            isActive={isActive(dashboardItem.path)}
            collapsed={collapsed}
            onNavigate={handleNavigate}
          />

          {collapsed && <Separator className="my-1 w-8 bg-sidebar-border" />}
          {!collapsed && <Separator className="bg-sidebar-border" />}

          {/* Nav groups */}
          {navGroups.map((group) => (
            <SidebarNavGroup
              key={group.label}
              group={group}
              isOpen={groupOpenState[group.label] ?? true}
              onOpenChange={
                collapsed
                  ? () => handleGroupExpandSidebar(group.label)
                  : (open) => setGroupOpenState((prev) => ({ ...prev, [group.label]: open }))
              }
              collapsed={collapsed}
              onNavigate={handleNavigate}
              isActiveFn={isActive}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom section — unchanged */}
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
              isActive={isActive(item.path)}
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
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

**Step 3: Run the full test suite**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All tests pass (506+). No tests should break because this refactor only changes internal rendering — no public API, hooks, or services are affected.

**Step 4: Run the build**

Run: `npx vite build 2>&1 | tail -10`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/creative/layout/CreativeSidebar.tsx
git commit -m "feat(ux03): refactor sidebar to grouped collapsible navigation

Replace flat 18-item nav with 7 semantic groups using shadcn sidebar
primitives and Radix Collapsible. Includes active-group auto-open,
collapsed-mode expand-on-click, navigable group support (Analytics),
and future item placeholders (Companies, People, Leads).

Closes UX-03"
```

---

### Task 3: Verify and deploy

**Step 1: Run the full test suite one final time**

Run: `npx vitest run 2>&1 | tail -20`
Expected: All tests pass

**Step 2: Run the production build**

Run: `npx vite build 2>&1 | tail -10`
Expected: Build succeeds with no warnings about missing imports

**Step 3: Push to GitHub (triggers Vercel deploy)**

Run: `git push origin main`
Expected: Push succeeds

**Step 4: Verify Vercel deployment**

Use the Vercel MCP tools to confirm the latest deployment reaches READY state.

**Step 5: Manual verification checklist**

Verify in the deployed application:

- [ ] Dashboard appears as standalone top item
- [ ] All 7 groups render with correct labels and icons
- [ ] Clicking a group chevron expands/collapses its items
- [ ] Operations group starts collapsed
- [ ] Navigating to /creative/workflows auto-opens the Operations group
- [ ] Clicking Analytics group label navigates to /creative/analytics
- [ ] All 18 existing nav paths still work (clients, contacts, portfolios, opportunities, projects, signals, style, enrichment, inbox, calendar, analytics, analytics/pipeline, analytics/ai-insights, reports, workflows, ingestion, resolution, knowledge-base)
- [ ] Collapsed sidebar shows group icons
- [ ] Clicking a group icon in collapsed mode expands the sidebar
- [ ] Future items (Companies, People, Leads) appear muted with "Coming soon" tooltip
- [ ] Bottom section (AI Assistant, Integrations, Billing, Settings) unchanged
- [ ] Mobile overlay shows grouped navigation
- [ ] Collapse toggle button works
