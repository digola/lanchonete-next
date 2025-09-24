'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

import { useProducts, useCategories } from '@/hooks/useApi';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useCart } from '@/hooks/useCart';
import { ProductCard, ProductList } from '@/components/ProductCard';
import { CartIcon } from '@/components/CartIcon';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Search, User, LogIn, Filter, X } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, user, logout, getRoleLabel } = useApiAuth();
  const { addItem } = useCart();

  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Buscar categorias
  const { data: categories, loading: categoriesLoading } = useCategories();

  // Buscar produtos com filtros
  const { data: productsResponse, loading: productsLoading, execute: refetchProducts } = useProducts({
    ...(searchTerm && { search: searchTerm }),
    ...(selectedCategory && { categoryId: selectedCategory }),
    isAvailable: true,
  });

  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination;

  // Aplicar filtros com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      refetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, refetchProducts]);

  const handleAddToCart = (product: Product) => {
    console.log('🛒 Adicionando produto ao carrinho:', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      isAvailable: product.isAvailable
    });
    addItem(product);
    console.log('✅ Produto adicionado com sucesso!');
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  const filteredCategories = categories?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container-app">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">🍔</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lanchonete</h1>
                <p className="text-sm text-gray-600">Cardápio Online</p>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Debug Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const cartData = localStorage.getItem('lanchonete-cart-v2');
                  console.log('🔍 Debug - localStorage atual:', cartData);
                  if (cartData) {
                    const parsed = JSON.parse(cartData);
                    console.log('🔍 Debug - Dados parseados:', parsed);
                    console.log('🔍 Debug - Items no localStorage:', parsed.items?.length || 0);
                  }
                }}
              >
                🔍 Debug
              </Button>
              
              {/* Cart Icon */}
              <CartIcon />
              
              {/* User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-600">{getRoleLabel()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" onClick={logout}>
                      Sair
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="outline" leftIcon={<LogIn className="h-4 w-4" />}>
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary">
                      Cadastrar
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-app py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Cardápio</h2>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filtros
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Filtros</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Categorias</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === '' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryFilter('')}
                  >
                    Todas
                  </Button>
                  {categoriesLoading ? (
                    <div className="flex space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    filteredCategories.map((category: Category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCategoryFilter(category.id)}
                        leftIcon={
                          category.imageUrl ? (
                            <Image 
                              src={category.imageUrl} 
                              alt={category.name}
                              width={16}
                              height={16}
                              className="w-4 h-4 object-cover rounded"
                            />
                          ) : (
                            <span>📦</span>
                          )
                        }
                      >
                        {category.name}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <ProductList
            products={products}
            onAddToCart={handleAddToCart}
            showAddButton={true}
          />
        )}

        {/* Empty State */}
        {!productsLoading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou verifique novamente mais tarde.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container-app">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Lanchonete</h3>
              <p className="text-gray-400 text-sm">
                O melhor da comida caseira com a praticidade do delivery.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📞 (11) 99999-9999</p>
                <p>✉️ contato@lanchonete.com</p>
                <p>📍 Rua das Flores, 123 - Centro</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Horário de Funcionamento</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>Segunda a Sexta: 8h às 22h</p>
                <p>Sábado: 9h às 23h</p>
                <p>Domingo: 10h às 21h</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Lanchonete. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
