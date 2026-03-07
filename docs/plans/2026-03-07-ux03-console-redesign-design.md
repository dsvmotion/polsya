# UX-03: Console Redesign — Grouped Sidebar Navigation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the flat 18-item sidebar into a grouped, collapsible navigation system using existing shadcn/ui sidebar primitives.

**Architecture:** Refactor `CreativeSidebar.tsx` internals to use `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton`, and Radix `Collapsible`. Keep `CreativeLayout.tsx` and all routes unchanged.

**Tech Stack:** React, shadcn/ui sidebar primitives, Radix Collapsible, Lucide icons, Tailwind CSS

---

## 1. Problem

The current sidebar has 18 flat navigation items. As Polsya grows, this list becomes unscalable — users can't form mental models around where things live, and the nav lacks semantic grouping.

## 2. Approach

**Approach B: Adopt shadcn sidebar primitives** — chosen over custom evolution (A) and full layout migration (C).

- Reuse existing `sidebar.tsx` components (`SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`)
- Use Radix `Collapsible` for group expand/collapse
- Keep `CreativeLayout.tsx` unchanged (still owns sidebar state)
- Keep `CreativeSidebarProps` interface unchanged (same 5 props)
- Keep all routes in `App.tsx` unchanged

## 3. Navigation Structure

```
Dashboard                          (standalone)
─────────────────────────────────
Discover          [Search]
  Local Businesses                 /creative/discover
  Companies                       (future)
  People                          (future)

Entities          [Building2]
  Clients                          /creative/clients
  Contacts                         /creative/contacts
  Portfolios                       /creative/portfolios

Pipeline          [Kanban]
  Opportunities                    /creative/opportunities
  Projects                         /creative/projects
  Leads                            (future)

Intelligence      [Sparkles]
  Signals                          /creative/signals
  Style Engine                     /creative/style
  Enrichment                       /creative/enrichment

Communication     [MessageCircle]
  Email                            /creative/inbox
  Calendar                         /creative/calendar

Analytics         [TrendingUp]     /creative/analytics (navigable group)
  Overview                         /creative/analytics
  Pipeline                         /creative/analytics/pipeline
  AI Insights                      /creative/analytics/ai-insights

Operations        [GitBranch]      (collapsed by default)
  Workflows                        /creative/workflows
  Ingestion                        /creative/ingestion
  Resolution                       /creative/resolution
  Knowledge Base                   /creative/knowledge-base
─────────────────────────────────
AI Assistant
Integrations
Billing
Settings
```

**Group ordering rationale:** Discover → Entities → Pipeline mirrors the user workflow: find → organize → work.

## 4. Data Types

```ts
interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  future?: boolean;        // muted, non-navigable, "Coming soon" tooltip
  badge?: string | number; // e.g. unread count for Signals, Email
  command?: string;        // future CMD+K integration metadata
}

interface NavGroup {
  label: string;
  icon: LucideIcon;        // shown when sidebar collapsed
  path?: string;            // optional navigable group landing page
  defaultOpen?: boolean;    // defaults to true; Operations = false
  items: NavItem[];
}
```

## 5. Component Architecture

```
CreativeSidebar
├── Header (logo + badge + NotificationBell) — UNCHANGED
├── SidebarContent (ScrollArea)
│   ├── SidebarMenu
│   │   └── Dashboard (standalone SidebarMenuItem + SidebarMenuButton)
│   ├── SidebarGroup × 7
│   │   └── Collapsible (defaultOpen from config)
│   │       ├── SidebarGroupLabel + CollapsibleTrigger
│   │       │   ├── Group icon + label
│   │       │   ├── Optional badge (group-level aggregate)
│   │       │   └── ChevronRight (rotates on open)
│   │       └── CollapsibleContent
│   │           └── SidebarMenu
│   │               └── SidebarMenuItem × N
│   │                   └── SidebarMenuButton (isActive, tooltip)
│   │                       ├── Item icon + label
│   │                       └── Optional SidebarMenuBadge
├── Bottom section — UNCHANGED
│   ├── AI Assistant button
│   ├── Integrations, Billing, Settings (NavItems)
│   └── Collapse toggle button
```

## 6. Behaviors

### 6.1 Collapsed sidebar

When collapsed (`w-[68px]`):
- Group labels hidden (via `group-data-[collapsible=icon]:opacity-0`)
- Sub-items hidden (via `group-data-[collapsible=icon]:hidden`)
- Each group shows its group icon as a single icon button with tooltip
- **Clicking a group icon:** expands the sidebar (`onCollapsedChange(false)`) and ensures that group is open
- Dashboard remains a standalone icon button
- Bottom items remain as icon buttons with tooltips

### 6.2 Group expand/collapse

- Each group has independent open/close state via `useState`, initialized from `defaultOpen`
- No localStorage persistence — state resets to defaults on page reload
- Chevron rotates 90° on open (CSS transition)
- Operations group: `defaultOpen: false` (collapsed by default)

### 6.3 Active-group auto-open

If the current route matches an item inside a collapsed group, that group auto-opens on mount. This prevents the user navigating to `/creative/workflows` and seeing the Operations group closed with no visual indication of where they are.

### 6.4 Navigable groups

Groups with `path` defined (currently only Analytics) have a clickable group label that navigates to the group's landing page. The chevron remains the toggle control. Split interaction: label area navigates, chevron toggles.

### 6.5 Future items

Items with `future: true`:
- Render with `opacity-40 pointer-events-none cursor-default`
- Show tooltip "Coming soon" on hover
- No navigation on click
- Positioned where they'll eventually live in the group

### 6.6 Icon hierarchy

Group icons and item icons are visually distinct:
- **Group icons = abstract/container** (Building2, Kanban, MessageCircle)
- **Item icons = specific/action** (Users, FolderKanban, Mail)

Avoids collisions like Entities group + Clients item both using `Users`.

## 7. Files Changed

| File | Change |
|------|--------|
| `src/components/creative/layout/CreativeSidebar.tsx` | **Major refactor** — replace flat nav with grouped config + shadcn primitives |

**No changes to:**
- `CreativeLayout.tsx`
- `App.tsx` (routes)
- `WorkspaceContainer.tsx`
- Any page components
- `sidebar.tsx` (shadcn primitive)
- `collapsible.tsx` (Radix primitive)

## 8. Testing

- Verify all 18 existing nav items still navigate correctly
- Verify group expand/collapse behavior
- Verify collapsed sidebar shows group icons with tooltips
- Verify collapsed sidebar expand-on-click behavior
- Verify future items are muted and non-navigable
- Verify Operations group starts collapsed
- Verify active-group auto-open (navigate to /creative/workflows, Operations should be open)
- Verify mobile overlay renders grouped navigation
- Verify Analytics group label navigates to /creative/analytics
- Existing test suite (506 tests) should pass unchanged
- Build should succeed

## 9. Out of Scope

- RBAC / permission-based nav visibility (no RBAC system yet)
- CMD+K command palette integration (command field added as metadata only)
- New pages for future items (Companies, People, Leads)
- Hub pages for groups (except Analytics which already exists)
- localStorage persistence for group open/close state
- Changes to CreativeLayout or routing architecture
