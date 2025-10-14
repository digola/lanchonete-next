'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';

import { useBasicMenu } from '@/hooks/useBasicMenu';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useCart } from '@/hooks/useCart';
import { OptimizedProductCard, OptimizedProductList } from '@/components/OptimizedProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Search, Filter, X } from 'lucide-react';
import Link from 'next/link';

export default function CustomerCartPage() {
  const { isAuthenticated, user, logout, getRoleLabel } = useApiAuth();
  const { addItem, items, totalItems } = useCart();

  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Buscar dados do menu com hook básico e estável
  const {
    categories,
    products,
    pagination,
    loading: { categories: categoriesLoading, products: productsLoading },
    refetch: refetchProducts,
    isSearching,
  } = useBasicMenu({
    ...(searchTerm && { search: searchTerm }),
    ...(selectedCategory && { categoryId: selectedCategory }),
    isAvailable: true,
  });

  const handleAddToCart = useCallback((product: Product) => {
    console.log('🛒 Adicionando produto ao carrinho:', {
      productId: product.id,
      productName: product.name,
      price: product.price,
    });
    addItem(product);
  }, [addItem]);

  const handleCategoryFilter = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
  }, [selectedCategory]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
  }, []);

  // Memoizar categorias filtradas
  const filteredCategories = useMemo(() => {
    return categories?.filter((category: Category) => category.isActive) || [];
  }, [categories]);

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para acessar esta página.
          </p>
          <Link href="/login">
            <Button variant="primary">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/customer/dashboard" className="hover:text-primary-600">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">Cardápio</span>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cardápio
          </h1>
          <p className="text-gray-600">
            Escolha seus produtos favoritos e adicione ao carrinho
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filtros
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filtros</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  leftIcon={<X className="h-4 w-4" />}
                >
                  Limpar
                </Button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Categorias</h4>
                <div className="flex flex-wrap gap-2">
                  {categoriesLoading ? (
                    <div className="flex space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    filteredCategories.map((category: Category) => (
                      <Badge
                        key={category.id}
                        variant={selectedCategory === category.id ? 'primary' : 'outline'}
                        className="cursor-pointer hover:bg-primary-50"
                        onClick={() => handleCategoryFilter(category.id)}
                      >
                        {category.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="transition-all duration-300 ease-in-out">
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="animate-fade-in">
              <OptimizedProductList
                products={products}
                onAddToCart={handleAddToCart}
                showAddButton={true}
              />
            </div>
          )}
          
          {/* Indicador de busca */}
          {isSearching && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
              Buscando produtos...
            </div>
          )}
        </div>

        {/* Empty State */}
        {!productsLoading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar seus filtros ou termos de busca
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}
    </div>
  );
}
