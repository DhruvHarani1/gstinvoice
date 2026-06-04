import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  TrendingUp,
  Clock,
  FileText,
  Users,
  Plus,
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
  PlusCircle,
  BarChart3,
  Building2,
  Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { InvoiceStatus } from '@/types';

// Currency Formatter
const formatINR = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

// Date Formatter
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Percentage Change Helper
const calcChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export default async function DashboardPage() {
  const supabase = createClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch Merchant Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name')
    .eq('id', user.id)
    .single();

  // Fetch Invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, client:clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch Clients Count
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch Clients Count (for change calc, previous month)
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { count: clientsLastMonth } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lt('created_at', startOfCurrentMonth.toISOString());

  // Statistics Calculations
  const invoicesList = invoices || [];
  const clientCount = totalClients || 0;
  const clientCountLastMonth = clientsLastMonth || 0;

  // Invoices Created
  const invoicesThisMonth = invoicesList.filter(
    (inv) => new Date(inv.invoice_date) >= startOfCurrentMonth
  );
  const invoicesLastMonth = invoicesList.filter(
    (inv) => {
      const d = new Date(inv.invoice_date);
      return d >= startOfLastMonth && d <= endOfLastMonth;
    }
  );

  // Revenue (Paid Invoices)
  const revenueThisMonth = invoicesThisMonth
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const revenueLastMonth = invoicesLastMonth
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  // Outstanding Sent/Overdue Invoices (Total active, not just this month)
  const outstandingAmount = invoicesList
    .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.amount_paid || 0)), 0);

  const outstandingLastMonth = invoicesList
    .filter((inv) => {
      const d = new Date(inv.invoice_date);
      return d < startOfCurrentMonth && (inv.status === 'sent' || inv.status === 'overdue');
    })
    .reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.amount_paid || 0)), 0);

  // Growth Calculations
  const revenueChange = calcChange(revenueThisMonth, revenueLastMonth);
  const outstandingChange = calcChange(outstandingAmount, outstandingLastMonth);
  const invoicesChange = calcChange(invoicesThisMonth.length, invoicesLastMonth.length);
  const clientsChange = calcChange(clientCount, clientCountLastMonth);

  // Recent Invoices (limit to 5)
  const recentInvoices = invoicesList.slice(0, 5);

  // Helper for Status Badge Styling
  const getStatusBadge = (status: InvoiceStatus) => {
    const config = {
      draft: { bg: 'bg-slate-50 border-slate-200 text-slate-700', label: 'Draft' },
      sent: { bg: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Sent' },
      paid: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Paid' },
      overdue: { bg: 'bg-rose-50 border-rose-200 text-rose-700', label: 'Overdue' },
      cancelled: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Cancelled' },
    };

    const style = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${style.bg}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner or Empty Invoice Onboarding Notification */}
      {invoicesList.length === 0 ? (
        <div className="p-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 translate-y-[-12px]">
            <Sparkles className="w-64 h-64" />
          </div>
          <div className="space-y-3 max-w-lg z-10 text-center md:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Welcome to InvoiceWala, {profile?.business_name || 'Business Owner'}!
            </h2>
            <p className="text-indigo-100 text-base">
              You are ready to start invoicing. Create your first professional, GST-compliant invoice in less than 30 seconds.
            </p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="px-6 py-3 bg-white hover:bg-slate-50 text-[#6C63FF] font-bold rounded-xl shadow-sm hover:shadow transition-all duration-150 shrink-0 z-10 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Welcome back, {profile?.business_name || 'Partner'}!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Here is how your business is performing this month
            </p>
          </div>
          <Link
            href="/dashboard/invoices/new"
            className="self-start sm:self-auto bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Revenue (This Month)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900">{formatINR(revenueThisMonth)}</h3>
            <div className="flex items-center gap-1 text-xs">
              {revenueChange >= 0 ? (
                <span className="text-emerald-600 font-bold flex items-center">
                  +{revenueChange}%
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center">
                  {revenueChange}%
                </span>
              )}
              <span className="text-slate-400">from last month</span>
            </div>
          </div>
        </div>

        {/* Outstanding Amount */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Outstanding Balance</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900">{formatINR(outstandingAmount)}</h3>
            <div className="flex items-center gap-1 text-xs">
              {outstandingChange <= 0 ? (
                <span className="text-emerald-600 font-bold flex items-center">
                  {outstandingChange}%
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center">
                  +{outstandingChange}%
                </span>
              )}
              <span className="text-slate-400">from last month</span>
            </div>
          </div>
        </div>

        {/* Invoices Count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Invoices (This Month)</span>
            <div className="p-2 bg-indigo-50 text-[#6C63FF] rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900">{invoicesThisMonth.length}</h3>
            <div className="flex items-center gap-1 text-xs">
              {invoicesChange >= 0 ? (
                <span className="text-emerald-600 font-bold flex items-center">
                  +{invoicesChange}%
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center">
                  {invoicesChange}%
                </span>
              )}
              <span className="text-slate-400">from last month</span>
            </div>
          </div>
        </div>

        {/* Total Clients */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Total Clients</span>
            <div className="p-2 bg-indigo-50 text-[#6C63FF] rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-slate-900">{clientCount}</h3>
            <div className="flex items-center gap-1 text-xs">
              {clientsChange >= 0 ? (
                <span className="text-emerald-600 font-bold flex items-center">
                  +{clientsChange}%
                </span>
              ) : (
                <span className="text-rose-600 font-bold flex items-center">
                  {clientsChange}%
                </span>
              )}
              <span className="text-slate-400">from last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Invoices Table + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Invoices Panel (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Recent Invoices</h3>
              {invoicesList.length > 5 && (
                <Link
                  href="/dashboard/invoices"
                  className="text-xs font-semibold text-[#6C63FF] hover:underline flex items-center gap-0.5"
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentInvoices.length === 0 ? (
              /* Empty Invoice State */
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-800 text-sm">No invoices found</h4>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto">
                    You haven&apos;t generated any invoices yet. Click button below to create your first GST bill.
                  </p>
                </div>
                <Link
                  href="/dashboard/invoices/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#6C63FF] text-xs font-bold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Invoice
                </Link>
              </div>
            ) : (
              /* Invoices Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/55 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 select-none">
                      <th className="px-6 py-3">Invoice #</th>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <Link href={`/dashboard/invoices/${inv.id}`} className="hover:text-[#6C63FF]">
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 max-w-[150px] truncate">
                          {inv.client?.name || 'Unknown Client'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {formatDate(inv.invoice_date)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatINR(Number(inv.total_amount))}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(inv.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (1/3 width) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <h3 className="font-bold text-slate-800">Quick Actions</h3>

          <div className="grid grid-cols-1 gap-3">
            {/* New Invoice */}
            <Link
              href="/dashboard/invoices/new"
              className="flex items-center justify-between p-4 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 rounded-xl transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-[#6C63FF] rounded-lg group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">New Invoice</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Generate a new bill</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#6C63FF] transition-colors" />
            </Link>

            {/* Add Client */}
            <Link
              href="/dashboard/clients?action=new"
              className="flex items-center justify-between p-4 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 rounded-xl transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-[#6C63FF] rounded-lg group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Add Client</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Add a new billing client</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#6C63FF] transition-colors" />
            </Link>

            {/* View Reports */}
            <Link
              href="/dashboard/reports"
              className="flex items-center justify-between p-4 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/20 rounded-xl transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-[#6C63FF] rounded-lg group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">View Reports</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Monitor revenue charts</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#6C63FF] transition-colors" />
            </Link>
          </div>

          {/* Quick Business Card Summary */}
          {profile?.business_name && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-white text-slate-500 rounded-lg border border-slate-100 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Profile</p>
                <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{profile.business_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
