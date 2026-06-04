import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getInvoices } from '@/lib/supabase/queries';
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

  // Fetch Invoices along with their related Client information (cached)
  const invoices = await getInvoices(user.id);

  return (
    <InvoicesListClient
      initialInvoices={(invoices as unknown as (Invoice & { client: Client })[]) || []}
    />
  );
}
