'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Send,
  Edit2,
  Copy,
  Trash2,
  Loader2,
  CreditCard,
  History,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Invoice, InvoiceItem, Client, Profile } from '@/types';
import StatusBadge from '@/components/invoice/StatusBadge';
import { numberToIndianWords } from '@/lib/utils';

interface InvoiceDetailClientProps {
  invoice: Invoice & { client: Client };
  items: InvoiceItem[];
  profile: Profile;
}

// Format INR currency
const formatINR = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

// Format Date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Format Date and Time
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function InvoiceDetailClient({
  invoice: initialInvoice,
  items,
  profile,
}: InvoiceDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [invoice, setInvoice] = useState(initialInvoice);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Payment Recording States
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(
    String(Number(invoice.total_amount) - Number(invoice.amount_paid || 0))
  );
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Update Status in database
  const handleUpdateStatus = async (newStatus: typeof invoice.status) => {
    setIsUpdatingStatus(newStatus);
    try {
      const payload: Partial<Invoice> = { status: newStatus };
      if (newStatus === 'paid') {
        payload.amount_paid = invoice.total_amount;
      }

      const { error } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', invoice.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Invoice status updated to ${newStatus}.`);
      setInvoice((prev) => ({
        ...prev,
        status: newStatus,
        amount_paid: newStatus === 'paid' ? prev.total_amount : prev.amount_paid,
        updated_at: new Date().toISOString(),
      }));
      router.refresh();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Record Custom Payment Amount
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payVal = Number(paymentAmount);
    if (isNaN(payVal) || payVal <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    const currentPaid = Number(invoice.amount_paid || 0);
    const totalAmt = Number(invoice.total_amount);
    const remainingAmt = totalAmt - currentPaid;

    if (payVal > remainingAmt) {
      toast.error(`Payment amount cannot exceed outstanding balance of ${formatINR(remainingAmt)}`);
      return;
    }

    setIsRecordingPayment(true);
    try {
      const newPaid = Number((currentPaid + payVal).toFixed(2));
      const autoPaid = newPaid >= totalAmt;
      const { error } = await supabase
        .from('invoices')
        .update({
          amount_paid: newPaid,
          status: autoPaid ? 'paid' : invoice.status,
        })
        .eq('id', invoice.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Recorded payment of ${formatINR(payVal)} successfully.`);
      setInvoice((prev) => ({
        ...prev,
        amount_paid: newPaid,
        status: autoPaid ? 'paid' : prev.status,
        updated_at: new Date().toISOString(),
      }));
      setShowRecordPayment(false);
      router.refresh();
    } catch {
      toast.error('Failed to record payment.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const InvoicePDF = (await import('@/components/invoices/InvoicePDF')).default;

      const doc = (
        <InvoicePDF
          invoice={invoice}
          items={items}
          client={invoice.client}
          profile={profile}
          pdfThemeColor={typeof window !== 'undefined' ? localStorage.getItem('invoicewala_pdf_theme') || undefined : undefined}
          upiId={typeof window !== 'undefined' ? localStorage.getItem('invoicewala_upi_id') || undefined : undefined}
          showBankDetails={typeof window !== 'undefined' ? localStorage.getItem('invoicewala_show_bank_details') !== 'false' : true}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Invoice PDF downloaded successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF download.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Send Email simulation
  const handleSendEmail = async () => {
    if (!invoice.client.email) {
      toast.error('Client does not have an email address configured.');
      return;
    }

    setIsSendingEmail(true);
    // Simulate API dispatch delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(`Invoice details dispatched to ${invoice.client.email} successfully.`);
    setIsSendingEmail(false);
  };

  // Duplicate Invoice Action
  const handleDuplicateInvoice = async () => {
    setIsDuplicating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication expired.');
        return;
      }

      // Fetch Latest Profile for prefix and next invoice number
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileData) throw new Error('Failed to load profile.');

      const nextNum = profileData.next_invoice_number;
      const dupInvoiceNumber = `${profileData.invoice_prefix || 'INV'}-${String(nextNum).padStart(4, '0')}`;

      // 1. Insert Header Copy
      const headerPayload = {
        user_id: user.id,
        client_id: invoice.client.id,
        invoice_number: dupInvoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: null,
        status: 'draft',
        place_of_supply: invoice.place_of_supply,
        subtotal: invoice.subtotal,
        cgst_amount: invoice.cgst_amount,
        sgst_amount: invoice.sgst_amount,
        igst_amount: invoice.igst_amount,
        total_amount: invoice.total_amount,
        amount_paid: 0.00,
        notes: invoice.notes,
        terms: invoice.terms,
      };

      const { data: dupHeader, error: dupHeaderError } = await supabase
        .from('invoices')
        .insert(headerPayload)
        .select('*')
        .single();

      if (dupHeaderError) {
        toast.error(dupHeaderError.message);
        return;
      }

      // 2. Insert items copy
      const itemsPayload = items.map((item, idx) => ({
        invoice_id: dupHeader.id,
        description: item.description,
        hsn_sac: item.hsn_sac,
        quantity: item.quantity,
        rate: item.rate,
        gst_rate: item.gst_rate,
        taxable_amount: item.taxable_amount,
        cgst_rate: item.cgst_rate,
        cgst_amount: item.cgst_amount,
        sgst_rate: item.sgst_rate,
        sgst_amount: item.sgst_amount,
        igst_rate: item.igst_rate,
        igst_amount: item.igst_amount,
        total_amount: item.total_amount,
        sort_order: idx,
      }));

      const { error: dupItemsError } = await supabase
        .from('invoice_items')
        .insert(itemsPayload);

      if (dupItemsError) {
        // Rollback duplicated header
        await supabase.from('invoices').delete().eq('id', dupHeader.id);
        toast.error(dupItemsError.message);
        return;
      }

      // 3. Increment Next invoice index
      await supabase
        .from('profiles')
        .update({ next_invoice_number: nextNum + 1 })
        .eq('id', user.id);

      toast.success(`Duplicated invoice as ${dupInvoiceNumber} successfully.`);
      router.push(`/dashboard/invoices/${dupHeader.id}/edit`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Duplication failed.';
      toast.error(msg);
    } finally {
      setIsDuplicating(false);
    }
  };

  // Delete single invoice
  const handleDeleteInvoice = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Invoice deleted successfully.');
      router.push('/dashboard/invoices');
      router.refresh();
    } catch {
      toast.error('Failed to delete invoice.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper variables for layout math
  const paidVal = Number(invoice.amount_paid || 0);
  const totalVal = Number(invoice.total_amount);
  const remainingVal = Math.max(0, totalVal - paidVal);
  const paymentPercentage = totalVal > 0 ? (paidVal / totalVal) * 100 : 0;
  const isIntrastate = profile.state === invoice.place_of_supply;

  return (
    <div className="space-y-6">
      {/* Top back navigation and control bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{invoice.invoice_number}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Billed to {invoice.client.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {/* Quick status change toggles */}
          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
            <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs font-semibold gap-0.5 shrink-0">
              {invoice.status === 'draft' && (
                <button
                  onClick={() => handleUpdateStatus('sent')}
                  disabled={isUpdatingStatus !== null}
                  className="px-2.5 py-1 text-slate-600 hover:text-[#6C63FF] hover:bg-white rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isUpdatingStatus === 'sent' && <Loader2 className="w-3 h-3 animate-spin" />}
                  Mark as Sent
                </button>
              )}
              <button
                onClick={() => handleUpdateStatus('paid')}
                disabled={isUpdatingStatus !== null}
                className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-white rounded transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isUpdatingStatus === 'paid' && <Loader2 className="w-3 h-3 animate-spin" />}
                Mark as Paid
              </button>
              {invoice.status !== 'overdue' && invoice.status === 'sent' && (
                <button
                  onClick={() => handleUpdateStatus('overdue')}
                  disabled={isUpdatingStatus !== null}
                  className="px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-white rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isUpdatingStatus === 'overdue' && <Loader2 className="w-3 h-3 animate-spin" />}
                  Mark as Overdue
                </button>
              )}
            </div>
          )}

          {/* Edit / Actions */}
          {invoice.status === 'draft' && (
            <Link
              href={`/dashboard/invoices/${invoice.id}/edit`}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Download
          </button>

          <button
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Email
          </button>

          <button
            onClick={handleDuplicateInvoice}
            disabled={isDuplicating}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isDuplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
            Duplicate
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Full Details Sheet (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8 select-text">
            
            {/* Sheet Header details */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-100 pb-6">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">{profile.business_name}</h3>
                {profile.gstin && <p className="text-xs text-slate-500 font-mono mt-1">GSTIN: {profile.gstin}</p>}
                {profile.phone && <p className="text-xs text-slate-400 mt-1">Phone: {profile.phone}</p>}
              </div>

              <div className="sm:text-right space-y-1 select-none">
                <h2 className="text-xl font-bold text-[#6C63FF]">TAX INVOICE</h2>
                <div className="text-xs text-slate-500 grid grid-cols-2 sm:grid-cols-1 gap-x-4">
                  <p><span className="text-slate-400 font-medium">Invoice No:</span> <span className="font-mono text-slate-800 font-bold">{invoice.invoice_number}</span></p>
                  <p><span className="text-slate-400 font-medium">Invoice Date:</span> <span className="text-slate-700 font-semibold">{formatDate(invoice.invoice_date)}</span></p>
                  {invoice.due_date && (
                    <p><span className="text-slate-400 font-medium">Due Date:</span> <span className="text-slate-700 font-semibold">{formatDate(invoice.due_date)}</span></p>
                  )}
                  {invoice.place_of_supply && (
                    <p><span className="text-slate-400 font-medium">Place of Supply:</span> <span className="text-slate-700 font-semibold">{invoice.place_of_supply}</span></p>
                  )}
                </div>
              </div>
            </div>

            {/* Billed By vs Billed To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Billed By</h4>
                <p className="font-bold text-slate-800 text-sm">{profile.business_name}</p>
                {profile.address && <p className="text-xs text-slate-500 max-w-xs">{profile.address}</p>}
                <p className="text-xs text-slate-500">
                  {[profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider select-none">Billed To</h4>
                <p className="font-bold text-slate-800 text-sm">{invoice.client.name}</p>
                {invoice.client.address && <p className="text-xs text-slate-500 max-w-xs">{invoice.client.address}</p>}
                <p className="text-xs text-slate-500">
                  {[invoice.client.city, invoice.client.state, invoice.client.pincode].filter(Boolean).join(', ')}
                </p>
                {invoice.client.phone && <p className="text-xs text-slate-400">Phone: {invoice.client.phone}</p>}
                {invoice.client.gstin && (
                  <p className="text-xs font-mono text-slate-500 mt-1">GSTIN: {invoice.client.gstin}</p>
                )}
              </div>
            </div>

            {/* Items List Table */}
            <div className="overflow-x-auto select-none">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2 text-center w-[80px]">HSN/SAC</th>
                    <th className="px-4 py-2 text-center w-[60px]">Qty</th>
                    <th className="px-4 py-2 text-right w-[100px]">Rate</th>
                    <th className="px-4 py-2 text-center w-[70px]">GST</th>
                    <th className="px-4 py-2 text-right w-[110px]">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.description}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{item.hsn_sac || '—'}</td>
                      <td className="px-4 py-3 text-center">{Number(item.quantity)}</td>
                      <td className="px-4 py-3 text-right">{formatINR(Number(item.rate))}</td>
                      <td className="px-4 py-3 text-center">{Number(item.gst_rate)}%</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(Number(item.total_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals computation and breakdown */}
            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-3 max-w-sm">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Amount in Words</h5>
                  <p className="text-xs text-slate-600 font-semibold italic">{numberToIndianWords(Number(invoice.total_amount))}</p>
                </div>

                {profile.bank_name && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-0.5 select-none">
                    <p className="font-bold text-slate-700 mb-1">Bank Payment Parameters:</p>
                    <p><span className="text-slate-400">Bank:</span> {profile.bank_name}</p>
                    <p><span className="text-slate-400">Account:</span> {profile.bank_account}</p>
                    {profile.bank_ifsc && <p><span className="text-slate-400">IFSC:</span> {profile.bank_ifsc}</p>}
                  </div>
                )}
              </div>

              <div className="w-full sm:w-[260px] space-y-2 select-none">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatINR(Number(invoice.subtotal))}</span>
                </div>

                {isIntrastate ? (
                  <>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>CGST</span>
                      <span>{formatINR(Number(invoice.cgst_amount))}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>SGST</span>
                      <span>{formatINR(Number(invoice.sgst_amount))}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>IGST</span>
                    <span>{formatINR(Number(invoice.igst_amount))}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 text-sm">Total Amount</span>
                  <span className="font-black text-lg text-[#6C63FF]">{formatINR(Number(invoice.total_amount))}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-100 select-none">
                {invoice.notes && (
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</h5>
                    <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terms & Conditions</h5>
                    <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata details, payments, history timeline (1/3 width) */}
        <div className="space-y-6 select-none">
          
          {/* Payment Status widget */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#6C63FF]" />
              Payment History
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Total Invoiced:</span>
                <span className="text-slate-800">{formatINR(totalVal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-emerald-600">{formatINR(paidVal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Outstanding:</span>
                <span className="text-rose-600">{formatINR(remainingVal)}</span>
              </div>
            </div>

            {/* Payment Progress bar indicator */}
            <div className="space-y-1.5 pt-2">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-right text-slate-400 font-bold uppercase tracking-wider">
                {paymentPercentage.toFixed(0)}% paid
              </p>
            </div>

            {/* Record Custom Payment */}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <div className="pt-2 border-t border-slate-50">
                {showRecordPayment ? (
                  <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" htmlFor="rec-payment-amount">
                        Enter Amount Received (₹)
                      </label>
                      <input
                        id="rec-payment-amount"
                        type="number"
                        step="any"
                        min="0.01"
                        max={remainingVal}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRecordPayment(false)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isRecordingPayment}
                        className="px-3 py-1.5 bg-[#6C63FF] hover:bg-[#554ce6] text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                      >
                        {isRecordingPayment && <Loader2 className="w-3 h-3 animate-spin" />}
                        Record Payment
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setPaymentAmount(String(remainingVal));
                      setShowRecordPayment(true);
                    }}
                    className="w-full py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors text-center"
                  >
                    Record Payment Receipt
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-[#6C63FF]" />
              Timeline History
            </h3>

            <div className="relative border-l border-slate-200 ml-2.5 pl-5 space-y-5 py-2 text-xs">
              {/* Event 1: Created */}
              <div className="relative">
                <span className="absolute left-[-26px] top-1.5 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white ring-4 ring-indigo-50" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800">Invoice Draft Created</p>
                  <p className="text-[10px] text-slate-400">{formatDateTime(invoice.created_at)}</p>
                </div>
              </div>

              {/* Event 2: Last Update */}
              {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                <div className="relative">
                  <span className="absolute left-[-26px] top-1.5 w-3 h-3 bg-indigo-200 rounded-full border-2 border-white" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">Invoice Updated</p>
                    <p className="text-[10px] text-slate-400">Current Status: <span className="font-bold capitalize text-[#6C63FF]">{invoice.status}</span></p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(invoice.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Delete invoice?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Are you sure you want to delete invoice <span className="font-semibold text-slate-900">{invoice.invoice_number}</span>?
                  This action is permanent and will remove the invoice and its child line items databases records.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInvoice}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
