import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  BarChart3,
  Settings,
  CreditCard,
  Plug,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { useEntityTypes } from '@/hooks/useEntityTypes';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { APP_NAME } from '@/lib/brand';

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onOpenAiChat?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  match?: RegExp;
  children?: { label: string; href: string }[];
}

export function AppSidebar({ open, onOpenChange, collapsed, onCollapsedChange, onOpenAiChat }: AppSidebarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { data: entityTypes = [] } = useEntityTypes();
  const { organization } = useCurrentOrganization();

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/app', icon: LayoutDashboard, match: /^\/app\/?$/ },
    {
      label: 'Prospecting',
      href: '/prospecting/entities',
      icon: Search,
      match: /^\/prospecting/,
      children: entityTypes.map((et) => ({
        label: et.label,
        href: `/prospecting/entities/${et.key}`,
      })),
    },
    {
      label: 'Operations',
      href: '/operations/entities',
      icon: ClipboardList,
      match: /^\/operations/,
      children: entityTypes.map((et) => ({
        label: et.label,
        href: `/operations/entities/${et.key}`,
      })),
    },
    { label: 'Reports', href: '/reports', icon: BarChart3, match: /^\/reports/ },
    { label: 'Team', href: '/team', icon: Users, match: /^\/team/ },
  ];

  const bottomItems: NavItem[] = [
    { label: 'Integrations', href: '/app/integrations', icon: Plug, match: /^\/app\/integrations/ },
    { label: 'Billing', href: '/app/billing', icon: CreditCard, match: /^\/app\/billing/ },
    { label: 'Settings', href: '/app/settings', icon: Settings, match: /^\/app\/settings/ },
  ];

  const isActive = (item: NavItem) => {
    if (item.match) return item.match.test(location.pathname);
    return location.pathname === item.href;
  };

  const logoUrl = organization?.logo_url;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-14 border-b border-sidebar-border px-3 shrink-0', collapsed && 'justify-center')}>
        {!collapsed && (
          <Link to="/app" className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <>
                <img src="/polsya-logo-black.png" alt="Polsya" className="h-7 w-auto dark:hidden shrink-0" />
                <img src="/polsya-logo-white.png" alt="Polsya" className="h-7 w-auto hidden dark:block shrink-0" />
              </>
            )}
            <span className="font-semibold text-sm text-sidebar-foreground truncate">
              {organization?.name || APP_NAME}
            </span>
          </Link>
        )}
        {collapsed && (
          <Link to="/app">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <>
                <img src="/polsya-logo-black.png" alt="Polsya" className="h-7 w-auto dark:hidden" />
                <img src="/polsya-logo-white.png" alt="Polsya" className="h-7 w-auto hidden dark:block" />
              </>
            )}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const expanded = active && item.children && item.children.length > 0 && !collapsed;

            return (
              <div key={item.href}>
                {collapsed ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          'flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors',
                          active
                            ? 'bg-sidebar-accent text-sidebar-primary'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )}

                {expanded && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={cn(
                          'block px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                          location.pathname === child.href
                            ? 'text-sidebar-primary bg-sidebar-accent/50'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30',
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
        {/* AI Assistant */}
        {onOpenAiChat &&
          (collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={onOpenAiChat}
                  className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
                >
                  <Sparkles className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                AI Assistant
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={onOpenAiChat}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
            >
              <Sparkles className="h-5 w-5 shrink-0" />
              <span className="truncate">AI Assistant</span>
            </button>
          ))}

        {bottomItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return collapsed ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <Separator className="my-2 bg-sidebar-border" />

        {/* Theme toggle */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        )}

        {/* Collapse toggle (desktop) */}
        {!collapsed ? (
          <button
            onClick={() => onCollapsedChange(true)}
            className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
            <span>Collapse</span>
          </button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onCollapsedChange(false)}
                className="hidden lg:flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Expand
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-xl animate-in slide-in-from-left duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => onOpenChange(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
