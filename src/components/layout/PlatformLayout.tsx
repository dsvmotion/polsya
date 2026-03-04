import { Outlet, Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Mail, ScrollText, Compass } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformOwner } from '@/lib/platform';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';

export function PlatformLayout() {
  const { user } = useAuth();

  if (!user) return null;

  if (!isPlatformOwner(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 h-14 border-b border-border flex items-center justify-between px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 bg-background/90">
        <div className="flex items-center gap-6">
          <Link to="/platform" className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" />
            <span className="font-semibold">Sales Compass — Admin</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/platform" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/platform/billing" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Pagos clientes
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/platform/contact-messages" className="gap-2">
                <Mail className="h-4 w-4" />
                Contacto
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/platform/logs" className="gap-2">
                <ScrollText className="h-4 w-4" />
                Logs
              </Link>
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">Ir al CRM</Link>
          </Button>
          <UserMenu />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
