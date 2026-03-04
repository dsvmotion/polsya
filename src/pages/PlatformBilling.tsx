import { useState, useMemo } from 'react';
import { CreditCard, Building2, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePlatformTenants } from '@/hooks/usePlatformTenants';

export default function PlatformBilling() {
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

  const activeTenants = tenants.filter((t) =>
    ['active', 'trialing'].includes(t.subscriptionStatus ?? '')
  );
  const inactiveTenants = tenants.filter(
    (t) => !['active', 'trialing'].includes(t.subscriptionStatus ?? '')
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Pagos de clientes</h1>
        <p className="text-sm text-muted-foreground">
          Controla las suscripciones de tus clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CreditCard className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeTenants.length}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveTenants.length}</p>
                <p className="text-sm text-muted-foreground">Sin suscripción activa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Todas las organizaciones</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <div className="space-y-2">
              {filteredTenants.map((t) => (
                <Link
                  key={t.id}
                  to={`/platform/org/${t.id}`}
                  className="flex items-center justify-between py-3 px-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.slug} · {t.memberCount} miembros
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
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
                      <span className="text-xs text-muted-foreground">
                        Hasta {new Date(t.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
