import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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
 * Handles recording the client view event and triggering email alerts to freelancers.
 * @param invoiceId UUID of the viewed invoice
 */
export async function trackInvoiceView(invoiceId: string) {
  try {
    // 1. Fetch the invoice and client details using admin client
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice tracking error: Invoice not found', invoiceError);
      return;
    }

    // 2. Fetch the freelancer's notification preferences
    const { data: prefs, error: prefsError } = await supabaseAdmin
      .from('notification_preferences')
      .select('email_client_viewed')
      .eq('user_id', invoice.user_id)
      .single();

    // If client viewed notifications are disabled
    if (!prefsError && prefs && !prefs.email_client_viewed) {
      console.log(`Invoice tracking: User ${invoice.user_id} has view alerts disabled.`);
      return;
    }

    // 3. Verify client has not already triggered this alert to prevent duplicate emails
    if (invoice.client_viewed_notified) {
      console.log(`Invoice tracking: User already notified for invoice ${invoiceId}`);
      return;
    }

    // Mark as notified
    const { error: updateError } = await supabaseAdmin
      .from('invoices')
      .update({ client_viewed_notified: true })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Invoice tracking: Failed to update client_viewed_notified status', updateError);
      return;
    }

    // 4. Retrieve seller's email address from auth.users
    let freelancerEmail = '';
    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(invoice.user_id);
    if (!authUserError && authUser?.user) {
      freelancerEmail = authUser.user.email || '';
    }

    if (freelancerEmail) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@invoicewala.in';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const totalAmount = Number(invoice.total_amount);
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(totalAmount);

      await resend.emails.send({
        from: fromEmail,
        to: freelancerEmail,
        subject: `Client Viewed Invoice #${invoice.invoice_number} 👀`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 24px; font-weight: bold; color: #6C63FF;">InvoiceWala</span>
            </div>
            <h2 style="color: #0f172a; margin-bottom: 16px; text-align: center;">Invoice Viewed! 👀</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Great news! Your client, <strong>${invoice.client?.name || 'Customer'}</strong>, has just viewed <strong>Invoice #${invoice.invoice_number}</strong> (${formattedAmount}).
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${appUrl}/dashboard/invoices/${invoice.id}" 
                 style="display: inline-block; background-color: #6C63FF; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px;">
                View Invoice Details
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 11px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
              This notification was sent automatically because client tracking was triggered. To turn off these alerts, update your Notification Settings in the dashboard.
            </p>
          </div>
        `,
      });
      console.log(`Invoice tracking: Alert email dispatched successfully to ${freelancerEmail}`);
    }
  } catch (err) {
    console.error('Invoice tracking failed:', err);
  }
}
