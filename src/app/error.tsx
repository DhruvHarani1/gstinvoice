'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for tracking
    console.error('Captured Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none font-sans">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-12 shadow-2xl max-w-md w-full text-center space-y-6 animate-fade-in-up">
        
        {/* Error icon */}
        <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Something went wrong</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            An unexpected error occurred while executing this page. We have logged this occurrence. Please try again.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#6C63FF] hover:bg-[#554ce6] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
