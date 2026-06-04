import React from 'react';
import { Receipt, CheckCircle2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left side: Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 bg-white">
        <div className="w-full max-w-md">
          {/* Logo (Centered on mobile, left-aligned on desktop) */}
          <div className="flex items-center gap-2 mb-8 justify-center md:justify-start">
            <div className="p-2 bg-indigo-50 text-[#6C63FF] rounded-lg">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Invoice<span className="text-[#6C63FF]">Wala</span>
            </span>
          </div>
          {children}
        </div>
      </div>

      {/* Right side: Decorative Panel (hidden on mobile) */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 lg:p-20 bg-gradient-to-tr from-[#554ce6] to-[#7f77ff] text-white">
        {/* Top Header Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 text-white rounded-lg backdrop-blur-sm">
            <Receipt className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Invoice<span className="text-indigo-200">Wala</span>
          </span>
        </div>

        {/* Tagline & Value Props */}
        <div className="my-auto space-y-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            GST invoices in <span className="underline decoration-indigo-200 decoration-wavy">30 seconds</span>.
          </h1>
          <p className="text-indigo-100 text-lg max-w-md">
            The easiest and fastest invoicing software built for Indian small businesses, freelancers, and enterprises.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-indigo-200 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">GST Compliance Made Simple</h4>
                <p className="text-indigo-100 text-sm">Automatic CGST, SGST, and IGST calculation based on place of supply.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-indigo-200 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Professional PDF Bills</h4>
                <p className="text-indigo-100 text-sm">Generate and download GST-ready PDF invoices to send directly to your customers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-indigo-200 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">UPI & Credit Card Collections</h4>
                <p className="text-indigo-100 text-sm">Collect payments seamlessly via Razorpay integration linked to your invoices.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-indigo-200">
          &copy; {new Date().getFullYear()} InvoiceWala. Made for Bharat 🇮🇳
        </div>
      </div>
    </div>
  );
}
