'use client';

import React, { useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/contexts/ProfileContext';
import { Check, Loader2, Sparkles, CreditCard, Calendar, History, Trash } from 'lucide-react';
import { toast } from 'sonner';

interface RazorpayInvoice {
  id: string;
  invoice_number: string;
  date: number;
  amount: number;
  status: string;
  short_url?: string;
}

export default function BillingSettingsPage() {
  const { plan, status, currentPeriodEnd, invoiceCount, limit, refreshSubscription } = useSubscription();
  const { profile } = useProfile();
  const [isUpgradingPlan, setIsUpgradingPlan] = useState<'pro' | 'business' | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [invoices, setInvoices] = useState<RazorpayInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Fetch past invoices
  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/subscription/invoices');
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch (err) {
        console.error('Failed to load past invoices:', err);
      } finally {
        setLoadingInvoices(false);
      }
    }
    fetchInvoices();
  }, [plan]);

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

  const handleUpgrade = async (targetPlan: 'pro' | 'business') => {
    setIsUpgradingPlan(targetPlan);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay payment gateways.');
        setIsUpgradingPlan(null);
        return;
      }

      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize subscription');
      }

      const { subscription_id, key_id } = data;

      const options = {
        key: key_id,
        subscription_id: subscription_id,
        name: 'InvoiceWala',
        description: `Upgrade to ${targetPlan === 'business' ? 'Business' : 'Pro'} Plan`,
        image: 'https://placeholder.co/128x128?text=IW',
        handler: async function () {
          toast.success('Payment authorized! Updating account...');
          
          await new Promise((resolve) => setTimeout(resolve, 3000));
          await refreshSubscription();
          
          toast.success(`Upgraded to ${targetPlan === 'business' ? 'Business' : 'Pro'} successfully!`);
          setIsUpgradingPlan(null);
        },
        prefill: {
          name: profile?.business_name || '',
          email: '',
        },
        theme: {
          color: '#6C63FF',
        },
        modal: {
          ondismiss: () => {
            setIsUpgradingPlan(null);
          },
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayConstructor(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Payment initiation failed.');
      setIsUpgradingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still retain access until the end of your billing cycle.')) {
      return;
    }
    
    setIsCancelling(true);
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      toast.success(data.message || 'Subscription cancelled successfully.');
      await refreshSubscription();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getPlanPrice = () => {
    if (plan === 'business') return '₹599';
    if (plan === 'pro') return '₹299';
    return '₹0';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Billing & Plans</h1>
        <p className="text-slate-500 text-xs mt-1">Manage subscription levels, check invoices, and monitor invoice limits.</p>
      </div>

      {/* Current plan detail card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Subscription</span>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {plan === 'free' ? 'Free Starter' : plan} Plan
            </h2>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              status === 'active' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {status}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {plan === 'free' 
                  ? 'No recurring payment schedule' 
                  : `Next Billing: ${currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '—'}`
                }
              </span>
            </div>
            <div>
              <span>Invoice Usage: <strong>{invoiceCount}</strong> of <strong>{limit === Infinity ? 'Unlimited' : limit}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 gap-1.5 w-full md:w-auto">
          <div className="text-right">
            <span className="text-2xl font-extrabold text-slate-800">{getPlanPrice()}</span>
            <span className="text-slate-400 text-xs">/month</span>
          </div>
          {plan !== 'free' && status === 'active' && (
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1 px-3 border border-rose-100 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash className="w-3 h-3" />}
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Plan comparisons */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" /> Choose Your Plan
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Card */}
          <div className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between ${plan === 'free' ? 'border-[#6C63FF] ring-2 ring-indigo-100' : 'border-slate-100'}`}>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Free Starter</h4>
              <p className="text-slate-400 text-[10px] mt-1">For testing and light billing needs.</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-slate-800">₹0</span>
                <span className="text-slate-400 text-xs">/mo</span>
              </div>
              <ul className="space-y-2 mt-4 text-[11px] text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Limit 5 invoices total</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Client & profile records</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Basic GST mathematical checks</span>
                </li>
              </ul>
            </div>
            
            <button
              disabled
              className="mt-6 w-full text-center py-2 border border-slate-100 rounded-xl text-xs font-bold text-slate-400 bg-slate-50"
            >
              {plan === 'free' ? 'Current Plan' : 'Free Plan'}
            </button>
          </div>

          {/* Pro Card */}
          <div className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between relative ${plan === 'pro' ? 'border-[#6C63FF] ring-2 ring-indigo-100' : 'border-slate-100'}`}>
            <span className="absolute -top-3 left-6 bg-[#6C63FF] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              Most Popular
            </span>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Pro Professional</h4>
              <p className="text-slate-400 text-[10px] mt-1">For independent freelancers and small businesses.</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-slate-800">₹299</span>
                <span className="text-slate-400 text-xs">/mo</span>
              </div>
              <ul className="space-y-2 mt-4 text-[11px] text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited Invoices</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>GST-compliant PDF downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Email sending templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Custom invoice prefixes</span>
                </li>
              </ul>
            </div>
            
            {plan === 'pro' ? (
              <button
                disabled
                className="mt-6 w-full text-center py-2 border border-[#6C63FF] rounded-xl text-xs font-bold text-[#6C63FF]"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={isUpgradingPlan !== null}
                className="mt-6 w-full py-2 bg-[#6C63FF] hover:bg-[#5b52eb] rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-75 shadow-sm"
              >
                {isUpgradingPlan === 'pro' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    Upgrade to Pro
                  </>
                )}
              </button>
            )}
          </div>

          {/* Business Card */}
          <div className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between ${plan === 'business' ? 'border-[#6C63FF] ring-2 ring-indigo-100' : 'border-slate-100'}`}>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Business Enterprise</h4>
              <p className="text-slate-400 text-[10px] mt-1">For growing teams and scaling agencies.</p>
              <div className="my-4">
                <span className="text-2xl font-extrabold text-slate-800">₹599</span>
                <span className="text-slate-400 text-xs">/mo</span>
              </div>
              <ul className="space-y-2 mt-4 text-[11px] text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Multi-business registries</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Custom email domains support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Dedicated support line</span>
                </li>
              </ul>
            </div>
            
            {plan === 'business' ? (
              <button
                disabled
                className="mt-6 w-full text-center py-2 border border-[#6C63FF] rounded-xl text-xs font-bold text-[#6C63FF]"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade('business')}
                disabled={isUpgradingPlan !== null}
                className="mt-6 w-full py-2 bg-[#6C63FF] hover:bg-[#5b52eb] rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-75 shadow-sm"
              >
                {isUpgradingPlan === 'business' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    Upgrade to Business
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" /> Invoice Payment History
        </h3>
        
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {loadingInvoices ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              <p className="text-xs">Fetching payment history from Razorpay...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <History className="w-8 h-8 text-slate-200" />
              <p className="text-xs">No past subscription invoices found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-bottom border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Billing Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{inv.invoice_number}</td>
                    <td className="p-4 text-slate-500">
                      {new Date(inv.date * 1000).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 font-bold text-slate-700">₹{(inv.amount / 100).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {inv.short_url ? (
                        <a 
                          href={inv.short_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#6C63FF] hover:text-[#5b52eb] font-bold"
                        >
                          View Receipt &rarr;
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
