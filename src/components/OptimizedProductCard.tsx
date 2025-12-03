'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useAdicionais } from '@/hooks/useAdicionais';
import { Plus, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';




interface OptimizedProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, notes?: string, customizations?: Record<string, any>) => void;
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
  const router = useRouter();
  const [notes, setNotes] = useState<string>('');
  const [isAdicionaisOpen, setIsAdicionaisOpen] = useState(false);
  const [selectedAdicionais, setSelectedAdicionais] = useState<Record<string, boolean>>({});
  const { adicionais, loading: adicionaisLoading } = useAdicionais(product.id);
  
  // Inicializar fallbackAdicionais antes de usar
  const productFallbackAdicionais = useMemo(() => (product as any).adicionais ?? [], [product]);
  const adicionaisList = useMemo(() => 
    (adicionais && adicionais.length > 0) ? adicionais : (productFallbackAdicionais || []), 
    [adicionais, productFallbackAdicionais]
  );
  
  const adicionaisTotal = useMemo(() => 
    adicionaisList.reduce((sum: number, a: any) => {
      return sum + (selectedAdicionais[a.id] ? (a.price || 0) : 0);
    }, 0),
    [adicionaisList, selectedAdicionais]
  );
  
  const hasAdicionais = useMemo(() => 
    (adicionais && adicionais.length > 0) || (productFallbackAdicionais && productFallbackAdicionais.length > 0),
    [adicionais, productFallbackAdicionais]
  );
  // Memoizar callbacks para evitar re-renderizações
  const handleAddToCart = useCallback(() => {
    if (onAddToCart && product.isAvailable) {
      const normalizedNotes = notes.trim();
      onAddToCart(product, normalizedNotes || undefined);
    }
  }, [onAddToCart, product, notes]);

  const toggleAdicional = (id: string) => {
    setSelectedAdicionais(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmAdicionais = () => {
    if (!onAddToCart) {
      setIsAdicionaisOpen(false);
      return;
    }
    const chosen = Object.keys(selectedAdicionais).filter(k => selectedAdicionais[k]);
    const customizations = {
      adicionais: chosen,
      adicionaisTotal,
    };
    const normalizedNotes = notes.trim();
    onAddToCart(product, normalizedNotes || undefined, customizations);
    setIsAdicionaisOpen(false);
    // reset selection
    setSelectedAdicionais({});
  };

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

  const isNotes = useMemo(() => {
    // Normalizar acentos e considerar plural
    const raw = (product.category?.name || '').toLowerCase();
    const name = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return name.includes('bebidas') || name.includes('hamburguer') ||  name.includes('acompanhamento')|| name.includes('sobremesa')|| name.includes('pizza');
     
  }, [product.category?.name]);

  
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

          {/* Observações (somente para hambúrguer) */}
          {isNotes && (
            <div className="mt-4">
              <Input
                type="text"
                placeholder="Observações / adicionais (ex.: alface)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 space-y-2">
            {/* Botão Adicionar Principal */}
            {showAddButton && useAuthStore.getState().isAuthenticated && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                className="w-full font-semibold"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Adicionar ao Carrinho
              </Button>
            )}

            {showAddButton && !useAuthStore.getState().isAuthenticated && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/login')}
                disabled={!product.isAvailable}
                className="w-full font-semibold"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Adicionar ao Carrinho
              </Button>
            )}

            {/* Botão Adicionais - Elegante e Destacado */}
            {hasAdicionais && product.isAvailable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdicionaisOpen(true)}
                className="w-full relative overflow-hidden border-2 border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 font-medium group"
                leftIcon={<Sparkles className="h-4 w-4 group-hover:animate-pulse" />}
              >
                <span className="relative z-10">Personalizar com Adicionais</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-500/10 transition-all" />
              </Button>
            )}
          </div>

          {/* Modal de Adicionais */}
          <Modal
            isOpen={isAdicionaisOpen}
            onClose={() => setIsAdicionaisOpen(false)}
            title={`✨ Personalize: ${product.name}`}
            size="md"
          >
            <div className="space-y-4 py-4">
              {/* Cabeçalho */}
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">Escolha os adicionais desejados para melhorar sua experiência</p>
              </div>

              {/* Lista de Adicionais */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adicionaisLoading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin">⏳</div>
                    <p className="text-gray-600 mt-2">Carregando adicionais...</p>
                  </div>
                )}

                {!adicionaisLoading && adicionaisList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum adicional disponível para este produto</p>
                  </div>
                )}

                {adicionaisList.map((a: any) => (
                  <label 
                    key={a.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedAdicionais[a.id]}
                      onChange={() => toggleAdicional(a.id)}
                      className="mt-1 w-5 h-5 text-purple-600 rounded cursor-pointer accent-purple-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{a.name}</div>
                      {a.description && (
                        <div className="text-xs text-gray-500 mt-1">{a.description}</div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-sm font-semibold text-purple-600 whitespace-nowrap">
                        +{formatCurrency(a.price)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Resumo e Ações */}
              {adicionaisList.length > 0 && (
                <>
                  <div className="border-t pt-3 mt-4">
                    <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600">Total de adicionais</span>
                        <span className="text-lg font-bold text-purple-600">
                          {formatCurrency(adicionaisTotal)}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        {Object.values(selectedAdicionais).filter(Boolean).length} selecionado(s)
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAdicionaisOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleConfirmAdicionais}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Adicionar com Adicionais
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Modal>
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
  onAddToCart?: (product: Product, notes?: string) => void;
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
