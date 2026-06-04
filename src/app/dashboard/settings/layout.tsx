'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, FileText, Landmark, Shield, CreditCard, Bell } from 'lucide-react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Business Profile', href: '/dashboard/settings/profile', icon: User },
    { name: 'Invoice Preferences', href: '/dashboard/settings/invoice', icon: FileText },
    { name: 'Bank Details', href: '/dashboard/settings/bank', icon: Landmark },
    { name: 'Notifications', href: '/dashboard/settings/notifications', icon: Bell },
    { name: 'Account Credentials', href: '/dashboard/settings/account', icon: Shield },
    { name: 'Billing & Plan', href: '/dashboard/settings/billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side Tab Navigation */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-3 hidden lg:block">
            Settings Category
          </p>
          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 lg:shrink ${
                    isActive
                      ? 'bg-[#6C63FF] text-white shadow-md shadow-indigo-50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Settings Content Pane */}
        <main className="flex-1 w-full bg-white border border-slate-100 rounded-2xl p-6 lg:p-8 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
