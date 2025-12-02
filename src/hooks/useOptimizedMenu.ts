import { useState, useEffect, useMemo } from 'react';
import { useApiCache } from './useApiCache';
import { Product, Category } from '@/types';

interface UseOptimizedMenuOptions {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}

/**
 * useOptimizedMenu
 *
 * Hook responsável por buscar e otimizar o consumo de categorias e produtos
 * com cache e filtragem local. Utiliza useApiCache internamente com TTLs
 * diferentes por recurso para reduzir chamadas à API sem perder reatividade.
 *
 * - Categorias: TTL de 5 minutos, com stale-while-revalidate
 * - Produtos: TTL de 2 minutos, com stale-while-revalidate
 *
 * Filtros suportados:
 *  - search: termo de busca aplicado localmente (cliente)
 *  - categoryId: filtra produtos por categoria na chamada ao backend
 *  - isAvailable: filtra apenas produtos disponíveis
 *
 * @param options Opções de filtro e comportamento
 * @returns Objeto com listas de categorias e produtos (filtrados), paginação,
 * estados de loading, funções de refetch e tempo de cache dos produtos.
 */
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
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Falha ao buscar categorias');
      return res.json();
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutos
      staleWhileRevalidate: true,
    }
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
    cacheTime: productsCacheTime,
  } = useApiCache<{ data: Product[]; pagination: any }>(
    productsUrl,
    async () => {
      const res = await fetch(productsUrl);
      if (!res.ok) throw new Error('Falha ao buscar produtos');
      return res.json();
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutos
      staleWhileRevalidate: true,
    }
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

  const RefetchProducts = {
    categories: refetchCategories,
    products: refetchProducts,
  };

  return {
    categories,
    products: filteredProducts,
    pagination,
    loading,
    RefetchProducts,
    cacheTime: productsCacheTime || 0,
  };
}

