import { cache } from 'react';
import { createClient } from './server';
import { Profile, Client, InvoiceItem, InvoiceWithAll, InvoiceWithClient } from '@/types';

/**
 * Fetches the user profile details server-side.
 * Memoized per-request using React cache().
 */
export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error in getProfile query:', error.message);
    return null;
  }
  return data;
});

/**
 * Fetches the clients directory list belonging to the user server-side.
 * Memoized per-request using React cache().
 */
export const getClients = cache(async (userId: string): Promise<Client[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error in getClients query:', error.message);
    return [];
  }
  return data || [];
});

/**
 * Fetches the invoices list server-side with filters and client relationship joined.
 * Memoized per-request using React cache().
 */
export const getInvoices = cache(async (
  userId: string,
  filters?: { status?: string; client_id?: string }
): Promise<InvoiceWithClient[]> => {
  const supabase = createClient();
  let query = supabase
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('user_id', userId);

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.client_id) {
    query = query.eq('client_id', filters.client_id);
  }

  const { data, error } = await query.order('invoice_date', { ascending: false });

  if (error) {
    console.error('Error in getInvoices query:', error.message);
    return [];
  }

  return (data as unknown as InvoiceWithClient[]) || [];
});

/**
 * Fetches a single invoice with all related client details and child line item rows.
 * Memoized per-request using React cache().
 */
export const getInvoiceWithAll = cache(async (invoiceId: string): Promise<InvoiceWithAll | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*), items:invoice_items(*)')
    .eq('id', invoiceId)
    .single();

  if (error) {
    console.error('Error in getInvoiceWithAll query:', error.message);
    return null;
  }

  if (data && data.items) {
    // Sort items by sort_order ascending
    data.items.sort((a: InvoiceItem, b: InvoiceItem) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  return data as unknown as InvoiceWithAll;
});
