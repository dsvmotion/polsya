import { summarizePipeline, type OpportunityInput } from '@/services/pipelineService';

export interface PharmacyRow {
  id: string;
  commercial_status: string;
  /** DB column name - Supabase returns this */
  client_type?: string;
  /** BusinessEntity field - use when available */
  typeKey?: string;
}

export interface OpportunityRow extends OpportunityInput {
  id: string;
  pharmacy_id: string;
  created_at: string;
}

export interface DocumentRow {
  pharmacy_id: string;
  uploaded_at: string;
}

export interface DashboardKpis {
  pipelineTotal: number;
  weightedForecast: number;
  atRiskCount: number;
  activeClientsCount: number;
  conversionRate: number;
}

const CONVERSION_STATUSES = new Set([
  'contacted',
  'qualified',
  'proposal',
  'client',
]);

export const STALE_THRESHOLD_MS = 60 * 24 * 60 * 60 * 1000;

/** Row that has a type identifier (typeKey on BusinessEntity or client_type from DB) */
type EntityTypeRow = { typeKey?: string; client_type?: string };

export function filterEntitiesByTypeKey<T extends EntityTypeRow>(
  entities: readonly T[],
  entityTypeKey: string,
): T[] {
  if (entityTypeKey === 'all') return entities as T[];
  return entities.filter((e) => (e.typeKey ?? e.client_type) === entityTypeKey);
}

/** @deprecated Use filterEntitiesByTypeKey. Re-exported for backward compatibility. */
export const filterPharmaciesByClientType = filterEntitiesByTypeKey;

export function filterOpportunitiesByTimeRange(
  opportunities: readonly OpportunityRow[],
  cutoffIso: string | null,
): OpportunityRow[] {
  if (!cutoffIso) return opportunities as OpportunityRow[];
  return opportunities.filter((o) => o.created_at >= cutoffIso);
}

export function filterOpportunitiesByPharmacyIds(
  opportunities: readonly OpportunityRow[],
  pharmacyIds: ReadonlySet<string>,
): OpportunityRow[] {
  return opportunities.filter((o) => pharmacyIds.has(o.pharmacy_id));
}

export function computeConversionRate(pharmacies: readonly PharmacyRow[]): number {
  let eligible = 0;
  let converted = 0;
  for (const p of pharmacies) {
    if (CONVERSION_STATUSES.has(p.commercial_status)) {
      eligible++;
      if (p.commercial_status === 'client') converted++;
    }
  }
  return eligible > 0 ? (converted / eligible) * 100 : 0;
}

export function countActiveClients(pharmacies: readonly PharmacyRow[]): number {
  let count = 0;
  for (const p of pharmacies) {
    if (p.commercial_status === 'client') count++;
  }
  return count;
}

export function computeAtRiskCount(
  clientIds: readonly string[],
  documents: readonly DocumentRow[],
  nowMs: number = Date.now(),
): number {
  if (clientIds.length === 0) return 0;

  const latestByPharmacy = new Map<string, string>();
  for (const doc of documents) {
    if (!latestByPharmacy.has(doc.pharmacy_id)) {
      latestByPharmacy.set(doc.pharmacy_id, doc.uploaded_at);
    }
  }

  let atRisk = 0;
  for (const cid of clientIds) {
    const latest = latestByPharmacy.get(cid);
    if (!latest || nowMs - new Date(latest).getTime() > STALE_THRESHOLD_MS) {
      atRisk++;
    }
  }
  return atRisk;
}

export interface ComputeKpisInput {
  pharmacies: readonly PharmacyRow[];
  opportunities: readonly OpportunityRow[];
  documents: readonly DocumentRow[];
  entityTypeKey: string;
  cutoffIso: string | null;
  nowMs?: number;
}

export function computeDashboardKpis(input: ComputeKpisInput): DashboardKpis {
  const filteredPharmacies = filterEntitiesByTypeKey(input.pharmacies, input.entityTypeKey);
  const pharmIds = new Set(filteredPharmacies.map((p) => p.id));

  let filteredOpps = filterOpportunitiesByTimeRange(input.opportunities, input.cutoffIso);
  if (input.entityTypeKey !== 'all') {
    filteredOpps = filterOpportunitiesByPharmacyIds(filteredOpps, pharmIds);
  }

  const pipeline = summarizePipeline(filteredOpps);
  const activeClientsCount = countActiveClients(filteredPharmacies);
  const conversionRate = computeConversionRate(filteredPharmacies);

  const clientIds = filteredPharmacies
    .filter((p) => p.commercial_status === 'client')
    .map((p) => p.id);

  const relevantDocs = clientIds.length > 0
    ? input.documents.filter((d) => pharmIds.has(d.pharmacy_id))
    : [];

  const atRiskCount = computeAtRiskCount(clientIds, relevantDocs, input.nowMs);

  return {
    pipelineTotal: pipeline.totalPipeline,
    weightedForecast: pipeline.weightedForecast,
    atRiskCount,
    activeClientsCount,
    conversionRate,
  };
}
