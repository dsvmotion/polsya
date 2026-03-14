import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DetailedOrder, EntityWithOrders, EntityDocument } from '@/types/operations';
import { type BusinessEntity } from '@/types/entity';
import { type EntityTypeKey } from '@/types/entity';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import { toBusinessEntities } from '@/services/entityService';
import { logger } from '@/lib/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function useDetailedOrders() {
  return useQuery({
    queryKey: ['detailed-orders'],
    queryFn: async (): Promise<DetailedOrder[]> => {
      const headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      const response = await fetch(`${SUPABASE_URL}/functions/v1/woocommerce-orders-detailed`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json();
          const code = body.code ? ` [${body.code}]` : '';
          const page = body.page ? ` (page ${body.page})` : '';
          detail = `WooCommerce API failed${code}${page}: ${body.error || response.status}`;
        } catch {
          detail = `Failed to fetch detailed orders: ${response.status}`;
        }
        logger.error(detail);
        throw new Error(detail);
      }

      const data = await response.json();
      return data.orders || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEntityDocuments() {
  return useQuery({
    queryKey: ['pharmacy-documents'],
    queryFn: async (): Promise<EntityDocument[]> => {
      const { data, error } = await supabase
        .from('pharmacy_order_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        logger.error('Error fetching documents:', error);
        throw new Error(`Error fetching documents: ${error.message}`);
      }

      return (data || []).map(doc => ({
        id: doc.id,
        pharmacyId: doc.pharmacy_id,
        orderId: doc.order_id ?? null,
        documentType: doc.document_type as EntityDocument['documentType'],
        filePath: doc.file_path,
        fileName: doc.file_name,
        uploadedAt: doc.uploaded_at,
        notes: doc.notes,
      }));
    },
  });
}

type EntityOperationsFilters = {
  country?: string;
  province?: string;
  city?: string;
  commercialStatus?: string;
  paymentStatus?: string;
  search?: string;
  clientType?: EntityTypeKey;
};

const DB_SORT_COLUMNS: Record<string, string> = {
  name: 'name',
  address: 'address',
  postal_code: 'postal_code',
  city: 'city',
  province: 'province',
  autonomous_community: 'autonomous_community',
  phone: 'phone',
  secondary_phone: 'secondary_phone',
  email: 'email',
  activity: 'activity',
  subsector: 'subsector',
  legal_form: 'legal_form',
  commercialStatus: 'commercial_status',
};

export function useEntityOperations(
  filters?: EntityOperationsFilters,
  page: number = 0,
  pageSize: number = 50,
  sortField: string = 'name',
  sortDirection: 'asc' | 'desc' = 'asc'
) {
  const hasPaymentFilter = !!(filters?.paymentStatus && filters.paymentStatus !== 'all');
  const dbColumn = DB_SORT_COLUMNS[sortField];

  const {
    data: pageData = { pharmacies: [] as BusinessEntity[], totalCount: 0 },
    isLoading: pharmaciesLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pharmacy-operations', filters ?? {}, page, pageSize, sortField, sortDirection],
    queryFn: async (): Promise<{ pharmacies: BusinessEntity[]; totalCount: number }> => {
      let query = supabase
        .from('pharmacies')
        .select('*', { count: 'exact' })
        .not('saved_at', 'is', null);

      if (filters?.clientType) query = query.eq('client_type', filters.clientType as never);
      if (filters?.country) query = query.ilike('country', filters.country);
      if (filters?.province) query = query.ilike('province', filters.province);
      if (filters?.city) query = query.ilike('city', filters.city);
      if (filters?.commercialStatus && filters.commercialStatus !== 'all') {
        query = query.eq('commercial_status', filters.commercialStatus as never);
      }
      if (filters?.search) {
        const escaped = filters.search.replace(/[%_.(),"\\]/g, '\\$&');
        query = query.or(`name.ilike.%${escaped}%,address.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
      }

      if (dbColumn) {
        query = query.order(dbColumn, { ascending: sortDirection === 'asc' });
      } else {
        query = query.order('name', { ascending: true });
      }

      if (!hasPaymentFilter) {
        query = query.range(page * pageSize, (page + 1) * pageSize - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        pharmacies: toBusinessEntities((data || []) as never[]),
        totalCount: count ?? 0,
      };
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useDetailedOrders();

  const pageIds = pageData.pharmacies.map(p => p.id);

  const { data: docSummaryMap = new Map<string, { count: number; hasInvoice: boolean; hasReceipt: boolean }>(), isLoading: docsLoading } = useQuery({
    queryKey: ['pharmacy-doc-summary', pageIds],
    enabled: pageIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_order_documents')
        .select('pharmacy_id, document_type')
        .in('pharmacy_id', pageIds);

      if (error) throw new Error(`Error fetching doc summary: ${error.message}`);

      const map = new Map<string, { count: number; hasInvoice: boolean; hasReceipt: boolean }>();
      for (const row of data || []) {
        const entry = map.get(row.pharmacy_id) ?? { count: 0, hasInvoice: false, hasReceipt: false };
        entry.count++;
        if (row.document_type === 'invoice') entry.hasInvoice = true;
        if (row.document_type === 'receipt') entry.hasReceipt = true;
        map.set(row.pharmacy_id, entry);
      }
      return map;
    },
  });

  let pharmaciesWithOrders: EntityWithOrders[] = pageData.pharmacies.map((pharmacy) => {
    let pharmacyOrders: DetailedOrder[] = [];

    if (pharmacy.status === 'client') {
      pharmacyOrders = orders.filter(order => {
        const orderName = order.customerName.toLowerCase().trim();
        const pharmacyName = pharmacy.name.toLowerCase().trim();

        if (orderName === pharmacyName) return true;

        const minLength = Math.min(orderName.length, pharmacyName.length);
        const maxLength = Math.max(orderName.length, pharmacyName.length);
        if (minLength / maxLength < 0.8) return false;

        return orderName.includes(pharmacyName) || pharmacyName.includes(orderName);
      });
    }

    const sortedOrders = [...pharmacyOrders].sort(
      (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );

    const lastOrder = sortedOrders.length > 0 ? sortedOrders[0] : null;
    const totalRevenue = pharmacyOrders.reduce((sum, o) => sum + o.amount, 0);

    const docInfo = docSummaryMap.get(pharmacy.id);
    const documentCount = docInfo?.count ?? 0;
    const hasInvoice = docInfo?.hasInvoice ?? false;
    const hasReceipt = docInfo?.hasReceipt ?? false;

    return {
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      province: pharmacy.region,
      country: pharmacy.country,
      clientType: pharmacy.typeKey || 'pharmacy',
      phone: pharmacy.phone,
      email: pharmacy.email,
      commercialStatus: pharmacy.status,
      notes: pharmacy.notes,
      orders: sortedOrders,
      lastOrder,
      totalRevenue,
      hasInvoice,
      hasReceipt,
      documentCount,
      lat: pharmacy.lat,
      lng: pharmacy.lng,
      savedAt: pharmacy.savedAt ?? null,
      postal_code: pharmacy.attributes.postalCode ?? null,
      autonomous_community: pharmacy.attributes.autonomousCommunity ?? null,
      secondary_phone: pharmacy.attributes.secondaryPhone ?? null,
      activity: pharmacy.attributes.activity ?? null,
      subsector: pharmacy.attributes.subsector ?? null,
      legal_form: pharmacy.attributes.legalForm ?? null,
    };
  });

  if (hasPaymentFilter) {
    pharmaciesWithOrders = pharmaciesWithOrders.filter(
      (pharmacy) => pharmacy.lastOrder?.paymentStatus === filters!.paymentStatus
    );
  }

  // When paymentStatus is active the full set was fetched (no SQL range), so
  // totalCount and pagination must be computed from the filtered result.
  const finalTotalCount = hasPaymentFilter ? pharmaciesWithOrders.length : pageData.totalCount;
  const finalPharmacies = hasPaymentFilter
    ? pharmaciesWithOrders.slice(page * pageSize, (page + 1) * pageSize)
    : pharmaciesWithOrders;

  return {
    pharmacies: finalPharmacies,
    totalCount: finalTotalCount,
    isLoading: pharmaciesLoading || ordersLoading || docsLoading,
    error,
    refetch,
  };
}

export function useEntitiesWithOrders(savedOnly: boolean = true, clientType?: EntityTypeKey) {
  const { data: pharmacies = [], isLoading: pharmaciesLoading } = useQuery({
    queryKey: ['pharmacies', savedOnly ? 'saved' : 'all', clientType ?? 'all'],
    queryFn: async (): Promise<BusinessEntity[]> => {
      const allData: BusinessEntity[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('pharmacies')
          .select('*')
          .order('autonomous_community')
          .order('postal_code')
          .order('name')
          .range(from, from + pageSize - 1);

        if (savedOnly) {
          query = query.not('saved_at', 'is', null);
        }
        if (clientType) {
          query = query.eq('client_type', clientType as never);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Error fetching pharmacies:', error);
          break;
        }

        if (data && data.length > 0) {
          allData.push(...toBusinessEntities(data as never[]));
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return allData;
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useDetailedOrders();
  const { data: documents = [], isLoading: docsLoading } = useEntityDocuments();

  const pharmaciesWithOrders: EntityWithOrders[] = pharmacies.map((pharmacy) => {
    let pharmacyOrders: DetailedOrder[] = [];
    
    if (pharmacy.status === 'client') {
      pharmacyOrders = orders.filter(order => {
        const orderName = order.customerName.toLowerCase().trim();
        const pharmacyName = pharmacy.name.toLowerCase().trim();
        
        if (orderName === pharmacyName) return true;
        
        const minLength = Math.min(orderName.length, pharmacyName.length);
        const maxLength = Math.max(orderName.length, pharmacyName.length);
        
        if (minLength / maxLength < 0.8) return false;
        
        return orderName.includes(pharmacyName) || pharmacyName.includes(orderName);
      });
    }

    const sortedOrders = [...pharmacyOrders].sort(
      (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );

    const lastOrder = sortedOrders.length > 0 ? sortedOrders[0] : null;
    const totalRevenue = pharmacyOrders.reduce((sum, o) => sum + o.amount, 0);

    const pharmacyDocs = documents.filter(d => d.pharmacyId === pharmacy.id);
    const hasInvoice = pharmacyDocs.some(d => d.documentType === 'invoice');
    const hasReceipt = pharmacyDocs.some(d => d.documentType === 'receipt');
    const documentCount = pharmacyDocs.length;

    return {
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      province: pharmacy.region,
      country: pharmacy.country,
      clientType: pharmacy.typeKey || 'pharmacy',
      phone: pharmacy.phone,
      email: pharmacy.email,
      commercialStatus: pharmacy.status,
      notes: pharmacy.notes,
      orders: sortedOrders,
      lastOrder,
      totalRevenue,
      hasInvoice,
      hasReceipt,
      documentCount,
      lat: pharmacy.lat,
      lng: pharmacy.lng,
      savedAt: pharmacy.savedAt ?? null,
      postal_code: pharmacy.attributes.postalCode ?? null,
      autonomous_community: pharmacy.attributes.autonomousCommunity ?? null,
      secondary_phone: pharmacy.attributes.secondaryPhone ?? null,
      activity: pharmacy.attributes.activity ?? null,
      subsector: pharmacy.attributes.subsector ?? null,
      legal_form: pharmacy.attributes.legalForm ?? null,
    };
  });

  return {
    data: pharmaciesWithOrders,
    isLoading: pharmaciesLoading || ordersLoading || docsLoading,
  };
}

const ALLOWED_UPLOAD_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
]);
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pharmacyId,
      orderId,
      documentType,
      file,
    }: {
      pharmacyId: string;
      orderId: string | null;
      documentType: EntityDocument['documentType'];
      file: File;
    }) => {
      if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
        throw new Error('File type not allowed. Accepted: PDF, images, CSV, Excel.');
      }
      if (file.size > MAX_UPLOAD_SIZE) {
        throw new Error('File too large. Maximum size is 10 MB.');
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const folder = orderId ?? 'general';
      const filePath = `${pharmacyId}/${folder}/${documentType}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('pharmacy-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data, error } = await supabase
        .from('pharmacy_order_documents')
        .insert({
          pharmacy_id: pharmacyId,
          order_id: orderId,
          document_type: documentType,
          file_path: filePath,
          file_name: file.name,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save document record: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pharmacy-documents')
        .remove([filePath]);

      if (storageError) {
        logger.warn('Failed to delete file from storage:', storageError);
      }

      // Delete record
      const { error } = await supabase
        .from('pharmacy_order_documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete document: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-documents'] });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('pharmacy-documents')
        .download(filePath);

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      return data;
    },
  });
}
