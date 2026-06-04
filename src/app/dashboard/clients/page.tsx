import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getClients, getInvoices } from '@/lib/supabase/queries';
import ClientsListClient from '@/components/clients/ClientsListClient';

export const revalidate = 0; // Disable static page generation cache to always show real-time changes

export default async function ClientsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Clients and Invoices (cached)
  const clientsData = await getClients(user.id);
  const invoicesData = await getInvoices(user.id);

  // Compute total invoiced per client
  const totals: Record<string, number> = {};
  invoicesData.forEach((inv) => {
    totals[inv.client_id] = (totals[inv.client_id] || 0) + Number(inv.total_amount);
  });

  return (
    <ClientsListClient 
      initialClients={clientsData} 
      invoiceTotals={totals} 
    />
  );
}
