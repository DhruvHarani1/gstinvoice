'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

interface Product {
  id: string;
  name: string;
  description: string;
  hsn_sac: string;
  rate: number;
  gst_rate: number;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Deletion state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hsnSac, setHsnSac] = useState('');
  const [rate, setRate] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [isSaving, setIsSaving] = useState(false);

  // Load products from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('invoicewala_products');
      if (stored) {
        try {
          setProducts(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse products:', e);
        }
      }
    }
  }, []);

  // Save products to localStorage
  const saveProductsToStorage = (updatedList: Product[]) => {
    localStorage.setItem('invoicewala_products', JSON.stringify(updatedList));
    setProducts(updatedList);
  };

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.hsn_sac.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setHsnSac('');
    setRate('');
    setGstRate('18');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setHsnSac(product.hsn_sac);
    setRate(String(product.rate));
    setGstRate(String(product.gst_rate));
    setIsModalOpen(true);
  };

  // Handle Form Submission (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Product or Service name is required.');
      return;
    }

    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum < 0) {
      toast.error('Please enter a valid rate greater than or equal to 0.');
      return;
    }

    const gstNum = parseFloat(gstRate);

    setIsSaving(true);
    // Simulate slight save delay for premium loading experience
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (editingProduct) {
        // Edit flow
        const updated = products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: name.trim(),
                description: description.trim(),
                hsn_sac: hsnSac.trim(),
                rate: rateNum,
                gst_rate: gstNum,
              }
            : p
        );
        saveProductsToStorage(updated);
        toast.success(`Product/Service "${name}" updated successfully.`);
      } else {
        // Add flow
        const newProduct: Product = {
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim(),
          hsn_sac: hsnSac.trim(),
          rate: rateNum,
          gst_rate: gstNum,
          created_at: new Date().toISOString(),
        };
        saveProductsToStorage([newProduct, ...products]);
        toast.success(`Product/Service "${name}" added successfully.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product details.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    // Simulate slight delete delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const updated = products.filter((p) => p.id !== productToDelete.id);
      saveProductsToStorage(updated);
      toast.success(`Product/Service "${productToDelete.name}" deleted successfully.`);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Currency Formatter
  const formatINR = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Products & Services</h2>
          <p className="text-sm text-slate-500">Manage products, standard service catalogs, rates, and default tax codes</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Product/Service
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[450px] relative">
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Create your first catalog item"
            description="Add products or services here to quickly reuse standard line items, pricing rates, and GST structures."
            action={{
              label: 'Add Product/Service',
              onClick: handleOpenAddModal,
            }}
          />
        ) : (
          <>
            {/* Search Header Panel */}
            <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white select-none z-10">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, description, or HSN/SAC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                />
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Description</th>
                    <th className="px-6 py-3.5">HSN/SAC</th>
                    <th className="px-6 py-3.5">Rate</th>
                    <th className="px-6 py-3.5">GST Rate</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-400 text-xs">
                        No products or services match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 max-w-[200px] truncate">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-[250px] truncate">
                          {product.description || <span className="text-slate-300 italic">No description</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          {product.hsn_sac || <span className="text-slate-300 italic font-sans">—</span>}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-950">
                          {formatINR(product.rate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-indigo-50 text-[#6C63FF] border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold">
                            {product.gst_rate}% GST
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="inline-flex p-1.5 text-slate-400 hover:text-[#6C63FF] hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="inline-flex p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
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
          </>
        )}
      </div>

      {/* Add/Edit Product Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Catalog Item' : 'Add Catalog Item'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingProduct ? 'Update standard pricing, tax rules, and metadata.' : 'Define standard details to speed up billing setup.'}
              </p>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="prod-name">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="e.g. Graphic Design Consultancy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="prod-desc">
                  Description
                </label>
                <textarea
                  id="prod-desc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                  placeholder="Standard descriptions to prefill line items..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="prod-rate">
                    Rate (INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="prod-rate"
                    type="number"
                    step="0.01"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    placeholder="e.g. 1500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="prod-hsn">
                    HSN/SAC
                  </label>
                  <input
                    id="prod-hsn"
                    type="text"
                    value={hsnSac}
                    onChange={(e) => setHsnSac(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono"
                    placeholder="e.g. 9983"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="prod-gst">
                  Default GST Rate
                </label>
                <select
                  id="prod-gst"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST (Standard Services)</option>
                  <option value="28">28% GST</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#6C63FF] hover:bg-[#554ce6] text-white font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Catalog Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        title="Delete item?"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action is permanent and cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
}
