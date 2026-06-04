import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '../pdf/InvoicePDF';
import InvoiceEmail from './templates/InvoiceEmail';
import { Invoice, Client, InvoiceItem } from '@/types';

// Initialize the Supabase Service Role client to bypass RLS policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

/**
 * Renders the invoice to PDF and sends it via Resend.
 * @param invoiceId UUID of the invoice
 * @param recipientEmail Email address of the recipient
 */
export async function sendInvoiceEmail(invoiceId: string, recipientEmail: string) {
  // 1. Fetch invoice and client
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Failed to fetch invoice: ${invoiceError?.message || 'Not found'}`);
  }

  // 2. Fetch invoice items
  const { data: items, error: itemsError } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true });

  if (itemsError || !items) {
    throw new Error(`Failed to fetch invoice items: ${itemsError?.message || 'Not found'}`);
  }

  // 3. Fetch profile (seller details)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', invoice.user_id)
    .single();

  if (profileError || !profile) {
    throw new Error(`Failed to fetch business profile: ${profileError?.message || 'Not found'}`);
  }

  // 4. Try to fetch seller's email address from auth users
  let sellerEmail = '';
  try {
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(invoice.user_id);
    if (!authUserError && authUser?.user) {
      sellerEmail = authUser.user.email || '';
    }
  } catch (err) {
    console.error('Failed to retrieve auth user email:', err);
  }

  // 5. Render PDF to Buffer
  const pdfElement = React.createElement(InvoicePDF, {
    invoice: invoice as unknown as Invoice,
    items: items as unknown as InvoiceItem[],
    client: invoice.client as unknown as Client,
    profile: profile,
    sellerEmail: sellerEmail || undefined,
  });

  const buffer = await renderToBuffer(pdfElement as any);

  // 6. Dispatch Email via Resend
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@invoicewala.in';
  
  const emailResult = await resend.emails.send({
    from: fromEmail,
    to: recipientEmail,
    subject: `Invoice #${invoice.invoice_number} from ${profile.business_name} — ₹${Number(invoice.total_amount).toFixed(2)}`,
    react: React.createElement(InvoiceEmail, {
      invoice: invoice as unknown as Invoice,
      client: invoice.client as unknown as Client,
      profile: profile,
    }) as any,
    attachments: [
      {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: buffer,
      },
    ],
  });

  if (emailResult.error) {
    throw new Error(`Resend email delivery failed: ${emailResult.error.message}`);
  }

  return emailResult.data;
}
