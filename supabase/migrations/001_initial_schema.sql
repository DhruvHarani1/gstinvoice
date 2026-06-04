-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create trigger function for updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT NOT NULL,
  pincode TEXT,
  phone TEXT,
  logo_url TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  signature_url TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  next_invoice_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  place_of_supply TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  cgst_amount NUMERIC(12,2) DEFAULT 0.00,
  sgst_amount NUMERIC(12,2) DEFAULT 0.00,
  igst_amount NUMERIC(12,2) DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12,2) DEFAULT 0.00,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger to invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  hsn_sac TEXT,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1.000,
  rate NUMERIC(12,2) NOT NULL,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  taxable_amount NUMERIC(12,2) NOT NULL,
  cgst_rate NUMERIC(5,2) DEFAULT 9.00,
  cgst_amount NUMERIC(12,2) DEFAULT 0.00,
  sgst_rate NUMERIC(5,2) DEFAULT 9.00,
  sgst_amount NUMERIC(12,2) DEFAULT 0.00,
  igst_rate NUMERIC(5,2) DEFAULT 0.00,
  igst_amount NUMERIC(12,2) DEFAULT 0.00,
  total_amount NUMERIC(12,2) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 5. Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  invoice_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger to subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger function for automatic user profile & subscription creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, state)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'My Business'),
    coalesce(new.raw_user_meta_data->>'state', 'Other')
  );

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (
    new.id,
    'free',
    'active'
  );

  RETURN new;
END;
$$;

-- Trigger to execute when a new user signs up in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies

-- profiles policies
CREATE POLICY "Users can select their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- clients policies
CREATE POLICY "Users can select their own clients"
  ON public.clients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (user_id = auth.uid());

-- invoices policies
CREATE POLICY "Users can select their own invoices"
  ON public.invoices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (user_id = auth.uid());

-- invoice_items policies
CREATE POLICY "Users can select their own invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own invoice items"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own invoice items"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own invoice items"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- subscriptions policies
CREATE POLICY "Users can select their own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own subscription"
  ON public.subscriptions FOR DELETE
  USING (user_id = auth.uid());
