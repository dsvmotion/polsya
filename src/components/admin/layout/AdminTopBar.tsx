import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { APP_NAME } from '@/lib/brand';

interface AdminTopBarProps {
  onMobileMenuToggle: () => void;
}

export function AdminTopBar({ onMobileMenuToggle }: AdminTopBarProps) {
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-border flex items-center justify-between px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 bg-background/90">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-sm">
          {APP_NAME} <span className="text-xs text-muted-foreground font-normal">Admin</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
