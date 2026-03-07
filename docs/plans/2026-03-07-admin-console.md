# Admin Console Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an internal admin console at `/admin/*` with sidebar navigation, role-based access, and 14 admin pages for managing users, organizations, subscriptions, billing, signals, ingestion, AI jobs, moderation, logs, feature flags, analytics, and settings.

**Architecture:** Reuse the collapsible sidebar pattern from CreativeSidebar (UX-03). AdminRoute guard wraps all `/admin/*` routes, checking `isPlatformOwner()`. Each admin page follows a consistent layout: stats cards at top, filterable/paginated data table below. Charts use Recharts (already installed). New pages that lack real data sources (signals, ingestion, AI jobs, moderation) are built as scaffolds with mock data and TODO comments marking where to connect real sources.

**Tech Stack:** React 18, React Router 6, TypeScript, Tailwind CSS, Radix UI/shadcn, TanStack Query, Recharts (installed), Vitest

**Design doc:** `docs/plans/2026-03-07-marketing-website-design.md` (Part 4: Admin Console)

**Prerequisite:** Complete `docs/plans/2026-03-07-marketing-website.md` first (it restructures App.tsx routes and creates the 3-layer architecture).

---

### Task 1: Admin Navigation Config

**Files:**
- Create: `src/components/admin/layout/admin-nav-config.ts`
- Test: `src/components/admin/layout/__tests__/admin-nav-config.test.ts`

**Step 1: Write the failing test**

```typescript
// src/components/admin/layout/__tests__/admin-nav-config.test.ts
import { describe, it, expect } from 'vitest';
import { adminNavGroups, adminDashboardItem, adminBottomItems } from '../admin-nav-config';

describe('admin-nav-config', () => {
  it('exports a dashboard item pointing to /admin', () => {
    expect(adminDashboardItem.path).toBe('/admin');
    expect(adminDashboardItem.label).toBe('Dashboard');
  });

  it('exports 5 navigation groups', () => {
    expect(adminNavGroups).toHaveLength(5);
    const labels = adminNavGroups.map((g) => g.label);
    expect(labels).toEqual([
      'Users & Organizations',
      'Revenue',
      'Intelligence',
      'Platform',
      'Settings',
    ]);
  });

  it('Users & Organizations group has Users and Organizations items', () => {
    const group = adminNavGroups.find((g) => g.label === 'Users & Organizations')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/users');
    expect(paths).toContain('/admin/organizations');
  });

  it('Revenue group has Subscriptions and Billing', () => {
    const group = adminNavGroups.find((g) => g.label === 'Revenue')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/subscriptions');
    expect(paths).toContain('/admin/billing');
  });

  it('Intelligence group has Signals, Ingestion, AI Jobs', () => {
    const group = adminNavGroups.find((g) => g.label === 'Intelligence')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/signals');
    expect(paths).toContain('/admin/ingestion');
    expect(paths).toContain('/admin/ai-jobs');
  });

  it('Platform group has Moderation, Logs, Flags, Analytics', () => {
    const group = adminNavGroups.find((g) => g.label === 'Platform')!;
    const paths = group.items.map((i) => i.path);
    expect(paths).toContain('/admin/moderation');
    expect(paths).toContain('/admin/logs');
    expect(paths).toContain('/admin/flags');
    expect(paths).toContain('/admin/analytics');
  });

  it('exports bottom nav items with Back to App link', () => {
    const backItem = adminBottomItems.find((i) => i.path === '/app');
    expect(backItem).toBeDefined();
    expect(backItem!.label).toBe('Back to App');
  });

  it('all nav items have icon, label, and path', () => {
    const allItems = [
      adminDashboardItem,
      ...adminNavGroups.flatMap((g) => g.items),
      ...adminBottomItems,
    ];
    for (const item of allItems) {
      expect(item.label).toBeTruthy();
      expect(item.path).toBeTruthy();
      expect(item.icon).toBeTruthy();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/layout/__tests__/admin-nav-config.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/components/admin/layout/admin-nav-config.ts
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  Building2,
  CreditCard,
  Download,
  Flag,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

// Reuse types from creative sidebar for consistency
export interface AdminNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: string | number;
}

export interface AdminNavGroup {
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  items: AdminNavItem[];
}

export const adminDashboardItem: AdminNavItem = {
  label: 'Dashboard',
  icon: LayoutDashboard,
  path: '/admin',
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Users & Organizations',
    icon: Users,
    defaultOpen: true,
    items: [
      { label: 'Users', icon: Users, path: '/admin/users' },
      { label: 'Organizations', icon: Building2, path: '/admin/organizations' },
    ],
  },
  {
    label: 'Revenue',
    icon: Wallet,
    items: [
      { label: 'Subscriptions', icon: CreditCard, path: '/admin/subscriptions' },
      { label: 'Billing', icon: Wallet, path: '/admin/billing' },
    ],
  },
  {
    label: 'Intelligence',
    icon: Sparkles,
    items: [
      { label: 'Signals', icon: Zap, path: '/admin/signals' },
      { label: 'Ingestion', icon: Download, path: '/admin/ingestion' },
      { label: 'AI Jobs', icon: BrainCircuit, path: '/admin/ai-jobs' },
    ],
  },
  {
    label: 'Platform',
    icon: BarChart3,
    items: [
      { label: 'Moderation', icon: Shield, path: '/admin/moderation' },
      { label: 'Logs', icon: ScrollText, path: '/admin/logs' },
      { label: 'Flags', icon: Flag, path: '/admin/flags' },
      { label: 'Analytics', icon: TrendingUp, path: '/admin/analytics' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'Admin Settings', icon: Settings, path: '/admin/settings' },
    ],
  },
];

export const adminBottomItems: AdminNavItem[] = [
  { label: 'Back to App', icon: ArrowLeft, path: '/app' },
];
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/admin/layout/__tests__/admin-nav-config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/layout/admin-nav-config.ts src/components/admin/layout/__tests__/admin-nav-config.test.ts
git commit -m "feat(admin): add admin navigation config"
```

