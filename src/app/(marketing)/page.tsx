import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

export const metadata: Metadata = {
  title: "GST Invoices in 30 Seconds for Indian Freelancers",
  description: "Stop making invoices in Excel. InvoiceWala generates professional GST invoices, sends them to clients, and tracks payments — all in one place.",
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return <LandingPageClient />;
}
