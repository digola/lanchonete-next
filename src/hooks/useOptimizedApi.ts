'use client';

import { useCallback } from 'react';
import { useApiCache, useBatchApiCache, cacheUtils } from './useApiCache';
import { useApiAuth } from './useApiAuth';

/**
 * Hook otimizado para produtos com cache
 */
export const useOptimizedProducts = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  const { token } = useApiAuth();

  const buildUrl = useCallback(() => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.categoryId) queryParams.set('categoryId', params.categoryId);
    if (params?.isAvailable !== undefined) queryParams.set('isAvailable', params.isAvailable.toString());

    return `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  }, [params]);

  const fetchProducts = useCallback(async () => {
    const url = buildUrl();
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
  }, [buildUrl, token]);

  const cacheKey = `products:${JSON.stringify(params || {})}`;
  
  return useApiCache(cacheKey, fetchProducts, {
    ttl: 5 * 60 * 1000, // 5 minutos para produtos (aumentar cache)
    staleWhileRevalidate: true,
  });
};

/**
 * Hook otimizado para categorias com cache
 */
export const useOptimizedCategories = (includeProducts?: boolean) => {
  const { token } = useApiAuth();

  const fetchCategories = useCallback(async () => {
    const queryParams = new URLSearchParams();
    if (includeProducts) queryParams.set('includeProducts', 'true');
    
    const url = `/api/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
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
  }, [includeProducts, token]);

  const cacheKey = `categories:${includeProducts ? 'with-products' : 'basic'}`;
  
  return useApiCache(cacheKey, fetchCategories, {
    ttl: 30 * 60 * 1000, // 30 minutos para categorias (mudam muito pouco)
    staleWhileRevalidate: true,
  });
};

/**
 * Hook para buscar dados do dashboard em lote
 */
export const useOptimizedDashboard = () => {
  const { token } = useApiAuth();

  const fetchDashboardData = useCallback(async () => {
    const urls = [
      '/api/orders?limit=5&status=pendente',
      '/api/orders?limit=5&status=confirmado',
      '/api/products?limit=10&isAvailable=true',
      '/api/categories',
      '/api/users?limit=5',
      '/api/tables?status=ocupada',
    ];

    const responses = await Promise.all(
      urls.map(url => 
        fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        })
      )
    );

    const results = await Promise.all(
      responses.map(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
    );

    return {
      pendingOrders: results[0],
      confirmedOrders: results[1],
      recentProducts: results[2],
      categories: results[3],
      recentUsers: results[4],
      occupiedTables: results[5],
    };
  }, [token]);

  return useApiCache('dashboard:data', fetchDashboardData, {
    ttl: 1 * 60 * 1000, // 1 minuto para dashboard
    staleWhileRevalidate: true,
  });
};

/**
 * Hook para buscar dados relacionados em lote
 */
export const useOptimizedBatchData = (entityType: 'products' | 'orders' | 'users' | 'tables') => {
  const { token } = useApiAuth();

  const fetchBatchData = useCallback(async (keys: string[]) => {
    const results: Record<string, any> = {};

    // Buscar dados em paralelo
    const promises = keys.map(async (key) => {
      try {
        const response = await fetch(`/api/${entityType}/${key}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return { key, data };
      } catch (error) {
        console.error(`Erro ao buscar ${entityType} ${key}:`, error);
        return { key, data: null };
      }
    });

    const responses = await Promise.all(promises);
    
    responses.forEach(({ key, data }) => {
      results[key] = data;
    });

    return results;
  }, [entityType, token]);

  return useBatchApiCache([], fetchBatchData, {
    ttl: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para dados que raramente mudam (categorias, configurações)
 */
export const useOptimizedStaticData = () => {
  const { token } = useApiAuth();

  const fetchStaticData = useCallback(async () => {
    const [categoriesResponse, tablesResponse] = await Promise.all([
      fetch('/api/categories', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }),
      fetch('/api/tables', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }),
    ]);

    if (!categoriesResponse.ok || !tablesResponse.ok) {
      throw new Error('Erro ao buscar dados estáticos');
    }

    const [categories, tables] = await Promise.all([
      categoriesResponse.json(),
      tablesResponse.json(),
    ]);

    return {
      categories: categories.data || [],
      tables: tables.data || [],
    };
  }, [token]);

  return useApiCache('static:data', fetchStaticData, {
    ttl: 30 * 60 * 1000, // 30 minutos para dados estáticos
    staleWhileRevalidate: true,
  });
};

/**
 * Hook para invalidar cache quando dados são modificados
 */
export const useCacheInvalidation = () => {
  const invalidateProducts = useCallback(() => {
    cacheUtils.invalidateProducts();
  }, []);

  const invalidateCategories = useCallback(() => {
    cacheUtils.invalidateCategories();
  }, []);

  const invalidateOrders = useCallback(() => {
    cacheUtils.invalidateOrders();
  }, []);

  const invalidateUsers = useCallback(() => {
    cacheUtils.invalidateUsers();
  }, []);

  const invalidateTables = useCallback(() => {
    cacheUtils.invalidateTables();
  }, []);

  const invalidateAll = useCallback(() => {
    cacheUtils.clear();
  }, []);

  return {
    invalidateProducts,
    invalidateCategories,
    invalidateOrders,
    invalidateUsers,
    invalidateTables,
    invalidateAll,
  };
};

export { cacheUtils };
