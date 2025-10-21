'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApiAuth } from './useApiAuth';

// Cache global simples
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TIME = 2 * 60 * 1000; // 2 minutos

/**
 * Hook otimizado para dados do menu com cache e debounce
 */
export const useBasicMenu = (filters?: {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  const auth = useApiAuth();
  const token = auth?.token || null;
  
  // TODOS os hooks devem estar no topo
  const [debouncedSearch, setDebouncedSearch] = useState(filters?.search || '');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout>();
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [productsData, setProductsData] = useState<any>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<any>(null);

  // Hook para categorias com CACHE
  const fetchCategories = useCallback(async () => {
    const cacheKey = '/api/categories';
    
    // Verificar cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TIME * 5) { // 10 minutos para categorias
      return cached.data;
    }

    const response = await fetch(cacheKey, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Armazenar no cache
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }, [token]);

  // Hook para produtos com CACHE e debounce
  const fetchProducts = useCallback(async () => {
    const queryParams = new URLSearchParams();
    if (debouncedSearch) queryParams.set('search', debouncedSearch);
    if (filters?.categoryId) queryParams.set('categoryId', filters.categoryId);
    if (filters?.isAvailable !== undefined) queryParams.set('isAvailable', filters.isAvailable.toString());

    const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    // Verificar cache
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
      return cached.data;
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Armazenar no cache
    cache.set(url, { data, timestamp: Date.now() });

    return data;
  }, [debouncedSearch, filters?.categoryId, filters?.isAvailable, token]);

  const refresh = useCallback(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const data = await fetchProducts();
        setProductsData(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setProductsError(error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [fetchProducts]);

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
    isSearching, // Indica se está digitando
  }), [
    categoriesData,
    productsData,
    categoriesLoading,
    productsLoading,
    productsError,
    isSearching
  ]);

  // Debounce do searchTerm
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(filters?.search || '');
      setIsSearching(false);
    }, 300); // 300ms de debounce

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [filters?.search]);

  useEffect(() => {
    const loadCategories = async () => {
      // Se já tem dados em cache, não mostra loading
      const cacheKey = '/api/categories';
      const cached = cache.get(cacheKey);
      if (!cached) {
        setCategoriesLoading(true);
      }
      
      try {
        const data = await fetchCategories();
        setCategoriesData(data);
      } catch (error) {
        console.error('Erro ao carregar categorias :', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [token, fetchCategories]);

  useEffect(() => {
    const loadProducts = async () => {
      // Construir URL para verificar cache
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.set('search', debouncedSearch);
      if (filters?.categoryId) queryParams.set('categoryId', filters.categoryId);
      if (filters?.isAvailable !== undefined) queryParams.set('isAvailable', filters.isAvailable.toString());
      const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // Se já tem dados em cache, não mostra loading
      const cached = cache.get(url);
      if (!cached) {
        setProductsLoading(true);
      }
      
      setProductsError(null);
      try {
        const data = await fetchProducts();
        setProductsData(data);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        setProductsError(error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [debouncedSearch, filters?.categoryId, filters?.isAvailable, token, fetchProducts]);

  // Verificação de segurança após todos os hooks
  if (!auth) {
    console.warn('useApiAuth retornou undefined');
    return {
      categories: [],
      products: [],
      pagination: null,
      loading: { categories: false, products: false, any: false },
      errors: { categories: null, products: null, any: false },
      isSearching: false,
      refetch: () => {}
    };
  }

  return {
    ...menuData,
    refetch: refresh,
  };
};

// Função para limpar o cache manualmente
export const clearMenuCache = () => {
  cache.clear();
};
