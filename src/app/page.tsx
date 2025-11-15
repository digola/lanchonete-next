'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import { useBasicMenu } from '@/hooks/useBasicMenu';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useCart } from '@/hooks/useCart';
import { useApi } from '@/hooks/useApi';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { OptimizedProductCard, OptimizedProductList } from '@/components/OptimizedProductCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProductSkeleton } from '@/components/ui/Skeleton';
import { UserRole } from '@/types';



import { Product, Category, GeneralSettings } from '@/types';
import Link from 'next/link';
import { 
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Building2,
  CreditCard,
  Printer,
  Database,
  Clock,
  Phone,
  Mail,
  MapPin,
  Globe,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Search, 
  User,
  LogIn,
   X, 
  ShoppingCart,
  Settings
} from 'lucide-react';
import { stat } from 'fs';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { StaffHeader } from '@/components/staff/StaffHeader';
import { CustomerHeader } from '@/components/customer/CustomerHeader';

export default function HomePage() {
  const { isAuthenticated, user, logout, getRoleLabel } = useApiAuth();
  const { addItem, items, totalItems } = useCart();
  const { settings: publicSettings, getWorkingDaysText, getWorkingHoursText } = usePublicSettings();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Detectar quando a hidratação está completa
  useEffect(() => { setIsHydrated(true);
  }, []);
  
  
  // Verificar se é staff e se há mesa na URL
  const isStaff = (user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'MANAGER');

  // Renderizar sempre o mesmo conteúdo no servidor e cliente
  const shouldShowStaffFeatures = isHydrated && isStaff;
  
  // Buscar dados da mesa se tableId estiver disponível
  const { data: tableData } = useApi<any>(tableId ? `/api/tables/${tableId}` : '', { immediate: !!tableId });
  
  useEffect(() => {
    const tableIdParam = searchParams.get('tableId');
    if (tableIdParam) {
      setTableId(tableIdParam);
      console.log('🪑 Mesa selecionada:', tableIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tableData) {
      console.log('🪑 Dados da mesa recebidos na página principal:', tableData);
      const table = tableData.data || tableData;
      console.log('🪑 Mesa extraída na página principal:', table);
      setTableNumber(table?.number);
    }
  }, [tableData]);

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

  // Remover debounce manual - agora é feito no hook
  // useEffect removido - o debounce é feito internamente no useOptimizedMenuStatic

  const handleAddToCart = useCallback((product: Product, notes?: string) => {
    console.log('🛒 Adicionando produto ao carrinho:', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      isAvailable: product.isAvailable
    });
    addItem(product, 1, notes);
    console.log('✅ Produto adicionado com sucesso!');
  }, [addItem]);

  const handleCategoryFilter = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
  }, [selectedCategory]);


  // Memoizar categorias filtradas
  const filteredCategories = useMemo(() => categories || [], [categories]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header por regra de usuário */}
      {isHydrated && isAuthenticated ? (
        (() => {
          const role = (user?.role || '').toUpperCase();
          if (role.includes('ADMIN')) return <AdminHeader />;
          if (role === 'STAFF' || role === 'MANAGER') return <StaffHeader/>;
          return <CustomerHeader />;
        })()
      ) : (
        <header className="bg-white shadow-sm border-b">
          <div className="container-app">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 space-y-4 lg:space-y-0">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-white">🍔</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{publicSettings?.restaurantName || 'Lanchonete'}</h1>
                  <p className="text-sm text-gray-600">Cardápio Online</p>
                </div>
              </Link>

              {/* User Actions */}
              <div className="flex items-center justify-between lg:justify-end space-x-4">
                {/* Cart Indicator */}
                {isHydrated && totalItems > 0 && (
                  <Link href={isStaff && tableId ? `/cart?tableId=${tableId}` : '/cart'} className="relative inline-block">
                    <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm font-medium">Carrinho</span>
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    </button>
                  </Link>
                )}
                
                {/* Botões de autenticação (convidado) */}
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="outline" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
                      <span className="hidden sm:inline">Entrar</span>
                      <span className="sm:hidden">Login</span>
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      <span className="hidden sm:inline">Cadastrar</span>
                      <span className="sm:hidden">Cadastro</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

   {/* Main Content */}
      
    <main className="flex-grow">
        {/* Mensagem de seleção de mesa para Staff/Manager */}
          {shouldShowStaffFeatures && tableId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🪑</span>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Mesa {tableNumber || 'N/A'}
                  </h3>
                  <p className="text-sm text-blue-700 hidden sm:block">
                    Selecione produtos para adicionar ao pedido desta mesa
                  </p>
                  <p className="text-sm text-blue-700 sm:hidden">
                    Adicionar produtos ao pedido 
                  </p>
                </div>
              </div>
            </div>


            
          </div>
          
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">Cardápio</h2>
              {/* Mesa selecionada para Staff/Manager */}
              {shouldShowStaffFeatures && tableId && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <span>🪑</span>
                  <span>Mesa {tableNumber || 'N/A'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
            
              {/* Campo de Busca */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Seleção Rápida por Categoria */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Seleção Rápida</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('')}
                className="transition-all duration-200 hover:scale-105"
              >
                🍽️ Todas
              </Button>
              {categoriesLoading ? (
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                filteredCategories.map((category: Category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryFilter(category.id)}
                    className="transition-all duration-200 hover:scale-105"
                    leftIcon={
                      category.imageUrl ? (
                        <Image 
                          src={category.imageUrl} 
                          alt={category.name}
                          width={16}
                          height={16}
                          className="w-4 h-4 object-cover rounded"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        />
                      ) : (
                        <span className="text-sm">
                          {category.name === 'Bebidas' ? '🥤' :
                           category.name === 'Pratos' ? '🍽️' :
                           category.name === 'Sobremesas' ? '🍰' :
                           category.name === 'Pizzas' ? '🍕' :
                           category.name === 'Lanches' ? '🍔' : '📦'}
                        </span>
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


        {/* Products Grid */}
        <div className="transition-all duration-300 ease-in-out">
          {(productsLoading || isSearching) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
              {[...Array(8)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
             
            </div>
            
          ) : (
            
            <div className="animate-fade-in">
               <OptimizedProductList
                products={products}
                onAddToCart={handleAddToCart}
               // showAddButton={shouldShowStaffFeatures}
              />
               
            </div>
          )}
          
          {/* Indicador de busca */}
          {isSearching && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              Buscando produtos...
            </div>
          )}
        </div>

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
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
            }}>
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
        )};

        </main> 

    
    <div className="flex-grow">
       {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container-app">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div>
              <h3 className="font-semibold mb-4">
               {publicSettings?.restaurantName ? publicSettings.restaurantName : 'Lanchonete nome'}
            
              </h3>
             
              <p className="text-gray-400 text-sm">
                O melhor da comida caseira com a praticidade do delivery.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  📞 {publicSettings?.restaurantPhone ? (
                    <a href={`tel:${publicSettings.restaurantPhone.replace(/\s|\(|\)|-/g, '')}`} className="hover:text-primary-400 transition-colors">
                      {publicSettings.restaurantPhone}
                    </a>
                  ) : (
                    '(11) 99999-9999'
                  )}
                </p>
                <p>
                  ✉️ {publicSettings?.restaurantEmail ? (
                    <a href={`mailto:${publicSettings.restaurantEmail}`} className="hover:text-primary-400 transition-colors">
                      {publicSettings.restaurantEmail}
                    </a>
                  ) : (
                    'contato@lanchonete.com'
                  )}
                </p>
                <p>
                  📍 {publicSettings?.restaurantAddress ? (
                    <a
                      href={`https://www.google.com/maps/search/?q=${encodeURIComponent(publicSettings.restaurantAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary-400 transition-colors"
                    >
                      {publicSettings.restaurantAddress}
                    </a>
                  ) : (
                    'Endereço não informado'
                  )}
                </p>
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <h3 className="font-semibold mb-4">Horário de Funcionamento</h3>
              <div className="space-y-1 text-sm text-gray-400">
                <p>{getWorkingDaysText()}: {getWorkingHoursText()}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 {publicSettings?.restaurantName || 'Lanchonete'}. Todos os direitos reservados.</p>
          </div>
      </div>
        <div className='mt-6 flex justify-center space-x-4'>
          <h2>precisando de um site igual a este?</h2>   
          <p>
            Entre em contato conosco para obter mais informações no celular (14)991247981 (sidnei).
          </p>
        </div>
        
        </footer>
</div>
</div>


  );
}
