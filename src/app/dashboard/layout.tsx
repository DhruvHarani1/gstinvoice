'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  Receipt,
  Bell,
  Menu,
  X,
  Plus,
  LogOut,
  User as UserIcon,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { ProfileProvider, useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Sidebar Navigation Configuration
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Products/Services', href: '/dashboard/products', icon: Package },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, subscription, isLoading } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine Page Title dynamically
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Overview';
    if (pathname.startsWith('/dashboard/invoices')) return 'Invoices';
    if (pathname.startsWith('/dashboard/clients')) return 'Clients';
    if (pathname.startsWith('/dashboard/products')) return 'Products & Services';
    if (pathname.startsWith('/dashboard/reports')) return 'Reports & Analytics';
    if (pathname.startsWith('/dashboard/settings')) return 'Settings';
    if (pathname.startsWith('/dashboard/onboarding')) return 'Onboarding';
    return 'Dashboard';
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      toast.error('Error signing out');
    }
  };

  // Get Initials for Avatar
  const getUserInitials = () => {
    if (profile?.business_name) {
      return profile.business_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
    }
    return 'US';
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        {/* Sidebar Skeleton */}
        <aside className="hidden md:flex flex-col w-[240px] bg-white border-r border-slate-100 p-6 space-y-8 animate-pulse shrink-0">
          <div className="h-8 bg-slate-200 rounded-lg w-32" />
          <div className="space-y-4 flex-1">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-10 bg-slate-100 rounded-lg" />
            ))}
          </div>
          <div className="h-16 bg-slate-100 rounded-xl" />
        </aside>

        {/* Content area skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Skeleton */}
          <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-32" />
            <div className="flex items-center gap-4">
              <div className="h-9 bg-slate-200 rounded-lg w-28" />
              <div className="h-8 w-8 bg-slate-200 rounded-full" />
              <div className="h-8 w-8 bg-slate-200 rounded-full" />
            </div>
          </header>
          {/* Page Body Skeleton */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-white border border-slate-100 rounded-2xl animate-pulse" />
              <div className="h-40 bg-white border border-slate-100 rounded-2xl animate-pulse" />
              <div className="h-40 bg-white border border-slate-100 rounded-2xl animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isFreePlan = !subscription || subscription.plan === 'free';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 p-6 justify-between select-none">
      <div className="space-y-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-[#6C63FF] rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Invoice<span className="text-[#6C63FF]">Wala</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#6C63FF] text-white shadow-sm shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade Banner & User Section */}
      <div className="space-y-6 pt-4 border-t border-slate-100">
        {/* Upgrade Banner for Free Plan */}
        {isFreePlan && (
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white space-y-3 relative overflow-hidden shadow-sm">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
              <Sparkles className="w-20 h-20" />
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-200">Free Tier Limit</h5>
              <p className="text-xs leading-relaxed text-indigo-100">
                You can create up to 5 invoices. Upgrade to get unlimited invoices.
              </p>
            </div>
            <Link
              href="/dashboard/settings?tab=billing"
              className="block w-full text-center bg-white hover:bg-slate-50 text-[#6C63FF] font-bold py-1.5 px-3 rounded-lg text-xs transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-[#6C63FF] font-bold text-sm shrink-0 border border-indigo-100">
            {getUserInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 truncate">
              {profile?.business_name || 'My Business'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                subscription?.plan === 'business'
                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                  : subscription?.plan === 'pro'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {subscription?.plan || 'Free'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar (Fixed left, width 240px) */}
      <aside className="hidden md:block w-[240px] shrink-0 h-full">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[240px] h-full shadow-2xl relative animate-slide-in">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-40">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 leading-none">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Primary Action Button (New Invoice) */}
            <Link
              href="/dashboard/invoices/new"
              className="bg-[#6C63FF] hover:bg-[#554ce6] text-white text-sm font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </Link>

            {/* Notification Bell */}
            <button className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 p-1 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-[#6C63FF] font-bold text-xs border border-indigo-100 shrink-0">
                  {getUserInitials()}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1 text-slate-700 z-50">
                  <div className="px-4 py-2 border-b border-slate-50 text-xs font-semibold text-slate-400 select-none">
                    Signed in as <br />
                    <span className="text-slate-600 truncate block font-bold mt-0.5">
                      {profile?.business_name || 'My Business'}
                    </span>
                  </div>
                  <Link
                    href="/dashboard/settings?tab=profile"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 font-medium transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Profile Settings
                  </Link>
                  <Link
                    href="/dashboard/settings?tab=billing"
                    onClick={() => setIsUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 font-medium transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-slate-400" />
                    Billing Plan
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Child Router Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProfileProvider>
  );
}
