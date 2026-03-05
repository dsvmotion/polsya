import type { CreativePortfolio } from '@/types/creative';
import { PORTFOLIO_CATEGORY_LABELS, PORTFOLIO_CATEGORY_COLORS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, ImageOff } from 'lucide-react';

interface PortfolioCardProps {
  portfolio: CreativePortfolio;
  onClick?: () => void;
}

export function PortfolioCard({ portfolio, onClick }: PortfolioCardProps) {
  return (
    <div
      className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {portfolio.thumbnailUrl ? (
          <img
            src={portfolio.thumbnailUrl}
            alt={portfolio.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ImageOff className="h-8 w-8 text-muted-foreground/40" />
        )}
      </div>
      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm truncate">{portfolio.title}</h3>
          {portfolio.isPublic ? (
            <Globe className="h-3.5 w-3.5 text-green-600 shrink-0" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
        {portfolio.category && (
          <Badge
            variant="secondary"
            className={`text-xs ${PORTFOLIO_CATEGORY_COLORS[portfolio.category].bg} ${PORTFOLIO_CATEGORY_COLORS[portfolio.category].text} border-0`}
          >
            {PORTFOLIO_CATEGORY_LABELS[portfolio.category]}
          </Badge>
        )}
      </div>
    </div>
  );
}
