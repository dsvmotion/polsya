import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, BarChart3, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivateSubscriptionCardProps {
  reason?: 'no_subscription' | 'past_due_expired' | 'blocked_status';
}

/**
 * Pantalla "Activa tu suscripción" — no bloquea, solo invita a suscribirse.
 * Se muestra cuando el usuario no tiene acceso (sin suscripción, trial vencido, impago).
 */
export function ActivateSubscriptionCard({ reason = 'no_subscription' }: ActivateSubscriptionCardProps) {
  const isBlocked = reason === 'past_due_expired' || reason === 'blocked_status';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card className="border-2 border-primary/20 bg-card">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <CreditCard className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl">
            {isBlocked ? 'Actualiza tu suscripción' : 'Activa tu suscripción'}
          </CardTitle>
          <CardDescription>
            {reason === 'no_subscription' && (
              <>
                Disfruta de toda la plataforma durante 7 días gratis. Sin tarjeta de crédito.
              </>
            )}
            {reason === 'past_due_expired' && (
              <>
                Tu periodo de cortesía ha finalizado. Actualiza tu método de pago para recuperar el acceso.
              </>
            )}
            {reason === 'blocked_status' && (
              <>
                Tu suscripción necesita atención. Actualiza tu método de pago en Billing.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
              <BarChart3 className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-medium">Reportes avanzados</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border p-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-medium">Mapas y territorios</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to="/billing">
                {isBlocked ? 'Actualizar método de pago' : 'Empezar trial gratis'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/pricing">Ver planes</Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            7 días de prueba · Sin compromiso · Cancela cuando quieras
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
