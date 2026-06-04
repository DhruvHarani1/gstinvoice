'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  // State variables for toggles
  const [emailClientViewed, setEmailClientViewed] = useState(true);
  const [emailOverdueReminders, setEmailOverdueReminders] = useState(true);
  const [emailMonthlySummary, setEmailMonthlySummary] = useState(true);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If not found, insert defaults
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('notification_preferences')
            .insert({ user_id: user.id });
          
          if (insertError) throw insertError;
        } else {
          throw error;
        }
      } else if (data) {
        setEmailClientViewed(data.email_client_viewed);
        setEmailOverdueReminders(data.email_overdue_reminders);
        setEmailMonthlySummary(data.email_monthly_summary);
      }
    } catch (err: unknown) {
      console.error('Error fetching notification preferences:', err);
      toast.error('Failed to load notification settings.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication expired.');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email_client_viewed: emailClientViewed,
          email_overdue_reminders: emailOverdueReminders,
          email_monthly_summary: emailMonthlySummary,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Notification preferences updated successfully!');
    } catch (err: unknown) {
      console.error('Error saving notification preferences:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C63FF]" />
        <p className="text-slate-500 text-sm font-semibold">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl select-none">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#6C63FF]" /> Notification Preferences
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage how and when you receive automated emails and business updates
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 pt-4 border-t border-slate-100">
        <div className="space-y-5">
          
          {/* Toggle: Client Views Invoice */}
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100/50 transition-all">
            <div className="space-y-1 pr-4">
              <label className="text-sm font-bold text-slate-800 cursor-pointer" htmlFor="view-alert">
                Email on Client View
              </label>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Receive an immediate email alert when a client opens your invoice email or views the public link.
              </p>
            </div>
            <button
              id="view-alert"
              type="button"
              onClick={() => setEmailClientViewed(!emailClientViewed)}
              className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                emailClientViewed ? 'bg-[#6C63FF]' : 'bg-slate-200'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  emailClientViewed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle: Overdue Invoice Reminders */}
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100/50 transition-all">
            <div className="space-y-1 pr-4">
              <label className="text-sm font-bold text-slate-800 cursor-pointer" htmlFor="overdue-reminder">
                Weekly Overdue Reminders
              </label>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Get weekly reminders of unpaid invoices that have passed their due dates so you can follow up.
              </p>
            </div>
            <button
              id="overdue-reminder"
              type="button"
              onClick={() => setEmailOverdueReminders(!emailOverdueReminders)}
              className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                emailOverdueReminders ? 'bg-[#6C63FF]' : 'bg-slate-200'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  emailOverdueReminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle: Monthly Revenue Summary */}
          <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100/50 transition-all">
            <div className="space-y-1 pr-4">
              <label className="text-sm font-bold text-slate-800 cursor-pointer" htmlFor="monthly-summary">
                Monthly Business Summary
              </label>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Receive a monthly digest showing previous month revenue summaries, invoice volume, top clients, and total GST owed.
              </p>
            </div>
            <button
              id="monthly-summary"
              type="button"
              onClick={() => setEmailMonthlySummary(!emailMonthlySummary)}
              className={`w-11 h-6 shrink-0 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                emailMonthlySummary ? 'bg-[#6C63FF]' : 'bg-slate-200'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  emailMonthlySummary ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#6C63FF] hover:bg-[#5b52eb] text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 text-xs shadow-md shadow-indigo-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
