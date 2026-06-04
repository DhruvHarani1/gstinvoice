import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export async function POST() {
  try {
    const supabase = createClient();

    // 1. Authenticate user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the user's active subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No subscription record found' },
        { status: 404 }
      );
    }

    const rzpSubscriptionId = subscription.razorpay_subscription_id;
    if (!rzpSubscriptionId) {
      return NextResponse.json(
        { error: 'No active Razorpay subscription to cancel.' },
        { status: 400 }
      );
    }

    // 3. Request Razorpay to cancel subscription at the end of current cycle
    try {
      await razorpay.subscriptions.cancel(rzpSubscriptionId, true);
    } catch (rzpErr) {
      console.error('Razorpay cancellation failed:', rzpErr);
      return NextResponse.json(
        { error: `Razorpay cancellation failed: ${rzpErr instanceof Error ? rzpErr.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // 4. Update local database status to 'cancelled'
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update subscription status in DB:', updateError);
      return NextResponse.json({
        success: true,
        warning: 'Subscription cancelled in Razorpay, but local database status update failed.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription has been scheduled for cancellation at the end of the billing cycle.',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
