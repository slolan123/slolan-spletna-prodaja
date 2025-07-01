
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  naziv: string;
  cena: number;
  popust?: number;
  slika_url?: string;
  slike_urls?: string[];
  koda: string;
  zaloga: number;
  na_voljo: boolean;
  selectedVariant?: {
    id: string;
    color_name: string;
    color_value?: string;
    images: string[];
    stock: number;
  };
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: (productId: string, variantId?: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

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

  const getItemKey = (productId: string, variantId?: string) => {
    return variantId ? `${productId}-${variantId}` : productId;
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const variantId = product.selectedVariant?.id;
    const itemKey = getItemKey(product.id, variantId);
    
    // Check stock availability
    const availableStock = product.selectedVariant?.stock || product.zaloga;
    const currentInCart = getItemCount(product.id, variantId);
    
    if (currentInCart + quantity > availableStock) {
      toast({
        title: "Ni dovolj na zalogi",
        description: `Na zalogi je samo ${availableStock} kosov, v košarici pa imate že ${currentInCart}.`,
        variant: "destructive",
      });
      return;
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => {
        const existingKey = getItemKey(item.id, item.selectedVariant?.id);
        return existingKey === itemKey;
      });

      if (existingItem) {
        return prevItems.map(item => {
          const existingKey = getItemKey(item.id, item.selectedVariant?.id);
          if (existingKey === itemKey) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    const itemKey = getItemKey(productId, variantId);
    setItems(prevItems => prevItems.filter(item => {
      const existingKey = getItemKey(item.id, item.selectedVariant?.id);
      return existingKey !== itemKey;
    }));
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    const itemKey = getItemKey(productId, variantId);
    setItems(prevItems => prevItems.map(item => {
      const existingKey = getItemKey(item.id, item.selectedVariant?.id);
      if (existingKey === itemKey) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = item.popust && item.popust > 0 
        ? item.cena * (1 - item.popust / 100)
        : item.cena;
      return total + (price * item.quantity);
    }, 0);
  };

  const getItemCount = (productId: string, variantId?: string) => {
    const itemKey = getItemKey(productId, variantId);
    const item = items.find(item => {
      const existingKey = getItemKey(item.id, item.selectedVariant?.id);
      return existingKey === itemKey;
    });
    return item ? item.quantity : 0;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
