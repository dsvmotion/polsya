import { useState } from 'react';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { DataTable } from '@/components/creative/shared/DataTable';
import { documentColumns } from '@/components/creative/documents/document-columns';
import { DocumentUploadSheet } from '@/components/creative/documents/DocumentUploadSheet';
import { useAiDocuments } from '@/hooks/useAiDocuments';
import { useAiUsage } from '@/hooks/useAiUsage';
import { getErrorMessage } from '@/lib/utils';

export default function CreativeKnowledgeBase() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: documents = [], isLoading, error, refetch } = useAiDocuments();
  const { data: budget } = useAiUsage();

  return (
    <WorkspaceContainer
      title="Knowledge Base"
      description="Upload and manage documents for AI-powered search"
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Document</span>
        </Button>
      }
    >
      {error ? (
        <div className="flex flex-col items-center justify-center py-12 text-sm text-destructive gap-3">
          <AlertCircle className="h-8 w-8 opacity-60" />
          <p>Failed to load documents: {getErrorMessage(error)}</p>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      ) : (
      <div className="mt-2">
        <DataTable
          columns={documentColumns}
          data={documents}
          isLoading={isLoading}
          searchKey="title"
          searchPlaceholder="Search documents..."
        />
      </div>
      )}

      {budget && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>AI Credits:</span>
          <span className="font-medium text-foreground">
            {budget.remaining === null ? '∞' : `${Math.max(0, budget.remaining)} remaining`}
          </span>
          <span>({budget.creditsUsed} used{budget.monthlyCredits !== null ? ` of ${budget.monthlyCredits + budget.creditsPurchased}` : ''})</span>
        </div>
      )}

      <DocumentUploadSheet open={uploadOpen} onOpenChange={setUploadOpen} />
    </WorkspaceContainer>
  );
}
