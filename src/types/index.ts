import { z } from 'zod';

// Utility Union Types
export type PlanType = 'free' | 'pro' | 'business';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// 1. Profile Type
export interface Profile {
  id: string;
  business_name: string;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string;
  pincode: string | null;
  phone: string | null;
  logo_url: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_ifsc: string | null;
  signature_url: string | null;
  invoice_prefix: string;
  next_invoice_number: number;
  referral_code: string;
  referred_by: string | null;
  referrals_rewarded: number;
  created_at: string;
  updated_at: string;
}

// 2. Client Type
export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
}

// 3. Invoice Type
export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  place_of_supply: string | null;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
}

// 4. InvoiceItem Type
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  hsn_sac: string | null;
  quantity: number;
  rate: number;
  gst_rate: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
  sort_order: number;
}

// 5. Subscription Type
export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  razorpay_subscription_id: string | null;
  razorpay_customer_id: string | null;
  status: string;
  current_period_end: string | null;
  invoice_count: number;
  created_at: string;
  updated_at: string;
}

// Joined Types
export interface InvoiceWithClient extends Invoice {
  client: Client;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface InvoiceWithAll extends Invoice {
  client: Client;
  items: InvoiceItem[];
}

// --- ZOD SCHEMAS ---

// Invoice Item Schema
export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required'),
  hsn_sac: z.string().nullable().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  rate: z.number().nonnegative('Rate must be non-negative'),
  gst_rate: z.number().nonnegative('GST rate must be non-negative').default(18),
  taxable_amount: z.number().nonnegative(),
  cgst_rate: z.number().nonnegative().default(9),
  cgst_amount: z.number().nonnegative().default(0),
  sgst_rate: z.number().nonnegative().default(9),
  sgst_amount: z.number().nonnegative().default(0),
  igst_rate: z.number().nonnegative().default(0),
  igst_amount: z.number().nonnegative().default(0),
  total_amount: z.number().nonnegative(),
  sort_order: z.number().int().default(0).optional(),
});

// Create Invoice Schema (including items)
export const createInvoiceSchema = z.object({
  client_id: z.string().uuid('Please select a client'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  place_of_supply: z.string().min(1, 'Place of supply is required'),
  subtotal: z.number().nonnegative(),
  cgst_amount: z.number().nonnegative().default(0),
  sgst_amount: z.number().nonnegative().default(0),
  igst_amount: z.number().nonnegative().default(0),
  total_amount: z.number().nonnegative(),
  amount_paid: z.number().nonnegative().default(0),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

// Create Client Schema
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).nullable().optional(),
  phone: z.string().nullable().optional(),
  gstin: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().min(1, 'State is required').nullable().optional(),
  pincode: z.string().nullable().optional(),
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  gstin: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  bank_account: z.string().nullable().optional(),
  bank_ifsc: z.string().nullable().optional(),
  signature_url: z.string().nullable().optional(),
  invoice_prefix: z.string().min(1, 'Invoice prefix is required'),
  next_invoice_number: z.number().int().positive('Next invoice number must be positive'),
});

// Inferred Types from Zod Schemas
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
