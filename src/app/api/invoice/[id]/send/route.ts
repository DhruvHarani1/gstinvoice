import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInvoiceEmail } from '@/lib/email/sendInvoice';

export const runtime = 'nodejs'; // Ensure running in full Node.js environment for @react-pdf/renderer

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // 1. Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch invoice and confirm ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    // 3. Confirm client has a configured email address
    const clientEmail = invoice.client?.email;
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client does not have an email address configured.' },
        { status: 400 }
      );
    }

    // 4. Send the invoice PDF email via Resend
    await sendInvoiceEmail(params.id, clientEmail);

    // 5. Update invoice status to 'sent'
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', params.id);

    if (updateError) {
      console.error('Failed to update invoice status in DB:', updateError);
      return NextResponse.json({
        success: true,
        warning: 'Invoice was emailed successfully, but status update failed in the database.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice email sent and status updated to sent.',
    });
  } catch (error) {
    console.error('Error in email sending route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
