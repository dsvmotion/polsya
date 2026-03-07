import type { CreativeProject } from '@/types/creative';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';

interface ProjectCardProps {
  project: CreativeProject;
  clientName?: string;
  onClick?: () => void;
}

export function ProjectCard({ project, clientName, onClick }: ProjectCardProps) {
  const statusColors = PROJECT_STATUS_COLORS[project.status];
  const budget = project.budgetCents != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency ?? 'USD' }).format(project.budgetCents / 100)
    : null;

  return (
    <div
      className="rounded-xl border border-border border-t-2 border-t-primary/40 bg-card p-4 space-y-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate">{project.name}</h3>
          {clientName && <p className="text-xs text-muted-foreground truncate">{clientName}</p>}
        </div>
        <Badge variant="secondary" className={`${statusColors.bg} ${statusColors.text} border-0 shrink-0 ml-2 rounded-full px-2 py-0.5 text-xs`}>
          {PROJECT_STATUS_LABELS[project.status]}
        </Badge>
      </div>
      {project.startDate && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(project.startDate).toLocaleDateString()}
            {project.endDate ? ` — ${new Date(project.endDate).toLocaleDateString()}` : ''}
          </span>
        </div>
      )}
      {budget && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          <span>{budget}</span>
        </div>
      )}
    </div>
  );
}
