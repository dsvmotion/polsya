import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_SOURCE_TYPES,
  DOCUMENT_STATUSES,
  DOCUMENT_SOURCE_LABELS,
  DOCUMENT_SOURCE_COLORS,
  DOCUMENT_STATUS_COLORS,
  AI_CREDIT_COSTS,
} from '@/types/ai-documents';
import type { AiBudget, AiDocument, DocumentSourceType } from '@/types/ai-documents';

// ---------------------------------------------------------------------------
// 1. Type maps and constants
// ---------------------------------------------------------------------------
describe('ai-documents type maps and constants', () => {
  it('DOCUMENT_SOURCE_TYPES contains exactly pdf, text, url', () => {
    expect([...DOCUMENT_SOURCE_TYPES]).toEqual(['pdf', 'text', 'url']);
  });

  it('DOCUMENT_STATUSES contains exactly pending, processing, ready, error', () => {
    expect([...DOCUMENT_STATUSES]).toEqual(['pending', 'processing', 'ready', 'error']);
  });

  it('DOCUMENT_SOURCE_LABELS has a label for every source type and labels are non-empty strings', () => {
    for (const src of DOCUMENT_SOURCE_TYPES) {
      const label = DOCUMENT_SOURCE_LABELS[src];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('DOCUMENT_SOURCE_COLORS has bg and text for every source type', () => {
    for (const src of DOCUMENT_SOURCE_TYPES) {
      expect(DOCUMENT_SOURCE_COLORS[src]).toHaveProperty('bg');
      expect(DOCUMENT_SOURCE_COLORS[src]).toHaveProperty('text');
    }
  });

  it('DOCUMENT_STATUS_COLORS has bg and text for every status', () => {
    for (const st of DOCUMENT_STATUSES) {
      expect(DOCUMENT_STATUS_COLORS[st]).toHaveProperty('bg');
      expect(DOCUMENT_STATUS_COLORS[st]).toHaveProperty('text');
    }
  });

  it('AI_CREDIT_COSTS has positive integer values for chat, rag_chat, document_ingest, url_ingest', () => {
    const keys: (keyof typeof AI_CREDIT_COSTS)[] = ['chat', 'rag_chat', 'document_ingest', 'url_ingest'];
    for (const k of keys) {
      const val = AI_CREDIT_COSTS[k];
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThan(0);
    }
  });

  it('label map keys match DOCUMENT_SOURCE_TYPES exactly (no extras, no missing)', () => {
    expect(Object.keys(DOCUMENT_SOURCE_LABELS).sort()).toEqual([...DOCUMENT_SOURCE_TYPES].sort());
  });

  it('source color map keys match DOCUMENT_SOURCE_TYPES exactly', () => {
    expect(Object.keys(DOCUMENT_SOURCE_COLORS).sort()).toEqual([...DOCUMENT_SOURCE_TYPES].sort());
  });

  it('status color map keys match DOCUMENT_STATUSES exactly', () => {
    expect(Object.keys(DOCUMENT_STATUS_COLORS).sort()).toEqual([...DOCUMENT_STATUSES].sort());
  });
});

// ---------------------------------------------------------------------------
// 2. AiBudget type contract
// ---------------------------------------------------------------------------
describe('AiBudget type contract', () => {
  it('allows unlimited credits (monthlyCredits: null, remaining: null)', () => {
    const budget: AiBudget = {
      monthlyCredits: null,
      creditsUsed: 100,
      creditsPurchased: 0,
      aiFeatures: ['chat', 'rag', 'documents'],
      remaining: null,
    };
    expect(budget.monthlyCredits).toBeNull();
    expect(budget.remaining).toBeNull();
  });

  it('allows limited credits', () => {
    const budget: AiBudget = {
      monthlyCredits: 500,
      creditsUsed: 150,
      creditsPurchased: 0,
      aiFeatures: ['chat'],
      remaining: 350,
    };
    expect(budget.monthlyCredits).toBe(500);
    expect(budget.remaining).toBe(350);
  });

  it('allows exhausted credits (remaining: 0)', () => {
    const budget: AiBudget = {
      monthlyCredits: 500,
      creditsUsed: 500,
      creditsPurchased: 0,
      aiFeatures: ['chat', 'rag'],
      remaining: 0,
    };
    expect(budget.remaining).toBe(0);
  });

  it('allows negative remaining (overuse)', () => {
    const budget: AiBudget = {
      monthlyCredits: 500,
      creditsUsed: 505,
      creditsPurchased: 0,
      aiFeatures: [],
      remaining: -5,
    };
    expect(budget.remaining).toBe(-5);
  });

  it('allows empty aiFeatures array', () => {
    const budget: AiBudget = {
      monthlyCredits: null,
      creditsUsed: 0,
      creditsPurchased: 0,
      aiFeatures: [],
      remaining: null,
    };
    expect(budget.aiFeatures).toEqual([]);
  });

  it('allows multiple aiFeatures', () => {
    const budget: AiBudget = {
      monthlyCredits: null,
      creditsUsed: 0,
      creditsPurchased: 0,
      aiFeatures: ['chat', 'rag', 'documents'],
      remaining: null,
    };
    expect(budget.aiFeatures).toEqual(['chat', 'rag', 'documents']);
  });
});

// ---------------------------------------------------------------------------
// 3. chunkText pure function
// ---------------------------------------------------------------------------

// Mirror of chunkText from supabase/functions/ai-document-ingest/index.ts
const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  if (!text.trim()) return chunks;

  // Split on paragraph boundaries first
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (currentChunk.length + trimmedPara.length + 2 <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        // Overlap: keep the tail of the previous chunk
        const overlapStart = Math.max(0, currentChunk.length - CHUNK_OVERLAP);
        currentChunk = currentChunk.slice(overlapStart) + '\n\n' + trimmedPara;
      } else {
        // Single paragraph larger than chunk size — split on sentences
        const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= CHUNK_SIZE) {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              const overlapStart = Math.max(0, currentChunk.length - CHUNK_OVERLAP);
              currentChunk = currentChunk.slice(overlapStart) + ' ' + sentence;
            } else {
              // Single sentence larger than chunk — force push
              currentChunk = sentence.slice(0, CHUNK_SIZE);
              if (sentence.length > CHUNK_SIZE) {
                chunks.push(currentChunk);
                currentChunk = sentence.slice(CHUNK_SIZE - CHUNK_OVERLAP);
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

describe('chunkText', () => {
  it('returns empty array for empty string', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    expect(chunkText('   \n\n  \t  ')).toEqual([]);
  });

  it('returns single chunk for short text under CHUNK_SIZE', () => {
    const shortText = 'This is a short piece of text.';
    const chunks = chunkText(shortText);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(shortText);
  });

  it('keeps multiple paragraphs that fit in one chunk as a single chunk', () => {
    const para1 = 'First paragraph.';
    const para2 = 'Second paragraph.';
    const para3 = 'Third paragraph.';
    const text = `${para1}\n\n${para2}\n\n${para3}`;
    const chunks = chunkText(text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain(para1);
    expect(chunks[0]).toContain(para2);
    expect(chunks[0]).toContain(para3);
  });

  it('splits long text into multiple chunks', () => {
    // Create text that exceeds CHUNK_SIZE with multiple paragraphs
    const paragraph = 'A'.repeat(800);
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}\n\n${paragraph}`;
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('produces overlapping chunks (tail of previous appears at start of next)', () => {
    // Create two paragraphs that individually fit but together exceed CHUNK_SIZE
    const para1 = 'Word '.repeat(300).trim(); // ~1500 chars
    const para2 = 'Text '.repeat(200).trim(); // ~1000 chars
    const text = `${para1}\n\n${para2}`;
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    // The algorithm takes slice(overlapStart) of the previous chunk and prepends
    // it to the next chunk. The final chunk gets .trim(). So the overlap content
    // (trimmed) should appear at the start of the second chunk.
    const overlapStart = Math.max(0, chunks[0].length - CHUNK_OVERLAP);
    const overlapSlice = chunks[0].slice(overlapStart).trim();
    expect(chunks[1].startsWith(overlapSlice)).toBe(true);
  });

  it('chunks a very long single paragraph (no paragraph breaks) on sentence boundaries', () => {
    // Build a single paragraph of many sentences that exceeds CHUNK_SIZE
    const sentence = 'This is a sentence that contains some content. ';
    const longParagraph = sentence.repeat(80); // ~3840 chars, well over CHUNK_SIZE
    const chunks = chunkText(longParagraph);
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should not exceed CHUNK_SIZE by much (overlap from previous is added)
    // The first chunk should be within CHUNK_SIZE
    expect(chunks[0].length).toBeLessThanOrEqual(CHUNK_SIZE);
  });
});

// ---------------------------------------------------------------------------
// 4. Credit exhaustion logic
// ---------------------------------------------------------------------------

function isCreditsExhausted(remaining: number | null | undefined): boolean {
  return remaining !== null && remaining !== undefined && remaining <= 0;
}

describe('isCreditsExhausted', () => {
  it('returns false for null (unlimited)', () => {
    expect(isCreditsExhausted(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isCreditsExhausted(undefined)).toBe(false);
  });

  it('returns false for positive remaining (100)', () => {
    expect(isCreditsExhausted(100)).toBe(false);
  });

  it('returns false for remaining = 1', () => {
    expect(isCreditsExhausted(1)).toBe(false);
  });

  it('returns true for remaining = 0', () => {
    expect(isCreditsExhausted(0)).toBe(true);
  });

  it('returns true for negative remaining (-5)', () => {
    expect(isCreditsExhausted(-5)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. toAiDocument mapper
// ---------------------------------------------------------------------------

// Mirror of AiDocumentRow from src/hooks/useAiDocuments.ts
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

// Mirror of toAiDocument from src/hooks/useAiDocuments.ts
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

describe('toAiDocument mapper', () => {
  const baseRow: AiDocumentRow = {
    id: 'doc-001',
    organization_id: 'org-123',
    title: 'Test Document',
    source_type: 'pdf',
    source_url: 'org-123/file.pdf',
    file_size_bytes: 1024,
    status: 'ready',
    error_message: null,
    chunk_count: 5,
    metadata: { word_count: 500 },
    created_by: 'user-456',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  };

  it('maps all snake_case fields to camelCase correctly', () => {
    const doc = toAiDocument(baseRow);
    expect(doc.id).toBe('doc-001');
    expect(doc.organizationId).toBe('org-123');
    expect(doc.title).toBe('Test Document');
    expect(doc.sourceType).toBe('pdf');
    expect(doc.sourceUrl).toBe('org-123/file.pdf');
    expect(doc.fileSizeBytes).toBe(1024);
    expect(doc.status).toBe('ready');
    expect(doc.errorMessage).toBeNull();
    expect(doc.chunkCount).toBe(5);
    expect(doc.metadata).toEqual({ word_count: 500 });
    expect(doc.createdBy).toBe('user-456');
    expect(doc.createdAt).toBe('2026-01-01T00:00:00Z');
    expect(doc.updatedAt).toBe('2026-01-02T00:00:00Z');
  });

  it('preserves null values for optional fields', () => {
    const row: AiDocumentRow = {
      ...baseRow,
      source_url: null,
      file_size_bytes: null,
      error_message: null,
    };
    const doc = toAiDocument(row);
    expect(doc.sourceUrl).toBeNull();
    expect(doc.fileSizeBytes).toBeNull();
    expect(doc.errorMessage).toBeNull();
  });

  it('handles all status values correctly', () => {
    for (const status of DOCUMENT_STATUSES) {
      const doc = toAiDocument({ ...baseRow, status });
      expect(doc.status).toBe(status);
    }
  });

  it('handles all source_type values correctly', () => {
    for (const sourceType of DOCUMENT_SOURCE_TYPES) {
      const doc = toAiDocument({ ...baseRow, source_type: sourceType });
      expect(doc.sourceType).toBe(sourceType);
    }
  });

  it('maps error status with error_message', () => {
    const row: AiDocumentRow = {
      ...baseRow,
      status: 'error',
      error_message: 'PDF extraction failed',
    };
    const doc = toAiDocument(row);
    expect(doc.status).toBe('error');
    expect(doc.errorMessage).toBe('PDF extraction failed');
  });

  it('maps a url source_type row correctly', () => {
    const row: AiDocumentRow = {
      ...baseRow,
      source_type: 'url',
      source_url: 'https://example.com/article',
      file_size_bytes: null,
    };
    const doc = toAiDocument(row);
    expect(doc.sourceType).toBe('url');
    expect(doc.sourceUrl).toBe('https://example.com/article');
    expect(doc.fileSizeBytes).toBeNull();
  });
});
