import type { Metadata } from 'next';
import LoginPageClient from './LoginPageClient';

export const metadata: Metadata = {
  title: "Login to your account",
  description: "Sign in to your InvoiceWala account to generate, track, and manage your GST invoices.",
  alternates: {
    canonical: "/login",
  },
};

export default function Page() {
  return <LoginPageClient />;
}
