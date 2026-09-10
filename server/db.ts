export interface Organization {
  id: string;
  name: string;
  slug: string;
  profile: 'SALON' | 'CLINIC' | 'FIELD_SERVICE' | 'B2B_DISTRIBUTOR';
  is_hipaa_compliant: boolean;
  timezone: string;
  currency: string;
  settings: Record<string, any>;
}

export interface Client {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  hipaa_consent_given: boolean;
  sms_opt_in: boolean;
  notes?: string;
}

export interface B2BCustomer {
  id: string;
  organization_id: string;
  company_name: string;
  tax_id: string;
  credit_limit: number;
  available_credit: number;
  net_terms_days: number;
  pricing_tier: string;
  auto_approve_threshold: number;
}

export interface Staff {
  id: string;
  organization_id: string;
  name: string;
  title: string;
  npi_number?: string;
  commission_rate_percent: number;
}

export interface Service {
  id: string;
  organization_id: string;
  name: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  deposit_required: number;
}

export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  wholesale_price: number;
  retail_price: number;
  stock_quantity: number;
  tier_pricing: Record<string, number>;
}

export interface Appointment {
  id: string;
  organization_id: string;
  location_id: string;
  client_id: string;
  staff_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  no_show_flag: boolean;
  deposit_amount: number;
  phi_encrypted_notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  organization_id: string;
  b2b_customer_id: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'FULFILLED' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  payment_terms_days: number;
  items: Array<{ product_id: string; name: string; quantity: number; unit_price: number }>;
  created_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  order_id?: string;
  appointment_id?: string;
  b2b_customer_id?: string;
  client_id?: string;
  invoice_number: string;
  status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  due_date: string;
  created_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount: number;
  method: 'CREDIT_CARD' | 'ACH' | 'NET_TERMS' | 'CASH';
  gateway_transaction_id: string;
  status: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  organization_id: string;
  appointment_id: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH';
  scheduled_time: string;
  sent_time?: string;
  status: 'SCHEDULED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RESPONDED';
  external_message_id?: string;
  sanitized_payload: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  timestamp: string;
  details: string;
}

// Initial Seed Database State
export const organizations: Organization[] = [
  {
    id: 'org-salon-101',
    name: 'Aura Luxury Spa & Salon',
    slug: 'aura-salon',
    profile: 'SALON',
    is_hipaa_compliant: false,
    timezone: 'America/New_York',
    currency: 'USD',
    settings: { tip_prompt_enabled: true, commission_tracking: true }
  },
  {
    id: 'org-clinic-202',
    name: 'Apex Health Dental & Medical Practice',
    slug: 'apex-health',
    profile: 'CLINIC',
    is_hipaa_compliant: true,
    timezone: 'America/Chicago',
    currency: 'USD',
    settings: { phi_obfuscation: true, provider_npi_required: true }
  },
  {
    id: 'org-field-303',
    name: 'ProFlow Plumbing & HVAC Services',
    slug: 'proflow-hvac',
    profile: 'FIELD_SERVICE',
    is_hipaa_compliant: false,
    timezone: 'America/Denver',
    currency: 'USD',
    settings: { dispatch_routing: true, offline_sync: true }
  },
  {
    id: 'org-b2b-404',
    name: 'Vanguard Industrial Wholesale & Supply',
    slug: 'vanguard-wholesale',
    profile: 'B2B_DISTRIBUTOR',
    is_hipaa_compliant: false,
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    settings: { net_terms_allowed: true, credit_limit_enforcement: true }
  }
];

