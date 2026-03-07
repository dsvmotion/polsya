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

  if (segments.length <= 1) return null;

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
