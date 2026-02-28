// Real sale data from WooCommerce
export interface Sale {
  id: string;
  orderId: string;
  customerName: string;
  customerType: 'pharmacy' | 'client' | 'herbalist';
  address: string;
  city: string;
  province: string;
  country: string;
  lat: number;
  lng: number;
  amount: number;
  date: string;
  products: string[];
  commercialStatus?: 'not_contacted' | 'contacted' | 'qualified' | 'proposal' | 'client' | 'retained' | 'lost';
  phone?: string;
  email?: string;
}
