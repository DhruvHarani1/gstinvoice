'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle,
  Eye,
  Edit2,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Invoice, Client } from '@/types';
import StatusBadge from '@/components/invoice/StatusBadge';
import { revalidatePathAction } from '@/app/dashboard/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

const ITEMS_PER_PAGE = 10;

type InvoiceWithClient = Invoice & {
  client: Client;
};

interface InvoicesListClientProps {
  initialInvoices: InvoiceWithClient[];
}

type SortField = 'date' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

// Format INR currency
const formatINR = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

// Format Date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function InvoicesListClient({ initialInvoices }: InvoicesListClientProps) {
  const supabase = createClient();

  const [invoices, setInvoices] = useState<InvoiceWithClient[]>(initialInvoices);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Single Deletion State
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceWithClient | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Filter Logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // 1. Tab Filter
      if (activeTab !== 'all' && inv.status !== activeTab) {
        return false;
      }
      // 2. Search query filter
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const matchesInvoiceNum = inv.invoice_number.toLowerCase().includes(query);
      const matchesClientName = inv.client?.name.toLowerCase().includes(query) || false;

      return matchesInvoiceNum || matchesClientName;
    });
  }, [invoices, activeTab, searchQuery]);

  // Sorting Logic
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.invoice_date).getTime() - new Date(b.invoice_date).getTime();
      } else if (sortField === 'amount') {
        comparison = Number(a.total_amount) - Number(b.total_amount);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredInvoices, sortField, sortOrder]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = useMemo(() => {
    return sortedInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedInvoices, startIndex]);

  // Reset pagination on filters change
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setSelectedIds([]);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedInvoices.map((inv) => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkMarkAsPaid = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const updates = selectedIds.map((id) => {
        const inv = invoices.find((i) => i.id === id);
        return supabase
          .from('invoices')
          .update({ status: 'paid', amount_paid: inv?.total_amount || 0 })
          .eq('id', id);
      });

      const results = await Promise.all(updates);
      const firstError = results.find((r) => r.error)?.error;

      if (firstError) {
        toast.error(firstError.message);
        return;
      }

      toast.success(`Marked ${selectedIds.length} invoices as Paid successfully.`);
      
      // Update local state
      setInvoices((prev) =>
        prev.map((inv) =>
          selectedIds.includes(inv.id)
            ? { ...inv, status: 'paid', amount_paid: inv.total_amount }
            : inv
        )
      );
      setSelectedIds([]);
      await revalidatePathAction('/dashboard/invoices');
      await revalidatePathAction('/dashboard');
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', selectedIds);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Deleted ${selectedIds.length} invoices successfully.`);
      setInvoices((prev) => prev.filter((inv) => !selectedIds.includes(inv.id)));
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      await revalidatePathAction('/dashboard/invoices');
      await revalidatePathAction('/dashboard');
    } catch {
      toast.error('Failed to delete invoices.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Single Deletion
  const handleDeleteSingle = async () => {
    if (!invoiceToDelete) return;
    setIsDeletingSingle(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Invoice ${invoiceToDelete.invoice_number} deleted successfully.`);
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceToDelete.id));
      setInvoiceToDelete(null);
      await revalidatePathAction('/dashboard/invoices');
      await revalidatePathAction('/dashboard');
    } catch {
      toast.error('Failed to delete invoice.');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-500">Manage and send professional GST compliant bills</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* Filter tabs Row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-px select-none">
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === 'all' 
            ? invoices.length 
            : invoices.filter((inv) => inv.status === tab).length;

          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-xs font-bold capitalize border-b-2 transition-all relative ${
                isActive
                  ? 'border-[#6C63FF] text-[#6C63FF]'
                  : 'border-transparent text-slate-400 hover:text-slate-950'
              }`}
            >
              {tab}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-indigo-50 text-[#6C63FF]' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[450px] relative">
        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Create your first invoice"
            description="You haven't created any invoices yet. Generate a professional GST invoice with a live calculation system."
            action={{
              label: 'New Invoice',
              href: '/dashboard/invoices/new'
            }}
          />
        ) : (
          <>
            {/* Search header panel */}
        <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white select-none z-10">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by invoice number or client..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
            />
          </div>

          {/* Bulk Actions sticky bar placeholder */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-xl animate-fade-in w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs font-bold text-[#6C63FF]">
                {selectedIds.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkMarkAsPaid}
                  disabled={isBulkUpdating || isBulkDeleting}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-sm disabled:opacity-40 transition-colors"
                >
                  {isBulkUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 text-emerald-500" />}
                  Mark as Paid
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isBulkUpdating || isBulkDeleting}
                  className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-[10px] flex items-center gap-1 disabled:opacity-40 transition-colors"
                >
                  {isBulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invoices list table */}
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 select-none">
                <th className="px-6 py-3 w-[50px] text-center">
                  <input
                    type="checkbox"
                    checked={paginatedInvoices.length > 0 && selectedIds.length === paginatedInvoices.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 border-slate-300 rounded text-[#6C63FF] focus:ring-[#6C63FF]"
                  />
                </th>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Client</th>
                <th
                  onClick={() => toggleSort('date')}
                  className="px-6 py-3 cursor-pointer hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="px-6 py-3">Due Date</th>
                <th
                  onClick={() => toggleSort('amount')}
                  className="px-6 py-3 cursor-pointer hover:bg-slate-100/50 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    {sortField === 'amount' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  className="px-6 py-3 cursor-pointer hover:bg-slate-100/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-slate-400 text-xs">
                    No invoices matching search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  const isChecked = selectedIds.includes(inv.id);
                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/20 transition-colors ${isChecked ? 'bg-indigo-50/10' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(inv.id)}
                          className="w-3.5 h-3.5 border-slate-300 rounded text-[#6C63FF] focus:ring-[#6C63FF]"
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="hover:text-[#6C63FF]">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 max-w-[180px] truncate">
                        {inv.client?.name || 'Unknown Client'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {inv.due_date ? formatDate(inv.due_date) : <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-right">
                        {formatINR(Number(inv.total_amount))}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap select-none">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="inline-flex p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {inv.status === 'draft' && (
                          <Link
                            href={`/dashboard/invoices/${inv.id}/edit`}
                            className="inline-flex p-1.5 text-slate-400 hover:text-[#6C63FF] hover:bg-indigo-50/50 rounded-lg transition-all"
                            title="Edit Invoice"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          className="inline-flex p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium select-none z-10">
            <span>
              Showing {startIndex + 1} to{' '}
              {Math.min(startIndex + ITEMS_PER_PAGE, sortedInvoices.length)} of{' '}
              {sortedInvoices.length} invoices
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Delete Single Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!invoiceToDelete}
        title="Delete invoice?"
        description={`Are you sure you want to delete invoice ${invoiceToDelete?.invoice_number}? This action is permanent and will delete the invoice along with its child line items database rows.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteSingle}
        onCancel={() => setInvoiceToDelete(null)}
        isLoading={isDeletingSingle}
        type="danger"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Delete multiple invoices?"
        description={`Are you sure you want to delete the ${selectedIds.length} selected invoices? This action is permanent and cannot be undone. All linked line item rows will also be deleted.`}
        confirmLabel="Delete Invoices"
        cancelLabel="Cancel"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        isLoading={isBulkDeleting}
        type="danger"
      />
    </div>
  );
}
