'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Evitar requisições duplicadas
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    // Se já existe uma requisição pendente, aguardar ela
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Se tem dados válidos no cache, retornar
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fazer nova requisição
    const promise = fetchFn().then((data) => {
      this.set(key, data, ttl);
      this.pendingRequests.delete(key);
      return data;
    }).catch((error) => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Invalidar cache por padrão
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância global do cache
const apiCache = new ApiCache();

/**
 * Hook para cache de API com TTL e stale-while-revalidate
 */
export const useApiCache = <T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
) => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
    isStale: boolean;
  }>({
    data: null,
    loading: false,
    error: null,
    isStale: false,
  });

  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const data = await apiCache.getOrFetch(
        key,
        fetchFn,
        ttl
      );

      setState({
        data,
        loading: false,
        error: null,
        isStale: false,
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [key, fetchFn, ttl]);

  const invalidate = useCallback(() => {
    apiCache.delete(key);
    setState(prev => ({ ...prev, data: null, isStale: false }));
  }, [key]);

  const refresh = useCallback(() => {
    apiCache.delete(key);
    return fetchData(true);
  }, [fetchData, key]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData();
  }, [key]); // Usar apenas key como dependência

  return {
    ...state,
    fetchData,
    invalidate,
    refresh,
  };
};

/**
 * Hook para cache de múltiplas entidades relacionadas
 */
export const useBatchApiCache = <T = any>(
  keys: string[],
  fetchFn: (keys: string[]) => Promise<Record<string, T>>,
  options: CacheOptions = {}
) => {
  const [state, setState] = useState<{
    data: Record<string, T | null>;
    loading: boolean;
    error: string | null;
  }>({
    data: {},
    loading: false,
    error: null,
  });

  const { ttl = 5 * 60 * 1000 } = options;

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Verificar quais chaves já estão em cache
      const cachedData: Record<string, T | null> = {};
      const missingKeys: string[] = [];

      for (const key of keys) {
        const cached = apiCache.get<T>(key);
        if (cached) {
          cachedData[key] = cached;
        } else {
          missingKeys.push(key);
        }
      }

      // Se todas estão em cache, retornar dados do cache
      if (missingKeys.length === 0) {
        setState({
          data: cachedData,
          loading: false,
          error: null,
        });
        return cachedData;
      }

      // Buscar apenas as que estão faltando
      const freshData = await fetchFn(missingKeys);
      
      // Salvar no cache
      for (const [key, value] of Object.entries(freshData)) {
        if (value !== null) {
          apiCache.set(key, value, ttl);
        }
      }

      const allData = { ...cachedData, ...freshData };

      setState({
        data: allData,
        loading: false,
        error: null,
      });

      return allData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [keys, fetchFn, ttl]);

  const invalidate = useCallback(() => {
    keys.forEach(key => apiCache.delete(key));
    setState(prev => ({ ...prev, data: {} }));
  }, [keys]);

  const refresh = useCallback(() => {
    keys.forEach(key => apiCache.delete(key));
    return fetchData();
  }, [fetchData, keys]);

  useEffect(() => {
    fetchData();
  }, [keys.join(',')]); // Usar keys como string para evitar loops

  return {
    ...state,
    fetchData,
    invalidate,
    refresh,
  };
};

// Utilitários para gerenciar cache
export const cacheUtils = {
  // Invalidar cache por padrão
  invalidatePattern: (pattern: string) => apiCache.invalidatePattern(pattern),
  
  // Limpar todo o cache
  clear: () => apiCache.clear(),
  
  // Invalidar cache de produtos
  invalidateProducts: () => apiCache.invalidatePattern('^/api/products'),
  
  // Invalidar cache de categorias
  invalidateCategories: () => apiCache.invalidatePattern('^/api/categories'),
  
  // Invalidar cache de pedidos
  invalidateOrders: () => apiCache.invalidatePattern('^/api/orders'),
  
  // Invalidar cache de usuários
  invalidateUsers: () => apiCache.invalidatePattern('^/api/users'),
  
  // Invalidar cache de mesas
  invalidateTables: () => apiCache.invalidatePattern('^/api/tables'),
};

export default apiCache;
