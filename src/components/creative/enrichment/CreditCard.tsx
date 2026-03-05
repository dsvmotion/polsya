import type { EnrichmentCredit } from '@/types/enrichment-engine';
import { Progress } from '@/components/ui/progress';

interface CreditCardProps {
  credit: EnrichmentCredit;
}

export function CreditCard({ credit }: CreditCardProps) {
  const remaining = credit.totalCredits - credit.usedCredits;
  const percentage = credit.totalCredits > 0 ? (credit.usedCredits / credit.totalCredits) * 100 : 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize">{credit.provider}</h3>
        <span className="text-sm text-muted-foreground">
          {remaining.toLocaleString()} remaining
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{credit.usedCredits.toLocaleString()} / {credit.totalCredits.toLocaleString()} used</span>
        {credit.resetAt && (
          <span>Resets {new Date(credit.resetAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}
