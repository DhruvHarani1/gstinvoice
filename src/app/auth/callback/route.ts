import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

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
