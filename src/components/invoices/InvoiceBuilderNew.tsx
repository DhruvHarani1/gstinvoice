'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  ArrowLeft,
  Download,
  Send,
  Save,
  Building,
  PlusCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Client, Profile } from '@/types';
import { numberToIndianWords } from '@/lib/utils';
import { INDIAN_STATES, GST_RATES } from '@/lib/constants';
import QuickAddClientModal from '@/components/clients/QuickAddClientModal';
import UpgradeModal from '@/components/upgrade/UpgradeModal';
import { revalidatePathAction } from '@/app/dashboard/actions';

interface LineItemInput {
  description: string;
  hsn_sac: string;
  quantity: number;
  rate: number;
  gst_rate: number;
}

export default function InvoiceBuilderNew() {
  const router = useRouter();
  const supabase = createClient();

  // User State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Limit State
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [dueDate, setDueDate] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Searchable Client Selector State
  const [clientSearch, setClientSearch] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Line Items State
  const [items, setItems] = useState<LineItemInput[]>([
    { description: '', hsn_sac: '', quantity: 1, rate: 0, gst_rate: 18 }
  ]);

  // Submission State
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Load User Data & Clients
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to access the invoice builder.');
        router.push('/login');
        return;
      }

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setPlaceOfSupply(profileData.state || '');

      // Auto-generate invoice number
      const generatedNumber = `${profileData.invoice_prefix || 'INV'}-${String(profileData.next_invoice_number || 1).padStart(4, '0')}`;
      setInvoiceNumber(generatedNumber);

      // Load defaults from localStorage
      if (typeof window !== 'undefined') {
        const storedTerms = localStorage.getItem('invoicewala_default_terms');
        if (storedTerms) setTerms(storedTerms);

        const storedNotes = localStorage.getItem('invoicewala_default_notes');
        if (storedNotes) setNotes(storedNotes);

        const storedDueDays = localStorage.getItem('invoicewala_default_due_days') || '15';
        const days = parseInt(storedDueDays, 10);
        if (!isNaN(days) && days > 0) {
          const due = new Date();
          due.setDate(due.getDate() + days);
          setDueDate(due.toISOString().split('T')[0]);
        }
      }

      // Fetch Clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      setClients(clientsData || []);

      // Fetch Subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Verify Plan Limit for Free Plan
      if (!subData || subData.plan === 'free') {
        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        
        const { count, error: countError } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('invoice_date', startOfMonth);

        if (!countError && count !== null && count >= 5) {
          setIsLimitReached(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error initializing page.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle Client Search
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter((c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase()))
    );
  }, [clients, clientSearch]);

  // Handle Client Selection
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch('');
    setIsClientDropdownOpen(false);
    // Prefill Place of Supply based on client's state if configured
    if (client.state) {
      setPlaceOfSupply(client.state);
    }
  };

  // Quick Client Added Callback
  const handleClientAdded = (newClient: Client) => {
    setClients((prev) => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
    handleSelectClient(newClient);
  };

  // Add Item Row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', hsn_sac: '', quantity: 1, rate: 0, gst_rate: 18 },
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Invoice must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update Item Fields
  const handleUpdateItem = (index: number, key: keyof LineItemInput, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };
      return updated;
    });
  };

  // Computations block
  const computedData = useMemo(() => {
    let subtotal = 0;
    let cgst_amount = 0;
    let sgst_amount = 0;
    let igst_amount = 0;

    const isIntrastate = profile?.state === placeOfSupply;

    const calculatedItems = items.map((item, idx) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const taxable_amount = Number((qty * rate).toFixed(2));

      subtotal += taxable_amount;

      let cgst_rate = 0;
      let cgst_item = 0;
      let sgst_rate = 0;
      let sgst_item = 0;
      let igst_rate = 0;
      let igst_item = 0;

      const gstRateNum = Number(item.gst_rate) || 0;

      if (isIntrastate) {
        cgst_rate = gstRateNum / 2;
        cgst_item = Number((taxable_amount * (cgst_rate / 100)).toFixed(2));
        sgst_rate = gstRateNum / 2;
        sgst_item = Number((taxable_amount * (sgst_rate / 100)).toFixed(2));
        cgst_amount += cgst_item;
        sgst_amount += sgst_item;
      } else {
        igst_rate = gstRateNum;
        igst_item = Number((taxable_amount * (igst_rate / 100)).toFixed(2));
        igst_amount += igst_item;
      }

      const total_amount = Number((taxable_amount + cgst_item + sgst_item + igst_item).toFixed(2));

      return {
        description: item.description,
        hsn_sac: item.hsn_sac,
        quantity: qty,
        rate,
        gst_rate: gstRateNum,
        taxable_amount,
        cgst_rate,
        cgst_amount: cgst_item,
        sgst_rate,
        sgst_amount: sgst_item,
        igst_rate,
        igst_amount: igst_item,
        total_amount,
        sort_order: idx,
      };
    });

    const total_amount = Number((subtotal + cgst_amount + sgst_amount + igst_amount).toFixed(2));

    return {
      items: calculatedItems,
      subtotal: Number(subtotal.toFixed(2)),
      cgst_amount: Number(cgst_amount.toFixed(2)),
      sgst_amount: Number(sgst_amount.toFixed(2)),
      igst_amount: Number(igst_amount.toFixed(2)),
      total_amount,
      amountInWords: numberToIndianWords(total_amount),
    };
  }, [items, profile?.state, placeOfSupply]);

  // Main Save Invoice DB Query
  const saveInvoice = async (status: 'draft' | 'sent') => {
    if (!selectedClient) {
      toast.error('Please select a billing client.');
      return null;
    }
    if (!invoiceNumber.trim()) {
      toast.error('Invoice number is required.');
      return null;
    }
    if (items.some((item) => !item.description.trim())) {
      toast.error('All line items must have a description.');
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication expired. Please sign in again.');
        router.push('/login');
        return null;
      }

      // 1. Insert Invoice Header details
      const invoicePayload = {
        user_id: user.id,
        client_id: selectedClient.id,
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        status,
        place_of_supply: placeOfSupply || null,
        subtotal: computedData.subtotal,
        cgst_amount: computedData.cgst_amount,
        sgst_amount: computedData.sgst_amount,
        igst_amount: computedData.igst_amount,
        total_amount: computedData.total_amount,
        notes: notes.trim() || null,
        terms: terms.trim() || null,
      };

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoicePayload)
        .select('*')
        .single();

      if (invoiceError) {
        toast.error(`Invoice Error: ${invoiceError.message}`);
        return null;
      }

      // 2. Insert Invoice Items Details
      const itemsPayload = computedData.items.map((item, idx) => ({
        invoice_id: invoiceData.id,
        description: item.description.trim(),
        hsn_sac: item.hsn_sac.trim() || null,
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

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsPayload);

      if (itemsError) {
        // Rollback inserted header
        await supabase.from('invoices').delete().eq('id', invoiceData.id);
        toast.error(`Line Items Error: ${itemsError.message}`);
        return null;
      }

      // 3. Increment Next Invoice Number in profile
      if (profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ next_invoice_number: profile.next_invoice_number + 1 })
          .eq('id', user.id);

        if (profileError) {
          console.error('Failed to update next invoice number:', profileError);
        }
      }

      // Trigger path revalidations
      await revalidatePathAction('/dashboard/invoices');
      await revalidatePathAction('/dashboard');

      return invoiceData;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database save failed.';
      toast.error(msg);
      return null;
    }
  };

  // Action: Save as Draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const invoice = await saveInvoice('draft');
    setIsSavingDraft(false);

    if (invoice) {
      toast.success('Invoice saved as draft successfully.');
      router.push('/dashboard/invoices');
      router.refresh();
    }
  };

  // Action: Save & Download PDF
  const handleDownloadPDF = async () => {
    if (!profile) return;
    setIsDownloadingPDF(true);
    const invoice = await saveInvoice('sent');

    if (invoice) {
      try {
        // Dynamically load react-pdf renderer client-side only to bypass SSR restrictions
        const { pdf } = await import('@react-pdf/renderer');
        const InvoicePDF = (await import('@/components/invoices/InvoicePDF')).default;

        const doc = (
          <InvoicePDF
            invoice={invoice}
            items={computedData.items}
            client={selectedClient!}
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

        toast.success('Invoice saved and PDF downloaded.');
        router.push('/dashboard/invoices');
        router.refresh();
      } catch (pdfErr) {
        console.error('PDF Generation Failed:', pdfErr);
        toast.error('Invoice saved, but PDF generation failed.');
      }
    }
    setIsDownloadingPDF(false);
  };

  // Action: Save & Send Email
  const handleSendEmail = async () => {
    if (!selectedClient?.email) {
      toast.error('Client does not have an email address configured.');
      return;
    }

    setIsSendingEmail(true);
    const invoice = await saveInvoice('sent');

    if (invoice) {
      toast.success(`Invoice saved and sent to ${selectedClient.email} successfully.`);
      router.push('/dashboard/invoices');
      router.refresh();
    }
    setIsSendingEmail(false);
  };

  // Keyboard Shortcut: Ctrl+Enter to save & download PDF
  const downloadRef = useRef(handleDownloadPDF);
  useEffect(() => {
    downloadRef.current = handleDownloadPDF;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        
        // Blur current focused element to commit changes
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        downloadRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading indicator overlay
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-40 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#6C63FF]" />
        <p className="text-slate-500 text-sm font-semibold">Loading Invoice Builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none relative">
      {/* Dynamic Plan limits Upgrade blocker */}
      <UpgradeModal
        isOpen={isLimitReached}
        onClose={() => {
          router.push('/dashboard/invoices');
        }}
      />

      {/* Breadcrumbs / Back navigation */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/invoices"
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">New Invoice</h2>
          <p className="text-xs text-slate-500">Create a professional GST compliant invoice</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* LEFT PANEL: Form Elements (60% / 3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section 1: Invoice Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <FileText className="w-4 h-4 text-[#6C63FF]" />
              Invoice Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="invoice-num-input">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="invoice-num-input"
                  type="text"
                  autoFocus
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                />
              </div>

              {/* Place of Supply */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="place-of-supply-input">
                  Place of Supply <span className="text-red-500">*</span>
                </label>
                <select
                  id="place-of-supply-input"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-955 bg-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state.code} value={state.name}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="invoice-date-input">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="invoice-date-input"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="due-date-input">Due Date</label>
                <div className="relative">
                  <input
                    id="due-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Bill To */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <Building className="w-4 h-4 text-[#6C63FF]" />
              Bill To
            </h3>

            {selectedClient ? (
              /* Selected Client Display Card */
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-sm">{selectedClient.name}</p>
                  {selectedClient.email && <p className="text-xs text-slate-500">{selectedClient.email}</p>}
                  {selectedClient.phone && <p className="text-xs text-slate-500">{selectedClient.phone}</p>}
                  {selectedClient.address && <p className="text-xs text-slate-400 mt-1">{selectedClient.address}</p>}
                  <p className="text-xs text-slate-400">
                    {[selectedClient.city, selectedClient.state, selectedClient.pincode].filter(Boolean).join(', ')}
                  </p>
                  {selectedClient.gstin && (
                    <span className="inline-block bg-indigo-50 border border-indigo-100 text-[#6C63FF] font-mono text-[10px] font-bold px-2 py-0.5 rounded mt-2">
                      GSTIN: {selectedClient.gstin}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="text-xs text-[#6C63FF] hover:text-[#554ce6] font-bold hover:underline"
                >
                  Change Client
                </button>
              </div>
            ) : (
              /* Searchable Dropdown Selector */
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="client-search-input">
                  Select Billing Client <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="client-search-input"
                    type="text"
                    placeholder="Search by client/company name..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                  />
                </div>

                {isClientDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{client.name}</p>
                          <p className="text-[10px] text-slate-400">{client.email || 'No email'}</p>
                        </div>
                        {client.gstin && (
                          <span className="text-[10px] text-slate-400 font-mono">{client.gstin}</span>
                        )}
                      </button>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="px-4 py-3 text-center text-xs text-slate-400">
                        No clients match search criteria.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsClientDropdownOpen(false);
                        setIsQuickAddOpen(true);
                      }}
                      className="w-full px-4 py-3 bg-indigo-50/40 hover:bg-indigo-50 text-[#6C63FF] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border-t border-slate-100"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add New Client
                    </button>
                  </div>
                )}
                {/* Click outside target */}
                {isClientDropdownOpen && (
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsClientDropdownOpen(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Section 3: Line Items (Dynamic Table) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Line Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-[#6C63FF] hover:text-[#554ce6] font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 select-none">
                    <th className="px-3 py-2.5">Item Description</th>
                    <th className="px-3 py-2.5 w-[110px]">HSN/SAC</th>
                    <th className="px-3 py-2.5 w-[80px] text-center">Qty</th>
                    <th className="px-3 py-2.5 w-[120px] text-right">Rate (₹)</th>
                    <th className="px-3 py-2.5 w-[90px] text-center">GST %</th>
                    <th className="px-3 py-2.5 w-[120px] text-right">Amount (₹)</th>
                    <th className="px-3 py-2.5 w-[50px] text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20">
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          placeholder="Consulting Services, SaaS Subscription..."
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          placeholder="e.g. 998311"
                          value={item.hsn_sac}
                          onChange={(e) => handleUpdateItem(idx, 'hsn_sac', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] focus:border-[#6C63FF] text-center"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] focus:border-[#6C63FF] text-center"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate === 0 ? '' : item.rate}
                          onChange={(e) => handleUpdateItem(idx, 'rate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#6C63FF] focus:border-[#6C63FF] text-right"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={item.gst_rate}
                          onChange={(e) => handleUpdateItem(idx, 'gst_rate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#6C63FF] focus:border-[#6C63FF] text-center"
                        >
                          {GST_RATES.map((r) => (
                            <option key={r} value={r}>
                              {r}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900 text-right">
                        ₹{(item.quantity * item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Notes & Terms */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Notes & Terms</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="notes-textarea">Notes</label>
                <textarea
                  id="notes-textarea"
                  rows={3}
                  placeholder="Thank you for your business! Note: Please pay within due date."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="terms-textarea">Terms & Conditions</label>
                <textarea
                  id="terms-textarea"
                  rows={3}
                  placeholder="e.g. Bank Account details, Late fee terms..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Summary Preview (40% / 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-3 flex justify-between items-center">
              <span>Invoice Preview</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-bold uppercase tracking-wider">
                Live Calculation
              </span>
            </h3>

            {/* Calculations display */}
            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Invoice Number</span>
                <span className="font-mono text-white font-bold">{invoiceNumber || '—'}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Billed To</span>
                <span className="text-white font-bold">{selectedClient?.name || <span className="text-slate-500 italic">No Client Selected</span>}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Subtotal</span>
                <span className="text-white font-bold">₹{computedData.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Tax logic split */}
              {profile?.state === placeOfSupply ? (
                <>
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400">CGST</span>
                    <span className="text-white font-bold">₹{computedData.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-slate-400">SGST</span>
                    <span className="text-white font-bold">₹{computedData.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">IGST</span>
                  <span className="text-white font-bold">₹{computedData.igst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-2 border-t border-indigo-500/30">
                <span className="text-sm font-bold text-white">Total Amount</span>
                <span className="text-xl font-black text-indigo-400">₹{computedData.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Amount in words */}
              <div className="p-3 bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Amount in Words</span>
                <span className="text-[11px] text-indigo-200 italic font-semibold leading-snug block">
                  {computedData.amountInWords}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              
              {/* Draft */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isDownloadingPDF || isSendingEmail}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm shadow-inner"
              >
                {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-slate-400" />}
                Save as Draft
              </button>

              {/* Download PDF */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isSavingDraft || isDownloadingPDF || isSendingEmail}
                className="w-full flex items-center justify-center gap-2 bg-[#6C63FF] hover:bg-[#554ce6] text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg shadow-indigo-500/10"
              >
                {isDownloadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-indigo-200" />}
                Save & Download PDF
              </button>

              {/* Send Email */}
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSavingDraft || isDownloadingPDF || isSendingEmail}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg shadow-emerald-600/10"
              >
                {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-emerald-200" />}
                Save & Send Email
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Client Dialog */}
      <QuickAddClientModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}
