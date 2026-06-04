import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Razorpay from 'razorpay';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Check if the user has a referrer
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const referrerId = profile.referred_by;
    if (!referrerId) {
      return NextResponse.json({ message: 'User was not referred' });
    }

    // 2. Fetch the referrer's profile details
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('profiles')
      .select('referrals_rewarded')
      .eq('id', referrerId)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json({ error: 'Referrer profile not found' }, { status: 404 });
    }

    // 3. Retrieve referrer's email from auth.users
    let referrerEmail = '';
    try {
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(referrerId);
      if (!authUserError && authUser?.user) {
        referrerEmail = authUser.user.email || '';
      }
    } catch (err) {
      console.error('Failed to retrieve referrer email:', err);
    }

    // 4. Query all profiles referred by this referrer
    const { data: referredProfiles, error: referredError } = await supabaseAdmin
      .from('profiles')
      .select('id, subscriptions(plan, status)')
      .eq('referred_by', referrerId);

    if (referredError || !referredProfiles) {
      console.error('Failed to query referred profiles:', referredError);
      return NextResponse.json({ error: 'Failed to compile referral stats' }, { status: 500 });
    }

    // Count successful conversions (sub is plan pro/business and status active)
    const successfulCount = referredProfiles.filter((p) => {
      const sub = Array.isArray(p.subscriptions) ? p.subscriptions[0] : p.subscriptions;
      return sub && (sub.plan === 'pro' || sub.plan === 'business') && sub.status === 'active';
    }).length;

    const currentRewarded = referrer.referrals_rewarded || 0;
    const expectedRewards = Math.floor(successfulCount / 3);

    // 5. If eligible for a reward, update their subscription and trigger Resend email
    if (expectedRewards > currentRewarded) {
      const rewardMonths = expectedRewards - currentRewarded;

      const { data: sub, error: subErr } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', referrerId)
        .single();

      if (subErr || !sub) {
        console.error('Failed to fetch referrer subscription:', subErr);
        return NextResponse.json({ error: 'Referrer subscription not found' }, { status: 404 });
      }

      // Calculate new period end date
      let currentEnd = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
      if (currentEnd < new Date()) {
        currentEnd = new Date();
      }
      currentEnd.setMonth(currentEnd.getMonth() + rewardMonths);
      const updatedPeriodEnd = currentEnd.toISOString();

      // a. Update database subscription
      const { error: dbUpdateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan: sub.plan === 'free' ? 'pro' : sub.plan, // Promote free to pro, otherwise keep plan
          status: 'active',
          current_period_end: updatedPeriodEnd,
        })
        .eq('user_id', referrerId);

      if (dbUpdateError) {
        console.error('Failed to update subscription in database:', dbUpdateError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // b. Sync next billing cycle with Razorpay
      if (sub.razorpay_subscription_id) {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
          });

          const startAtTimestamp = Math.floor(currentEnd.getTime() / 1000);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subsApi = razorpay.subscriptions as any;
          const updateMethod = subsApi.update || subsApi.edit;
          
          if (updateMethod) {
            await updateMethod.call(subsApi, sub.razorpay_subscription_id, {
              start_at: startAtTimestamp,
              schedule_change_at: 'now',
            });
            console.log(`Razorpay subscription ${sub.razorpay_subscription_id} rescheduled to ${updatedPeriodEnd}`);
          }
        } catch (rzpErr) {
          console.error('Failed to update Razorpay subscription billing date:', rzpErr);
          // Don't fail the response since DB was successfully updated and extended
        }
      }

      // c. Update referrals_rewarded metadata in profiles
      await supabaseAdmin
        .from('profiles')
        .update({
          referrals_rewarded: expectedRewards,
        })
        .eq('id', referrerId);

      // d. Send reward notification email via Resend
      if (referrerEmail) {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@invoicewala.in';
        const formattedDate = currentEnd.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        try {
          await resend.emails.send({
            from: fromEmail,
            to: referrerEmail,
            subject: 'You earned 1 month of FREE Pro Subscription! 🎁',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <span style="font-size: 24px; font-weight: bold; color: #6C63FF;">InvoiceWala</span>
                </div>
                <h2 style="color: #0f172a; margin-bottom: 16px; text-align: center;">Congratulations! 🎉</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                  You successfully referred friends to InvoiceWala. As a thank you for driving our growth, we have extended your subscription by <strong>${rewardMonths} month${rewardMonths > 1 ? 's' : ''} for free!</strong>
                </p>
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                  <span style="font-size: 13px; font-weight: bold; color: #475569; display: block; margin-bottom: 6px;">NEW BILLING PERIOD END DATE</span>
                  <span style="font-size: 20px; font-weight: black; color: #6C63FF;">${formattedDate}</span>
                </div>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                  Keep sharing your referral link to earn even more free months!
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/referral" 
                     style="display: inline-block; background-color: #6C63FF; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px rgba(108, 99, 255, 0.1);">
                    View Referral Dashboard
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 11px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
                  This reward email was sent because you successfully unlocked a referral milestone. Thank you for using InvoiceWala.
                </p>
              </div>
            `,
          });
          console.log(`Referral reward email sent to ${referrerEmail}`);
        } catch (emailErr) {
          console.error('Failed to send referral reward email:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        rewarded: true,
        newRewardedCount: expectedRewards,
        newPeriodEnd: updatedPeriodEnd,
      });
    }

    return NextResponse.json({
      success: true,
      rewarded: false,
      message: `User referred, but referrer is not eligible for new reward yet. Converted: ${successfulCount}, Rewarded: ${currentRewarded}`,
    });
  } catch (error) {
    console.error('Error in referral reward API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