export const clients: Client[] = [
  {
    id: 'cli-001',
    organization_id: 'org-salon-101',
    first_name: 'Elena',
    last_name: 'Rostova',
    email: 'elena@example.com',
    phone: '+1 (555) 234-5678',
    hipaa_consent_given: false,
    sms_opt_in: true,
    notes: 'Prefers organic essential oils'
  },
  {
    id: 'cli-002',
    organization_id: 'org-clinic-202',
    first_name: 'Marcus',
    last_name: 'Vance',
    email: 'marcus.vance@example.com',
    phone: '+1 (555) 876-5432',
    hipaa_consent_given: true,
    sms_opt_in: true,
    notes: '[ENCRYPTED_PHI: Patient reports mild sensitivity on lower right molar #30]'
  },
  {
    id: 'cli-003',
    organization_id: 'org-field-303',
    first_name: 'Sarah',
    last_name: 'Conner',
    email: 'sarah.c@example.com',
    phone: '+1 (555) 345-6789',
    hipaa_consent_given: false,
    sms_opt_in: true,
    notes: 'Gate code 4821. Heat pump unit in backyard.'
  }
];

export const b2bCustomers: B2BCustomer[] = [
  {
    id: 'b2b-cust-101',
    organization_id: 'org-b2b-404',
    company_name: 'Apex Construction Corp',
    tax_id: 'XX-XXX9842',
    credit_limit: 25000.00,
    available_credit: 18500.00,
    net_terms_days: 30,
    pricing_tier: 'PLATINUM',
    auto_approve_threshold: 5000.00
  },
  {
    id: 'b2b-cust-102',
    organization_id: 'org-b2b-404',
    company_name: 'Metro Retail Hardware Group',
    tax_id: 'XX-XXX1109',
    credit_limit: 10000.00,
    available_credit: 1200.00,
    net_terms_days: 15,
    pricing_tier: 'GOLD',
    auto_approve_threshold: 2000.00
  }
];

export const staffMembers: Staff[] = [
  {
    id: 'stf-101',
    organization_id: 'org-salon-101',
    name: 'Sophia Martinez',
    title: 'Master Esthetician & Stylist',
    commission_rate_percent: 45.0
  },
  {
    id: 'stf-201',
    organization_id: 'org-clinic-202',
    name: 'Dr. James H. Wilson, DDS',
    title: 'Lead Dental Practitioner',
    npi_number: '1982736450',
    commission_rate_percent: 0
  },
  {
    id: 'stf-301',
    organization_id: 'org-field-303',
    name: 'Robert "Bob" Miller',
    title: 'Master HVAC Technician',
    commission_rate_percent: 15.0
  }
];

export const services: Service[] = [
  {
    id: 'srv-101',
    organization_id: 'org-salon-101',
    name: 'Signature Deep Hydration Facial',
    duration_minutes: 60,
    buffer_minutes: 15,
    price: 150.00,
    deposit_required: 30.00
  },
  {
    id: 'srv-201',
    organization_id: 'org-clinic-202',
    name: 'Comprehensive Oral Exam & Digital X-Rays',
    duration_minutes: 45,
    buffer_minutes: 15,
    price: 220.00,
    deposit_required: 50.00
  },
  {
    id: 'srv-301',
    organization_id: 'org-field-303',
    name: 'Emergency Furnace Inspection & Tune-Up',
    duration_minutes: 90,
    buffer_minutes: 30,
    price: 195.00,
    deposit_required: 0.00
  }
];

export const products: Product[] = [
  {
    id: 'prod-101',
    organization_id: 'org-b2b-404',
    sku: 'VALVE-HEAVY-200',
    name: 'Industrial Grade Brass Pressure Relief Valve 2"',
    wholesale_price: 120.00,
    retail_price: 185.00,
    stock_quantity: 450,
    tier_pricing: { '10': 110, '50': 95, '100': 85 }
  },
  {
    id: 'prod-102',
    organization_id: 'org-b2b-404',
    sku: 'COPPER-PIPE-100FT',
    name: 'Type M Hard Temper Copper Tubing 3/4" (100ft roll)',
    wholesale_price: 240.00,
    retail_price: 350.00,
    stock_quantity: 85,
    tier_pricing: { '5': 225, '20': 200 }
  },
  {
    id: 'prod-103',
    organization_id: 'org-salon-101',
    name: 'HydraGlow Botanical Treatment Serum (50ml)',
    wholesale_price: 28.00,
    retail_price: 65.00,
    stock_quantity: 120,
    tier_pricing: {}
  }
];

