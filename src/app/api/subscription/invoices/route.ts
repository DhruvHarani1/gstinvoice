import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export async function GET() {
  try {
    const supabase = createClient();

    // 1. Authenticate user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user's subscription record to get customer_id
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', user.id)
      .single();

    const customerId = subscription?.razorpay_customer_id;
    if (!customerId) {
      return NextResponse.json([]);
    }

    // 3. Query Razorpay for invoices linked to this customer
    try {
      const invoices = await razorpay.invoices.all({
        customer_id: customerId,
      });

      return NextResponse.json(invoices.items || []);
    } catch (rzpErr) {
      console.error('Failed to fetch invoices from Razorpay:', rzpErr);
      return NextResponse.json([]); // Return empty list rather than throwing to avoid breaking UI settings page
    }
  } catch (error) {
    console.error('Error fetching billing invoices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
