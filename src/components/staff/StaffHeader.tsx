'use client';


import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Button } from '@/components/ui/Button';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBasicMenu } from '@/hooks/useBasicMenu';
import { useCart } from '@/hooks/useCart';
import { Badge, TableStatusBadge } from '@/components/ui/Badge';
import { UserRole } from '@/types';
import type { Product } from '@/types';

import { 
  Menu, 
  Bell, 
  User,
  LogOut,
  Home,
  ShoppingCart,
  Users
} from 'lucide-react';

import { useApi } from '@/hooks/useApi';
import router from 'next/router';
import { toast } from '@/lib/toast';

export function StaffHeader() { 
  const { user, logout, isLoading, getRoleLabel, getUserDisplayName, hasMinimumRole } = useApiAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const { addItem, items, totalItems, setCartTable } = useCart();
  const searchParams = useSearchParams();
  // Filtros de busca e categoria para o menu
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
   const isStaff = (user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'MANAGER');
  const router = useRouter();
  //usado filtro
   const shouldShowStaffFeatures = isHydrated && isStaff;
    const [tableId, setTableId] = useState<string | null>(null);
    const handleLogout = async () => {
      setShowUserMenu(false);
      await logout();
      // Toast de sucesso de logout
      try { toast.success('Logout concluído'); } catch {}
      // Redirecionar para login após logout
      router.push('/login');
    };
  // Determina se o usuário tem pelo menos role de STAFF (inclui MANAGER e ADMIN)
  const isStaffRole = hasMinimumRole(UserRole.STAFF);
  const cartHref = isStaffRole && tableId ? `/cart?tableId=${tableId}` : '/cart';
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  // Marcar hidratação para evitar inconsistências entre SSR e Client
  useEffect(() => {
    setIsHydrated(true);
  }, []);
   // Buscar dados da mesa se tableId estiver disponível
    const { data: tableData } = useApi<any>(tableId ? `/api/tables/${tableId}` : '', { immediate: !!tableId });
    
    useEffect(() => {
      const tableIdParam = searchParams.get('tableId');
      if (tableIdParam) {
        setTableId(tableIdParam);
        // Persistir associação da mesa no carrinho
        setCartTable(tableIdParam, null);
        console.log('🪑 Mesa selecionada:', tableIdParam);
      }
    }, [searchParams, setCartTable]);
  
    useEffect(() => {
      if (tableData) {
        console.log('🪑 Dados da mesa recebidos na página principal:', tableData);
        const table = tableData.data || tableData;
        console.log('🪑 Mesa extraída na página principal:', table);
        setTableNumber(table?.number);
        // Atualizar número da mesa no carrinho (se tableId já definido)
        if (tableId) {
          setCartTable(tableId, table?.number ?? null);
        }
      }
    }, [tableData, tableId, setCartTable]);
  
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
  
    const handleAddToCart = useCallback((product: Product) => {
      console.log('🛒 Adicionando produto ao carrinho:', {
        productId: product.id,
        productName: product.name,
        price: product.price,
        isAvailable: product.isAvailable
      });
      addItem(product);
      console.log('✅ Produto adicionado com sucesso!');
    }, [addItem]);
  
    const handleCategoryFilter = useCallback((categoryId: string) => {
      setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    }, [selectedCategory]);
  
  
    // Memoizar categorias filtradas
    const filteredCategories = useMemo(() => categories || [], [categories]);
 
 return (
   <header className="bg-white shadow-sm border-b border-gray-200">
     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
       <div className="flex justify-between items-center h-16">
         {/* Esquerda: Logo, Carrinho, Navegação */}
         <div className="flex items-center space-x-6">
           {/* Logo */}
           <Link href="/staff" prefetch={false} className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-sm">L</span>
             </div>
             <span className="text-xl font-bold text-gray-900">Lanchonete</span>
           </Link>

           {/* Carrinho (apenas se houver itens) */}
           {isHydrated && totalItems != 0 && (
             <Link href={cartHref} prefetch={false} className="relative inline-block">
               <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                 <ShoppingCart className="h-4 w-4" />
                 <span className="hidden sm:inline text-sm font-medium">Carrinho</span>
                 <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                   {totalItems }
                 </span>
                               
               </button>
             </Link>
           )}

           {/* Navegação */}
           <nav className="hidden md:flex items-center space-x-6">
             <Link
               href="/staff"
               prefetch={false}
               className="text-gray-600 hover:text-primary-600 transition-colors"
             >
               Dashboard
             </Link>
             <Link
               href="/table-selection"
               prefetch={false}
               className="text-gray-600 hover:text-primary-600 transition-colors"
             >
              
             </Link>
             <Link
               href="/"
               prefetch={false}
               className="text-gray-600 hover:text-primary-600 transition-colors"
             >
               Cardápio
             </Link>
           </nav>
         </div>
  {shouldShowStaffFeatures && isStaff && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/table-selection')}
                  className="flex items-center space-x-2"
                >
                  <span>🪑</span>
                  <span>{tableId ? 'Trocar Mesa' : 'Selecionar Mesa'}</span>
                </Button>
              )}
         {/* Direita: Ações do Usuário */}
         <div className="flex items-center space-x-4">
           {/* Notificações */}
           <Button variant="ghost" size="icon">
             <Bell className="h-5 w-5" />
           </Button>

           {/* Menu do Usuário */}
           <div className="relative">
             <Button
               variant="ghost"
               onClick={() => setShowUserMenu(!showUserMenu)}
               className="flex items-center space-x-2"
             >
               <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                 <User className="h-4 w-4 text-primary-600" />
               </div>
               <div className="hidden md:block text-left">
                 <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                 <p className="text-xs text-gray-500">{getRoleLabel()}</p>
               </div>
             </Button>

             {/* Dropdown do Usuário */}
             {showUserMenu && (
               <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                 <Link
                   href="/table-selection"
                   prefetch={false}
                   className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                   onClick={() => setShowUserMenu(false)}
                 >
                   <Users className="h-4 w-4 mr-3" />
                   Mesas 
              
                 </Link>
                 <Link
                   href="/"
                   prefetch={false}
                   className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                   onClick={() => setShowUserMenu(false)}
                 >
                   <Home className="h-4 w-4 mr-3" />
                   Cardápio
                 </Link>
                 <hr className="my-1" />
                 <button
                   onClick={handleLogout}
                   disabled={isLoading}
                   className={`flex items-center w-full px-4 py-2 text-sm hover:bg-red-50 ${isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}`}
                 >
                   {isLoading ? (
                     <>
                       <div className="spinner h-4 w-4 mr-3"></div>
                       Saindo...
                     </>
                   ) : (
                     <>
                       <LogOut className="h-4 w-4 mr-3" />
                       Sair
                     </>
                   )}
                 </button>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   </header>
 );
}
