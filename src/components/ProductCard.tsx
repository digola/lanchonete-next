'use client';

import { useState, memo, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Product, Adicional } from '@/types';
import { Clock, AlertTriangle, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAdicionais } from '@/hooks/useAdicionais';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, notes?: string, customizations?: Record<string, any>) => void;
  onViewDetails?: (product: Product) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  className?: string;
}

export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = false,
  className,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isAdicionaisOpen, setIsAdicionaisOpen] = useState(false);
  const [selectedAdicionaisIds, setSelectedAdicionaisIds] = useState<string[]>([]);
  const [selectedAdicionaisMap, setSelectedAdicionaisMap] = useState<Record<string, boolean>>({});

  const { adicionais, loading: adicionaisLoading } = useAdicionais(product.id);
  const productFallbackAdicionais = (product as any).adicionais ?? [];
  const hasAdicionais = (adicionais && adicionais.length > 0) || (productFallbackAdicionais && productFallbackAdicionais.length > 0);
  const adicionaisList = (adicionais && adicionais.length > 0) ? adicionais : (productFallbackAdicionais || []);
  const adicionaisTotal = adicionaisList.reduce((sum: number, a: Adicional) => sum + (selectedAdicionaisMap[a.id] ? (a.price || 0) : 0), 0);

  // Memoizar callbacks para evitar re-renderizações desnecessárias
  const handleAddToCart = useCallback(() => {
    if (onAddToCart && product.isAvailable) {
      onAddToCart(product);
    }
  }, [onAddToCart, product]);

  const toggleAdicional = (id: string) => {
    setSelectedAdicionaisMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmAdicionais = () => {
    if (!onAddToCart) {
      setIsAdicionaisOpen(false);
      return;
    }
    const chosen = Object.keys(selectedAdicionaisMap).filter(k => selectedAdicionaisMap[k]);
    const customizations = {
      adicionaisIds: chosen,
      adicionaisTotal,
    };
    onAddToCart(product, undefined, customizations);
    setIsAdicionaisOpen(false);
    setSelectedAdicionaisMap({});
  };

  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(product);
    }
  }, [onViewDetails, product]);

  // Memoizar valores computados
  const formattedPrice = useMemo(() => formatCurrency(product.price), [product.price]);
  
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
          {product.imageUrl && !imageError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
              unoptimized
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
                {product.category.imageUrl ? (
                  <Image 
                    src={product.category.imageUrl} 
                    alt={product.category.name}
                    width={12}
                    height={12}
                    className="w-3 h-3 object-cover rounded mr-1"
                  />
                ) : (
                  <span className="mr-1">📦</span>
                )}
                {product.category.name}
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
            {hasAdicionais && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdicionaisOpen(true)}
              >
                Adicionais
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
                {formattedPrice}
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
            {hasAdicionais && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdicionaisOpen(true)}
              >
                Adicionais
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

          {/* Modal de Adicionais */}
          <Modal
            isOpen={isAdicionaisOpen}
            onClose={() => setIsAdicionaisOpen(false)}
            title={`Adicionais — ${product.name}`}
            size="md"
          >
            <div className="space-y-4">
              {adicionaisLoading && <div>Carregando adicionais...</div>}
                {!adicionaisLoading && adicionaisList.length === 0 && (
                  <div>Nenhum adicional disponível para este produto.</div>
                )}
              <div className="space-y-3">
                {adicionaisLoading && <div>Carregando adicionais...</div>}
                {!adicionaisLoading && adicionaisList.length === 0 && (
                  <div>Nenhum adicional disponível para este produto.</div>
                )}
                {adicionaisList.map((a: Adicional) => (
                  <label key={a.id} className="flex items-center justify-between border p-3 rounded cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={!!selectedAdicionaisMap[a.id]}
                        onChange={() => toggleAdicional(a.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{a.name}</div>
                        {a.description && <div className="text-sm text-gray-600">{a.description}</div>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-semibold">{formatCurrency(a.price)}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3">
                <div className="text-sm">Total adicionais: <span className="font-medium">{formatCurrency(adicionaisTotal)}</span></div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsAdicionaisOpen(false)}>Fechar</Button>
                  <Button onClick={handleConfirmAdicionais} disabled={adicionaisList.length === 0}>Adicionar com adicionais</Button>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </CardContent>
    </Card>
  );
});

// Componente para lista de produtos
interface ProductListProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  showAddButton?: boolean;
  showDetailsButton?: boolean;
  className?: string;
}

export const ProductList = memo(function ProductList({
  products,
  onAddToCart,
  onViewDetails,
  showAddButton = true,
  showDetailsButton = false,
  className,
}: ProductListProps) {
  // Memoizar a lista de produtos para evitar re-renderizações desnecessárias
  const memoizedProducts = useMemo(() => products, [products]);

  if (memoizedProducts.length === 0) {
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
      {memoizedProducts.map((product) => (
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
});

export default ProductCard;
