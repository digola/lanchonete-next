'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApiCache } from './useApiCache';
import { useApiAuth } from './useApiAuth';

/**
 * Hook básico e estável para dados do menu
 * Implementação simples sem debounce complexo
 */
export const useBasicMenu = (filters?: {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  const { token } = useApiAuth();
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [isSearching, setIsSearching] = useState(false);

  // Atualizar termo de busca quando filtros mudam
  useEffect(() => {
    if (filters?.search !== searchTerm) {
      setSearchTerm(filters?.search || '');
    }
  }, [filters?.search, searchTerm]);

  // Hook para categorias (dados estáticos - cache muito longo)
  const fetchCategories = useCallback(async () => {
    const response = await fetch('/api/categories', {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }, [token]);

  const { data: categoriesData, loading: categoriesLoading } = useApiCache(
    'static:categories',
    fetchCategories,
    {
      ttl: 60 * 60 * 1000, // 1 hora para categorias
      staleWhileRevalidate: true,
    }
  );

  // Hook para produtos (dados dinâmicos - cache médio)
  const fetchProducts = useCallback(async () => {
    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.set('search', searchTerm);
    if (filters?.categoryId) queryParams.set('categoryId', filters.categoryId);
    if (filters?.isAvailable !== undefined) queryParams.set('isAvailable', filters.isAvailable.toString());

    const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }, [searchTerm, filters?.categoryId, filters?.isAvailable, token]);

  const cacheKey = `products:${searchTerm}:${filters?.categoryId}:${filters?.isAvailable}`;
  
  const { data: productsData, loading: productsLoading, error: productsError, refresh } = useApiCache(
    cacheKey,
    fetchProducts,
    {
      ttl: 5 * 60 * 1000, // 5 minutos para produtos
      staleWhileRevalidate: true,
    }
  );

  // Dados memoizados para evitar re-renders
  const menuData = useMemo(() => ({
    categories: categoriesData?.data || [],
    products: productsData?.data || [],
    pagination: productsData?.pagination || null,
    loading: {
      categories: categoriesLoading,
      products: productsLoading,
      any: categoriesLoading || productsLoading,
    },
    errors: {
      categories: null,
      products: productsError,
      any: !!productsError,
    },
    isSearching: false, // Removido debounce por enquanto
  }), [
    categoriesData,
    productsData,
    categoriesLoading,
    productsLoading,
    productsError
  ]);

  return {
    ...menuData,
    refetch: refresh,
  };
};
