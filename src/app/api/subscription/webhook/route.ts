import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client with service role key to bypass RLS policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature header missing' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Validate signature signature if secret key is present
    if (secret) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(bodyText)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Razorpay webhook signature verification failed.');
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
      }
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    
    console.log(`Razorpay webhook triggered event: ${event}`);

    // Handle payment failure event (not subscription entity itself, but links to it)
    if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const rzpSubscriptionId = paymentEntity?.subscription_id;
      
      if (rzpSubscriptionId) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('razorpay_subscription_id', rzpSubscriptionId);
        console.log(`Subscription ${rzpSubscriptionId} flagged as past_due due to payment failure.`);
      }
      return NextResponse.json({ status: 'ok' });
    }

    const subscriptionEntity = payload.payload?.subscription?.entity;
    if (!subscriptionEntity) {
      return NextResponse.json({ status: 'ok', message: 'No subscription payload found' });
    }

    const subscriptionId = subscriptionEntity.id;
    const periodEnd = subscriptionEntity.current_end 
      ? new Date(subscriptionEntity.current_end * 1000).toISOString() 
      : null;

    // Determine plan name by matching Plan ID
    let planName: 'free' | 'pro' | 'business' = 'free';
    if (subscriptionEntity.plan_id === process.env.RAZORPAY_PLAN_BUSINESS_ID) {
      planName = 'business';
    } else if (subscriptionEntity.plan_id === process.env.RAZORPAY_PLAN_PRO_ID) {
      planName = 'pro';
    } else {
      console.warn('Received unknown plan ID, falling back to Pro:', subscriptionEntity.plan_id);
      planName = 'pro'; // default fallback for testing/graceful handling
    }

    switch (event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        // Retrieve the user_id associated with this subscription ID
        const { data: subData } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('razorpay_subscription_id', subscriptionId)
          .single();

        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: planName,
            status: 'active',
            current_period_end: periodEnd,
          })
          .eq('razorpay_subscription_id', subscriptionId);
        console.log(`Subscription ${subscriptionId} status set to active (Plan: ${planName})`);

        // Trigger referral reward check if user is upgraded
        if (subData?.user_id && (planName === 'pro' || planName === 'business')) {
          try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const res = await fetch(`${appUrl}/api/referral/reward`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: subData.user_id }),
            });
            const resText = await res.text();
            console.log(`Triggered referral check for user ${subData.user_id}. Response:`, resText);
          } catch (err) {
            console.error('Failed to trigger referral reward check:', err);
          }
        }
        break;
      }

      case 'subscription.cancelled':
        await supabaseAdmin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'cancelled',
            current_period_end: null,
          })
          .eq('razorpay_subscription_id', subscriptionId);
        console.log(`Subscription ${subscriptionId} cancelled, account returned to Free plan.`);
        break;

      default:
        console.log(`Unhandled Razorpay event trigger: ${event}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling webhook payload:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
