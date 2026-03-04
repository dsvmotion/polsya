import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Compass, Search, ClipboardList, BarChart3, Sparkles, ChevronRight } from 'lucide-react';

const ONBOARDING_KEY = 'sales-compass-onboarding-completed';

export function getOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    // ignore
  }
}

const steps = [
  {
    title: 'Welcome to Sales Compass',
    description: 'Your CRM for prospecting, operations, and sales intelligence. Let\'s get you started.',
    icon: Compass,
  },
  {
    title: 'Prospecting',
    description: 'Find and qualify leads on the map. Filter by type, territory, and status.',
    icon: Search,
  },
  {
    title: 'Operations',
    description: 'Manage orders and daily operations. Track deliveries and follow-ups.',
    icon: ClipboardList,
  },
  {
    title: 'Reports & AI',
    description: 'View pipeline metrics and ask questions about your data with the AI assistant.',
    icon: BarChart3,
  },
  {
    title: 'You\'re all set',
    description: 'Explore the dashboard or start adding your first contacts.',
    icon: Sparkles,
  },
];

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setOnboardingCompleted();
      onOpenChange(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    setOnboardingCompleted();
    onOpenChange(false);
  };

  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <Icon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.description}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1 py-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleNext} className="w-full gap-2">
            {isLast ? (
              <>
                Go to Dashboard
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
          {!isLast && (
            <Button variant="ghost" onClick={handleSkip} className="w-full text-muted-foreground">
              Skip tutorial
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
