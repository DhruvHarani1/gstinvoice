import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InvoicesListClient from '@/components/invoices/InvoicesListClient';
import { Invoice, Client } from '@/types';

export const revalidate = 0; // Prevent Next.js from caching static invoices lists

export default async function InvoicesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Invoices along with their related Client information
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: false });

  if (error) {
    console.error('Error fetching invoices server-side:', error);
  }

  return (
    <InvoicesListClient
      initialInvoices={(invoices as unknown as (Invoice & { client: Client })[]) || []}
    />
  );
}