export const appointments: Appointment[] = [
  {
    id: 'apt-101',
    organization_id: 'org-salon-101',
    location_id: 'loc-101',
    client_id: 'cli-001',
    staff_id: 'stf-101',
    service_id: 'srv-101',
    start_time: '2026-09-15T14:00:00Z',
    end_time: '2026-09-15T15:00:00Z',
    status: 'CONFIRMED',
    no_show_flag: false,
    deposit_amount: 30.00,
    created_at: '2026-09-10T08:00:00Z'
  },
  {
    id: 'apt-202',
    organization_id: 'org-clinic-202',
    location_id: 'loc-202',
    client_id: 'cli-002',
    staff_id: 'stf-201',
    service_id: 'srv-201',
    start_time: '2026-09-16T10:00:00Z',
    end_time: '2026-09-16T10:45:00Z',
    status: 'PENDING',
    no_show_flag: false,
    deposit_amount: 50.00,
    phi_encrypted_notes: 'AES256GCM:a7b8c9d0e1f2...',
    created_at: '2026-09-10T09:15:00Z'
  }
];

export const orders: Order[] = [
  {
    id: 'ord-501',
    organization_id: 'org-b2b-404',
    b2b_customer_id: 'b2b-cust-101',
    status: 'APPROVED',
    subtotal: 6500.00,
    tax_amount: 520.00,
    shipping_amount: 150.00,
    total_amount: 7170.00,
    payment_terms_days: 30,
    items: [
      { product_id: 'prod-101', name: 'Industrial Grade Brass Pressure Relief Valve 2"', quantity: 50, unit_price: 95.00 },
      { product_id: 'prod-102', name: 'Type M Hard Temper Copper Tubing 3/4" (100ft roll)', quantity: 7, unit_price: 250.00 }
    ],
    created_at: '2026-09-08T11:20:00Z'
  }
];

export const invoices: Invoice[] = [
  {
    id: 'inv-901',
    organization_id: 'org-b2b-404',
    order_id: 'ord-501',
    b2b_customer_id: 'b2b-cust-101',
    invoice_number: 'INV-2026-0089',
    status: 'UNPAID',
    subtotal: 6500.00,
    tax: 520.00,
    total: 7170.00,
    amount_paid: 0.00,
    due_date: '2026-10-08',
    created_at: '2026-09-08T11:25:00Z'
  }
];

export const payments: Payment[] = [];

export const reminders: Reminder[] = [
  {
    id: 'rem-101',
    organization_id: 'org-salon-101',
    appointment_id: 'apt-101',
    channel: 'SMS',
    scheduled_time: '2026-09-14T14:00:00Z',
    status: 'SCHEDULED',
    sanitized_payload: 'Reminder: Your Signature Facial at Aura Salon is tomorrow at 2:00 PM. Reply 1 to Confirm.',
    created_at: '2026-09-10T08:00:00Z'
  },
  {
    id: 'rem-202',
    organization_id: 'org-clinic-202',
    appointment_id: 'apt-202',
    channel: 'SMS',
    scheduled_time: '2026-09-15T10:00:00Z',
    status: 'SCHEDULED',
    sanitized_payload: 'HIPAA SAFE: Appointment at Apex Health on Sep 16 at 10:00 AM. Reply 1 to Confirm. [No PHI included]',
    created_at: '2026-09-10T09:15:00Z'
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: 'log-001',
    organization_id: 'org-clinic-202',
    user_id: 'stf-201',
    action: 'CREATE_HIPAA_RECORD',
    entity_type: 'APPOINTMENT',
    entity_id: 'apt-202',
    ip_address: '192.168.1.105',
    timestamp: '2026-09-10T09:15:00Z',
    details: 'Created appointment apt-202 with encrypted PHI payload.'
  }
];
