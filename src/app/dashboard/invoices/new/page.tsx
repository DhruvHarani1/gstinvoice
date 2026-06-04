'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const InvoiceBuilderNew = dynamic(
  () => import('@/components/invoices/InvoiceBuilderNew'),
  {
    loading: () => (
      <div className="flex flex-col justify-center items-center py-40 gap-4">
        <LoadingSpinner />
        <p className="text-slate-500 text-sm font-semibold">Loading Invoice Builder...</p>
      </div>
    ),
    ssr: false,
  }
);

export default function NewInvoicePage() {
  return <InvoiceBuilderNew />;
}
