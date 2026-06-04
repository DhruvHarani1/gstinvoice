'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Validation Schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSubmittedEmail(data.email);
      setIsSubmittedSuccessfully(true);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmittedSuccessfully) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-50 text-[#6C63FF] rounded-full">
            <MailCheck className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Check your inbox</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            We sent a password reset link to <span className="font-semibold text-slate-900">{submittedEmail}</span>.
            Click the link in the email to set a new password.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#6C63FF] hover:underline flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h2>
        <p className="text-sm text-slate-500">
          Enter your email address and we will send you a link to reset your password
        </p>
      </div>

      {/* Main Password Reset Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            disabled={isLoading}
            placeholder="name@company.com"
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.email ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-4 rounded-lg flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Send Reset Link
        </button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-sm text-slate-500">
        Remembered your password?{' '}
        <Link href="/login" className="font-semibold text-[#6C63FF] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
