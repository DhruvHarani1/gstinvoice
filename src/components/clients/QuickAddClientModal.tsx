'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { INDIAN_STATES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types';

const quickClientSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).nullable().optional(),
  phone: z.string().nullable().optional(),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GSTIN format (15 characters alphanumeric)'
    )
    .or(z.literal(''))
    .nullable()
    .optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().min(1, 'State is required'),
  pincode: z
    .string()
    .length(6, 'Pincode must be exactly 6 digits')
    .or(z.literal(''))
    .nullable()
    .optional(),
});

type QuickClientValues = z.infer<typeof quickClientSchema>;

interface QuickAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
}

export default function QuickAddClientModal({ isOpen, onClose, onClientAdded }: QuickAddClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickClientValues>({
    resolver: zodResolver(quickClientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: QuickClientValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in.');
        return;
      }

      const clientPayload = {
        user_id: user.id,
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        gstin: data.gstin?.trim()?.toUpperCase() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state || null,
        pincode: data.pincode?.trim() || null,
      };

      const { data: insertedData, error } = await supabase
        .from('clients')
        .insert(clientPayload)
        .select('*')
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Client added successfully.');
      reset();
      onClientAdded(insertedData);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add client.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Quick Add Client</h3>
          <p className="text-xs text-slate-500">Register a new client profile without leaving the invoice builder</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-name">
                Client / Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="quick-name"
                type="text"
                placeholder="Acme Corporates Ltd."
                {...register('name')}
                disabled={isSubmitting}
                className={`w-full px-3 py-1.5 border text-sm rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                  errors.name ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-red-500 text-[10px] mt-0.5">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-email">Email</label>
              <input
                id="quick-email"
                type="email"
                placeholder="billing@acme.com"
                {...register('email')}
                disabled={isSubmitting}
                className={`w-full px-3 py-1.5 border text-sm rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                  errors.email ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-phone">Phone</label>
              <input
                id="quick-phone"
                type="text"
                placeholder="9876543210"
                {...register('phone')}
                disabled={isSubmitting}
                className="w-full px-3 py-1.5 border border-slate-200 text-sm rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
              />
            </div>

            {/* GSTIN */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-gstin">GSTIN</label>
              <input
                id="quick-gstin"
                type="text"
                placeholder="27AAAAA1111A1Z1"
                {...register('gstin')}
                disabled={isSubmitting}
                className={`w-full px-3 py-1.5 border text-sm rounded-lg text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                  errors.gstin ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.gstin && <p className="text-red-500 text-[10px] mt-0.5">{errors.gstin.message}</p>}
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-address">Billing Address</label>
              <textarea
                id="quick-address"
                rows={2}
                placeholder="Unit 102, Building A"
                {...register('address')}
                disabled={isSubmitting}
                className="w-full px-3 py-1.5 border border-slate-200 text-sm rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-city">City</label>
              <input
                id="quick-city"
                type="text"
                placeholder="Bengaluru"
                {...register('city')}
                disabled={isSubmitting}
                className="w-full px-3 py-1.5 border border-slate-200 text-sm rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
              />
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-pincode">Pincode</label>
              <input
                id="quick-pincode"
                type="text"
                placeholder="560001"
                maxLength={6}
                {...register('pincode')}
                disabled={isSubmitting}
                className={`w-full px-3 py-1.5 border text-sm rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                  errors.pincode ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.pincode && <p className="text-red-500 text-[10px] mt-0.5">{errors.pincode.message}</p>}
            </div>

            {/* State */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="quick-state">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="quick-state"
                {...register('state')}
                disabled={isSubmitting}
                className={`w-full px-3 py-1.5 border text-sm rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] bg-white ${
                  errors.state ? 'border-red-500' : 'border-slate-200'
                }`}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              {errors.state && <p className="text-red-500 text-[10px] mt-0.5">{errors.state.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#6C63FF] hover:bg-[#554ce6] text-white font-bold py-2 px-5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
