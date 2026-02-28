import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, corsHeaders as makeCorsHeaders } from '../_shared/cors.ts';

interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  date_created: string;
  date_paid: string | null;
  total: string;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode?: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode?: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
  }>;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

interface DetailedOrder {
  id: string;
  orderId: string;
  status: string;
  customerName: string;
  customerType: 'pharmacy' | 'client';
  email: string;
  phone: string;
  billingAddress: string;
  billingCity: string;
  billingProvince: string;
  billingCountry: string;
  country: string;
  province: string;
  shippingAddress: string;
  shippingCity: string;
  amount: number;
  dateCreated: string;
  datePaid: string | null;
  paymentMethod: string;
  paymentMethodTitle: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    total: number;
  }>;
  paymentLinkUrl: string | null;
}

// Detect if customer is a pharmacy based on company name or metadata
function isPharmacy(order: WooCommerceOrder): boolean {
  const companyName = order.billing.company?.toLowerCase() || '';
  const pharmacyKeywords = ['farmacia', 'pharmacy', 'pharma', 'botica', 'drogueria', 'apoteca'];
  
  if (pharmacyKeywords.some(keyword => companyName.includes(keyword))) {
    return true;
  }
  
  const customerTypeMeta = order.meta_data?.find(
    meta => meta.key === 'customer_type' || meta.key === '_customer_type'
  );
  if (customerTypeMeta?.value?.toLowerCase() === 'pharmacy') {
    return true;
  }
  
  return false;
}

function getPaymentStatus(order: WooCommerceOrder): 'paid' | 'pending' | 'failed' | 'refunded' {
  const status = order.status.toLowerCase();
  if (status === 'completed' || status === 'processing') {
    return order.date_paid ? 'paid' : 'pending';
  }
  if (status === 'refunded') return 'refunded';
  if (status === 'failed' || status === 'cancelled') return 'failed';
  return 'pending';
}

function getPaymentLinkFromMeta(order: WooCommerceOrder): string | null {
  // Common payment link meta keys
  const linkKeys = ['_payment_link', 'payment_link_url', '_checkout_url', 'payment_url'];
  for (const key of linkKeys) {
    const meta = order.meta_data?.find(m => m.key === key);
    if (meta?.value) return meta.value;
  }
  return null;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin') || '';
  const corsHeaders = makeCorsHeaders(origin);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const wooUrl = Deno.env.get('WOOCOMMERCE_URL');
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

    if (!wooUrl || !consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ error: 'WooCommerce credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    // Include all relevant statuses for operations view
    const status = url.searchParams.get('status') || 'completed,processing,on-hold,pending';

    const baseUrl = wooUrl.endsWith('/') ? wooUrl.slice(0, -1) : wooUrl;
    const wooAuthHeader = 'Basic ' + btoa(`${consumerKey}:${consumerSecret}`);

    const allOrders: WooCommerceOrder[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const apiUrl = `${baseUrl}/wp-json/wc/v3/orders?per_page=100&page=${currentPage}&status=${status}`;
      const wooResponse = await fetch(apiUrl, {
        headers: { 'Authorization': wooAuthHeader, 'Content-Type': 'application/json' }
      });

      if (!wooResponse.ok) {
        console.error(`WooCommerce API error on page ${currentPage}:`, wooResponse.status);
        if (currentPage === 1) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch orders from WooCommerce' }),
            { status: wooResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      const pageOrders: WooCommerceOrder[] = await wooResponse.json();
      allOrders.push(...pageOrders);

      if (currentPage === 1) {
        totalPages = parseInt(wooResponse.headers.get('X-WP-TotalPages') || '1');
      }

      currentPage++;
    } while (currentPage <= totalPages);

    const detailedOrders: DetailedOrder[] = allOrders.map(order => {
      const customerName = order.billing.company || 
        `${order.billing.first_name} ${order.billing.last_name}`.trim();

      return {
        id: order.id.toString(),
        orderId: `WC-${order.number}`,
        status: order.status,
        customerName,
        customerType: isPharmacy(order) ? 'pharmacy' : 'client',
        email: order.billing.email || '',
        phone: order.billing.phone || '',
        billingAddress: [order.billing.address_1, order.billing.address_2].filter(Boolean).join(', '),
        billingCity: order.billing.city || '',
        billingProvince: order.billing.state || '',
        billingCountry: order.billing.country || '',
        country: order.billing.country || '',
        province: order.billing.state || '',
        shippingAddress: [order.shipping.address_1, order.shipping.address_2].filter(Boolean).join(', '),
        shippingCity: order.shipping.city || '',
        amount: parseFloat(order.total) || 0,
        dateCreated: order.date_created,
        datePaid: order.date_paid,
        paymentMethod: order.payment_method || 'unknown',
        paymentMethodTitle: order.payment_method_title || 'Unknown',
        paymentStatus: getPaymentStatus(order),
        products: order.line_items.map(item => ({
          id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          total: parseFloat(item.total) || 0,
        })),
        paymentLinkUrl: getPaymentLinkFromMeta(order),
      };
    });

    return new Response(
      JSON.stringify({
        orders: detailedOrders,
        pagination: {
          total: allOrders.length,
          totalPages,
          currentPage: Math.max(1, Math.min(currentPage - 1, totalPages)),
          perPage: 100
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
