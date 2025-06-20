import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Profile {
  id: string;
  user_id: string;
  ime: string;
  priimek: string;
  telefon?: string;
  naslov?: string;
  vloga: 'admin' | 'user';
  preferred_language: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, ime: string, priimek: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        // Update language preference
        if (data.preferred_language && data.preferred_language !== i18n.language) {
          i18n.changeLanguage(data.preferred_language);
          localStorage.setItem('language', data.preferred_language);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [i18n]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        toast({
          title: t('auth.loginSuccess'),
          description: t('common.success'),
        });
        return {};
      }

      return { error: t('errors.general') };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: t('errors.general') };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, ime: string, priimek: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            ime,
            priimek,
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        toast({
          title: t('auth.registerSuccess'),
          description: t('common.success'),
        });
        return {};
      }

      return { error: t('errors.general') };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: t('errors.general') };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: t('errors.general'),
          variant: 'destructive',
        });
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        toast({
          title: t('auth.logoutSuccess'),
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: t('errors.unauthorized') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        return { error: error.message };
      }

      // Update local profile state
      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      // Update language if changed
      if (updates.preferred_language && updates.preferred_language !== i18n.language) {
        i18n.changeLanguage(updates.preferred_language);
        localStorage.setItem('language', updates.preferred_language);
      }

      toast({
        title: t('common.success'),
        description: 'Profile updated successfully',
      });

      return {};
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: t('errors.general') };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin: profile?.vloga === 'admin',
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};