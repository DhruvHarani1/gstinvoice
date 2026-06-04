'use client';

import React, { useState } from 'react';
import { 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Building2,
  Loader2,
  Check,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, Client, InvoiceItem, Profile } from '@/types';
import { numberToIndianWords, formatIndianCurrency } from '@/lib/utils';

interface PublicInvoiceViewClientProps {
  invoice: Invoice & { client: Client };
  items: InvoiceItem[];
  profile: Profile;
  sellerEmail?: string;
}

export default function PublicInvoiceViewClient({
  invoice: initialInvoice,
  items,
  profile,
  sellerEmail,
}: PublicInvoiceViewClientProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const totalAmount = Number(invoice.total_amount);
  const isIntrastate = profile.state === invoice.place_of_supply;

  // Mark invoice as paid
  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true);
    try {
      const response = await fetch(`/api/invoice/${invoice.id}/paid`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to update payment status.');
        return;
      }

      toast.success('Payment notification sent! Invoice marked as paid.');
      setInvoice((prev) => ({
        ...prev,
        status: 'paid',
        amount_paid: totalAmount,
        updated_at: new Date().toISOString(),
      }));
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while confirming payment.');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // Helper date formatter
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner Headers based on Invoice Status */}
        {invoice.status === 'paid' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Invoice Paid</p>
              <p className="text-xs text-emerald-700 mt-0.5">This invoice has been settled in full. Thank you!</p>
            </div>
          </div>
        )}

        {invoice.status === 'overdue' && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Invoice Overdue</p>
              <p className="text-xs text-rose-700 mt-0.5">The payment period for this invoice has expired. Please settle the bill as soon as possible.</p>
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">{invoice.invoice_number}</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wide ${
              invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
              invoice.status === 'overdue' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
              invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
              invoice.status === 'cancelled' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
              'bg-slate-50 text-slate-700 border border-slate-100'
            }`}>
              {invoice.status}
            </span>
          </div>

          <div className="flex gap-2 justify-end">
            {/* Download PDF */}
            <a
              href={`/api/invoice/${invoice.id}/pdf`}
              download={`${invoice.invoice_number}.pdf`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>

            {/* Mark as Paid (Client Action) */}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isMarkingPaid ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Mark as Paid
              </button>
            )}
          </div>
        </div>

        {/* Invoice Card UI */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-12 space-y-8">
          
          {/* Header section (Seller Brand + Tax Invoice Indicator) */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 text-[#6C63FF] rounded-lg flex items-center justify-center font-bold text-xl uppercase">
                {profile.business_name ? profile.business_name.charAt(0) : 'B'}
              </div>
              <div>
                <h1 className="font-black text-slate-900 text-base tracking-tight">{profile.business_name}</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">GST Compliant Bill</p>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <h2 className="text-xl font-bold text-[#6C63FF] tracking-wide">TAX INVOICE</h2>
              {profile.gstin && (
                <p className="text-[11px] font-mono font-semibold text-slate-500">GSTIN: {profile.gstin}</p>
              )}
            </div>
          </div>

          {/* Contact Details (Seller vs Metadata Info) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-600">
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Seller Details</h3>
              <p className="font-bold text-slate-800 text-sm">{profile.business_name}</p>
              {profile.address && <p>{profile.address}</p>}
              <p>{[profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}</p>
              {profile.phone && <p>Phone: {profile.phone}</p>}
              {sellerEmail && <p>Email: {sellerEmail}</p>}
            </div>

            <div className="space-y-1 sm:text-right flex flex-col sm:items-end">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 w-full">Invoice Info</h3>
              <table className="text-left text-xs border-collapse">
                <tbody>
                  <tr>
                    <td className="pr-4 py-0.5 text-slate-400 font-medium sm:text-right">Invoice No:</td>
                    <td className="font-mono text-slate-800 font-bold">#{invoice.invoice_number}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-0.5 text-slate-400 font-medium sm:text-right">Invoice Date:</td>
                    <td className="text-slate-700 font-semibold">{formatDate(invoice.invoice_date)}</td>
                  </tr>
                  {invoice.due_date && (
                    <tr>
                      <td className="pr-4 py-0.5 text-slate-400 font-medium sm:text-right">Due Date:</td>
                      <td className="text-slate-700 font-semibold">{formatDate(invoice.due_date)}</td>
                    </tr>
                  )}
                  {invoice.place_of_supply && (
                    <tr>
                      <td className="pr-4 py-0.5 text-slate-400 font-medium sm:text-right">Place of Supply:</td>
                      <td className="text-slate-700 font-semibold">{invoice.place_of_supply}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client Billed To details */}
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/50 text-xs">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</h3>
            <p className="font-bold text-slate-850 text-sm">{invoice.client.name}</p>
            {invoice.client.address && <p className="mt-1 text-slate-600">{invoice.client.address}</p>}
            <p className="text-slate-600">{[invoice.client.city, invoice.client.state, invoice.client.pincode].filter(Boolean).join(', ')}</p>
            {invoice.client.phone && <p className="mt-1 text-slate-500">Phone: {invoice.client.phone}</p>}
            {invoice.client.email && <p className="text-slate-500">Email: {invoice.client.email}</p>}
            {invoice.client.gstin && (
              <p className="mt-2 text-[11px] font-mono font-bold text-slate-600">GSTIN: {invoice.client.gstin}</p>
            )}
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px] text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                  <th className="px-4 py-2 text-center w-8">#</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-center w-24">HSN/SAC</th>
                  <th className="px-4 py-2 text-center w-16">Qty</th>
                  <th className="px-4 py-2 text-right w-24">Rate</th>
                  <th className="px-4 py-2 text-right w-28">CGST/IGST</th>
                  <th className="px-4 py-2 text-right w-24">SGST</th>
                  <th className="px-4 py-2 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item, idx) => {
                  const isOdd = idx % 2 !== 0;
                  return (
                    <tr key={item.id} className={isOdd ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.description}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.hsn_sac || '—'}</td>
                      <td className="px-4 py-3 text-center">{Number(item.quantity)}</td>
                      <td className="px-4 py-3 text-right">{formatIndianCurrency(Number(item.rate))}</td>
                      
                      {/* CGST / IGST Cell */}
                      <td className="px-4 py-3 text-right text-[10px]">
                        {isIntrastate ? (
                          <div>
                            <span className="font-semibold">{Number(item.cgst_rate)}%</span>
                            <span className="block text-slate-400">({formatIndianCurrency(Number(item.cgst_amount))})</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold">{Number(item.igst_rate)}%</span>
                            <span className="block text-slate-400">({formatIndianCurrency(Number(item.igst_amount))})</span>
                          </div>
                        )}
                      </td>

                      {/* SGST Cell */}
                      <td className="px-4 py-3 text-right text-[10px]">
                        {isIntrastate ? (
                          <div>
                            <span className="font-semibold">{Number(item.sgst_rate)}%</span>
                            <span className="block text-slate-400">({formatIndianCurrency(Number(item.sgst_amount))})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatIndianCurrency(Number(item.total_amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary calculations (Rupee words, bank coordinates vs sums breakdown) */}
          <div className="flex flex-col sm:flex-row justify-between gap-8 pt-6 border-t border-slate-100">
            <div className="space-y-4 max-w-md w-full">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount in Words</h4>
                <p className="text-xs text-slate-700 font-semibold italic">{numberToIndianWords(totalAmount)}</p>
              </div>

              {(profile.bank_name || profile.bank_account) && (
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 text-xs text-slate-600 space-y-1">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#6C63FF]" />
                    Bank Details for Settlement
                  </h4>
                  {profile.bank_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank Name:</span>
                      <span className="font-bold text-slate-800">{profile.bank_name}</span>
                    </div>
                  )}
                  {profile.bank_account && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Number:</span>
                      <span className="font-bold text-slate-800">{profile.bank_account}</span>
                    </div>
                  )}
                  {profile.bank_ifsc && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">IFSC Code:</span>
                      <span className="font-bold text-slate-800">{profile.bank_ifsc}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full sm:w-[280px] space-y-2.5 text-xs text-slate-600 select-none">
              <div className="flex justify-between">
                <span>Subtotal (Taxable Amount):</span>
                <span>{formatIndianCurrency(Number(invoice.subtotal))}</span>
              </div>

              {isIntrastate ? (
                <>
                  <div className="flex justify-between">
                    <span>CGST Total:</span>
                    <span>{formatIndianCurrency(Number(invoice.cgst_amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST Total:</span>
                    <span>{formatIndianCurrency(Number(invoice.sgst_amount))}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>IGST Total:</span>
                  <span>{formatIndianCurrency(Number(invoice.igst_amount))}</span>
                </div>
              )}

              <hr className="border-slate-100" />
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50">
                <span className="text-indigo-850">Grand Total:</span>
                <span className="text-[#6C63FF] text-base">{formatIndianCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-100 text-xs text-slate-500">
              {invoice.notes && (
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Notes</h4>
                  <p className="leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Terms & Conditions</h4>
                  <p className="leading-relaxed whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 pt-6 text-center text-[10px] text-slate-400 italic">
            This is a computer-generated invoice and does not require a physical signature. Thank you for your business!
          </div>

        </div>

        {/* Branding Footer Indicator */}
        <div className="text-center text-xs text-slate-400 pt-4 flex items-center justify-center gap-1">
          <span>Powered by</span>
          <span className="font-bold text-slate-600 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-[#6C63FF]" />
            InvoiceWala
          </span>
        </div>

      </div>
    </div>
  );
}
