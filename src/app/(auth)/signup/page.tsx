'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Validation Schema
const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            business_name: data.name, // Will be parsed by DB trigger as profiles.business_name
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setRegisteredEmail(data.email);
      setIsSubmittedSuccessfully(true);
      toast.success('Registration initiated!');
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error('Could not initiate Google signup');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isSubmittedSuccessfully) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-50 text-[#6C63FF] rounded-full">
            <Mail className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Check your email</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            We sent a verification link to <span className="font-semibold text-slate-900">{registeredEmail}</span>.
            Please click the link to confirm your account and complete setup.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#6C63FF] hover:underline"
          >
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
        <p className="text-sm text-slate-500">
          Get started with invoice billing and payments in seconds
        </p>
      </div>

      {/* Main Signup Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="name">
            Full Name / Business Name
          </label>
          <input
            id="name"
            type="text"
            disabled={isLoading || isGoogleLoading}
            placeholder="John Doe or Acme Corp"
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.name ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            disabled={isLoading || isGoogleLoading}
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            disabled={isLoading || isGoogleLoading}
            placeholder="••••••••"
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.password ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            disabled={isLoading || isGoogleLoading}
            placeholder="••••••••"
            className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] disabled:opacity-50 ${
              errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
            }`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start">
          <input
            id="acceptTerms"
            type="checkbox"
            disabled={isLoading || isGoogleLoading}
            className="h-4 w-4 rounded border-slate-300 text-[#6C63FF] focus:ring-[#6C63FF] mt-0.5"
            {...register('acceptTerms')}
          />
          <div className="ml-2 text-sm">
            <label htmlFor="acceptTerms" className="font-medium text-slate-700">
              I accept the{' '}
              <Link href="/terms" className="text-[#6C63FF] hover:underline font-semibold">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#6C63FF] hover:underline font-semibold">
                Privacy Policy
              </Link>
            </label>
            {errors.acceptTerms && (
              <p className="text-red-500 text-xs mt-1">{errors.acceptTerms.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-4 rounded-lg flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Get Started
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Or signup with</span>
        </div>
      </div>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
        className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </button>

      {/* Footer Link */}
      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[#6C63FF] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
