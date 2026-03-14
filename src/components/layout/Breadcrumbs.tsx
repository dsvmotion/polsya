import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
}

const routeMap: Record<string, string> = {
  prospecting: 'Prospecting',
  operations: 'Operations',
  entities: 'Entities',
  reports: 'Reports',
  team: 'Team',
  integrations: 'Integrations',
  profile: 'Settings',
  billing: 'Billing',
};

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return [{ label: 'Dashboard' }];

  const homeHref = pathname.startsWith('/app') ? '/app' : pathname.startsWith('/admin') ? '/admin' : '/dashboard';
  const crumbs: Crumb[] = [{ label: 'Dashboard', href: homeHref }];
  let path = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    path += `/${segment}`;
    const isLast = i === segments.length - 1;
    const label = routeMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, href: isLast ? undefined : path });
  }

  return crumbs;
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href ?? crumb.label} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          {i === 0 && crumbs.length > 1 ? (
            <Link to={crumbs[0]?.href ?? '/app'} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <Home className="h-4 w-4" />
            </Link>
          ) : crumb.href ? (
            <Link
              to={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors truncate"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className={cn('font-medium truncate', i === crumbs.length - 1 ? 'text-foreground' : 'text-muted-foreground')}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
