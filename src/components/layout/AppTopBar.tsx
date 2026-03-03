import { Menu, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

interface AppTopBarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function AppTopBar({ onMenuClick, onSearchClick }: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border flex items-center justify-between gap-4 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 bg-background/90">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 text-muted-foreground h-9 px-3 text-sm"
          onClick={onSearchClick}
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onSearchClick}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
