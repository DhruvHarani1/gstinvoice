'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Copy, 
  Check, 
  Share2, 
  Gift, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralPage() {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [referralsSent, setReferralsSent] = useState(0);
  const [referralsConverted, setReferralsConverted] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadReferralStats() {
      if (!profile?.id) return;
      
      try {
        setIsStatsLoading(true);
        
        // 1. Get referred profile signups (RLS limits results to referred profiles only)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id');
          
        if (profilesError) throw profilesError;
        setReferralsSent(profilesData?.length || 0);

        // 2. Get converted subscriptions (RLS limits results to referred users' subscriptions)
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select('user_id, plan')
          .neq('plan', 'free');
          
        if (subsError) throw subsError;
        setReferralsConverted(subsData?.length || 0);

      } catch (err) {
        console.error('Error loading referral stats:', err);
      } finally {
        setIsStatsLoading(false);
      }
    }

    if (profile?.id) {
      loadReferralStats();
    }
  }, [profile, supabase]);

  const referralCode = profile?.referral_code || 'CODE';
  
  // Build referral link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://invoicewala.in';
  const referralLink = `${origin}/r/${referralCode}`;
  const whatsappText = `I use InvoiceWala to generate professional GST invoices in 30 seconds. Sign up using my referral link to get started: ${referralLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">Loading referral panel...</p>
        </div>
      </div>
    );
  }

  // Calculate pending until next reward
  const rewardedCount = profile?.referrals_rewarded || 0;
  const targetForNext = (rewardedCount + 1) * 3;
  const remainingForNext = Math.max(0, targetForNext - referralsConverted);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 select-none">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl border border-indigo-950 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="absolute top-[-30px] right-[-30px] opacity-10 blur-xl w-60 h-60 bg-indigo-500 rounded-full animate-pulse"></div>
        <div className="relative z-10 space-y-6 md:max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Gift className="w-3.5 h-3.5" /> Growth Hack
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              Invite friends. <br />
              <span className="text-indigo-400 bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">Get free Pro months.</span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
              Word of mouth is our biggest growth hack! For every 3 friends you invite who upgrade to Pro, we will extend your own subscription by 1 month for free.
            </p>
          </div>
          
          {/* Reward Status Banner */}
          <div className="flex items-center gap-3 p-4 bg-indigo-950/60 backdrop-blur-sm border border-indigo-800/40 rounded-2xl">
            <Award className="w-6 h-6 text-yellow-400 shrink-0" />
            <div className="text-sm">
              <span className="font-bold block text-slate-100">Reward: Get 1 month Pro free for every 3 friends who upgrade</span>
              {remainingForNext > 0 ? (
                <span className="text-slate-400 text-xs">You are only <strong className="text-indigo-300">{remainingForNext}</strong> converted referral{remainingForNext > 1 ? 's' : ''} away from your next reward month!</span>
              ) : (
                <span className="text-emerald-400 text-xs font-bold">You hit the milestone! Your next month is being added.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Panel & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Columns - Share Box */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#6C63FF]" /> Share Your Referral Link
          </h2>

          <div className="space-y-4">
            {/* Link Copy Widget */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Unique Link</label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-55 border border-slate-200 rounded-xl bg-slate-50">
                <span className="text-sm font-semibold text-slate-700 px-3 truncate select-all flex-1">
                  {referralLink}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 animate-scale-up" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 shadow-sm shadow-emerald-500/10 transition-colors text-sm"
              >
                {/* SVG Whatsapp Logo */}
                <svg className="w-4.5 h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.558 1.865 14.09 .831 11.5 0.831c-5.442 0-9.87 4.423-9.873 9.87-.001 1.772.463 3.506 1.343 5.027l-.936 3.42 3.506-.922zm13.117-7.202c-.312-.156-1.848-.91-2.131-1.013-.282-.105-.489-.156-.693.156-.204.311-.788 1.013-.967 1.22-.178.204-.356.23-.668.074-1.26-.63-2.157-1.093-3.024-2.583-.229-.395-.084-.61.072-.767.143-.14.313-.364.471-.546.156-.182.208-.312.313-.52.105-.208.052-.389-.026-.546-.078-.156-.693-1.67-.95-2.285-.25-.605-.503-.523-.693-.533l-.591-.01c-.204 0-.536.077-.816.388-.28.311-1.07 1.045-1.07 2.548s1.093 2.955 1.246 3.162c.153.208 2.151 3.284 5.21 4.603.727.314 1.294.502 1.737.643.73.232 1.393.197 1.917.12.584-.087 1.848-.755 2.11-1.48.261-.726.261-1.349.183-1.479-.077-.13-.282-.208-.595-.364z" />
                </svg>
                Share on WhatsApp
              </a>
              <button
                onClick={handleCopyLink}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl flex justify-center items-center gap-2 transition-all text-sm"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>

          {/* Quick FAQ / How it works */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">How it works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-[#6C63FF]">1</div>
                <p className="text-xs font-bold text-slate-800">Share your link</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Send your link to other freelancers or small business owners.</p>
              </div>
              <div className="space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-[#6C63FF]">2</div>
                <p className="text-xs font-bold text-slate-800">They register</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Your friends signup for InvoiceWala and test out the system.</p>
              </div>
              <div className="space-y-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-[#6C63FF]">3</div>
                <p className="text-xs font-bold text-slate-800">Earn Pro Month</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Once 3 of them upgrade to Pro, we extend your Pro plan by 1 month!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats Block */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Referral Statistics
            </h2>

            {isStatsLoading ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-10 bg-slate-100 rounded-lg" />
                <div className="h-10 bg-slate-100 rounded-lg" />
                <div className="h-10 bg-slate-100 rounded-lg" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* Stat: Referrals Sent */}
                <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-[#6C63FF] rounded-lg">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sent</span>
                      <span className="text-[11px] text-slate-400 font-medium">Registered Signups</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-slate-800">{referralsSent}</span>
                </div>

                {/* Stat: Referrals Converted */}
                <div className="flex justify-between items-center p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Converted</span>
                      <span className="text-[11px] text-slate-400 font-medium">Upgraded to Pro</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-emerald-600">{referralsConverted}</span>
                </div>

                {/* Stat: Free Months Claimed */}
                <div className="flex justify-between items-center p-3.5 bg-yellow-50/50 rounded-xl border border-yellow-100/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                      <Gift className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rewarded</span>
                      <span className="text-[11px] text-slate-400 font-medium">Free Pro Months</span>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-yellow-700">{rewardedCount}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Referral Code: <strong className="text-[#6C63FF] font-black">{referralCode}</strong>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
