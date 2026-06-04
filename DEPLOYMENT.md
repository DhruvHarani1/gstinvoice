# InvoiceWala Production Deployment Guide

Follow these guidelines to deploy **InvoiceWala** in a secure, production-ready state on Vercel.

---

## 🔑 Environment Variables Glossary

Configure the following environment variables in your Vercel Project Settings under **Environment Variables**:

| Variable Name | Source / Description | Example / Value format |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project dashboard -> Project Settings -> API | `https://yourproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project dashboard -> Project Settings -> API | `sb_publishable_anon_key_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase -> API (Keep private, bypasses RLS for webhooks/crons) | `sb_secret_service_role_key_...` |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard -> Account & Settings -> API Keys | `rzp_live_...` or `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard -> Account & Settings -> API Keys | `your_razorpay_secret_key` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Safe to expose, pre-fills payment modals in client | Same as `RAZORPAY_KEY_ID` |
| `RAZORPAY_WEBHOOK_SECRET` | Created when defining Razorpay Webhook alerts | `your_custom_webhook_secret` |
| `RAZORPAY_PLAN_PRO_ID` | Razorpay -> Subscriptions -> Plans (₹299/mo Pro Plan) | `plan_PRO_ID` |
| `RAZORPAY_PLAN_BUSINESS_ID` | Razorpay -> Subscriptions -> Plans (₹599/mo Business Plan) | `plan_BUSINESS_ID` |
| `RESEND_API_KEY` | Resend.com -> API Keys | `re_...` |
| `RESEND_FROM_EMAIL` | Domain verified in Resend. Defaults to invoices@domain. | `invoices@invoicewala.in` |
| `NEXT_PUBLIC_APP_URL` | Domain URL of your production website | `https://invoicewala.in` |
| `CRON_SECRET` | Custom random string securing cron APIs | `super_secret_cron_passphrase` |

---

## 🛠️ Step-by-Step Vercel Deployment

1. **Push Code**: Commit all changes and push them to your production branch (e.g., `main`) on GitHub/GitLab/Bitbucket.
2. **Import Project**: Log in to Vercel, click **Add New** -> **Project**, and import your repository.
3. **Environment Setup**: In the configuration panel, paste all keys defined in the Environment Variables table above.
4. **Deploy**: Click **Deploy**. Vercel will build, lint, and serve the application globally.

---

## ⚡ Supabase Production Configuration Checklist

Before sending traffic, verify the following settings on your Supabase remote project dashboard:

1. **Apply Migrations**: Execute the SQL scripts located in `supabase/migrations/` (specifically `001_initial_schema.sql`, `002_referral_system.sql`, and `003_growth_retention.sql`) inside the Supabase SQL Editor.
2. **Authentication Settings**:
   - Go to **Authentication** -> **URL Configuration**.
   - Set **Site URL** to `https://invoicewala.in`.
   - Add Redirect URLs: `https://invoicewala.in/auth/callback` and `http://localhost:3000/auth/callback`.
3. **Enable Email Confirmation**: Under **Authentication** -> **Providers** -> **Email**, toggle **Confirm Email** ON to verify user accounts on signup.
4. **Configure Custom SMTP**: To prevent emails from going to spam or hitting rate limits, configure custom SMTP credentials (e.g., using Amazon SES, Mailgun, or Resend) under **Authentication** -> **SMTP Settings**.

---

## 💳 Razorpay Live Integration Checklist

1. **KYC Verification**: Submit business KYC verification on the Razorpay Dashboard (takes 1-2 business days for approval).
2. **API Keys**: Once activated, switch to **Live Mode** in the dashboard and generate Live API Keys. Set them as Vercel env vars (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
3. **Subscription Plans**: Go to **Subscriptions** -> **Plans** -> **Create Plan**. Create plans for Pro and Business, and copy the plan IDs to Vercel env vars.
4. **Webhook Setup**:
   - Go to **Account & Settings** -> **Webhooks** -> **Add New Webhook**.
   - **Webhook URL**: `https://invoicewala.in/api/subscription/webhook`
   - **Secret**: Enter a secure secret key and set it as `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**: Check `subscription.activated`, `subscription.charged`, `subscription.cancelled`, and `payment.failed`.

---

## 🌐 Custom Domain Setup

1. In the Vercel dashboard, go to **Settings** -> **Domains**.
2. Type `invoicewala.in` and click **Add**.
3. Configure DNS records on GoDaddy or your registrar pointing to Vercel's nameservers or CNAME targets as described in the Vercel instructions.
