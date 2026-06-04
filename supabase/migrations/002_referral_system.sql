-- Alter profiles table to add referral columns
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT,
ADD COLUMN referred_by UUID REFERENCES public.profiles(id),
ADD COLUMN referrals_rewarded INTEGER DEFAULT 0 NOT NULL;

-- Backfill unique referral codes for existing users
UPDATE public.profiles
SET referral_code = upper(substring(md5(id::text || random()::text) from 1 for 8))
WHERE referral_code IS NULL;

-- Set constraints on referral_code now that all are populated
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);

-- Update the handle_new_user trigger function to populate referral codes and link referrers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  referrer_id UUID;
  new_referral_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Resolve referrer from metadata referred_by_code if provided
  IF new.raw_user_meta_data->>'referred_by_code' IS NOT NULL THEN
    SELECT id INTO referrer_id FROM public.profiles 
    WHERE referral_code = (new.raw_user_meta_data->>'referred_by_code')
    LIMIT 1;
  END IF;

  -- Generate unique 8-character uppercase referral code
  LOOP
    new_referral_code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- Insert user profile with referral info
  INSERT INTO public.profiles (
    id, 
    business_name, 
    state, 
    referral_code, 
    referred_by,
    referrals_rewarded
  )
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'My Business'),
    coalesce(new.raw_user_meta_data->>'state', 'Other'),
    new_referral_code,
    referrer_id,
    0
  );

  -- Insert subscription
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (
    new.id,
    'free',
    'active'
  );

  RETURN new;
END;
$$;

-- RLS policy to allow referrers to select profiles they referred
CREATE POLICY "Users can select profiles they referred"
  ON public.profiles FOR SELECT
  USING (referred_by = auth.uid());

-- RLS policy to allow referrers to select subscriptions of users they referred
CREATE POLICY "Users can select subscriptions of users they referred"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = subscriptions.user_id
      AND profiles.referred_by = auth.uid()
    )
  );
