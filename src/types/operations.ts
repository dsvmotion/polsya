import type { ClientType, PharmacyStatus } from '@/types/pharmacy';

export interface DetailedOrder {
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

export interface PharmacyWithOrders {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  clientType: ClientType;
  phone: string | null;
  email: string | null;
  commercialStatus: PharmacyStatus;
  notes: string | null;
  orders: DetailedOrder[];
  lastOrder: DetailedOrder | null;
  totalRevenue: number;
  hasInvoice: boolean;
  hasReceipt: boolean;
  documentCount?: number;
  lat: number;
  lng: number;
  savedAt: string | null;
  postal_code?: string | null;
  autonomous_community?: string | null;
  secondary_phone?: string | null;
  activity?: string | null;
  subsector?: string | null;
  legal_form?: string | null;
}

export interface OperationsFilters {
  search: string;
  country: string;
  province: string;
  city: string;
  commercialStatus: 'all' | PharmacyStatus;
  paymentStatus: 'all' | 'paid' | 'pending' | 'failed' | 'refunded';
}

export type SortField = 'name' | 'address' | 'postal_code' | 'city' | 'province' | 'autonomous_community' | 'phone' | 'secondary_phone' | 'email' | 'activity' | 'subsector' | 'legal_form' | 'commercialStatus' | 'lastOrderDate' | 'totalRevenue' | 'paymentStatus';
export type SortDirection = 'asc' | 'desc';

export type DocumentType = 'invoice' | 'receipt' | 'contract' | 'delivery_note' | 'other';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  contract: 'Contract',
  delivery_note: 'Delivery Note',
  other: 'Other',
};

export type SegmentScope = 'operations' | 'prospecting';

export interface SavedSegment {
  id: string;
  name: string;
  description: string | null;
  scope: SegmentScope;
  filters: OperationsFilters;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskReason = 'no_recent_orders' | 'payment_failures' | 'no_orders_client';

export const RISK_REASON_LABELS: Record<RiskReason, string> = {
  no_recent_orders: 'No recent orders (60+ days)',
  payment_failures: 'Last payment failed',
  no_orders_client: 'Client with no orders',
};

export interface RiskAlert {
  pharmacyId: string;
  pharmacyName: string;
  riskLevel: RiskLevel;
  reasons: RiskReason[];
  lastOrderDate: string | null;
  daysSinceLastOrder: number | null;
  lastPaymentStatus: string | null;
}

export interface RiskSummary {
  highCount: number;
  mediumCount: number;
  totalAtRisk: number;
}

export type SmartSegmentKey =
  | 'none'
  | 'at_risk'
  | 'no_orders_client'
  | 'payment_failed'
  | 'no_recent_orders_60d';

export const SMART_SEGMENT_LABELS: Record<SmartSegmentKey, string> = {
  none: 'All pharmacies',
  at_risk: 'At risk',
  no_orders_client: 'Client — no orders',
  payment_failed: 'Payment failed',
  no_recent_orders_60d: 'No orders 60+ days',
};

export interface PharmacyDocument {
  id: string;
  pharmacyId: string;
  orderId: string | null;
  documentType: DocumentType;
  filePath: string;
  fileName: string;
  uploadedAt: string;
  notes: string | null;
}