---

### Task 2: AdminRoute Auth Guard

**Files:**
- Create: `src/components/admin/AdminRoute.tsx`
- Test: `src/components/admin/__tests__/AdminRoute.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/admin/__tests__/AdminRoute.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminRoute } from '../AdminRoute';

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock platform owner status hook
vi.mock('@/hooks/usePlatformOwnerStatus', () => ({
  usePlatformOwnerStatus: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';

const mockedUseAuth = vi.mocked(useAuth);
const mockedUsePlatformOwnerStatus = vi.mocked(usePlatformOwnerStatus);

describe('AdminRoute', () => {
  it('shows loading state while checking ownership', () => {
    mockedUseAuth.mockReturnValue({ user: { id: '1' } } as any);
    mockedUsePlatformOwnerStatus.mockReturnValue({ isOwner: false, isLoading: true } as any);

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when user is platform owner', () => {
    mockedUseAuth.mockReturnValue({ user: { id: '1' } } as any);
    mockedUsePlatformOwnerStatus.mockReturnValue({ isOwner: true, isLoading: false } as any);

    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects non-owner users', () => {
    mockedUseAuth.mockReturnValue({ user: { id: '1' } } as any);
    mockedUsePlatformOwnerStatus.mockReturnValue({ isOwner: false, isLoading: false } as any);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/__tests__/AdminRoute.test.tsx`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```tsx
// src/components/admin/AdminRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';
import { PageLoader } from '@/components/ui/page-loader';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAuth();
  const { isOwner, isLoading } = usePlatformOwnerStatus();

  if (!user) return <Navigate to="/login" replace />;
  if (isLoading) return <PageLoader />;
  if (!isOwner) return <Navigate to="/app" replace />;

  return <>{children}</>;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/admin/__tests__/AdminRoute.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/AdminRoute.tsx src/components/admin/__tests__/AdminRoute.test.tsx
git commit -m "feat(admin): add AdminRoute auth guard"
```

---

### Task 3: AdminSidebar Component

**Files:**
- Create: `src/components/admin/layout/AdminSidebar.tsx`
- Reference: `src/components/creative/layout/CreativeSidebar.tsx` (pattern source)

This is a simplified version of CreativeSidebar adapted for admin. The pattern is identical: collapsible groups, collapsed/expanded state, mobile overlay, tooltip on collapsed items.

**Step 1: Write the component**

```tsx
// src/components/admin/layout/AdminSidebar.tsx
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// NavButton
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// NavGroup
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// AdminSidebar
// ---------------------------------------------------------------------------

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
    onOpenChange(false); // close mobile overlay
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
```

**Step 2: Verify builds**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to AdminSidebar

**Step 3: Commit**

```bash
git add src/components/admin/layout/AdminSidebar.tsx
git commit -m "feat(admin): add AdminSidebar with collapsible groups"
```

---

### Task 4: AdminLayout + AdminTopBar

**Files:**
- Create: `src/components/admin/layout/AdminLayout.tsx`
- Create: `src/components/admin/layout/AdminTopBar.tsx`
- Create: `src/components/admin/layout/AdminBreadcrumbs.tsx`

**Step 1: Write AdminTopBar**

```tsx
// src/components/admin/layout/AdminTopBar.tsx
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { APP_NAME } from '@/lib/brand';

interface AdminTopBarProps {
  onMobileMenuToggle: () => void;
}

export function AdminTopBar({ onMobileMenuToggle }: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border flex items-center justify-between px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 bg-background/90">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-sm">
          {APP_NAME} <span className="text-xs text-muted-foreground font-normal">Admin</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
```

**Step 2: Write AdminBreadcrumbs**

```tsx
// src/components/admin/layout/AdminBreadcrumbs.tsx
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin',
  users: 'Users',
  organizations: 'Organizations',
  subscriptions: 'Subscriptions',
  billing: 'Billing',
  signals: 'Signals',
  ingestion: 'Ingestion',
  'ai-jobs': 'AI Jobs',
  moderation: 'Moderation',
  logs: 'System Logs',
  flags: 'Feature Flags',
  analytics: 'Analytics',
  settings: 'Settings',
};

export function AdminBreadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null; // just /admin — no breadcrumbs needed

  const crumbs = segments.map((seg, idx) => ({
    label: ROUTE_LABELS[seg] ?? seg,
    path: '/' + segments.slice(0, idx + 1).join('/'),
    isLast: idx === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {crumbs.map((crumb, idx) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="h-3 w-3" />}
          {crumb.isLast ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
```

