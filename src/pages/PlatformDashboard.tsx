import { useState, useMemo } from 'react';
import { Building2, CreditCard, Users, Search, ChevronRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePlatformTenants } from '@/hooks/usePlatformTenants';
import { supabase } from '@/integrations/supabase/client';

export default function PlatformDashboard() {
  const { data: tenants = [], isLoading } = usePlatformTenants();
  const [search, setSearch] = useState('');

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.trim().toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.subscriptionStatus ?? '').toLowerCase().includes(q),
    );
  }, [tenants, search]);
  const activeCount = tenants.filter((t) =>
    ['active', 'trialing'].includes(t.subscriptionStatus ?? '')
  ).length;

  const { data: contactCount = 0 } = useQuery({
    queryKey: ['platform', 'contact-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Platform Admin</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las organizaciones y suscripciones de tus clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredTenants.length}</p>
                <p className="text-sm text-muted-foreground">Organizaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Suscripciones activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Link to="/platform/contact-messages">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contactCount}</p>
                  <p className="text-sm text-muted-foreground">Mensajes contacto</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes
          </CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button asChild>
              <Link to="/platform/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Gestionar pagos
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
          ) : filteredTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay organizaciones registradas.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTenants.map((t) => (
                <Link
                  key={t.id}
                  to={`/platform/org/${t.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.memberCount} miembros · {t.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        ['active', 'trialing'].includes(t.subscriptionStatus ?? '')
                          ? 'bg-success/10 text-success'
                          : t.subscriptionStatus
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t.subscriptionStatus ?? 'Sin suscripción'}
                    </span>
                    {t.currentPeriodEnd && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Hasta {new Date(t.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
