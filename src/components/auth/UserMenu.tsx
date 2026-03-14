import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreditCard, LogOut, User, Shield } from 'lucide-react';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { usePlatformOwnerStatus } from '@/hooks/usePlatformOwnerStatus';
import { isPlatformOwner } from '@/lib/platform';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { organization, membership } = useCurrentOrganization();
  const { isOwner, isLoading } = usePlatformOwnerStatus();
  const platformOwner = isLoading ? isPlatformOwner(user) : isOwner;

  if (!user) return null;

  const initials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-background border-border" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-foreground">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
            {organization?.name && (
              <p className="text-[11px] text-muted-foreground truncate">
                {organization.name}{membership?.role ? ` · ${membership.role}` : ''}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-muted" />
        {platformOwner && (
          <DropdownMenuItem asChild className="cursor-pointer text-foreground focus:bg-accent focus:text-accent-foreground">
            <Link to="/platform" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              <span>Platform Admin</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer text-foreground focus:bg-accent focus:text-accent-foreground">
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer text-foreground focus:bg-accent focus:text-accent-foreground">
          <Link to="/billing" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-muted" />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
