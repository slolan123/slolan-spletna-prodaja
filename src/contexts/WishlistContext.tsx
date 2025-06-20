import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface WishlistContextType {
  wishlistItems: string[];
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  loadWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: React.ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const { user } = useAuth();
  const { t } = useTranslation();

  const loadWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('izdelek_id')
        .eq('uporabnik_id', user.id);

      if (error) throw error;

      setWishlistItems(data?.map(item => item.izdelek_id) || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId);
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: t('errors.unauthorized'),
        description: 'Prijavite se za dodajanje v seznam želja',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          uporabnik_id: user.id,
          izdelek_id: productId,
        });

      if (error) throw error;

      setWishlistItems(prev => [...prev, productId]);
      toast({
        title: t('wishlist.addedToWishlist'),
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: t('errors.general'),
        variant: 'destructive',
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('uporabnik_id', user.id)
        .eq('izdelek_id', productId);

      if (error) throw error;

      setWishlistItems(prev => prev.filter(id => id !== productId));
      toast({
        title: t('wishlist.removedFromWishlist'),
      });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: t('errors.general'),
        variant: 'destructive',
      });
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const value = {
    wishlistItems,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    loadWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};