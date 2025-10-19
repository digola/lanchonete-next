import { useState, useEffect, useMemo } from 'react';
import { useApiCache } from './useApiCache';
import { Product, Category } from '@/types';

interface UseOptimizedMenuOptions {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}

export function useOptimizedMenu(options: UseOptimizedMenuOptions = {}) {
  const { search, categoryId, isAvailable } = options;

  // Buscar categorias com cache de 5 minutos
  const {
    data: categoriesData,
    loading: categoriesLoading,
    fetchData: refetchCategories,
  } = useApiCache<{ data: Category[] }>(
    '/api/categories',
    async () => {
      const response = await fetch('/api/categories', {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth-token') && { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    { ttl: 5 * 60 * 1000 }
  );

  // Construir URL de produtos apenas quando necessário
  const productsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (isAvailable) params.append('isAvailable', 'true');
    if (categoryId) params.append('categoryId', categoryId);
    if (search) params.append('search', search);
    params.append('limit', '50'); // Limitar a 50 produtos
    
    return `/api/products?${params.toString()}`;
  }, [search, categoryId, isAvailable]);

  // Buscar produtos com cache de 2 minutos
  const {
    data: productsData,
    loading: productsLoading,
    fetchData: refetchProducts,
    invalidate: invalidateProductsCache,
  } = useApiCache<{ data: Product[]; pagination: any }>(
    productsUrl,
    async () => {
      const response = await fetch(productsUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth-token') && { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    { ttl: 2 * 60 * 1000 }
  );

  const categories = useMemo(() => categoriesData?.data || [], [categoriesData]);
  const products = useMemo(() => productsData?.data || [], [productsData]);
  const pagination = useMemo(() => productsData?.pagination || null, [productsData]);

  // Filtrar produtos no cliente se houver busca (para melhor performance)
  const filteredProducts = useMemo(() => {
    if (!search) return products;
    
    const searchLower = search.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    );
  }, [products, search]);

  const loading = {
    categories: categoriesLoading,
    products: productsLoading,
  };

  const refetch = {
    categories: refetchCategories,
    products: refetchProducts,
  };

  return {
    categories,
    products: filteredProducts,
    pagination,
    loading,
    refetch,
    invalidateProductsCache,
  };
}

