import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

interface CreativeTopBarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function CreativeTopBar({ onMenuClick, onSearchClick }: CreativeTopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 h-14 px-4 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search — full on md+, icon on sm */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex items-center gap-2 text-muted-foreground h-9 px-3"
          onClick={onSearchClick}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={onSearchClick}
        >
          <Search className="h-5 w-5" />
        </Button>

        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
