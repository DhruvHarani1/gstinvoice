'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, Subscription } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface ProfileContextType {
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch Subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching profile context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();

    // Listen for auth state changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSubscription(null);
        router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchProfile();
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [supabase, router, fetchProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        subscription,
        isLoading,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
