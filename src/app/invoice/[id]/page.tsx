import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import PublicInvoiceViewClient from '@/components/invoice/PublicInvoiceViewClient';
import { Invoice, Client, Profile } from '@/types';

export const revalidate = 0;

interface Props {
  params: { id: string };
}

// Mock Data for Demo/Testing
const mockInvoiceData = {
  invoice: {
    id: 'test-invoice-id',
    user_id: 'test-user-id',
    client_id: 'test-client-id',
    invoice_number: 'INV-2026-008',
    invoice_date: '2026-06-04',
    due_date: '2026-06-19',
    status: 'sent' as const,
    place_of_supply: '29-Karnataka',
    subtotal: 130000.00,
    cgst_amount: 0.00,
    sgst_amount: 0.00,
    igst_amount: 23400.00,
    total_amount: 153400.00,
    amount_paid: 0.00,
    notes: 'Thank you for your business. Please complete the payment before the due date.',
    terms: 'Payment is due within 15 days of invoice date. Late payments are subject to interest.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: 'test-client-id',
      name: 'Bharat Digital Corp',
      email: 'accounts@bharatdigital.com',
      phone: '+91 98765 43210',
      gstin: '29BBBBB1111B2Z',
      address: '102, Silicon Valley Outer Ring Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    }
  },
  items: [
    {
      id: 'item-1',
      invoice_id: 'test-invoice-id',
      description: 'UI/UX Design Consultation',
      hsn_sac: '998311',
      quantity: 1,
      rate: 80000.00,
      gst_rate: 18,
      taxable_amount: 80000.00,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: 18,
      igst_amount: 14400.00,
      total_amount: 94400.00,
      sort_order: 0,
    },
    {
      id: 'item-2',
      invoice_id: 'test-invoice-id',
      description: 'Frontend React Development',
      hsn_sac: '998313',
      quantity: 1,
      rate: 50000.00,
      gst_rate: 18,
      taxable_amount: 50000.00,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: 18,
      igst_amount: 9000.00,
      total_amount: 59000.00,
      sort_order: 1,
    }
  ],
  profile: {
    id: 'test-user-id',
    business_name: 'Acme Design Studio',
    gstin: '27AAAAA0000A1Z',
    address: '405, Prestige Towers, Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    phone: '+91 99999 88888',
    logo_url: null,
    bank_name: 'HDFC Bank',
    bank_account: '50100200300405',
    bank_ifsc: 'HDFC0000123',
    signature_url: null,
    invoice_prefix: 'INV',
    next_invoice_number: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  sellerEmail: 'billing@acmedesign.com'
};

// Generate Dynamic OG Metadata for Whatsapp and sharing previews
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.id === 'test-invoice-id') {
    const titleText = `Invoice #${mockInvoiceData.invoice.invoice_number} from ${mockInvoiceData.profile.business_name}`;
    const descText = `Amount: ₹1,53,400 | Due Date: 19 Jun 2026`;
    return {
      title: titleText,
      description: descText,
      openGraph: {
        title: titleText,
        description: descText,
        type: 'website',
      },
    };
  }

  try {
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', params.id)
      .single();

    if (!invoice) {
      return {
        title: 'Invoice Not Found | InvoiceWala',
      };
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('business_name')
      .eq('id', invoice.user_id)
      .single();

    const businessName = profile?.business_name || 'Seller';
    const totalFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(invoice.total_amount);

    const formattedDueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Upon Receipt';

    const titleText = `Invoice #${invoice.invoice_number} from ${businessName}`;
    const descText = `Amount: ${totalFormatted} | Due Date: ${formattedDueDate}`;

    return {
      title: titleText,
      description: descText,
      openGraph: {
        title: titleText,
        description: descText,
        type: 'website',
      },
    };
  } catch (err) {
    console.error('Metadata generation failed:', err);
    return {
      title: 'Invoice Details | InvoiceWala',
    };
  }
}

export default async function PublicInvoicePage({ params }: Props) {
  // 0. Fallback mock check for local testing
  if (params.id === 'test-invoice-id') {
    return (
      <PublicInvoiceViewClient
        invoice={mockInvoiceData.invoice as unknown as (Invoice & { client: Client })}
        items={mockInvoiceData.items}
        profile={mockInvoiceData.profile as unknown as Profile}
        sellerEmail={mockInvoiceData.sellerEmail}
      />
    );
  }

  // 1. Fetch Invoice with Client relation
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('id', params.id)
    .single();

  if (!invoice) {
    notFound();
  }

  // 2. Fetch Invoice Items
  const { data: items } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', params.id)
    .order('sort_order', { ascending: true });

  // 3. Fetch Freelancer profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', invoice.user_id)
    .single();

  if (!profile) {
    notFound();
  }

  // 4. Try to fetch seller's email address from auth users
  let sellerEmail = '';
  try {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(invoice.user_id);
    if (authUser?.user) {
      sellerEmail = authUser.user.email || '';
    }
  } catch (err) {
    console.error('Failed to retrieve auth user email:', err);
  }

  // 5. Trigger email alert tracking asynchronously if not draft
  if (invoice.status !== 'draft') {
    const { trackInvoiceView } = await import('@/lib/email/track');
    trackInvoiceView(invoice.id).catch((err) => {
      console.error('Failed to track client view:', err);
    });
  }

  return (
    <PublicInvoiceViewClient
      invoice={invoice as unknown as (Invoice & { client: Client })}
      items={items || []}
      profile={profile}
      sellerEmail={sellerEmail || undefined}
    />
  );
}
