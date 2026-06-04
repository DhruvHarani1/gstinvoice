'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, Eye, Zap, X, ChevronRight } from 'lucide-react';

const CURRENT_VERSION = '1.0';

export default function WhatsNew() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check localStorage version
    if (typeof window !== 'undefined') {
      const lastSeenVersion = localStorage.getItem('last_seen_changelog_version');
      if (lastSeenVersion !== CURRENT_VERSION) {
        // Show popup
        setIsOpen(true);
      }
    }
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_seen_changelog_version', CURRENT_VERSION);
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Decorative ambient background */}
        <div className="absolute top-[-40px] right-[-40px] opacity-[0.08] blur-xl w-48 h-48 bg-indigo-500 rounded-full pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-all"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="space-y-6">
          
          {/* Header */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-[#6C63FF] border border-indigo-100">
              <Sparkles className="w-3 h-3 text-[#6C63FF]" /> Release Version {CURRENT_VERSION}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
              What&apos;s New in <br />
              Invoice<span className="text-[#6C63FF]">Wala</span>
            </h2>
            <p className="text-xs text-slate-500">
              We&apos;ve rolled out some amazing updates to help you scale your freelance business!
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4 pt-2">
            
            {/* Feature 1: Referral system */}
            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="p-2.5 bg-indigo-50 text-[#6C63FF] rounded-xl shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-800">Referral Program</h4>
                <p className="text-xs text-slate-550 leading-relaxed text-slate-500 font-medium">
                  Share the love! Get 1 month of Pro plan completely free for every 3 friends who upgrade.
                </p>
              </div>
            </div>

            {/* Feature 2: Email tracking */}
            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-800">Client Email Tracking</h4>
                <p className="text-xs text-slate-550 leading-relaxed text-slate-500 font-medium">
                  Know exactly when your clients open and view your invoices. Toggles available in notification settings.
                </p>
              </div>
            </div>

            {/* Feature 3: Performance optimization */}
            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-800">Performance Booster</h4>
                <p className="text-xs text-slate-550 leading-relaxed text-slate-500 font-medium">
                  Extremely fast loading layouts and client-side image compression to save uploading bandwidth.
                </p>
              </div>
            </div>

          </div>

          {/* Action CTA Button */}
          <button
            onClick={handleClose}
            className="w-full bg-[#6C63FF] hover:bg-[#5b52eb] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-sm shadow-md shadow-indigo-100"
          >
            <span>Awesome, Got It!</span>
            <ChevronRight className="w-4 h-4 text-indigo-200" />
          </button>

        </div>
      </div>
    </div>
  );
}
