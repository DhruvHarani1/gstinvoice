'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Landmark, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function BankSettingsPage() {
  const { profile, refreshProfile } = useProfile();
  const supabase = createClient();

  const [isSaving, setIsSaving] = useState(false);

  // DB Fields
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // LocalStorage Fields
  const [upiId, setUpiId] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(true);

  // Load initial settings
  useEffect(() => {
    if (profile) {
      setBankName(profile.bank_name || '');
      setBankAccount(profile.bank_account || '');
      setBankIfsc(profile.bank_ifsc || '');
    }

    if (typeof window !== 'undefined') {
      setUpiId(localStorage.getItem('invoicewala_upi_id') || '');
      setShowBankDetails(localStorage.getItem('invoicewala_show_bank_details') !== 'false');
    }
  }, [profile]);

  const handleBankSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      // 1. Save primary bank account to Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankName.trim() || null,
          bank_account: bankAccount.trim() || null,
          bank_ifsc: bankIfsc.trim().toUpperCase() || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // 2. Save UPI ID and display toggle to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('invoicewala_upi_id', upiId.trim());
        localStorage.setItem('invoicewala_show_bank_details', String(showBankDetails));
      }

      toast.success('Bank details updated successfully!');
      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update bank details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Bank Details</h2>
        <p className="text-slate-500 text-xs mt-0.5">Specify bank accounts and payment keys printed on invoices.</p>
      </div>

      <form onSubmit={handleBankSave} className="space-y-6">
        
        {/* Bank Parameters */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Landmark className="w-4 h-4 text-indigo-500" /> Receiving Bank Account
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="bank-name">
                Bank Name
              </label>
              <input
                id="bank-name"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. State Bank of India"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="bank-acc">
                Account Number
              </label>
              <input
                id="bank-acc"
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. 1234567890"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="bank-ifsc">
                IFSC Code
              </label>
              <input
                id="bank-ifsc"
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono"
                placeholder="e.g. SBIN0001234"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="upi-id">
                UPI ID (for payments)
              </label>
              <input
                id="upi-id"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono"
                placeholder="e.g. acme@okaxis"
              />
              <p className="text-[10px] text-slate-400 mt-1">Allows clients to scan and pay directly via UPI apps.</p>
            </div>
          </div>
        </div>

        {/* Display Toggles */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                {showBankDetails ? (
                  <Eye className="w-4 h-4 text-emerald-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
                Render Bank Info on Invoices
              </h3>
              <p className="text-[10px] text-slate-400">Controls whether these bank details display in the invoice layout.</p>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => setShowBankDetails(!showBankDetails)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                showBankDetails ? 'bg-[#6C63FF]' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showBankDetails ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#6C63FF] hover:bg-[#5b52eb] text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Save Bank Details
        </button>

      </form>
    </div>
  );
}
