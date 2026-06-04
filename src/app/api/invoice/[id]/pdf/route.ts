import React from 'react';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import InvoicePDF from '@/lib/pdf/InvoicePDF';
import { Invoice, Client, InvoiceItem } from '@/types';

export const runtime = 'nodejs'; // Ensure running in full Node.js environment

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch Invoice with client details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return new Response('Invoice not found', { status: 404 });
    }

    // Fetch Invoice Items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', params.id)
      .order('sort_order', { ascending: true });

    if (itemsError || !items) {
      return new Response('Invoice items not found', { status: 404 });
    }

    // Fetch User profile details for billing parameters
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response('Profile not found', { status: 404 });
    }

    // Parse styling & visibility preferences from URL query parameters (passed by client)
    const { searchParams } = new URL(request.url);
    const pdfThemeColor = searchParams.get('theme') || undefined;
    const upiId = searchParams.get('upi') || undefined;
    const showBankDetails = searchParams.get('show_bank') !== 'false';

    // Generate PDF Stream using React.createElement for .ts file compilation
    const pdfStream = await renderToStream(
      React.createElement(InvoicePDF, {
        invoice: invoice as unknown as Invoice,
        items: items as unknown as InvoiceItem[],
        client: invoice.client as unknown as Client,
        profile: profile,
        sellerEmail: user?.email,
        pdfThemeColor,
        upiId,
        showBankDetails,
      }) as any
    );

    // Convert Node.js readable stream to Web ReadableStream
    const responseStream = new ReadableStream({
      start(controller) {
        pdfStream.on('data', (chunk) => controller.enqueue(chunk));
        pdfStream.on('end', () => controller.close());
        pdfStream.on('error', (err) => controller.error(err));
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
