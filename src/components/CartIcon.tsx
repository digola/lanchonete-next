'use client';

import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface CartIconProps {
  className?: string;
}

export const CartIcon = ({ className = '' }: CartIconProps) => {
  const { totalItems, isEmpty } = useCart();
  
  console.log('🛒 CartIcon renderizado:', {
    totalItems,
    isEmpty,
    timestamp: new Date().toISOString()
  });


  return (
    <Link 
      href="/cart" 
      className={`relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
    >
      <ShoppingCart className="h-6 w-6 text-gray-700" />
      
      {!isEmpty && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );
};
