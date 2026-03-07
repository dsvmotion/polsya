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
