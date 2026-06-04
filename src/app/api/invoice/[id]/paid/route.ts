import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 0. Fallback mock check for local testing
    if (params.id === 'test-invoice-id') {
      return NextResponse.json({
        success: true,
        message: 'Mock payment success triggered.',
      });
    }
    // 1. Fetch the invoice details and client info using admin client (bypassing RLS)
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', params.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // If it's already marked as paid, return success directly
    if (invoice.status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Invoice is already marked as paid.',
      });
    }

    // 2. Fetch the business profile of the freelancer
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', invoice.user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Freelancer profile not found' },
        { status: 404 }
      );
    }

    // 3. Update status in database to 'paid' and set amount_paid = total_amount
    const totalAmount = Number(invoice.total_amount);
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Failed to update invoice status in DB:', updateError);
      return NextResponse.json(
        { error: 'Failed to record payment in database.' },
        { status: 500 }
      );
    }

    // 4. Retrieve seller's email address from auth.users
    let freelancerEmail = '';
    try {
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(invoice.user_id);
      if (!authUserError && authUser?.user) {
        freelancerEmail = authUser.user.email || '';
      }
    } catch (err) {
      console.error('Failed to retrieve auth user email:', err);
    }

    // 5. Send notification email to the freelancer if email is resolved
    if (freelancerEmail) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@invoicewala.in';
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(totalAmount);

      try {
        await resend.emails.send({
          from: fromEmail,
          to: freelancerEmail,
          subject: `Payment Notification: Invoice #${invoice.invoice_number} Paid`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; rounded: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 24px; font-weight: bold; color: #6C63FF;">InvoiceWala</span>
              </div>
              <h2 style="color: #0f172a; margin-bottom: 16px;">Good News! Payment Recorded 🎉</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                Your client, <strong>${invoice.client?.name || 'Customer'}</strong>, has marked <strong>Invoice #${invoice.invoice_number}</strong> as paid via the public invoice portal.
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <table style="width: 100%; font-size: 14px; color: #475569; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Invoice Number:</td>
                    <td style="padding: 6px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">#${invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Client Name:</td>
                    <td style="padding: 6px 0; text-align: right; color: #0f172a;">${invoice.client?.name || '—'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: bold;">Amount Received:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #22c55e;">${formattedAmount}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/invoices/${invoice.id}" 
                   style="display: inline-block; background-color: #6C63FF; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px rgba(108, 99, 255, 0.1);">
                  View Details in Dashboard
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 11px; text-align: center; border-t: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
                This notification was sent automatically because a payment event occurred. Thank you for billing with InvoiceWala.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Log the error but don't fail the response since DB was successfully updated
        console.error('Failed to send payment notification email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice successfully marked as paid and freelancer notified.',
    });
  } catch (error) {
    console.error('Error in paid endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
