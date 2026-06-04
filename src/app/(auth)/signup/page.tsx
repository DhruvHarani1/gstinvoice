import type { Metadata } from 'next';
import SignupPageClient from './SignupPageClient';

export const metadata: Metadata = {
  title: "Create your free account",
  description: "Start generating professional GST invoices for free. Sign up to InvoiceWala in seconds.",
  alternates: {
    canonical: "/signup",
  },
};

export default function Page() {
  return <SignupPageClient />;
}