**Step 3: Write AdminLayout**

```tsx
// src/components/admin/layout/AdminLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopBar onMobileMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AdminBreadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Step 4: Verify builds**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to Admin layout components

**Step 5: Commit**

```bash
git add src/components/admin/layout/AdminLayout.tsx src/components/admin/layout/AdminTopBar.tsx src/components/admin/layout/AdminBreadcrumbs.tsx
git commit -m "feat(admin): add AdminLayout with sidebar, topbar, breadcrumbs"
```

---

### Task 5: Shared Admin Components (AdminStatsCard, AdminDataTable)

**Files:**
- Create: `src/components/admin/AdminStatsCard.tsx`
- Create: `src/components/admin/AdminDataTable.tsx`
- Test: `src/components/admin/__tests__/AdminStatsCard.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/admin/__tests__/AdminStatsCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminStatsCard } from '../AdminStatsCard';
import { Users } from 'lucide-react';

describe('AdminStatsCard', () => {
  it('renders title and value', () => {
    render(<AdminStatsCard title="Total Users" value={1234} icon={Users} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(<AdminStatsCard title="MRR" value={5000} icon={Users} trend={{ value: 12, direction: 'up' }} />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<AdminStatsCard title="Active" value={42} icon={Users} subtitle="this month" />);
    expect(screen.getByText('this month')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/admin/__tests__/AdminStatsCard.test.tsx`
Expected: FAIL — module not found

**Step 3: Write AdminStatsCard**

```tsx
// src/components/admin/AdminStatsCard.tsx
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AdminStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  formatValue?: (value: number | string) => string;
}

export function AdminStatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  formatValue,
}: AdminStatsCardProps) {
  const displayValue = formatValue
    ? formatValue(value)
    : typeof value === 'number'
      ? value.toLocaleString()
      : value;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{displayValue}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                'font-medium',
                trend.direction === 'up' ? 'text-green-500' : 'text-red-500',
              )}
            >
              {trend.direction === 'up' ? '+' : '-'}{trend.value}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Write AdminDataTable**

```tsx
// src/components/admin/AdminDataTable.tsx
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export interface AdminColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: AdminColumn<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export function AdminDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  pageSize = 20,
  onRowClick,
  isLoading,
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const q = search.trim().toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? '').toLowerCase().includes(q),
      ),
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, idx) => (
                <TableRow
                  key={row.id ?? idx}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {currentPage + 1} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/admin/__tests__/AdminStatsCard.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/admin/AdminStatsCard.tsx src/components/admin/AdminDataTable.tsx src/components/admin/__tests__/AdminStatsCard.test.tsx
git commit -m "feat(admin): add AdminStatsCard and AdminDataTable shared components"
```

---

### Task 6: AdminDashboard Page

**Files:**
- Create: `src/pages/admin/AdminDashboard.tsx`
- Reference: `src/pages/PlatformDashboard.tsx` (enhance this)

**Step 1: Write AdminDashboard**

This enhances PlatformDashboard with: stats cards (AdminStatsCard), recent activity feed, alerts panel, and mini sparklines using Recharts.

```tsx
// src/pages/admin/AdminDashboard.tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CreditCard, Users, TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { usePlatformTenants } from '@/hooks/usePlatformTenants';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { data: tenants = [], isLoading: tenantsLoading } = usePlatformTenants();

  const activeCount = useMemo(
    () => tenants.filter((t) => ['active', 'trialing'].includes(t.subscriptionStatus ?? '')).length,
    [tenants],
  );

  const trialingCount = useMemo(
    () => tenants.filter((t) => t.subscriptionStatus === 'trialing').length,
    [tenants],
  );

  // MRR calculation — sum active subscription amounts
  const { data: mrrCents = 0 } = useQuery({
    queryKey: ['admin', 'mrr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select('amount_cents')
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? []).reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);
    },
  });

  // Recent audit logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['admin', 'recent-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Contact messages count
  const { data: contactCount = 0 } = useQuery({
    queryKey: ['admin', 'contact-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and quick actions.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard
          title="Organizations"
          value={tenants.length}
          icon={Building2}
          subtitle={`${activeCount} active`}
        />
        <AdminStatsCard
          title="Active Subscriptions"
          value={activeCount}
          icon={CreditCard}
          subtitle={`${trialingCount} trialing`}
        />
        <AdminStatsCard
          title="MRR"
          value={`$${(mrrCents / 100).toLocaleString()}`}
          icon={TrendingUp}
        />
        <AdminStatsCard
          title="Contact Messages"
          value={contactCount}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/logs" className="gap-1 text-xs">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{log.action} — {log.resource_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/users"><Users className="h-4 w-4" /> Manage Users</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/organizations"><Building2 className="h-4 w-4" /> Manage Organizations</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/subscriptions"><CreditCard className="h-4 w-4" /> View Subscriptions</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/logs"><AlertTriangle className="h-4 w-4" /> System Logs</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link to="/admin/flags"><TrendingUp className="h-4 w-4" /> Feature Flags</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Verify builds**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/admin/AdminDashboard.tsx
git commit -m "feat(admin): add AdminDashboard page with stats and activity"
```

---

### Task 7: AdminUsers + AdminOrganizations Pages

**Files:**
- Create: `src/pages/admin/AdminUsers.tsx`
- Create: `src/pages/admin/AdminOrganizations.tsx`
- Create: `src/pages/admin/AdminOrganizationDetail.tsx`

These pages use AdminDataTable for consistent table layouts.

**Step 1: Write AdminUsers**

```tsx
// src/pages/admin/AdminUsers.tsx
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  organization_name: string | null;
  role: string | null;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const columns: AdminColumn<AdminUser>[] = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Name', render: (row) => row.full_name || '—' },
  { key: 'organization_name', label: 'Organization', render: (row) => row.organization_name || '—' },
  {
    key: 'role',
    label: 'Role',
    render: (row) => (
      <Badge variant="outline" className="text-xs">{row.role || 'member'}</Badge>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
];

export default function AdminUsers() {
  // TODO: Replace with a Supabase view or edge function that joins auth.users + organization_members
  // For now, query organization_members as a proxy
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          joined_at,
          organizations (name)
        `)
        .limit(200);
      if (error) throw error;
      return (data ?? []).map((m: any) => ({
        id: m.user_id,
        email: m.user_id, // TODO: resolve email from auth.users via edge function
        full_name: null,
        organization_name: m.organizations?.name ?? null,
        role: m.role,
        status: 'active',
        created_at: m.joined_at,
        last_sign_in_at: null,
      }));
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage platform users and their roles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Total Users" value={users.length} icon={Users} />
        <AdminStatsCard
          title="Active"
          value={users.filter((u) => u.status === 'active').length}
          icon={Users}
        />
        <AdminStatsCard
          title="Admins"
          value={users.filter((u) => u.role === 'admin' || u.role === 'owner').length}
          icon={Users}
        />
      </div>

      <AdminDataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search by email or name..."
        searchKeys={['email', 'full_name', 'organization_name']}
        isLoading={isLoading}
      />
    </div>
  );
}
```

**Step 2: Write AdminOrganizations**

```tsx
// src/pages/admin/AdminOrganizations.tsx
import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Users } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { usePlatformTenants } from '@/hooks/usePlatformTenants';

