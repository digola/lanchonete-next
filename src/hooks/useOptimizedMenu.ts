'use client';

import { useMemo } from 'react';
import { useOptimizedProducts, useOptimizedCategories } from './useOptimizedApi';

/**
 * Hook otimizado para dados do menu
 * Combina cache, batch queries e smart queries
 */
export const useOptimizedMenu = (filters?: {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  // Usar hooks otimizados individuais
  const { data: categories, loading: categoriesLoading } = useOptimizedCategories();
  const { data: productsResponse, loading: productsLoading, refresh: refetchProducts } = useOptimizedProducts({
    ...(filters?.search && { search: filters.search }),
    ...(filters?.categoryId && { categoryId: filters.categoryId }),
    ...(filters?.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
  });

  // Dados memoizados
  const menuData = useMemo(() => ({
    categories: categories?.data || [],
    products: productsResponse?.data || [],
    pagination: productsResponse?.pagination || null,
    loading: {
      categories: categoriesLoading,
      products: productsLoading,
      any: categoriesLoading || productsLoading,
    },
    errors: {
      categories: null,
      products: null,
      any: false,
    },
    isStale: {
      categories: false,
      products: false,
    },
  }), [categories, productsResponse, categoriesLoading, productsLoading]);

  return {
    ...menuData,
    refetch: refetchProducts,
  };
};

/**
 * Hook para dados do dashboard otimizado
 */
export const useOptimizedDashboard = () => {
  const { data: categories, loading: categoriesLoading } = useOptimizedCategories();
  const { data: productsResponse, loading: productsLoading, refresh: refetchProducts } = useOptimizedProducts({
    isAvailable: true,
  });

  const dashboardData = useMemo(() => ({
    // Dados principais
    categories: categories?.data || [],
    products: productsResponse?.data || [],
    
    // Estatísticas calculadas
    stats: {
      totalProducts: productsResponse?.data?.length || 0,
      totalCategories: categories?.data?.length || 0,
      availableProducts: productsResponse?.data?.filter((p: any) => p.isAvailable).length || 0,
    },
    
    // Estados
    loading: {
      categories: categoriesLoading,
      products: productsLoading,
      any: categoriesLoading || productsLoading,
    },
    errors: {
      categories: null,
      products: null,
      any: false,
    },
  }), [categories, productsResponse, categoriesLoading, productsLoading]);

  return {
    ...dashboardData,
    refetch: refetchProducts,
  };
};

/**
 * Hook para dados de pedidos otimizado
 */
export const useOptimizedOrders = (filters?: {
  status?: string;
  userId?: string;
  tableId?: string;
}) => {
  // Por enquanto, retornar dados vazios para evitar erros
  const ordersData = useMemo(() => ({
    orders: [],
    tables: [],
    
    loading: {
      orders: false,
      tables: false,
      any: false,
    },
    errors: {
      orders: null,
      tables: null,
      any: false,
    },
  }), []);

  return {
    ...ordersData,
    refetch: () => Promise.resolve(),
  };
};

/**
 * Hook para invalidar cache do menu
 */
export const useMenuCacheInvalidation = () => {
  const invalidateProducts = () => {
    // Invalidar cache de produtos
    window.dispatchEvent(new CustomEvent('invalidate-queries', {
      detail: { pattern: 'products' }
    }));
  };

  const invalidateCategories = () => {
    // Invalidar cache de categorias
    window.dispatchEvent(new CustomEvent('invalidate-queries', {
      detail: { pattern: 'categories' }
    }));
  };

  const invalidateAll = () => {
    // Invalidar todo o cache
    window.dispatchEvent(new CustomEvent('invalidate-queries', {
      detail: { pattern: '.*' }
    }));
  };

  return {
    invalidateProducts,
    invalidateCategories,
    invalidateAll,
  };
};
