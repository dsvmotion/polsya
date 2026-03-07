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
// Bottom navigation items
// ---------------------------------------------------------------------------

export const bottomNavItems: NavItem[] = [
  { label: 'Integrations', icon: Palette, path: '/integrations' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Settings', icon: Settings, path: '/profile' },
];
