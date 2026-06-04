'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Key, Mail, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newEmail !== confirmEmail) {
      toast.error('Email confirmation does not match.');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast.success('Confirmation links dispatched! Please verify links sent to both your current and new email addresses.');
      setNewEmail('');
      setConfirmEmail('');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update email address.');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Password confirmation does not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm account deletion.');
      return;
    }

    if (!confirm('WARNING: Deleting your account is permanent and cannot be undone. All your business profiles, client rosters, subscription details, and invoices will be purged. Are you sure you wish to proceed?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Your account has been deleted successfully.');
      
      // Force user client session clear and route to login
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Account Credentials</h2>
        <p className="text-slate-500 text-xs mt-0.5">Manage password credentials, update emails, or delete your account.</p>
      </div>

      <div className="space-y-6">
        
        {/* Change Email */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Mail className="w-4 h-4 text-indigo-500" /> Change Email Address
          </h3>
          <form 
            onSubmit={handleEmailChange} 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.requestSubmit();
              }
            }}
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="new-email">
                New Email Address
              </label>
              <input
                id="new-email"
                type="email"
                required
                autoFocus
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. name@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="confirm-email">
                Confirm New Email Address
              </label>
              <input
                id="confirm-email"
                type="email"
                required
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. name@company.com"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isUpdatingEmail}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdatingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Update Email
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="border border-slate-100 rounded-xl p-5 space-y-4 bg-slate-50/20">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Key className="w-4 h-4 text-indigo-500" /> Update Password
          </h3>
          <form 
            onSubmit={handlePasswordChange} 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.requestSubmit();
              }
            }}
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="new-pwd">
                New Password (min 6 characters)
              </label>
              <input
                id="new-pwd"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="confirm-pwd">
                Confirm New Password
              </label>
              <input
                id="confirm-pwd"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Change Password
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone: Delete Account */}
        <div className="border border-red-100 rounded-xl p-5 space-y-4 bg-red-50/10">
          <h3 className="text-xs font-bold text-red-700 flex items-center gap-1.5 border-b border-red-100/50 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-500" /> Danger Zone: Delete Account
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Deleting your account is a permanent action. This will erase your invoices, client directories, subscription properties, and personal profiles immediately. You cannot undo this step.
          </p>
          <form 
            onSubmit={handleDeleteAccount} 
            className="space-y-4 max-w-sm"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.requestSubmit();
              }
            }}
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="delete-confirm">
                To confirm deletion, type <strong className="text-red-600">DELETE</strong> below:
              </label>
              <input
                id="delete-confirm"
                type="text"
                required
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-red-100 outline-none transition-all font-mono"
                placeholder="Type DELETE"
              />
            </div>
            <button
              type="submit"
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-1.5 disabled:text-slate-400 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Permanently Delete Account
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
