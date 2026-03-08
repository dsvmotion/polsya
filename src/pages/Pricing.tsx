import { Link } from 'react-router-dom';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useBillingPlans,
  useCreateCheckoutSession,
} from '@/hooks/useBilling';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import { canManageBilling as canManageBillingRole } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import type { BillingPlan } from '@/types/billing';
import { ScrollAnimation } from '@/components/marketing/ScrollAnimation';

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const PLAN_CONFIG = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'For individuals and small teams getting started.',
    priceFallback: '€29',
    period: '/month',
    features: ['Up to 500 entities', '1 user', 'Core integrations', 'Map view', 'Basic reports', '7-day free trial'],
    featured: false,
    contactOnly: false,
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'For growing teams that need more power.',
    priceFallback: '€79',
    period: '/month',
    features: ['Up to 2,000 entities', 'Up to 5 users', 'All integrations', 'AI Assistant', 'Advanced reports', 'Priority support', '7-day free trial'],
    featured: true,
    contactOnly: false,
  },
  {
    code: 'business',
    name: 'Business',
    description: 'For scaling B2B teams with advanced needs.',
    priceFallback: '€149',
    period: '/month',
    features: ['Up to 10,000 entities', 'Up to 15 users', 'All integrations', 'Priority support', 'Advanced workflows', 'Dedicated onboarding', '7-day free trial'],
    featured: false,
    contactOnly: false,
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'For larger organizations with custom needs.',
    priceFallback: 'Custom',
    period: '',
    features: ['Unlimited entities', 'Unlimited users', 'Custom integrations', 'Dedicated support', 'SLA', 'Custom terms'],
    featured: false,
    contactOnly: true,
  },
] as const;

function findPlanByCode(plans: BillingPlan[], code: string): BillingPlan | undefined {
  return plans.find((p) => p.code?.toLowerCase() === code.toLowerCase());
}

export default function Pricing() {
  const { user } = useAuth();
  const { organization, membership, isLoading: orgLoading } = useCurrentOrganization();
  const { data: apiPlans = [], isLoading: plansLoading } = useBillingPlans();
  const createCheckout = useCreateCheckoutSession();
  const canManageBilling = canManageBillingRole(membership?.role ?? null);

  const handleSubscribe = async (planId: string) => {
    try {
      const result = await createCheckout.mutateAsync({
        planId,
        successUrl: `${window.location.origin}/billing?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start checkout');
    }
  };

  const isLoading = user && (orgLoading || plansLoading);

  return (
    <div className="py-16 sm:py-24 bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Simple, fair pricing
          </h1>
          <p className="mt-4 text-lg text-white/50">
            Start with a 7-day free trial. No credit card required. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {PLAN_CONFIG.map((config, idx) => {
            const apiPlan = !config.contactOnly ? findPlanByCode(apiPlans, config.code) : null;
            const canSubscribe = user && organization && canManageBilling && apiPlan && !config.contactOnly;
            const isContactOnly = config.contactOnly;

            let ctaLabel: string;
            let ctaElement: React.ReactNode;

            const linkButtonClass = cn(
              'w-full border-0',
              config.featured
                ? 'bg-gradient-cta text-white hover:opacity-90'
                : 'bg-white/10 text-white hover:bg-white/15'
            );

            if (isContactOnly) {
              ctaLabel = 'Contact sales';
              ctaElement = (
                <Button className={linkButtonClass} asChild>
                  <Link to="/contact?subject=enterprise">
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              );
            } else if (canSubscribe) {
              ctaLabel = createCheckout.isPending ? 'Redirecting...' : 'Subscribe';
              ctaElement = (
                <Button
                  className={linkButtonClass}
                  onClick={() => apiPlan && handleSubscribe(apiPlan.id)}
                  disabled={createCheckout.isPending}
                >
                  {createCheckout.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {ctaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              );
            } else if (user && !canManageBilling) {
              ctaLabel = 'View billing';
              ctaElement = (
                <Button className={linkButtonClass} asChild>
                  <Link to="/billing">
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              );
            } else {
              ctaLabel = 'Start free trial';
              ctaElement = (
                <Button className={linkButtonClass} asChild>
                  <Link to={`/signup?plan=${config.code}`}>
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              );
            }

            const displayPrice = apiPlan
              ? formatMoney(apiPlan.amount_cents, apiPlan.currency)
              : config.priceFallback;

            return (
              <ScrollAnimation key={config.code} delay={idx * 0.1}>
                <div
                  className={cn(
                    'relative rounded-2xl p-8 h-full',
                    config.featured
                      ? 'bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/20 lg:scale-105'
                      : 'glass-panel',
                  )}
                >
                  {config.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-hero px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Most popular
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-white">{config.name}</h2>
                  <p className="mt-2 text-sm text-white/40">{config.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{displayPrice}</span>
                    {config.period && <span className="text-white/40">{config.period}</span>}
                  </div>
                  <ul className="mt-8 space-y-3">
                    {config.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-4 w-4 shrink-0 text-brand-sage mt-0.5" />
                        <span className="text-sm text-white/60">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">{ctaElement}</div>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>

        {isLoading && (
          <p className="mt-4 text-center text-sm text-white/40">Loading plans...</p>
        )}

        <p className="mt-12 text-center text-sm text-white/40">
          All plans include: 7-day free trial, no long-term commitment, cancel anytime.
        </p>
      </div>
    </div>
  );
}
