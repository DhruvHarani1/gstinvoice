'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { INDIAN_STATES } from '@/lib/constants';
import { Client } from '@/types';

// Zod Validation Schema for Client Form
const clientFormSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address').or(z.literal('')).nullable().optional(),
  phone: z.string().nullable().optional(),
  gstin: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GSTIN format. Must be 15 characters alphanumeric (e.g., 07AAAAA1111A1Z1)'
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

export type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Client | null;
  onSubmit: (data: ClientFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export default function ClientForm({ initialData, onSubmit, isSubmitting }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    mode: 'onBlur',
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      gstin: initialData?.gstin || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      pincode: initialData?.pincode || '',
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      onKeyDown={handleKeyDown}
      className="space-y-6 max-w-2xl bg-white p-8 rounded-2xl border border-slate-100 shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="name">
            Client / Business Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Acme Corporates Ltd."
            autoFocus
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.name ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="billing@acme.com"
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.email ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="phone">
            Phone Number
          </label>
          <input
            id="phone"
            type="text"
            placeholder="9876543210"
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.phone ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('phone')}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* GSTIN */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="gstin">
            GSTIN <span className="text-slate-400 font-normal">(15 digit alphanumeric)</span>
          </label>
          <input
            id="gstin"
            type="text"
            placeholder="27AAAAA1111A1Z1"
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400  focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.gstin ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('gstin')}
          />
          {errors.gstin && (
            <p className="text-red-500 text-xs mt-1">{errors.gstin.message}</p>
          )}
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="address">
            Billing Address
          </label>
          <textarea
            id="address"
            rows={3}
            placeholder="Unit 102, Building A, Industrial Estate"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50"
            {...register('address')}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="city">
            City
          </label>
          <input
            id="city"
            type="text"
            placeholder="Bengaluru"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50"
            {...register('city')}
          />
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="pincode">
            Pincode
          </label>
          <input
            id="pincode"
            type="text"
            placeholder="560001"
            maxLength={6}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.pincode ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('pincode')}
          />
          {errors.pincode && (
            <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>
          )}
        </div>

        {/* State */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="state">
            State <span className="text-red-500">*</span>
          </label>
          <select
            id="state"
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] bg-white disabled:opacity-50 ${
              errors.state ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('state')}
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.name}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          {errors.state && (
            <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
          )}
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
        <Link
          href="/dashboard/clients"
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Client
        </button>
      </div>
    </form>
  );
}
