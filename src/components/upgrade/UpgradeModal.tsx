'use client';

import React, { useState } from 'react';
import { X, Check, Loader2, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from 'sonner';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { refreshSubscription } = useSubscription();
  const { profile } = useProfile();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as unknown as { Razorpay: unknown }).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setIsProcessing(true);
    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load payment gateways. Please check your internet connection.');
        setIsProcessing(false);
        return;
      }

      // 2. Call backend to create Razorpay Subscription
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize subscription');
      }

      const { subscription_id, key_id } = data;

      // 3. Open Razorpay Checkout overlay
      const options = {
        key: key_id,
        subscription_id: subscription_id,
        name: 'InvoiceWala',
        description: 'Upgrade to Pro Plan (₹299/mo)',
        image: 'https://placeholder.co/128x128?text=IW',
        handler: async function () {
          toast.success('Payment authorized! Activation webhook in progress.');
          setIsProcessing(true);
          
          // Poll/Wait briefly to allow webhook processing
          await new Promise((resolve) => setTimeout(resolve, 3000));
          await refreshSubscription();
          
          toast.success('Welcome to InvoiceWala Pro!');
          setIsProcessing(false);
          onClose();
        },
        prefill: {
          name: profile?.business_name || '',
          email: '', // prefills can be fetched from user if context offers it
        },
        theme: {
          color: '#6C63FF',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayConstructor(options);
      rzp.open();
    } catch (error) {
      console.error('Subscription setup failed:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong during checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => !isProcessing && onClose()}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Banner header */}
        <div className="bg-[#6C63FF] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
          
          <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
            Invoice Limits Reached
          </span>
          <h3 className="text-xl font-extrabold mt-2">Upgrade to Pro</h3>
          <p className="text-indigo-100 text-xs mt-1">Unlock professional unlimited invoice generation</p>
        </div>

        {/* Pricing details */}
        <div className="p-6">
          <div className="text-center mb-6">
            <span className="text-3xl font-extrabold text-slate-800">₹299</span>
            <span className="text-slate-400 text-sm"> / month</span>
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Included Features:</p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2.5 text-slate-600 text-xs">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Unlimited Invoices</strong> (create without limit thresholds)</span>
            </li>
            <li className="flex items-start gap-2.5 text-slate-600 text-xs">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>GST-Compliant PDFs</strong> with CGST, SGST, IGST columns</span>
            </li>
            <li className="flex items-start gap-2.5 text-slate-600 text-xs">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Email Sending</strong> (email PDFs directly to clients)</span>
            </li>
            <li className="flex items-start gap-2.5 text-slate-600 text-xs">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Custom Branding</strong> (business logo & invoice prefixes)</span>
            </li>
            <li className="flex items-start gap-2.5 text-slate-600 text-xs">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Premium Customer Support</strong></span>
            </li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full bg-[#6C63FF] hover:bg-[#5b52eb] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-75 shadow-md shadow-indigo-100"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Upgrade...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Upgrade Now
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full text-slate-400 hover:text-slate-500 text-xs font-bold mt-3 text-center transition-colors block py-1"
          >
            Stay on Free Plan
          </button>
        </div>
        
      </div>
    </div>
  );
}
