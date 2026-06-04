import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // 1. Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the original invoice header and verify ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied.' },
        { status: 404 }
      );
    }

    // 3. Fetch original invoice line items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', params.id)
      .order('sort_order', { ascending: true });

    if (itemsError || !items) {
      return NextResponse.json(
        { error: 'Invoice items not found.' },
        { status: 404 }
      );
    }

    // 4. Retrieve user profile to resolve current prefix & invoice number index
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Business profile details not found.' },
        { status: 404 }
      );
    }

    // 5. Generate formatting for the new invoice number
    const prefix = profile.invoice_prefix || 'INV';
    const nextNumber = profile.next_invoice_number || 1;
    const newInvoiceNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;

    // 6. Build insertion payload for the duplicate invoice header
    const today = new Date().toISOString().split('T')[0];

    const duplicateInvoicePayload = {
      user_id: user.id,
      client_id: invoice.client_id,
      invoice_number: newInvoiceNumber,
      invoice_date: today,
      due_date: null, // Reset due date for draft
      status: 'draft', // Reset status to draft
      place_of_supply: invoice.place_of_supply,
      subtotal: invoice.subtotal,
      cgst_amount: invoice.cgst_amount,
      sgst_amount: invoice.sgst_amount,
      igst_amount: invoice.igst_amount,
      total_amount: invoice.total_amount,
      amount_paid: 0.00, // Reset amount paid
      notes: invoice.notes,
      terms: invoice.terms,
    };

    // 7. Insert the duplicate invoice header
    const { data: newInvoice, error: createError } = await supabase
      .from('invoices')
      .insert(duplicateInvoicePayload)
      .select('*')
      .single();

    if (createError || !newInvoice) {
      return NextResponse.json(
        { error: `Failed to duplicate invoice: ${createError?.message}` },
        { status: 500 }
      );
    }

    // 8. Copy invoice items if there are any line items
    if (items.length > 0) {
      const duplicateItemsPayload = items.map((item) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        hsn_sac: item.hsn_sac,
        quantity: item.quantity,
        rate: item.rate,
        gst_rate: item.gst_rate,
        taxable_amount: item.taxable_amount,
        cgst_rate: item.cgst_rate,
        cgst_amount: item.cgst_amount,
        sgst_rate: item.sgst_rate,
        sgst_amount: item.sgst_amount,
        igst_rate: item.igst_rate,
        igst_amount: item.igst_amount,
        total_amount: item.total_amount,
        sort_order: item.sort_order,
      }));

      const { error: itemsCreateError } = await supabase
        .from('invoice_items')
        .insert(duplicateItemsPayload);

      if (itemsCreateError) {
        // Rollback inserted header
        await supabase.from('invoices').delete().eq('id', newInvoice.id);
        return NextResponse.json(
          { error: `Failed to copy invoice line items: ${itemsCreateError.message}` },
          { status: 500 }
        );
      }
    }

    // 9. Increment invoice number inside the profiles table
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ next_invoice_number: nextNumber + 1 })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error(
        'Failed to auto-increment next_invoice_number in duplicate route:',
        updateProfileError
      );
    }

    // 10. Revalidate path caches
    try {
      revalidatePath('/dashboard/invoices');
      revalidatePath('/dashboard');
    } catch (revalErr) {
      console.error('Revalidation error:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice successfully duplicated.',
      invoice: newInvoice,
    });
  } catch (error) {
    console.error('Error duplicating invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
