// Domain types for AI knowledge base documents and usage.

export const DOCUMENT_SOURCE_TYPES = ['pdf', 'text', 'url'] as const;
export type DocumentSourceType = (typeof DOCUMENT_SOURCE_TYPES)[number];

export const DOCUMENT_STATUSES = ['pending', 'processing', 'ready', 'error'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_SOURCE_LABELS: Record<DocumentSourceType, string> = {
  pdf: 'PDF',
  text: 'Text',
  url: 'URL',
};

export const DOCUMENT_SOURCE_COLORS: Record<DocumentSourceType, { bg: string; text: string }> = {
  pdf: { bg: 'bg-red-100', text: 'text-red-800' },
  text: { bg: 'bg-blue-100', text: 'text-blue-800' },
  url: { bg: 'bg-green-100', text: 'text-green-800' },
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  ready: { bg: 'bg-green-100', text: 'text-green-800' },
  error: { bg: 'bg-red-100', text: 'text-red-800' },
};

export interface AiDocument {
  id: string;
  organizationId: string;
  title: string;
  sourceType: DocumentSourceType;
  sourceUrl: string | null;
  fileSizeBytes: number | null;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiUsageMonthly {
  organizationId: string;
  period: string;
  creditsUsed: number;
  creditsPurchased: number;
  operationBreakdown: Record<string, number>;
}

export interface AiBudget {
  monthlyCredits: number | null; // null = unlimited
  creditsUsed: number;
  creditsPurchased: number;
  aiFeatures: string[];
  remaining: number | null; // null = unlimited
}

// Credit costs per operation
export const AI_CREDIT_COSTS = {
  chat: 1,
  rag_chat: 2,
  document_ingest: 5,
  url_ingest: 5,
} as const;
