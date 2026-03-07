/**
 * @deprecated Replaced by src/pages/admin/AdminAnalytics.tsx
 * Routes now redirect /platform/* -> /admin/*. Safe to delete after migration verified.
 */
import { TrendingUp, Building2, CreditCard, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformAnalytics } from '@/hooks/usePlatformAnalytics';

function formatMrr(cents: number): string {
  if (cents === 0) return '0 €';
  const euros = cents / 100;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros);
}

export default function PlatformAnalytics() {
  const { data, isLoading, error } = usePlatformAnalytics();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Cargando métricas…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-destructive">
          {error instanceof Error ? error.message : 'Error al cargar métricas'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          MRR, nuevos usuarios y churn de la plataforma.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatMrr(data.mrrCents)}</p>
                <p className="text-sm text-muted-foreground">MRR</p>
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
                <p className="text-2xl font-bold">{data.activeSubs}</p>
                <p className="text-sm text-muted-foreground">Suscripciones activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.trialingSubs}</p>
                <p className="text-sm text-muted-foreground">En trial</p>
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
                <p className="text-2xl font-bold">{data.totalOrgs}</p>
                <p className="text-sm text-muted-foreground">Organizaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-success" />
              Nuevos registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold">{data.newOrgsLast7Days}</p>
                <p className="text-sm text-muted-foreground">Últimos 7 días</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.newOrgsLast30Days}</p>
                <p className="text-sm text-muted-foreground">Últimos 30 días</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              Churn (30 días)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.churnedLast30Days}</p>
            <p className="text-sm text-muted-foreground">
              Suscripciones canceladas o impagadas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
