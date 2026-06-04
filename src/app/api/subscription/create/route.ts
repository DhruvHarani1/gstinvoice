/**
 * RAZORPAY SUBSCRIPTION PLAN CREATION INSTRUCTIONS:
 * 1. Log in to your Razorpay Dashboard (https://dashboard.razorpay.com).
 * 2. Ensure you are in Live Mode (or Test Mode for development).
 * 3. Go to "Subscriptions" in the sidebar, and select "Plans".
 * 4. Click "Create Plan" and specify:
 *    - Plan Name: "Pro" or "Business"
 *    - Billing Frequency: Monthly (or as preferred)
 *    - Amount (INR): e.g., 299 for Pro, 599 for Business.
 * 5. Copy the generated Plan IDs (starting with `plan_`).
 * 6. Define these environment variables in your Vercel settings or .env.local file:
 *    - RAZORPAY_PLAN_PRO_ID=plan_PRO_ID_FROM_DASHBOARD
 *    - RAZORPAY_PLAN_BUSINESS_ID=plan_BUSINESS_ID_FROM_DASHBOARD
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Authenticate user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body for target plan type
    const { plan } = await request.json();
    if (plan !== 'pro' && plan !== 'business') {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Get configured plan ID
    const planId = plan === 'business'
      ? process.env.RAZORPAY_PLAN_BUSINESS_ID
      : process.env.RAZORPAY_PLAN_PRO_ID;

    if (!planId) {
      return NextResponse.json(
        { error: `Razorpay Plan ID for '${plan}' is not configured on the server.` },
        { status: 500 }
      );
    }

    // 3. Fetch user profile and existing subscription details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.razorpay_customer_id;

    // 4. Create customer in Razorpay if not already linked
    if (!customerId) {
      try {
        const customer = await razorpay.customers.create({
          name: profile?.business_name || user.email || 'Business Owner',
          email: user.email!,
          contact: profile?.phone || undefined,
        });
        customerId = customer.id;

        // Save customer ID back to database subscription record
        await supabase
          .from('subscriptions')
          .update({ razorpay_customer_id: customerId })
          .eq('user_id', user.id);
      } catch (custErr) {
        console.error('Failed to create Razorpay customer:', custErr);
        return NextResponse.json(
          { error: `Razorpay customer registration failed: ${custErr instanceof Error ? custErr.message : 'Unknown customer error'}` },
          { status: 500 }
        );
      }
    }

    // 5. Create Subscription in Razorpay (casting to any to bypass typings gaps)
    const rzpSubscription = (await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: 120, // 10 years monthly cycles
      quantity: 1,
    } as unknown as Parameters<typeof razorpay.subscriptions.create>[0])) as unknown as { id: string };

    // 6. Record the pending subscription ID to our database
    await supabase
      .from('subscriptions')
      .update({
        razorpay_subscription_id: rzpSubscription.id,
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      subscription_id: rzpSubscription.id,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    });
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
