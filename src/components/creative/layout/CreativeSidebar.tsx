import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Briefcase,
  Image,
  Sparkles,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Palette,
  X,
  MessageSquare,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CreativeSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onOpenAiChat?: () => void;
}

const mainNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/creative' },
  { label: 'Clients', icon: Users, path: '/creative/clients' },
  { label: 'Projects', icon: FolderKanban, path: '/creative/projects' },
  { label: 'Opportunities', icon: Briefcase, path: '/creative/opportunities' },
  { label: 'Portfolios', icon: Image, path: '/creative/portfolios' },
  { label: 'Style Intelligence', icon: Sparkles, path: '/creative/style' },
];

const bottomNavItems = [
  { label: 'Integrations', icon: Palette, path: '/integrations' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Settings', icon: Settings, path: '/profile' },
];

export function CreativeSidebar({
  open,
  onOpenChange,
  collapsed,
  onCollapsedChange,
  onOpenAiChat,
}: CreativeSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/creative') return location.pathname === '/creative';
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const NavItem = ({ label, icon: Icon, path }: { label: string; icon: typeof LayoutDashboard; path: string }) => {
    const active = isActive(path);

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavigate(path)}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <button
        onClick={() => handleNavigate(path)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
          active
            ? 'bg-sidebar-accent text-sidebar-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn('flex items-center h-14 px-4 border-b border-sidebar-border', collapsed && 'justify-center px-2')}>
        {collapsed ? (
          <>
            <img src="/polsya-logo-black.png" alt="Polsya" className="h-6 w-auto dark:hidden" />
            <img src="/polsya-logo-white.png" alt="Polsya" className="h-6 w-auto hidden dark:block" />
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img src="/polsya-logo-black.png" alt="Polsya" className="h-6 w-auto dark:hidden" />
              <img src="/polsya-logo-white.png" alt="Polsya" className="h-6 w-auto hidden dark:block" />
              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Creative</span>
            </div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className={cn('flex flex-col gap-1', collapsed && 'items-center')}>
          {mainNavItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
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
            <NavItem key={item.path} {...item} />
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
