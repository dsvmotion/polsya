import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/integrations/supabase/helpers';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrganization } from '@/hooks/useOrganizationContext';
import type { AiDocument, DocumentSourceType } from '@/types/ai-documents';
import { logger } from '@/lib/logger';

interface AiDocumentRow {
  id: string;
  organization_id: string;
  title: string;
  source_type: string;
  source_url: string | null;
  file_size_bytes: number | null;
  status: string;
  error_message: string | null;
  chunk_count: number;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function toAiDocument(row: AiDocumentRow): AiDocument {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    sourceType: row.source_type as DocumentSourceType,
    sourceUrl: row.source_url,
    fileSizeBytes: row.file_size_bytes,
    status: row.status as AiDocument['status'],
    errorMessage: row.error_message,
    chunkCount: row.chunk_count,
    metadata: row.metadata,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const documentKeys = {
  all: (orgId: string) => ['ai-documents', orgId] as const,
  single: (docId: string) => ['ai-documents', 'detail', docId] as const,
};

export function useAiDocuments() {
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useQuery<AiDocument[]>({
    queryKey: documentKeys.all(orgId ?? ''),
    queryFn: async () => {
      const { data, error } = await fromTable('ai_documents')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as AiDocumentRow[]).map(toAiDocument);
    },
    enabled: !!orgId,
  });
}

export function useDocumentStatus(documentId: string | null) {
  return useQuery<AiDocument>({
    queryKey: documentKeys.single(documentId ?? ''),
    queryFn: async () => {
      const { data, error } = await fromTable('ai_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      if (error) throw error;
      return toAiDocument(data as AiDocumentRow);
    },
    enabled: !!documentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });
}

export interface UploadDocumentInput {
  title: string;
  sourceType: DocumentSourceType;
  file?: File;
  textContent?: string;
  url?: string;
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { membership } = useCurrentOrganization();
  const orgId = membership?.organization_id;

  return useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      if (!orgId) throw new Error('No organization');

      let sourceUrl: string | null = null;
      let fileSizeBytes: number | null = null;
      const metadata: Record<string, unknown> = {};

      // Upload file to Storage if PDF/file
      if (input.sourceType === 'pdf' && input.file) {
        const filePath = `${orgId}/${Date.now()}-${input.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('ai-documents')
          .upload(filePath, input.file);
        if (uploadError) throw uploadError;
        sourceUrl = filePath;
        fileSizeBytes = input.file.size;
      } else if (input.sourceType === 'text') {
        metadata.raw_content = input.textContent;
      } else if (input.sourceType === 'url') {
        sourceUrl = input.url ?? null;
      }

      // Create document row
      const { data, error } = await fromTable('ai_documents')
        .insert({
          organization_id: orgId,
          title: input.title,
          source_type: input.sourceType,
          source_url: sourceUrl,
          file_size_bytes: fileSizeBytes,
          status: 'pending',
          metadata,
          created_by: membership?.user_id,
        })
        .select('*')
        .single();
      if (error) throw error;

      // Trigger ingestion edge function
      const { error: fnError } = await supabase.functions.invoke('ai-document-ingest', {
        body: { document_id: (data as AiDocumentRow).id },
      });
      if (fnError) {
        logger.error('Ingest trigger failed:', fnError);
        // Document stays in pending — user can retry
      }

      return toAiDocument(data as AiDocumentRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: AiDocument) => {
      // Delete storage file if exists
      if (doc.sourceUrl && doc.sourceType === 'pdf') {
        await supabase.storage.from('ai-documents').remove([doc.sourceUrl]);
      }
      const { error } = await fromTable('ai_documents')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-documents'] });
    },
  });
}
