import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, MapPin, Plug, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { supabase } from '@/integrations/supabase/client';

const STEPS = [
  {
    id: 'welcome',
    title: `Welcome to ${APP_NAME}`,
    description: 'Your 7-day free trial has started. Here’s how to get the most out of the platform.',
    icon: Sparkles,
  },
  {
    id: 'dashboard',
    title: 'Your sales dashboard',
    description: 'See orders, entities, and revenue at a glance. Filter by geography and customer type.',
    icon: BarChart3,
    action: { label: 'Go to dashboard', to: '/app' },
  },
  {
    id: 'prospecting',
    title: 'Map your territory',
    description: 'Search for prospects, plot them on the map, and manage your pipeline with entity types.',
    icon: MapPin,
    action: { label: 'Explore prospecting', to: '/prospecting/entities' },
  },
  {
    id: 'integrations',
    title: 'Connect your tools',
    description: 'Link WooCommerce, Gmail, Outlook, and more. Your data flows in automatically.',
    icon: Plug,
    action: { label: 'Set up integrations', to: '/integrations' },
  },
  {
    id: 'billing',
    title: 'Full access when you subscribe',
    description: 'After your trial, choose a plan to keep full access. No surprises.',
    icon: CreditCard,
    action: { label: 'View plans', to: '/billing' },
  },
];

export function OnboardingWizard({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleComplete = async () => {
    onComplete(); // Close immediately for snappy UX
    try {
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
    } catch {
      // Ignore; user can skip again next time
    }
  };

  const handleNext = () => {
    if (isLast) {
      void handleComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    void handleComplete();
  };

  if (!current) return null;

  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.description}</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-2 justify-center pt-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full w-8 transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button variant="ghost" onClick={handleSkip} className="order-2 sm:order-1">
            Skip
          </Button>
          <div className="flex gap-2 order-1 sm:order-2">
            {current.action ? (
              <Button asChild variant="outline">
                <Link to={current.action.to} onClick={handleComplete}>
                  {current.action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <Button onClick={handleNext}>
              {isLast ? (
                <>
                  Get started
                  <Sparkles className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
