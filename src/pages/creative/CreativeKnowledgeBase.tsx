import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceContainer } from '@/components/creative/layout/WorkspaceContainer';
import { DataTable } from '@/components/creative/shared/DataTable';
import { documentColumns } from '@/components/creative/documents/document-columns';
import { DocumentUploadSheet } from '@/components/creative/documents/DocumentUploadSheet';
import { useAiDocuments } from '@/hooks/useAiDocuments';
import { useAiUsage } from '@/hooks/useAiUsage';

export default function CreativeKnowledgeBase() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: documents = [], isLoading } = useAiDocuments();
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
      <div className="mt-2">
        <DataTable
          columns={documentColumns}
          data={documents}
          isLoading={isLoading}
          searchKey="title"
          searchPlaceholder="Search documents..."
        />
      </div>

      {budget && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>AI Credits:</span>
          <span className="font-medium text-foreground">
            {budget.remaining === null ? '\u221E' : `${budget.remaining} remaining`}
          </span>
          <span>({budget.creditsUsed} used{budget.monthlyCredits !== null ? ` of ${budget.monthlyCredits + budget.creditsPurchased}` : ''})</span>
        </div>
      )}

      <DocumentUploadSheet open={uploadOpen} onOpenChange={setUploadOpen} />
    </WorkspaceContainer>
  );
}
