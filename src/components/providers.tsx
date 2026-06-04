'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { WifiOff, X } from 'lucide-react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register offline support Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('InvoiceWala Service Worker registered on scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('InvoiceWala Service Worker registration failed:', err);
          });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {children}
      {/* Toast Notification Container */}
      <Toaster richColors position="top-right" closeButton />

      {/* Premium Offline Warning Banner */}
      {isOffline && !dismissed && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm bg-rose-600 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-rose-500 flex items-start gap-3.5 animate-bounce select-none">
          <div className="p-2 bg-rose-700/80 rounded-xl">
            <WifiOff className="w-5 h-5 text-rose-100" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="font-extrabold text-xs tracking-tight">You are offline</h4>
            <p className="text-[10px] text-rose-100 leading-snug">
              Some features or dashboard records may be unavailable until you reconnect.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-rose-300 hover:text-white rounded-lg hover:bg-rose-750 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}
