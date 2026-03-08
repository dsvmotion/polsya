import { describe, it, expect } from 'vitest';
import {
  toIngestionProvider,
  toIngestionProviders,
  toIngestionRun,
  toIngestionRuns,
  toIngestionJob,
  toIngestionJobs,
  type IngestionProviderRow,
  type IngestionRunRow,
  type IngestionJobRow,
} from '@/services/ingestionService';

/* ─── Factories ─── */

const makeProviderRow = (o: Partial<IngestionProviderRow> = {}): IngestionProviderRow => ({
  id: 'ip-1',
  organization_id: 'org-1',
  provider_type: 'woocommerce',
  name: 'Main WooCommerce',
  config: { url: 'https://shop.example.com' },
  credentials_encrypted: 'enc-xyz',
  is_active: true,
  last_sync_at: '2025-06-01T00:00:00Z',
  sync_frequency_minutes: 30,
  metadata: {},
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...o,
});

const makeRunRow = (o: Partial<IngestionRunRow> = {}): IngestionRunRow => ({
  id: 'ir-1',
  organization_id: 'org-1',
  provider_id: 'ip-1',
  status: 'completed',
  started_at: '2025-06-01T10:00:00Z',
  completed_at: '2025-06-01T10:05:00Z',
  records_processed: 100,
  records_created: 80,
  records_updated: 15,
  records_failed: 5,
  error_log: [{ msg: 'duplicate' }],
  metadata: {},
  created_at: '2025-06-01T10:00:00Z',
  updated_at: '2025-06-01T10:05:00Z',
  ...o,
});

const makeJobRow = (o: Partial<IngestionJobRow> = {}): IngestionJobRow => ({
  id: 'ij-1',
  run_id: 'ir-1',
  organization_id: 'org-1',
  job_type: 'import',
  status: 'completed',
  input_data: { source: 'csv' },
  output_data: { count: 50 },
  error_message: null,
  attempts: 1,
  max_attempts: 3,
  started_at: '2025-06-01T10:00:00Z',
  completed_at: '2025-06-01T10:01:00Z',
  created_at: '2025-06-01T10:00:00Z',
  updated_at: '2025-06-01T10:01:00Z',
  ...o,
});

/* ─── Tests ─── */

describe('ingestionService', () => {
  describe('toIngestionProvider', () => {
    it('maps all fields', () => {
      const result = toIngestionProvider(makeProviderRow());
      expect(result.id).toBe('ip-1');
      expect(result.providerType).toBe('woocommerce');
      expect(result.name).toBe('Main WooCommerce');
      expect(result.config).toEqual({ url: 'https://shop.example.com' });
      expect(result.isActive).toBe(true);
      expect(result.syncFrequencyMinutes).toBe(30);
    });

    it('defaults nullish config/metadata to empty objects', () => {
      const row = makeProviderRow();
      (row as unknown as Record<string, unknown>).config = null;
      (row as unknown as Record<string, unknown>).metadata = null;
      const result = toIngestionProvider(row);
      expect(result.config).toEqual({});
      expect(result.metadata).toEqual({});
    });

    it('defaults nullish is_active to true', () => {
      const row = makeProviderRow();
      (row as unknown as Record<string, unknown>).is_active = null;
      expect(toIngestionProvider(row).isActive).toBe(true);
    });

    it('defaults nullish sync_frequency_minutes to 60', () => {
      const row = makeProviderRow();
      (row as unknown as Record<string, unknown>).sync_frequency_minutes = null;
      expect(toIngestionProvider(row).syncFrequencyMinutes).toBe(60);
    });
  });

  describe('toIngestionProviders', () => {
    it('maps array', () => {
      expect(toIngestionProviders([makeProviderRow(), makeProviderRow()])).toHaveLength(2);
    });

    it('returns empty for empty input', () => {
      expect(toIngestionProviders([])).toEqual([]);
    });
  });

  describe('toIngestionRun', () => {
    it('maps all fields', () => {
      const result = toIngestionRun(makeRunRow());
      expect(result.providerId).toBe('ip-1');
      expect(result.status).toBe('completed');
      expect(result.recordsProcessed).toBe(100);
      expect(result.recordsCreated).toBe(80);
      expect(result.recordsUpdated).toBe(15);
      expect(result.recordsFailed).toBe(5);
      expect(result.errorLog).toEqual([{ msg: 'duplicate' }]);
    });

    it('defaults nullish numeric fields to 0', () => {
      const row = makeRunRow();
      (row as unknown as Record<string, unknown>).records_processed = null;
      (row as unknown as Record<string, unknown>).records_created = null;
      (row as unknown as Record<string, unknown>).records_updated = null;
      (row as unknown as Record<string, unknown>).records_failed = null;
      const result = toIngestionRun(row);
      expect(result.recordsProcessed).toBe(0);
      expect(result.recordsCreated).toBe(0);
      expect(result.recordsUpdated).toBe(0);
      expect(result.recordsFailed).toBe(0);
    });

    it('defaults nullish error_log to empty array', () => {
      const row = makeRunRow();
      (row as unknown as Record<string, unknown>).error_log = null;
      expect(toIngestionRun(row).errorLog).toEqual([]);
    });
  });

  describe('toIngestionRuns', () => {
    it('maps array', () => {
      expect(toIngestionRuns([makeRunRow()])).toHaveLength(1);
    });
  });

  describe('toIngestionJob', () => {
    it('maps all fields', () => {
      const result = toIngestionJob(makeJobRow());
      expect(result.runId).toBe('ir-1');
      expect(result.jobType).toBe('import');
      expect(result.status).toBe('completed');
      expect(result.inputData).toEqual({ source: 'csv' });
      expect(result.outputData).toEqual({ count: 50 });
      expect(result.attempts).toBe(1);
      expect(result.maxAttempts).toBe(3);
    });

    it('defaults nullish data fields', () => {
      const row = makeJobRow();
      (row as unknown as Record<string, unknown>).input_data = null;
      (row as unknown as Record<string, unknown>).output_data = null;
      (row as unknown as Record<string, unknown>).attempts = null;
      (row as unknown as Record<string, unknown>).max_attempts = null;
      const result = toIngestionJob(row);
      expect(result.inputData).toEqual({});
      expect(result.outputData).toEqual({});
      expect(result.attempts).toBe(0);
      expect(result.maxAttempts).toBe(3);
    });
  });

  describe('toIngestionJobs', () => {
    it('maps array', () => {
      expect(toIngestionJobs([makeJobRow(), makeJobRow()])).toHaveLength(2);
    });
  });
});
