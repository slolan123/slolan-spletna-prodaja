import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

export const CartIcon = () => {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <Link to="/cart">
      <Button variant="ghost" size="sm" className="relative h-8 px-2">
        <ShoppingCart className="h-4 w-4" />
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
};