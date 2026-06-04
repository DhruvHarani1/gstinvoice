'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured Critical Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none font-sans antialiased">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-12 shadow-2xl max-w-md w-full text-center space-y-6">
          
          <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-650 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Critical error occurred</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              A fatal application rendering event occurred. Please hit the button below to retry refreshing the page components.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-[#6C63FF] hover:bg-[#554ce6] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Application
          </button>

        </div>
      </body>
    </html>
  );
}
