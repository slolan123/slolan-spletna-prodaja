import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface CartItem {
  id: string;
  naziv: string;
  cena: number;
  popust: number;
  slika_url: string;
  quantity: number;
  koda: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { t } = useTranslation();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        toast({
          title: t('cart.addedToCart'),
          description: `${product.naziv} (${existingItem.quantity + 1}x)`,
        });
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const cartItem: CartItem = {
          id: product.id,
          naziv: product.naziv,
          cena: product.cena,
          popust: product.popust || 0,
          slika_url: product.slika_url,
          quantity: 1,
          koda: product.koda,
        };
        
        toast({
          title: t('cart.addedToCart'),
          description: product.naziv,
        });
        
        return [...prevItems, cartItem];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => {
      const removedItem = prevItems.find(item => item.id === productId);
      if (removedItem) {
        toast({
          title: t('cart.removedFromCart'),
          description: removedItem.naziv,
        });
      }
      return prevItems.filter(item => item.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const finalPrice = item.cena * (1 - item.popust / 100);
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};