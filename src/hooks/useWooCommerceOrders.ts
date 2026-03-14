import { useQuery } from '@tanstack/react-query';
import { Sale } from '@/types/sale';
import { buildEdgeFunctionHeaders } from '@/lib/edge-function-headers';
import { logger } from '@/lib/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface WooCommerceOrderResponse {
  id: string;
  orderId: string;
  customerName: string;
  customerType: 'pharmacy' | 'client';
  address: string;
  city: string;
  country?: string;
  province?: string;
  lat?: number | null;
  lng?: number | null;
  amount: number;
  date: string;
  products: number | string[];
}

function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    Number.isFinite(lat) &&
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function transformOrderToSale(order: WooCommerceOrderResponse): Sale {
  if (!isValidLatLng(order.lat, order.lng)) {
    throw new Error(`Order ${order.orderId} has invalid coordinates`);
  }
  return {
    id: order.id,
    orderId: order.orderId,
    customerName: order.customerName,
    customerType: order.customerType,
    address: order.address || '',
    city: order.city || '',
    province: order.province || '',
    country: order.country || '',
    lat: order.lat,
    lng: order.lng,
    amount: order.amount || 0,
    date: order.date,
    products: Array.isArray(order.products) 
      ? order.products 
      : order.products > 0 
        ? [`${order.products} item${order.products > 1 ? 's' : ''}`]
        : [],
  };
}

export function useWooCommerceOrders() {
  return useQuery({
    queryKey: ['woocommerce-orders'],
    queryFn: async (): Promise<Sale[]> => {
      let headers: Record<string, string>;
      try {
        headers = await buildEdgeFunctionHeaders({ 'Content-Type': 'application/json' });
      } catch {
        // No org membership yet — return empty (WooCommerce requires org context)
        return [];
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/woocommerce-orders`, {
          method: 'POST',
          headers,
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          let detail = '';
          try {
            const body = await response.json();
            const code = body.code ? ` [${body.code}]` : '';
            const page = body.page ? ` (page ${body.page})` : '';
            detail = `WooCommerce API failed${code}${page}: ${body.error || response.status}`;
          } catch {
            detail = `WooCommerce API failed: ${response.status}`;
          }
          logger.error(detail);
          throw new Error(detail);
        }
        
        const data = await response.json();
        
        if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
          const sales: Sale[] = [];
          let skipped = 0;
          for (const o of data.orders as WooCommerceOrderResponse[]) {
            try {
              sales.push(transformOrderToSale(o));
            } catch {
              skipped++;
            }
          }
          if (skipped > 0) {
            logger.warn(`Skipped ${skipped} orders due to missing/invalid geocoding`);
          }
          return sales;
        }
        
        // Return empty array - NO mock data fallback
        return [];
      } catch (error) {
        logger.error('Error fetching WooCommerce orders:', error);
        throw error instanceof Error ? error : new Error('Unknown WooCommerce fetch error');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry auth, permission, or config errors
      const msg = error instanceof Error ? error.message : '';
      if (/401|403|session|organization|configured|credentials/i.test(msg)) return false;
      return failureCount < 2;
    },
  });
}

// Hook to fetch orders by pharmacy name or city for matching
export function useOrdersByPharmacy(pharmacyName: string | null, city: string | null) {
  const { data: allOrders = [] } = useWooCommerceOrders();
  
  if (!pharmacyName && !city) return [];
  
  return allOrders.filter(order => {
    const nameMatch = pharmacyName && 
      order.customerName.toLowerCase().includes(pharmacyName.toLowerCase());
    const cityMatch = city && 
      order.city.toLowerCase() === city.toLowerCase();
    
    return nameMatch || (cityMatch && order.customerType === 'pharmacy');
  });
}
