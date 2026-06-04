# Supabase Storage Setup Instructions

To support business logo and signature image uploads, you must create two storage buckets in your Supabase project dashboard.

## 1. Create the 'logos' Bucket
1. Log in to your **Supabase Dashboard** (https://supabase.com/dashboard).
2. Select your project.
3. In the left-hand navigation bar, click on **Storage**.
4. Click on **New bucket** at the top.
5. Set the **Bucket Name** exactly as: `logos`
6. Toggle the **Public bucket** switch to **ON** (so images are publicly readable via getPublicUrl).
7. Click **Create bucket**.

---

## 2. Create the 'signatures' Bucket
1. Inside the **Storage** section, click **New bucket** again.
2. Set the **Bucket Name** exactly as: `signatures`
3. Toggle the **Public bucket** switch to **ON**.
4. Click **Create bucket**.

---

## 3. Set Up RLS Policies
By default, authenticated users should be allowed to upload files to these buckets. Let's configure the Policies:

1. Click on the **logos** bucket in the Storage list, and select **Policies** (or go to **Database** -> **Policies** -> **Storage**).
2. Click **New Policy** under the `logos` bucket:
   - Choose **Get started quickly** (or manual template).
   - Under **Allowed operations**, select **INSERT** and **UPDATE**.
   - Under **Target roles**, select `authenticated`.
   - Set the policy condition so users can upload files:
     `auth.role() = 'authenticated'`
   - Save the policy.
3. Repetitively, click on the **signatures** bucket, click **New Policy**, and allow **INSERT** and **UPDATE** operations for `authenticated` users with the same condition:
   - Condition: `auth.role() = 'authenticated'`
   - Save the policy.

*Note: Public read access is enabled automatically because the buckets are marked as **Public**, meaning anyone with the public URL can display the image on invoices and templates.*
