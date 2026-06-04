import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InvoiceDetailClient from '@/components/invoices/InvoiceDetailClient';
import { Invoice, Client } from '@/types';

export const revalidate = 0; // Disable static page generation cache to always show real-time changes

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Invoice with client details
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!invoice) {
    notFound();
  }

  // Fetch Invoice Items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', params.id)
    .order('sort_order', { ascending: true });

  // Fetch User profile details for billing parameters
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/dashboard/onboarding');
  }

  return (
    <InvoiceDetailClient
      invoice={(invoice as unknown as (Invoice & { client: Client }))}
      items={items || []}
      profile={profile}
    />
  );
}
