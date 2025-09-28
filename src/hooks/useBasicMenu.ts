'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
// Removido useApiCache - não mais necessário
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

  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const data = await fetchCategories();
        setCategoriesData(data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [token]); // Removido fetchCategories das dependências

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

  const [productsData, setProductsData] = useState<any>(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<any>(null);

  useEffect(() => {
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
  }, [searchTerm, filters?.categoryId, filters?.isAvailable, token]); // Removido fetchProducts das dependências

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
