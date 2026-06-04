import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full text-center space-y-6 sm:space-y-8 animate-fade-in-up">
        
        {/* Styled CSS/SVG Illustration */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          {/* Subtle decorative circles */}
          <div className="absolute w-40 h-40 rounded-full bg-indigo-50/70 border border-indigo-100/30 animate-pulse" />
          <div className="absolute w-24 h-24 rounded-full bg-white border border-indigo-100 shadow-sm" />
          
          {/* SVG Vector sheet & magnifying glass */}
          <svg
            className="w-20 h-20 text-[#6C63FF] relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.156 12.016a2.25 2.25 0 11-3.182-3.182 2.25 2.25 0 013.182 3.182zM21 21l-3.5-3.5"
            />
          </svg>
          
          {/* Large text badge */}
          <span className="absolute bottom-2 bg-indigo-50 border border-indigo-100 text-[#6C63FF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm z-20">
            404 Error
          </span>
        </div>

        {/* Text descriptions */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Page not found</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            The page you are looking for does not exist, was renamed, or has been removed from the InvoiceWala servers.
          </p>
        </div>

        {/* CTA Redirect button */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-[#6C63FF] hover:bg-[#554ce6] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
