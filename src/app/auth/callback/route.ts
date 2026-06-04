import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // Handle referral link via cookie if present (especially for Google OAuth)
      try {
        const cookieHeader = request.headers.get('cookie') || '';
        const referredByCodeMatch = cookieHeader.match(/referred_by_code=([^;]+)/);
        const referredByCode = referredByCodeMatch ? decodeURIComponent(referredByCodeMatch[1]) : null;

        if (referredByCode) {
          const { data: dbProfile } = await supabaseAdmin
            .from('profiles')
            .select('referred_by')
            .eq('id', user.id)
            .single();

          if (dbProfile && !dbProfile.referred_by) {
            // Find referrer profile
            const { data: referrer } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('referral_code', referredByCode)
              .single();

            if (referrer && referrer.id !== user.id) {
              await supabaseAdmin
                .from('profiles')
                .update({ referred_by: referrer.id })
                .eq('id', user.id);
              console.log(`Linked user ${user.id} to referrer ${referrer.id} via callback cookie`);
            }
          }
        }
      } catch (refErr) {
        console.error('Failed to link referral in callback:', refErr);
      }

      // Query profiles to check if onboarding is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, address, state')
        .eq('id', user.id)
        .single();

      // If business_name is default 'My Business', address is missing, or state is default 'Other', onboarding is needed
      const isOnboardingNeeded =
        !profile ||
        profile.business_name === 'My Business' ||
        !profile.address ||
        profile.state === 'Other';

      if (isOnboardingNeeded) {
        return NextResponse.redirect(`${origin}/dashboard/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Authentication failed, return to login with error query param
  return NextResponse.redirect(
    `${origin}/login?error=Could not exchange code for session`
  );
}
export const dynamic = 'force-dynamic';
