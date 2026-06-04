'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Building2, MapPin, Landmark } from 'lucide-react';
import { INDIAN_STATES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

// Validation Schemas for Step Validation
const onboardingSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  full_name: z.string().min(1, 'Your name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  gstin: z.string().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'Please select a state'),
  pincode: z.string().length(6, 'Pincode must be exactly 6 digits'),
  bank_name: z.string().optional().or(z.literal('')),
  bank_account: z.string().optional().or(z.literal('')),
  bank_ifsc: z.string().optional().or(z.literal('')),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const STEPS_COUNT = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const supabase = createClient();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      business_name: '',
      full_name: '',
      phone: '',
      gstin: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      bank_name: '',
      bank_account: '',
      bank_ifsc: '',
    },
  });

  // Pull existing session and initial profile values if they exist
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          form.reset({
            business_name: profile.business_name || '',
            full_name: user.user_metadata?.business_name || '',
            phone: profile.phone || '',
            gstin: profile.gstin || '',
            address: profile.address || '',
            city: profile.city || '',
            state: profile.state || '',
            pincode: profile.pincode || '',
            bank_name: profile.bank_name || '',
            bank_account: profile.bank_account || '',
            bank_ifsc: profile.bank_ifsc || '',
          });
        }
      } catch {
        // Silently handle error, start with defaults
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router, form]);

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await form.trigger(['business_name', 'full_name', 'phone']);
    } else if (currentStep === 2) {
      isValid = await form.trigger(['gstin', 'address', 'city', 'state', 'pincode']);
    } else if (currentStep === 3) {
      isValid = await form.trigger(['bank_name', 'bank_account', 'bank_ifsc']);
    }

    if (isValid) {
      if (currentStep < STEPS_COUNT - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        await submitOnboarding(form.getValues());
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkipBankDetails = async () => {
    form.setValue('bank_name', '');
    form.setValue('bank_account', '');
    form.setValue('bank_ifsc', '');
    await submitOnboarding(form.getValues());
  };

  const submitOnboarding = async (values: OnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: values.business_name,
          phone: values.phone,
          gstin: values.gstin || null,
          address: values.address,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          bank_name: values.bank_name || null,
          bank_account: values.bank_account || null,
          bank_ifsc: values.bank_ifsc || null,
        })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Update user metadata name
      await supabase.auth.updateUser({
        data: { business_name: values.business_name },
      });

      localStorage.setItem('onboarding_complete', 'true');
      toast.success('Onboarding complete!');
      setCurrentStep(4);
    } catch {
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#6C63FF] mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Setting up your experience...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / STEPS_COUNT) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-10 space-y-8">
        
        {/* Header & Progress Indicator */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>STEP {currentStep} OF {STEPS_COUNT}</span>
            <span>{Math.round(progressPercentage)}% COMPLETE</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#6C63FF] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div>
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-[#6C63FF]" />
                  Tell us about your business
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Let&apos;s start by setting up your business profile for billing
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="business_name">
                    Registered Business Name
                  </label>
                  <input
                    id="business_name"
                    type="text"
                    placeholder="Acme Solutions Private Limited"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                      form.formState.errors.business_name ? 'border-red-500' : 'border-slate-300'
                    }`}
                    {...form.register('business_name')}
                  />
                  {form.formState.errors.business_name && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.business_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="full_name">
                    Your Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    placeholder="Dhruv Harani"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                      form.formState.errors.full_name ? 'border-red-500' : 'border-slate-300'
                    }`}
                    {...form.register('full_name')}
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    placeholder="9876543210"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                      form.formState.errors.phone ? 'border-red-500' : 'border-slate-300'
                    }`}
                    {...form.register('phone')}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-[#6C63FF]" />
                  GST & Address
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Provide your company billing location and optional GSTIN
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="gstin">
                    GSTIN <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="gstin"
                    type="text"
                    placeholder="07AAAAA1111A1Z1"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                      form.formState.errors.gstin ? 'border-red-500' : 'border-slate-300'
                    }`}
                    {...form.register('gstin')}
                  />
                  {form.formState.errors.gstin && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.gstin.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="address">
                    Billing Address
                  </label>
                  <textarea
                    id="address"
                    rows={2}
                    placeholder="Flat No, Building, Street Address"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                      form.formState.errors.address ? 'border-red-500' : 'border-slate-300'
                    }`}
                    {...form.register('address')}
                  />
                  {form.formState.errors.address && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      placeholder="Mumbai"
                      className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                        form.formState.errors.city ? 'border-red-500' : 'border-slate-300'
                      }`}
                      {...form.register('city')}
                    />
                    {form.formState.errors.city && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="pincode">
                      Pincode
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      placeholder="400001"
                      maxLength={6}
                      className={`w-full px-3 py-2 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] ${
                        form.formState.errors.pincode ? 'border-red-500' : 'border-slate-300'
                      }`}
                      {...form.register('pincode')}
                    />
                    {form.formState.errors.pincode && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.pincode.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="state">
                    State
                  </label>
                  <select
                    id="state"
                    className={`w-full px-3 py-2 border rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] bg-white ${
                      form.formState.errors.state ? 'border-red-500' : 'border-slate-300'
                    }`}
                    {...form.register('state')}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.state && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.state.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-6 h-6 text-[#6C63FF]" />
                  Bank Details
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Optional: Add bank details to show them directly on your generated invoices
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="bank_name">
                    Bank Name
                  </label>
                  <input
                    id="bank_name"
                    type="text"
                    placeholder="HDFC Bank"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                    {...form.register('bank_name')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="bank_account">
                    Account Number
                  </label>
                  <input
                    id="bank_account"
                    type="text"
                    placeholder="50100293810293"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                    {...form.register('bank_account')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="bank_ifsc">
                    IFSC Code
                  </label>
                  <input
                    id="bank_ifsc"
                    type="text"
                    placeholder="HDFC0000123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF]"
                    {...form.register('bank_ifsc')}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-6 py-6">
              <div className="flex justify-center">
                <div className="p-4 bg-indigo-50 text-[#6C63FF] rounded-full animate-bounce">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">You&apos;re ready!</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Your business profile is fully configured. You can now start creating professional GST bills.
                </p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => {
                    router.push('/dashboard');
                    router.refresh();
                  }}
                  className="w-full bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 transition-colors flex justify-center items-center gap-2"
                >
                  Create your first invoice
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={handleSkipBankDetails}
                  disabled={isSubmitting}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800 py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-[#6C63FF] hover:bg-[#554ce6] text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === 3 ? (
                  'Complete'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
