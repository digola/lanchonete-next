'use client';

import { memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Plus, Eye } from 'lucide-react';

interface OptimizedProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  className?: string;
}

/**
 * Componente de produto otimizado
 * Reduz re-renderizações desnecessárias
 */
export const OptimizedProductCard = memo(function OptimizedProductCard({
  product,
  onAddToCart,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = false,
  className,
}: OptimizedProductCardProps) {
  // Memoizar callbacks para evitar re-renderizações
  const handleAddToCart = useCallback(() => {
    if (onAddToCart && product.isAvailable) {
      onAddToCart(product);
    }
  }, [onAddToCart, product]);

  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  }, [onViewDetails, product]);

  // Memoizar valores computados
  const formattedPrice = useMemo(() => 
    formatCurrency(product.price), 
    [product.price]
  );
  
  const cardClassName = useMemo(() => 
    `group transition-all duration-200 hover:shadow-medium ${
      !product.isAvailable ? 'opacity-75' : ''
    } ${className}`, 
    [product.isAvailable, className]
  );

  return (
    <Card 
      className={cardClassName}
      hover="lift"
      clickable
    >
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">
                {formattedPrice}
              </span>
              
              {!product.isAvailable && (
                <span className="text-xs text-red-500 font-medium">
                  Indisponível
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            {showAddButton && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                className="flex-1"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Adicionar
              </Button>
            )}
            
            {showDetailsButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                leftIcon={<Eye className="h-4 w-4" />}
              >
                Ver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * Lista de produtos otimizada
 */
export const OptimizedProductList = memo(function OptimizedProductList({
  products,
  onAddToCart,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = false,
  className,
}: {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <OptimizedProductCard
          key={product.id}
          product={product}
          {...(onAddToCart && { onAddToCart })}
          {...(onViewDetails && { onViewDetails })}
          showAddButton={showAddButton}
          showDetailsButton={showDetailsButton}
        />
      ))}
    </div>
  );
});
