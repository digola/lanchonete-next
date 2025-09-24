'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';
import { Plus, Clock, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  className?: string;
}

export const ProductCard = ({
  product,
  onAddToCart,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = false,
  className,
}: ProductCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = () => {
    if (onAddToCart && product.isAvailable) {
      onAddToCart(product);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  return (
    <Card 
      className={`group transition-all duration-200 hover:shadow-medium ${
        !product.isAvailable ? 'opacity-75' : ''
      } ${className}`}
      hover="lift"
      clickable
    >
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
          {product.imageUrl && !imageError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-4xl text-gray-400">🍔</span>
            </div>
          )}

          {/* Availability Badge */}
          {!product.isAvailable && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" size="sm">
                Indisponível
              </Badge>
            </div>
          )}

          {/* Category Badge */}
          {product.category && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" size="sm">
                {product.category.icon} {product.category.name}
              </Badge>
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center space-x-2">
            {showDetailsButton && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleViewDetails}
              >
                Ver Detalhes
              </Button>
            )}
            {showAddButton && product.isAvailable && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Adicionar
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {product.name}
            </h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Price and Preparation Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">
                {formatCurrency(product.price)}
              </span>
            </div>
            
            {product.preparationTime > 0 && (
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {product.preparationTime}min
                </span>
              </div>
            )}
          </div>

          {/* Allergens */}
          {product.allergens && (
            <div className="flex items-start space-x-1 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Contém: {product.allergens}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            {showDetailsButton && (
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleViewDetails}
              >
                Ver Detalhes
              </Button>
            )}
            {showAddButton && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                {product.isAvailable ? 'Adicionar' : 'Indisponível'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para lista de produtos
interface ProductListProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  className?: string;
}

export const ProductList = ({
  products,
  onAddToCart,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = false,
  className,
}: ProductListProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-gray-600">
          Tente ajustar os filtros ou verifique novamente mais tarde.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          {...(onAddToCart && { onAddToCart })}
          {...(onViewDetails && { onViewDetails })}
          {...(showAddButton !== undefined && { showAddButton })}
          {...(showDetailsButton !== undefined && { showDetailsButton })}
        />
      ))}
    </div>
  );
};

export default ProductCard;
