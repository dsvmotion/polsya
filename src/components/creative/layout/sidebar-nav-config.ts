import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  Download,
  FolderKanban,
  GitBranch,
  GitMerge,
  Image,
  Kanban,
  Layers,
  LayoutDashboard,
  LineChart,
  Mail,
  MessageCircle,
  Palette,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  future?: boolean;
  badge?: string | number;
  command?: string;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  path?: string;
  defaultOpen?: boolean;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Standalone dashboard item
// ---------------------------------------------------------------------------

export const dashboardItem: NavItem = {
  label: 'Dashboard',
  icon: LayoutDashboard,
  path: '/app',
};

// ---------------------------------------------------------------------------
// Grouped navigation
// ---------------------------------------------------------------------------

export const navGroups: NavGroup[] = [
  {
    label: 'Discover',
    icon: Search,
    items: [
      { label: 'Local Businesses', icon: Search, path: '/app/discover' },
      { label: 'Companies', icon: Building2, path: '/app/companies', future: true },
      { label: 'People', icon: UserPlus, path: '/app/people', future: true },
    ],
  },
  {
    label: 'Entities',
    icon: Building2,
    items: [
      { label: 'Clients', icon: Users, path: '/app/clients' },
      { label: 'Contacts', icon: UserRound, path: '/app/contacts' },
      { label: 'Portfolios', icon: Image, path: '/app/portfolios' },
    ],
  },
  {
    label: 'Pipeline',
    icon: Kanban,
    items: [
      { label: 'Opportunities', icon: Briefcase, path: '/app/opportunities' },
      { label: 'Projects', icon: FolderKanban, path: '/app/projects' },
      { label: 'Leads', icon: UserPlus, path: '/app/leads', future: true },
    ],
  },
  {
    label: 'Intelligence',
    icon: Sparkles,
    items: [
      { label: 'Signals', icon: Zap, path: '/app/signals' },
      { label: 'Style Engine', icon: Sparkles, path: '/app/style' },
      { label: 'Enrichment', icon: Layers, path: '/app/enrichment' },
    ],
  },
  {
    label: 'Communication',
    icon: MessageCircle,
    items: [
      { label: 'Email', icon: Mail, path: '/app/inbox' },
      { label: 'Calendar', icon: Calendar, path: '/app/calendar' },
    ],
  },
  {
    label: 'Analytics',
    icon: TrendingUp,
    path: '/app/analytics',
    items: [
      { label: 'Overview', icon: TrendingUp, path: '/app/analytics' },
      { label: 'Reports', icon: BarChart3, path: '/app/reports' },
      { label: 'Pipeline', icon: LineChart, path: '/app/analytics/pipeline' },
      { label: 'AI Insights', icon: BrainCircuit, path: '/app/analytics/insights' },
    ],
  },
  {
    label: 'Operations',
    icon: GitBranch,
    defaultOpen: false,
    items: [
      { label: 'Workflows', icon: GitBranch, path: '/app/workflows' },
      { label: 'Ingestion', icon: Download, path: '/app/ingestion' },
      { label: 'Resolution', icon: GitMerge, path: '/app/resolution' },
      { label: 'Knowledge Base', icon: BookOpen, path: '/app/knowledge-base' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Bottom navigation items
// ---------------------------------------------------------------------------

export const bottomNavItems: NavItem[] = [
  { label: 'Integrations', icon: Palette, path: '/app/integrations' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Settings', icon: Settings, path: '/profile' },
];
