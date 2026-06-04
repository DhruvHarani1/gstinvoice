'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import ClientForm, { ClientFormValues } from '@/components/clients/ClientForm';

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be signed in to perform this action.');
        router.push('/login');
        return;
      }

      // Format fields properly
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

      const { error } = await supabase.from('clients').insert(clientPayload);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Client added successfully.');
      router.push('/dashboard/clients');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add client.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Add New Client</h2>
        <p className="text-sm text-slate-500">Create a client profile to generate invoices</p>
      </div>

      <ClientForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
