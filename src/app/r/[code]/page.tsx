'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  params: {
    code: string;
  };
}

export default function ReferralRedirectPage({ params }: Props) {
  const router = useRouter();
  const { code } = params;

  useEffect(() => {
    if (code) {
      // Store in cookie (30 days TTL)
      const maxAge = 30 * 24 * 60 * 60; // 30 days
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `referred_by_code=${encodeURIComponent(code)}; max-age=${maxAge}; path=/; SameSite=Lax${
        isSecure ? '; Secure' : ''
      }`;

      // Store in localStorage
      localStorage.setItem('referred_by_code', code);
    }

    // Redirect to signup page
    router.replace('/signup');
  }, [code, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 max-w-sm px-6">
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring outer */}
          <div className="absolute w-16 h-16 rounded-full bg-indigo-100 animate-ping opacity-75"></div>
          {/* Spinner inside */}
          <div className="relative w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-800">Applying Referral Code</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Securing your special referral reward. Just a second while we redirect you to signup...
          </p>
        </div>
      </div>
    </div>
  );
}
