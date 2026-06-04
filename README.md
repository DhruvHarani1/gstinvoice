# Invoicewala

Invoicewala is a modern, high-performance invoice billing and payment application built with Next.js 14, React, Tailwind CSS, Supabase, Resend, and Razorpay. It facilitates generating, downloading, mailing, and tracking GST-compliant invoices.

## Tech Stack & Architecture

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) for fully responsive utility-first layout customization
- **Database & Auth:** [Supabase](https://supabase.com/) via `@supabase/supabase-js` and `@supabase/ssr`
- **PDF Generation:** `@react-pdf/renderer` for dynamic server/client side invoice generation and download
- **Form Handling:** `react-hook-form` with `zod` for robust client/server type-safe form validations
- **Payment Processing:** `razorpay` integration for invoice payment settlement
- **Email Delivery:** `resend` for sending invoice notifications to customers
- **Icons:** `lucide-react` for modern icon assets

---

## Directory Structure

```
invoicewala/
├── src/
│   ├── app/             # Next.js App Router routes & layouts
│   ├── components/      # UI Components
│   └── lib/
│       └── utils.ts     # Tailwired styling helpers (cn function)
├── .env.local           # Local environment variables configuration
├── tailwind.config.ts   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

---

## Setup & Installation

### 1. Clone the project and install dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create or update the `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Build for Production

```bash
npm run build
```
