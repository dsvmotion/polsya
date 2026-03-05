/**
 * Typed helpers for querying Supabase tables/RPCs that aren't in the
 * auto-generated Database type.  This centralises the single unavoidable
 * `any` cast so every hook file stays lint-clean.
 */
import { supabase } from './client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fromTable = (table: string) => (supabase.from as any)(table);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rpcCall = (fn: string, params: Record<string, unknown>) => (supabase.rpc as any)(fn, params);
