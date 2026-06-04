import { useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/lib/supabase/client';
import { PLAN_LIMITS } from '@/lib/constants';

export function useSubscription() {
  const { subscription, refreshProfile } = useProfile();
  const [liveInvoiceCount, setLiveInvoiceCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const supabase = createClient();

  const plan = subscription?.plan || 'free';
  const limit = PLAN_LIMITS[plan]?.invoices ?? 5;

  const isProPlan = () => plan === 'pro';
  const isBusinessPlan = () => plan === 'business';

  const fetchLiveInvoiceCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!error && count !== null) {
        setLiveInvoiceCount(count);
      }
    } catch (err) {
      console.error('Error fetching live invoice count:', err);
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    fetchLiveInvoiceCount();
  }, [subscription]);

  const canCreateInvoice = () => {
    return liveInvoiceCount < limit;
  };

  return {
    plan,
    status: subscription?.status || 'active',
    currentPeriodEnd: subscription?.current_period_end || null,
    invoiceCount: liveInvoiceCount,
    limit,
    isLoading: loadingCount,
    isProPlan,
    isBusinessPlan,
    canCreateInvoice,
    refreshSubscription: async () => {
      await refreshProfile();
      await fetchLiveInvoiceCount();
    },
  };
}
