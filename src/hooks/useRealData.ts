'use client';

import { useState, useEffect, useCallback } from 'react';

interface RealDataConfig {
  enableRealData: boolean;
  fallbackToMock: boolean;
  cacheTimeout: number;
  retryAttempts: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
  fromFallback?: boolean;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutos default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

const cache = new DataCache();

/**
 * useRealData
 *
 * Abstração para consumir dados reais com cache, retry e fallback para
 * dados simulados (mock). Útil em ambientes com APIs instáveis ou em
 * desenvolvimento.
 *
 * @param apiUrl Endpoint real
 * @param mockData Dados simulados de fallback
 * @param config Controle de realData, cacheTimeout e tentativas de retry
 * @returns Estado, refresh e utilitários de cache
 */
export function useRealData<T>(
  apiUrl: string,
  mockData: T,
  config: RealDataConfig = {
    enableRealData: true,
    fallbackToMock: true,
    cacheTimeout: 300000, // 5 minutos
    retryAttempts: 3
  }
) {
  const {
    enableRealData = true,
    fallbackToMock = true,
    cacheTimeout = 300000,
    retryAttempts = 3,
  } = config;
  const [data, setData] = useState<T>(mockData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false): Promise<ApiResponse<T>> => {
    const cacheKey = `real-data-${apiUrl}`;
    
    // Verificar cache primeiro (se não forçar refresh)
    if (!forceRefresh) {
      const cachedData = cache.get<T>(cacheKey);
      if (cachedData) {
        console.log(`📦 Dados carregados do cache: ${apiUrl}`);
        return {
          success: true,
          data: cachedData,
          fromCache: true
        };
      }
    }

    if (!enableRealData) {
      console.log(`🎭 Usando dados simulados: ${apiUrl}`);
      return {
        success: true,
        data: mockData,
        fromFallback: true
      };
    }

    setLoading(true);
    setError(null);

    let lastError: Error | null = null;

    // Tentar buscar dados reais com retry
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        console.log(`🌐 Tentativa ${attempt}/${retryAttempts} - Buscando dados reais: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Erro na resposta da API');
        }

        // Salvar no cache
        cache.set(cacheKey, result.data, cacheTimeout);
        
        console.log(`✅ Dados reais carregados com sucesso: ${apiUrl}`);
        return {
          success: true,
          data: result.data,
          fromCache: false
        };

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Tentativa ${attempt} falhou: ${error}`);
        
        if (attempt < retryAttempts) {
          // Aguardar antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // Se todas as tentativas falharam, usar fallback
    if (fallbackToMock) {
      console.log(`🔄 Fallback para dados simulados: ${apiUrl}`);
      return {
        success: true,
        data: mockData,
        fromFallback: true
      };
    }

    throw lastError || new Error('Falha ao carregar dados');
  }, [apiUrl, mockData, enableRealData, cacheTimeout, retryAttempts, fallbackToMock]);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      const result = await fetchData(forceRefresh);
      
      if (result.success && result.data) {
        setData(result.data);
        setIsRealData(!result.fromFallback);
        setIsFromCache(!!result.fromCache);
        setError(null);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar dados: ${apiUrl}`, error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Em caso de erro, usar dados simulados como fallback
      if (fallbackToMock) {
        setData(mockData);
        setIsRealData(false);
        setIsFromCache(false);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchData, mockData, fallbackToMock, apiUrl]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  const invalidateCache = useCallback(() => {
    const cacheKey = `real-data-${apiUrl}`;
    cache.invalidate(cacheKey);
    console.log(`🗑️ Cache invalidado: ${apiUrl}`);
  }, [apiUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    isRealData,
    isFromCache,
    refresh,
    invalidateCache,
    loadData: () => loadData(true)
  };
}

// Hook especializado para produtos
/**
 * useRealProducts
 *
 * Especialização de useRealData para produtos.
 */
export function useRealProducts(mockProducts: any[] = []) {
  return useRealData(
    '/api/products?isAvailable=true&limit=50',
    mockProducts,
    {
      enableRealData: true,
      fallbackToMock: true,
      cacheTimeout: 600000, // 10 minutos para produtos
      retryAttempts: 2
    }
  );
}

// Hook especializado para pedidos
/**
 * useRealOrders
 *
 * Especialização de useRealData para pedidos, com filtro opcional por usuário.
 */
export function useRealOrders(userId?: string, mockOrders: any[] = []) {
  const apiUrl = userId 
    ? `/api/orders?customerId=${userId}&limit=20&sortBy=createdAt&sortOrder=desc`
    : '/api/orders?limit=20&sortBy=createdAt&sortOrder=desc';
    
  return useRealData(
    apiUrl,
    mockOrders,
    {
      enableRealData: true,
      fallbackToMock: true,
      cacheTimeout: 300000, // 5 minutos para pedidos
      retryAttempts: 3
    }
  );
}

// Hook especializado para categorias
/**
 * useRealCategories
 *
 * Especialização de useRealData para categorias.
 */
export function useRealCategories(mockCategories: any[] = []) {
  return useRealData(
    '/api/categories',
    mockCategories,
    {
      enableRealData: true,
      fallbackToMock: true,
      cacheTimeout: 1800000, // 30 minutos para categorias
      retryAttempts: 2
    }
  );
}

// Hook especializado para mesas
/**
 * useRealTables
 *
 * Especialização de useRealData para mesas.
 */
export function useRealTables(mockTables: any[] = []) {
  return useRealData(
    '/api/tables?includeAssignedUser=true',
    mockTables,
    {
      enableRealData: true,
      fallbackToMock: true,
      cacheTimeout: 300000, // 5 minutos para mesas
      retryAttempts: 2
    }
  );
}

// Hook para estatísticas administrativas
/**
 * useRealAdminStats
 *
 * Especialização de useRealData para estatísticas administrativas.
 */
export function useRealAdminStats(mockStats: any = {}) {
  return useRealData(
    '/api/admin/dashboard',
    mockStats,
    {
      enableRealData: true,
      fallbackToMock: true,
      cacheTimeout: 60000, // 1 minuto para stats
      retryAttempts: 2
    }
  );
}

export default useRealData;
