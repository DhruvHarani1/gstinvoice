'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Palette, FileText, Settings, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { name: 'Indigo Accent', hex: '#6C63FF' },
  { name: 'Emerald Teal', hex: '#10B981' },
  { name: 'Ocean Blue', hex: '#3B82F6' },
  { name: 'Coral Red', hex: '#EF4444' },
  { name: 'Violet Purple', hex: '#8B5CF6' },
  { name: 'Dark Slate', hex: '#475569' },
];

export default function InvoiceSettingsPage() {
  const { profile, refreshProfile } = useProfile();
  const supabase = createClient();

  const [isSaving, setIsSaving] = useState(false);

  // DB Fields
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);

  // LocalStorage Fields
  const [defaultTerms, setDefaultTerms] = useState('');
  const [defaultNotes, setDefaultNotes] = useState('');
  const [defaultDueDays, setDefaultDueDays] = useState('15');
  const [pdfTheme, setPdfTheme] = useState('#6C63FF');

  // Load initial settings
  useEffect(() => {
    if (profile) {
      setInvoicePrefix(profile.invoice_prefix || 'INV');
      setNextInvoiceNumber(profile.next_invoice_number ?? 1);
    }

    // Load from localStorage
    if (typeof window !== 'undefined') {
      setDefaultTerms(localStorage.getItem('invoicewala_default_terms') || '');
      setDefaultNotes(localStorage.getItem('invoicewala_default_notes') || '');
      setDefaultDueDays(localStorage.getItem('invoicewala_default_due_days') || '15');
      setPdfTheme(localStorage.getItem('invoicewala_pdf_theme') || '#6C63FF');
    }
  }, [profile]);

  const handleInvoiceSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (nextInvoiceNumber < 1) {
      toast.error('Next invoice number counter must be a positive integer.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save to Supabase (Prefix and next counter number)
      const { error } = await supabase
        .from('profiles')
        .update({
          invoice_prefix: invoicePrefix.trim(),
          next_invoice_number: nextInvoiceNumber,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // 2. Save preferences in client localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('invoicewala_default_terms', defaultTerms.trim());
        localStorage.setItem('invoicewala_default_notes', defaultNotes.trim());
        localStorage.setItem('invoicewala_default_due_days', defaultDueDays);
        localStorage.setItem('invoicewala_pdf_theme', pdfTheme);
      }

      toast.success('Invoice preferences updated successfully!');
      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update invoice settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Invoice Preferences</h2>
        <p className="text-slate-500 text-xs mt-0.5">Customize invoice sequences, terms offsets, default comments, and styling.</p>
      </div>

      <form onSubmit={handleInvoiceSettingsSave} className="space-y-6">
        
        {/* Numbering Sequence */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Settings className="w-4 h-4 text-indigo-500" /> Invoice Number Sequence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="invoice-prefix">
                Invoice Prefix
              </label>
              <input
                id="invoice-prefix"
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. INV, 2026-, WK"
              />
              <p className="text-[10px] text-slate-400 mt-1">Appends prior to the generated counter number.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="next-invoice-num">
                Next Invoice Number Counter
              </label>
              <div className="relative">
                <input
                  id="next-invoice-num"
                  type="number"
                  min={1}
                  value={nextInvoiceNumber}
                  onChange={(e) => setNextInvoiceNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setNextInvoiceNumber(1)}
                  title="Reset counter to 1"
                  className="absolute right-2 top-1.5 p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">The counter number used for the next created invoice.</p>
            </div>
          </div>
        </div>

        {/* Defaults Settings */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-indigo-500" /> Default Terms & Comments
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="default-due-days">
                Default Due Date Offset
              </label>
              <select
                id="default-due-days"
                value={defaultDueDays}
                onChange={(e) => setDefaultDueDays(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
              >
                <option value="0">Due on Receipt (0 days)</option>
                <option value="7">7 Days from Invoice Date</option>
                <option value="15">15 Days from Invoice Date</option>
                <option value="30">30 Days from Invoice Date</option>
                <option value="45">45 Days from Invoice Date</option>
                <option value="60">60 Days from Invoice Date</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="default-notes">
                  Default Invoice Notes (Comments)
                </label>
                <textarea
                  id="default-notes"
                  rows={4}
                  value={defaultNotes}
                  onChange={(e) => setDefaultNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all"
                  placeholder="e.g. Thank you for doing business with us!"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="default-terms">
                  Default Payment Terms & Conditions
                </label>
                <textarea
                  id="default-terms"
                  rows={4}
                  value={defaultTerms}
                  onChange={(e) => setDefaultTerms(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all"
                  placeholder="e.g. Payments must be processed within the stated due date."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color themes presets */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Palette className="w-4 h-4 text-indigo-500" /> Invoice PDF Theme Color
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {COLOR_PRESETS.map((preset) => {
              const isSelected = pdfTheme === preset.hex;
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setPdfTheme(preset.hex)}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[#6C63FF] bg-[#6C63FF]/5 ring-2 ring-indigo-100'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-black/5"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-[10px] font-bold text-slate-600 mt-2 text-center truncate w-full">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#6C63FF] hover:bg-[#5b52eb] text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save Invoice Settings
        </button>

      </form>
    </div>
  );
}
