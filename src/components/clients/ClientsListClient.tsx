'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Users,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { revalidatePathAction } from '@/app/dashboard/actions';

const ITEMS_PER_PAGE = 10;

// Currency Formatter
const formatINR = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

interface ClientsListClientProps {
  initialClients: Client[];
  invoiceTotals: Record<string, number>;
}

export default function ClientsListClient({ initialClients, invoiceTotals }: ClientsListClientProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    const backupClients = [...clients];
    
    // Optimistic Update
    setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
    const targetId = clientToDelete.id;
    const targetName = clientToDelete.name;
    setClientToDelete(null);
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', targetId);

      if (error) {
        // Rollback
        setClients(backupClients);
        toast.error(error.message);
        return;
      }

      toast.success(`Client "${targetName}" deleted successfully.`);
      // Purge server router caches
      await revalidatePathAction('/dashboard/clients');
      await revalidatePathAction('/dashboard');
    } catch {
      // Rollback
      setClients(backupClients);
      toast.error('Failed to delete client.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter clients by search query
  const filteredClients = clients.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.gstin && c.gstin.toLowerCase().includes(query))
    );
  });

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  return (
    <div className="space-y-6">
      {/* Title & Add CTA */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-sm text-slate-500">Manage and track your client billing directories</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      {/* Main List Box */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[400px]">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Add your first client"
            description="You haven't added any clients yet. Register a client profile and start generating GST invoices."
            action={{
              label: 'Add Client',
              href: '/dashboard/clients/new'
            }}
          />
        ) : (
          /* Active Client List Dashboard UI */
          <div className="flex flex-col justify-between flex-grow">
            {/* Search Filter Header */}
            <div className="p-4 border-b border-slate-50">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, or GSTIN..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                />
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">GSTIN</th>
                    <th className="px-6 py-3.5">City</th>
                    <th className="px-6 py-3.5">Total Invoiced</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {paginatedClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                        No clients matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 truncate max-w-[180px]">
                          {client.name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-[150px] truncate">
                          {client.email || <span className="text-slate-300 italic">No email</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          {client.gstin || <span className="text-slate-300 italic font-sans">Unregistered</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {client.city || <span className="text-slate-300 italic">—</span>}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {formatINR(invoiceTotals[client.id] || 0)}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <Link
                             href={`/dashboard/clients/${client.id}/edit`}
                             className="inline-flex p-1.5 text-slate-400 hover:text-[#6C63FF] hover:bg-indigo-50 rounded-lg transition-all"
                             title="Edit Client"
                           >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setClientToDelete(client)}
                            className="inline-flex p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium select-none">
                <span>
                  Showing {startIndex + 1} to{' '}
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)} of{' '}
                  {filteredClients.length} clients
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={clientToDelete !== null}
        title="Delete client?"
        description={`Are you sure you want to delete ${clientToDelete?.name}? This action is permanent and will delete their company data. Existing invoices linked to this client will remain.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteClient}
        onCancel={() => setClientToDelete(null)}
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}
