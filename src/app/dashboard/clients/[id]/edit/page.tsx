'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Client } from '@/types';
import ClientForm, { ClientFormValues } from '@/components/clients/ClientForm';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const fetchClient = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to perform this action.');
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        router.push('/dashboard/clients');
        return;
      }

      if (!data) {
        toast.error('Client not found.');
        router.push('/dashboard/clients');
        return;
      }

      setClient(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client details.';
      toast.error(errorMessage);
      router.push('/dashboard/clients');
    } finally {
      setIsLoading(false);
    }
  }, [id, supabase, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleSubmit = async (data: ClientFormValues) => {
    if (!client) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in to perform this action.');
        router.push('/login');
        return;
      }

      // Format payload properly
      const clientPayload = {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        gstin: data.gstin?.trim()?.toUpperCase() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state || null,
        pincode: data.pincode?.trim() || null,
      };

      const { error } = await supabase
        .from('clients')
        .update(clientPayload)
        .eq('id', client.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Client updated successfully.');
      router.push('/dashboard/clients');
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Edit Client</h2>
        <p className="text-sm text-slate-500">Modify client profile details and billing parameters</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#6C63FF]" />
          <p className="text-slate-500 text-sm font-medium">Fetching client profile...</p>
        </div>
      ) : (
        <ClientForm initialData={client} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
