-- 1. Add invoices_created_count to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN invoices_created_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Add client_viewed_notified to invoices
ALTER TABLE public.invoices 
ADD COLUMN client_viewed_notified BOOLEAN DEFAULT FALSE NOT NULL;

-- 3. Backfill invoices_created_count for existing subscriptions
UPDATE public.subscriptions s
SET invoices_created_count = (
  SELECT COUNT(*) FROM public.invoices i
  WHERE i.user_id = s.user_id
);

-- 4. Create trigger to automatically increment invoices_created_count on invoice insert
CREATE OR REPLACE FUNCTION public.increment_invoices_created_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET invoices_created_count = invoices_created_count + 1,
      updated_at = now()
  WHERE user_id = new.user_id;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_invoice_created
  AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.increment_invoices_created_count();

-- 5. Create notification_preferences table
CREATE TABLE public.notification_preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_client_viewed BOOLEAN DEFAULT TRUE NOT NULL,
  email_overdue_reminders BOOLEAN DEFAULT TRUE NOT NULL,
  email_monthly_summary BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger to notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Backfill notification_preferences for existing profiles
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 7. Update handle_new_user trigger function to insert default notification_preferences
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

  -- Insert default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id);

  -- Insert subscription (which now starts with invoices_created_count = 0)
  INSERT INTO public.subscriptions (user_id, plan, status, invoices_created_count)
  VALUES (
    new.id,
    'free',
    'active',
    0
  );

  RETURN new;
END;
$$;

-- 8. Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins (or service role) to select feedback, but restrict standard users
CREATE POLICY "Users can select their own feedback"
  ON public.feedback FOR SELECT
  USING (user_id = auth.uid());
