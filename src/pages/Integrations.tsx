import { IntegrationsCard } from '@/components/dashboard/IntegrationsCard';
import { IntegrationHealthCard } from '@/components/dashboard/IntegrationHealthCard';
import { AgentActionsCard } from '@/components/dashboard/AgentActionsCard';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

export default function IntegrationsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect your tools and manage data sync pipelines.
        </p>
      </div>

      <ErrorBoundary section="integrations">
        <IntegrationsCard />
      </ErrorBoundary>

      <ErrorBoundary section="integration-health">
        <IntegrationHealthCard />
      </ErrorBoundary>

      <ErrorBoundary section="agent-actions">
        <AgentActionsCard />
      </ErrorBoundary>
    </div>
  );
}
