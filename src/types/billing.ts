export type BillingInterval = 'month' | 'year';

export type BillingSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired';

export type BillingInvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  stripe_price_id: string;
  amount_cents: number;
  currency: string;
  interval: BillingInterval;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BillingCustomer {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingSubscription {
  id: string;
  organization_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: BillingSubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  id: string;
  organization_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string;
  invoice_number: string | null;
  status: BillingInvoiceStatus;
  currency: string;
  amount_due_cents: number;
  amount_paid_cents: number;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface BillingOverview {
  customer: BillingCustomer | null;
  subscription: BillingSubscription | null;
  invoices: BillingInvoice[];
}