const columns: AdminColumn<any>[] = [
  { key: 'name', label: 'Organization' },
  { key: 'slug', label: 'Slug' },
  {
    key: 'memberCount',
    label: 'Members',
    render: (row) => row.memberCount ?? '—',
  },
  {
    key: 'subscriptionStatus',
    label: 'Status',
    render: (row) => {
      const status = row.subscriptionStatus ?? 'none';
      const variant = status === 'active' ? 'default' : status === 'trialing' ? 'outline' : 'secondary';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    key: 'planName',
    label: 'Plan',
    render: (row) => row.planName ?? '—',
  },
  {
    key: 'created_at',
    label: 'Created',
    render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
  },
];

export default function AdminOrganizations() {
  const navigate = useNavigate();
  const { data: tenants = [], isLoading } = usePlatformTenants();

  const activeCount = tenants.filter((t) =>
    ['active', 'trialing'].includes(t.subscriptionStatus ?? ''),
  ).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Manage tenant organizations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Total Orgs" value={tenants.length} icon={Building2} />
        <AdminStatsCard title="Active" value={activeCount} icon={CreditCard} />
        <AdminStatsCard
          title="Trialing"
          value={tenants.filter((t) => t.subscriptionStatus === 'trialing').length}
          icon={Users}
        />
      </div>

      <AdminDataTable
        data={tenants}
        columns={columns}
        searchPlaceholder="Search organizations..."
        searchKeys={['name', 'slug', 'subscriptionStatus']}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/admin/org/${row.id}`)}
      />
    </div>
  );
}
```

**Step 3: Write AdminOrganizationDetail (minimal — enhance later)**

```tsx
// src/pages/admin/AdminOrganizationDetail.tsx
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// TODO: Enhance with tabs (Overview, Members, Subscription, Activity)
// For now, redirect to existing PlatformOrganizationDetail logic
export default function AdminOrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/organizations"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Organization Detail</h1>
          <p className="text-sm text-muted-foreground">ID: {orgId}</p>
        </div>
      </div>

      <p className="text-muted-foreground">
        TODO: Port and enhance PlatformOrganizationDetail with tabs
        (Overview, Members, Subscription, Integrations, Activity).
      </p>
    </div>
  );
}
```

**Step 4: Verify builds**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 5: Commit**

```bash
git add src/pages/admin/AdminUsers.tsx src/pages/admin/AdminOrganizations.tsx src/pages/admin/AdminOrganizationDetail.tsx
git commit -m "feat(admin): add Users, Organizations, and OrgDetail pages"
```

---

### Task 8: Revenue Pages (AdminSubscriptions + AdminBilling)

**Files:**
- Create: `src/pages/admin/AdminSubscriptions.tsx`
- Create: `src/pages/admin/AdminBilling.tsx`

**Step 1: Write AdminSubscriptions**

```tsx
// src/pages/admin/AdminSubscriptions.tsx
import { CreditCard, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const columns: AdminColumn<any>[] = [
  { key: 'org_name', label: 'Organization' },
  {
    key: 'plan_name',
    label: 'Plan',
    render: (row) => row.plan_name ?? 'Unknown',
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => {
      const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        active: 'default',
        trialing: 'outline',
        past_due: 'destructive',
        canceled: 'secondary',
      };
      return <Badge variant={colors[row.status] ?? 'secondary'}>{row.status}</Badge>;
    },
  },
  {
    key: 'amount_cents',
    label: 'MRR',
    render: (row) => `$${((row.amount_cents ?? 0) / 100).toFixed(2)}`,
  },
  {
    key: 'current_period_end',
    label: 'Period End',
    render: (row) => row.current_period_end ? new Date(row.current_period_end).toLocaleDateString() : '—',
  },
];

export default function AdminSubscriptions() {
  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select(`
          *,
          organizations (name),
          billing_plans (name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        ...s,
        org_name: s.organizations?.name ?? '—',
        plan_name: s.billing_plans?.name ?? '—',
      }));
    },
  });

  const active = subs.filter((s: any) => s.status === 'active');
  const trialing = subs.filter((s: any) => s.status === 'trialing');
  const pastDue = subs.filter((s: any) => s.status === 'past_due');
  const mrr = active.reduce((sum: number, s: any) => sum + (s.amount_cents ?? 0), 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Manage all platform subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Active" value={active.length} icon={CreditCard} />
        <AdminStatsCard title="Trialing" value={trialing.length} icon={Users} />
        <AdminStatsCard title="Past Due" value={pastDue.length} icon={AlertTriangle} />
        <AdminStatsCard title="MRR" value={`$${(mrr / 100).toLocaleString()}`} icon={TrendingUp} />
      </div>

      <AdminDataTable
        data={subs}
        columns={columns}
        searchPlaceholder="Search subscriptions..."
        searchKeys={['org_name', 'plan_name', 'status']}
        isLoading={isLoading}
      />
    </div>
  );
}
```

**Step 2: Write AdminBilling**

```tsx
// src/pages/admin/AdminBilling.tsx
import { Wallet, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const columns: AdminColumn<any>[] = [
  { key: 'org_name', label: 'Organization' },
  {
    key: 'amount_cents',
    label: 'Amount',
    render: (row) => `$${((row.amount_cents ?? 0) / 100).toFixed(2)}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => {
      const colors: Record<string, 'default' | 'destructive' | 'secondary'> = {
        paid: 'default',
        failed: 'destructive',
        pending: 'secondary',
      };
      return <Badge variant={colors[row.status] ?? 'secondary'}>{row.status}</Badge>;
    },
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (row) => new Date(row.created_at).toLocaleDateString(),
  },
  {
    key: 'stripe_invoice_id',
    label: 'Stripe ID',
    render: (row) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.stripe_invoice_id ? row.stripe_invoice_id.slice(0, 20) + '…' : '—'}
      </span>
    ),
  },
];

export default function AdminBilling() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['admin', 'invoices'],
    queryFn: async () => {
      // TODO: Create billing_invoices table or use Stripe API edge function
      // For now, return empty array as scaffold
      const { data, error } = await supabase
        .from('billing_invoices' as any)
        .select('*, organizations (name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        // Table may not exist yet — graceful fallback
        console.warn('billing_invoices table not found, showing empty state');
        return [];
      }
      return (data ?? []).map((i: any) => ({
        ...i,
        org_name: i.organizations?.name ?? '—',
      }));
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Billing & Invoices</h1>
        <p className="text-sm text-muted-foreground">View invoices and revenue data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Total Invoices" value={invoices.length} icon={Wallet} />
        <AdminStatsCard
          title="Paid"
          value={invoices.filter((i: any) => i.status === 'paid').length}
          icon={CheckCircle}
        />
        <AdminStatsCard
          title="Failed"
          value={invoices.filter((i: any) => i.status === 'failed').length}
          icon={AlertTriangle}
        />
      </div>

      <AdminDataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoices..."
        searchKeys={['org_name', 'status']}
        isLoading={isLoading}
      />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/admin/AdminSubscriptions.tsx src/pages/admin/AdminBilling.tsx
git commit -m "feat(admin): add Subscriptions and Billing pages"
```

---

### Task 9: Intelligence Pages (Signals, Ingestion, AI Jobs)

These pages are scaffolds — the real data sources will be connected as the intelligence pipeline is built.

**Files:**
- Create: `src/pages/admin/AdminSignals.tsx`
- Create: `src/pages/admin/AdminIngestion.tsx`
- Create: `src/pages/admin/AdminAiJobs.tsx`

**Step 1: Write AdminSignals**

```tsx
// src/pages/admin/AdminSignals.tsx
import { Zap, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSignals() {
  // TODO: Connect to real signal monitoring data
  // Data sources: creative_signals table, signal_processing_jobs
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Signals Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Monitor creative intelligence signal pipeline health.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Active Signal Types" value={0} icon={Zap} subtitle="TODO: connect" />
        <AdminStatsCard title="Processed (24h)" value={0} icon={Activity} subtitle="TODO: connect" />
        <AdminStatsCard title="Errors (24h)" value={0} icon={AlertTriangle} subtitle="TODO: connect" />
        <AdminStatsCard title="Success Rate" value="—" icon={CheckCircle} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Signal Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            Signal monitoring will be available once the intelligence pipeline is deployed.
            This page will show: signal types, processing rates, error rates, and alert thresholds.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Write AdminIngestion**

```tsx
// src/pages/admin/AdminIngestion.tsx
import { Download, Activity, AlertTriangle, Database } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminIngestion() {
  // TODO: Connect to real ingestion job data
  // Data sources: ingestion_jobs table, data_sources table
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Data Ingestion</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage data ingestion jobs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Active Jobs" value={0} icon={Activity} subtitle="TODO: connect" />
        <AdminStatsCard title="Sources Connected" value={0} icon={Database} subtitle="TODO: connect" />
        <AdminStatsCard title="Records Processed" value={0} icon={Download} subtitle="TODO: connect" />
        <AdminStatsCard title="Errors" value={0} icon={AlertTriangle} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Ingestion Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            Data ingestion monitoring will be available once ingestion sources are configured.
            This page will show: active jobs, source health, manual triggers, and error logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Write AdminAiJobs**

```tsx
// src/pages/admin/AdminAiJobs.tsx
import { BrainCircuit, Activity, Wallet, Clock } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAiJobs() {
  // TODO: Connect to real AI job tracking data
  // Data sources: ai_processing_jobs table, ai_usage_tracking table
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">AI Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Track AI processing jobs, usage, and costs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Running Jobs" value={0} icon={Activity} subtitle="TODO: connect" />
        <AdminStatsCard title="Completed (24h)" value={0} icon={BrainCircuit} subtitle="TODO: connect" />
        <AdminStatsCard title="Total Spend" value="$0" icon={Wallet} subtitle="TODO: connect" />
        <AdminStatsCard title="Avg Duration" value="—" icon={Clock} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Job Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            AI job tracking will be available once AI processing pipelines are deployed.
            This page will show: job queue, running jobs, cost tracking, and model configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/pages/admin/AdminSignals.tsx src/pages/admin/AdminIngestion.tsx src/pages/admin/AdminAiJobs.tsx
git commit -m "feat(admin): add Signals, Ingestion, AI Jobs scaffold pages"
```

---

### Task 10: Platform Pages (Moderation, Logs, Flags, Analytics)

**Files:**
- Create: `src/pages/admin/AdminModeration.tsx`
- Create: `src/pages/admin/AdminLogs.tsx`
- Create: `src/pages/admin/AdminFeatureFlags.tsx`
- Create: `src/pages/admin/AdminAnalytics.tsx`

**Step 1: Write AdminModeration**

```tsx
// src/pages/admin/AdminModeration.tsx
import { Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminModeration() {
  // TODO: Connect to moderation queue data
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Content Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review and moderate flagged content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatsCard title="Pending Review" value={0} icon={Clock} subtitle="TODO: connect" />
        <AdminStatsCard title="Approved (30d)" value={0} icon={CheckCircle} subtitle="TODO: connect" />
        <AdminStatsCard title="Rejected (30d)" value={0} icon={AlertTriangle} subtitle="TODO: connect" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">
            Content moderation will be available once user-generated content features are live.
            This page will show: flagged items queue, moderation history, and auto-moderation rules.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Write AdminLogs (enhanced from PlatformLogs)**

```tsx
// src/pages/admin/AdminLogs.tsx
import { useState } from 'react';
import { ScrollText, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AdminDataTable, type AdminColumn } from '@/components/admin/AdminDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const columns: AdminColumn<any>[] = [
  {
    key: 'created_at',
    label: 'Timestamp',
    render: (row) => (
      <span className="text-xs font-mono">
        {new Date(row.created_at).toLocaleString()}
      </span>
    ),
  },
  { key: 'action', label: 'Action' },
  { key: 'resource_type', label: 'Resource' },
  {
    key: 'actor_email',
    label: 'Actor',
    render: (row) => row.actor_email || row.actor_id?.slice(0, 8) || '—',
  },
  {
    key: 'org_name',
    label: 'Organization',
    render: (row) => row.org_name || '—',
  },
];

export default function AdminLogs() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Enhanced from 200
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource', 'Actor', 'Details'].join(','),
      ...logs.map((log: any) =>
        [
          new Date(log.created_at).toISOString(),
          log.action,
          log.resource_type,
          log.actor_id,
          JSON.stringify(log.details ?? {}),
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Logs</h1>
          <p className="text-sm text-muted-foreground">
            Audit trail of platform actions ({logs.length} entries).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <AdminDataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search logs..."
        searchKeys={['action', 'resource_type', 'actor_email']}
        isLoading={isLoading}
        pageSize={25}
      />
    </div>
  );
}
```

**Step 3: Write AdminFeatureFlags (enhanced from PlatformSettings)**

```tsx
// src/pages/admin/AdminFeatureFlags.tsx
import { Flag, ToggleRight, ToggleLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AdminFeatureFlags() {
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['admin', 'feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('category', 'feature_flag')
        .order('key');
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: String(value), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'feature-flags'] });
      toast.success('Flag updated');
    },
    onError: (err: Error) => {
      toast.error(`Failed to update flag: ${err.message}`);
    },
  });

  const enabledCount = flags.filter((f: any) => f.value === 'true').length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">
          {enabledCount} of {flags.length} flags enabled.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading flags…</p>
      ) : flags.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No feature flags configured. Add flags in the platform_settings table
            with category = &apos;feature_flag&apos;.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {flags.map((flag: any) => (
            <Card key={flag.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{flag.key}</span>
                    <Badge variant={flag.value === 'true' ? 'default' : 'secondary'}>
                      {flag.value === 'true' ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                  {flag.description && (
                    <p className="text-xs text-muted-foreground">{flag.description}</p>
                  )}
                </div>
                <Switch
                  checked={flag.value === 'true'}
                  onCheckedChange={(checked) =>
                    toggleFlag.mutate({ id: flag.id, value: checked })
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Write AdminAnalytics (enhanced with Recharts)**

```tsx
// src/pages/admin/AdminAnalytics.tsx
import { useMemo } from 'react';
import { TrendingUp, Users, Building2, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { usePlatformTenants } from '@/hooks/usePlatformTenants';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAnalytics() {
  const { data: tenants = [] } = usePlatformTenants();

  const { data: mrrCents = 0 } = useQuery({
    queryKey: ['admin', 'mrr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_subscriptions')
        .select('amount_cents')
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? []).reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);
    },
  });

  const { data: memberCount = 0 } = useQuery({
    queryKey: ['admin', 'member-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const activeCount = tenants.filter((t) =>
    ['active', 'trialing'].includes(t.subscriptionStatus ?? ''),
  ).length;

  // TODO: Replace with real time-series data from a metrics table
  // Placeholder chart data
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      month,
      orgs: Math.max(1, tenants.length - (months.length - i - 1) * 2),
      mrr: Math.max(0, (mrrCents / 100) - (months.length - i - 1) * 500),
    }));
  }, [tenants.length, mrrCents]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Key metrics and growth trends.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatsCard title="Total Users" value={memberCount} icon={Users} />
        <AdminStatsCard title="Organizations" value={tenants.length} icon={Building2} />
        <AdminStatsCard title="Active Subs" value={activeCount} icon={CreditCard} />
        <AdminStatsCard title="MRR" value={`$${(mrrCents / 100).toLocaleString()}`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Organization Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="orgs" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">MRR Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => [`$${v}`, 'MRR']} />
                <Line type="monotone" dataKey="mrr" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/pages/admin/AdminModeration.tsx src/pages/admin/AdminLogs.tsx src/pages/admin/AdminFeatureFlags.tsx src/pages/admin/AdminAnalytics.tsx
git commit -m "feat(admin): add Moderation, Logs, Feature Flags, Analytics pages"
```

---

### Task 11: AdminSettings Page

**Files:**
- Create: `src/pages/admin/AdminSettings.tsx`

**Step 1: Write AdminSettings**

```tsx
// src/pages/admin/AdminSettings.tsx
import { Settings, UserPlus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePlatformOwnerEmails } from '@/hooks/usePlatformOwnerEmails';
import { useAddPlatformOwner } from '@/hooks/useAddPlatformOwner';
import { useRemovePlatformOwner } from '@/hooks/useRemovePlatformOwner';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const { data: owners = [], isLoading } = usePlatformOwnerEmails();
  const addOwner = useAddPlatformOwner();
  const removeOwner = useRemovePlatformOwner();
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    addOwner.mutate(email, {
      onSuccess: () => {
        setNewEmail('');
        toast.success(`Added ${email} as admin`);
      },
    });
  };

  const handleRemove = (email: string) => {
    if (owners.length <= 1) {
      toast.error('Cannot remove the last admin');
      return;
    }
    removeOwner.mutate(email, {
      onSuccess: () => toast.success(`Removed ${email}`),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage platform administrators and system configuration.
        </p>
      </div>

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Administrators</CardTitle>
          <CardDescription>
            Users with admin access can view all organizations, manage subscriptions, and access system logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@company.com"
              type="email"
              className="max-w-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={addOwner.isPending} className="gap-2">
              <UserPlus className="h-4 w-4" /> Add
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-2">
              {owners.map((owner: any) => (
                <div key={owner.id ?? owner.email} className="flex items-center justify-between py-2 px-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{owner.email}</span>
                    <Badge variant="outline" className="text-xs">Admin</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(owner.email)}
                    disabled={removeOwner.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/admin/AdminSettings.tsx
git commit -m "feat(admin): add AdminSettings page with admin user management"
```

---

### Task 12: Wire Up Admin Routes in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Important**: This task assumes the marketing website plan (Task 7) has already restructured App.tsx with the 3-layer route groups. If not, this step adds the admin routes alongside the existing platform routes.

**Step 1: Add admin route imports and routes**

Add lazy imports for all admin pages at the top of App.tsx:

```typescript
// Admin Console (replaces /platform/*)
const AdminLayout = lazy(() => import('./components/admin/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrganizations = lazy(() => import('./pages/admin/AdminOrganizations'));
const AdminOrganizationDetail = lazy(() => import('./pages/admin/AdminOrganizationDetail'));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminBilling = lazy(() => import('./pages/admin/AdminBilling'));
const AdminSignals = lazy(() => import('./pages/admin/AdminSignals'));
const AdminIngestion = lazy(() => import('./pages/admin/AdminIngestion'));
const AdminAiJobs = lazy(() => import('./pages/admin/AdminAiJobs'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminFeatureFlags = lazy(() => import('./pages/admin/AdminFeatureFlags'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
```

Add the AdminRoute import:

```typescript
import { AdminRoute } from '@/components/admin/AdminRoute';
```

Add the admin route group inside `<Routes>`:

```tsx
{/* Admin Console routes */}
<Route path="admin" element={
  <AdminRoute>
    <AdminLayout />
  </AdminRoute>
}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="organizations" element={<AdminOrganizations />} />
  <Route path="org/:orgId" element={<AdminOrganizationDetail />} />
  <Route path="subscriptions" element={<AdminSubscriptions />} />
  <Route path="billing" element={<AdminBilling />} />
  <Route path="signals" element={<AdminSignals />} />
  <Route path="ingestion" element={<AdminIngestion />} />
  <Route path="ai-jobs" element={<AdminAiJobs />} />
  <Route path="moderation" element={<AdminModeration />} />
  <Route path="logs" element={<AdminLogs />} />
  <Route path="flags" element={<AdminFeatureFlags />} />
  <Route path="analytics" element={<AdminAnalytics />} />
  <Route path="settings" element={<AdminSettings />} />
</Route>

{/* Legacy redirect: /platform/* → /admin/* */}
<Route path="platform" element={<Navigate to="/admin" replace />} />
<Route path="platform/*" element={<Navigate to="/admin" replace />} />
```

**Step 2: Remove the old platform route group** (the `<Route path="platform" ...>` block)

**Step 3: Verify builds**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 4: Verify tests still pass**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -20`
Expected: All existing tests pass

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(admin): wire up /admin/* routes, redirect /platform/* → /admin/*"
```

---

### Task 13: Clean Up Legacy Platform Files

**Files:**
- Delete or deprecate: `src/components/layout/PlatformLayout.tsx`
- Delete or deprecate: `src/pages/PlatformDashboard.tsx`
- Delete or deprecate: `src/pages/PlatformBilling.tsx`
- Delete or deprecate: `src/pages/PlatformAnalytics.tsx`
- Delete or deprecate: `src/pages/PlatformLogs.tsx`
- Delete or deprecate: `src/pages/PlatformContactMessages.tsx`
- Delete or deprecate: `src/pages/PlatformSettings.tsx`
- Delete or deprecate: `src/pages/PlatformOrganizationDetail.tsx`

**Step 1: Verify no imports reference old platform pages**

Run: `grep -r "PlatformDashboard\|PlatformBilling\|PlatformAnalytics\|PlatformLogs\|PlatformSettings\|PlatformContactMessages\|PlatformOrganizationDetail\|PlatformLayout" src/ --include="*.tsx" --include="*.ts" -l`

Expected: Only `App.tsx` should reference them. If App.tsx was updated in Task 12, these should no longer be referenced.

**Step 2: Add deprecation comments to each file**

For each legacy platform file, add at the top:

```typescript
// @deprecated — Replaced by admin console (/admin/*). See src/pages/admin/.
// This file is kept temporarily for reference during migration.
// Safe to delete after admin console is fully deployed.
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: deprecate legacy platform admin files (replaced by /admin/*)"
```

---

### Task 14: Final Verification and Deploy

**Step 1: Run full test suite**

```bash
npx vitest run --reporter=verbose
```

Expected: All tests pass (existing + new admin nav config test + AdminStatsCard test + AdminRoute test)

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 3: Manual smoke test**

Start dev server and verify:
- `/admin` — Dashboard loads with stats cards and recent activity
- `/admin/users` — Users table renders
- `/admin/organizations` — Org table renders, clicking row navigates to detail
- `/admin/subscriptions` — Subscription table renders
- `/admin/billing` — Billing page renders (may show empty state)
- `/admin/signals` — Scaffold page renders
- `/admin/ingestion` — Scaffold page renders
- `/admin/ai-jobs` — Scaffold page renders
- `/admin/moderation` — Scaffold page renders
- `/admin/logs` — Log table renders with pagination and export
- `/admin/flags` — Feature flags render with toggle switches
- `/admin/analytics` — Charts render
- `/admin/settings` — Admin user management renders
- `/platform` → redirects to `/admin`
- Non-admin user at `/admin` → redirects to `/app`
- Sidebar collapses/expands on desktop
- Mobile: hamburger toggles sidebar overlay

**Step 4: Deploy**

```bash
npx vercel --prod
```

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during admin console smoke test"
```

---

## Summary

| Task | Description | New Files |
|------|-------------|-----------|
| 1 | Admin nav config | 2 (config + test) |
| 2 | AdminRoute auth guard | 2 (component + test) |
| 3 | AdminSidebar | 1 |
| 4 | AdminLayout + TopBar + Breadcrumbs | 3 |
| 5 | AdminStatsCard + AdminDataTable | 3 (2 components + test) |
| 6 | AdminDashboard | 1 |
| 7 | Users + Orgs + OrgDetail | 3 |
| 8 | Subscriptions + Billing | 2 |
| 9 | Signals + Ingestion + AI Jobs | 3 |
| 10 | Moderation + Logs + Flags + Analytics | 4 |
| 11 | AdminSettings | 1 |
| 12 | Wire up routes in App.tsx | 0 (modify) |
| 13 | Clean up legacy platform files | 0 (deprecate) |
| 14 | Final verification + deploy | 0 |

**Total new files: ~25**
**Estimated time: 3-4 hours**

After this plan: Both plans (marketing website + admin console) are complete. Execute them in order: marketing website first (it restructures routes), then admin console.
