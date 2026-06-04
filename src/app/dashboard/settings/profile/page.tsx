'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/lib/supabase/client';
import { INDIAN_STATES } from '@/lib/constants';
import { Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/image-compression';
import { revalidatePathAction } from '@/app/dashboard/actions';

export default function ProfileSettingsPage() {
  const { profile, refreshProfile } = useProfile();
  const supabase = createClient();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSig, setIsUploadingSig] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');

  // Image previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setGstin(profile.gstin || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setPincode(profile.pincode || '');
      setPhone(profile.phone || '');
      setLogoPreview(profile.logo_url);
      setSigPreview(profile.signature_url);
    }
  }, [profile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validate GSTIN if present (15 chars)
    if (gstin && gstin.trim().length !== 15) {
      toast.error('GSTIN must be exactly 15 characters alphanumeric.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: businessName,
          gstin: gstin || null,
          address: address || null,
          city: city || null,
          state: state,
          pincode: pincode || null,
          phone: phone || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Business profile updated successfully!');
      await revalidatePathAction('/dashboard');
      await refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update business profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    bucket: 'logos' | 'signatures',
    setUploading: React.Dispatch<React.SetStateAction<boolean>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    dbField: 'logo_url' | 'signature_url'
  ) => {
    let file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);

    // Compress client-side using Canvas API
    try {
      file = await compressImage(file, 600, 0.75);
    } catch (compressErr) {
      console.error('Image compression failed, uploading original:', compressErr);
    }

    // Set local preview instantly after compression
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `${uploadError.message}. Make sure the '${bucket}' bucket exists and has public read access configured.`
        );
      }

      // Generate public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Save public URL back to profile db record
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [dbField]: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success(`${bucket === 'logos' ? 'Logo' : 'Signature'} uploaded and updated successfully!`);
      await revalidatePathAction('/dashboard');
      await refreshProfile();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Business Profile</h2>
        <p className="text-slate-500 text-xs mt-0.5">Configure your company identity parameters shown on invoices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns - Inputs form */}
        <form 
          onSubmit={handleProfileSave} 
          className="lg:col-span-2 space-y-4"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.requestSubmit();
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="business-name">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="business-name"
                type="text"
                required
                autoFocus
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. Acme Corporation"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-gstin">
                GSTIN (15 chars)
              </label>
              <input
                id="profile-gstin"
                type="text"
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-mono"
                placeholder="e.g. 29ABCDE1234F1Z5"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-addr">
                Street Address
              </label>
              <input
                id="profile-addr"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. 123 Business Park, Sector 4"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-city">
                City
              </label>
              <input
                id="profile-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. Bengaluru"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-state">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="profile-state"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-pin">
                Pincode
              </label>
              <input
                id="profile-pin"
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. 560001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="profile-phone">
                Phone Number
              </label>
              <input
                id="profile-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#6C63FF] hover:bg-[#5b52eb] text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Save Profile
          </button>
        </form>

        {/* Right Column - Media Uploads & Previews */}
        <div className="space-y-6">
          {/* Logo Upload Card */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-bold text-slate-700">Company Logo</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border border-slate-200 bg-white rounded-xl overflow-hidden flex items-center justify-center relative shrink-0">
                {logoPreview ? (
                  <Image 
                    src={logoPreview} 
                    alt="Logo preview" 
                    fill 
                    sizes="64px" 
                    className="object-contain" 
                    unoptimized 
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHZpZXdCb3g9IjAgMCA4IDgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZHRoPSI4IiBmaWxsPSIjRjFGNUY5Ii8+Cjwvc3ZnPg=="
                  />
                ) : (
                  <Upload className="w-6 h-6 text-slate-300" />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-[#6C63FF]" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  onChange={(e) =>
                    handleFileUpload(e, 'logos', setIsUploadingLogo, setLogoPreview, 'logo_url')
                  }
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                >
                  Upload Logo
                </button>
                <p className="text-[9px] text-slate-400">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>

          {/* Signature Upload Card */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-bold text-slate-700">Authorized Signature</h4>
            <div className="flex items-center gap-4">
              <div className="w-20 h-12 border border-slate-200 bg-white rounded-lg overflow-hidden flex items-center justify-center relative shrink-0">
                {sigPreview ? (
                  <Image 
                    src={sigPreview} 
                    alt="Signature preview" 
                    fill 
                    sizes="80px" 
                    className="object-contain" 
                    unoptimized 
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHZpZXdCb3g9IjAgMCA4IDgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZHRoPSI4IiBmaWxsPSIjRjFGNUY5Ii8+Cjwvc3ZnPg=="
                  />
                ) : (
                  <Upload className="w-5 h-5 text-slate-300" />
                )}
                {isUploadingSig && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-[#6C63FF]" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={sigInputRef}
                  onChange={(e) =>
                    handleFileUpload(e, 'signatures', setIsUploadingSig, setSigPreview, 'signature_url')
                  }
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => sigInputRef.current?.click()}
                  disabled={isUploadingSig}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                >
                  Upload Signature
                </button>
                <p className="text-[9px] text-slate-400">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>

          {/* Live Preview Widget */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Live Invoice Preview
            </span>
            <div className="bg-white rounded-lg p-3 border border-slate-100 flex items-start justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 border border-slate-100 rounded bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 relative">
                  {logoPreview ? (
                    <Image 
                      src={logoPreview} 
                      alt="Preview logo" 
                      fill 
                      sizes="40px" 
                      className="object-contain" 
                      unoptimized 
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIHZpZXdCb3g9IjAgMCA4IDgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZHRoPSI4IiBmaWxsPSIjRjFGNUY5Ii8+Cjwvc3ZnPg=="
                    />
                  ) : (
                    <span className="text-slate-400 text-xs font-black">
                      {businessName ? businessName.charAt(0).toUpperCase() : 'B'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h5 className="text-[10px] font-black text-slate-800 truncate leading-none">
                    {businessName || 'My Business'}
                  </h5>
                  <p className="text-[8px] text-slate-400 font-mono mt-1">
                    GSTIN: {gstin || 'UNREGISTERED'}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black text-[#6C63FF] uppercase tracking-wider shrink-0 mt-0.5">
                Tax Invoice
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
