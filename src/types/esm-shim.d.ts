declare module 'https://esm.sh/@supabase/supabase-js@2' {
  interface SupabaseQueryBuilder {
    select: (...args: unknown[]) => SupabaseQueryBuilder;
    eq: (...args: unknown[]) => SupabaseQueryBuilder;
    order: (...args: unknown[]) => SupabaseQueryBuilder;
    limit: (...args: unknown[]) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
  }

  export interface SupabaseClient {
    from: (...args: unknown[]) => SupabaseQueryBuilder;
  }
}
