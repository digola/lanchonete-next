'use client';

import { useState, useEffect, useCallback } from 'react';

interface RealDataConfig {
  enableRealData: boolean;
  cacheTimeout: number;
  retryAttempts: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
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

export function useRealData<T>(
  apiUrl: string,
  initialData: T | null = null,
  config: RealDataConfig = {
    enableRealData: true,
    cacheTimeout: 300000, // 5 minutos
    retryAttempts: 3
  }
) {
  const {
    enableRealData = true,
    cacheTimeout = 300000,
    retryAttempts = 3,
  } = config;
  
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      console.log(`❌ Dados reais desabilitados: ${apiUrl}`);
      return {
        success: false,
        error: 'Dados reais desabilitados'
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

    // Se todas as tentativas falharam, retornar erro
    throw lastError || new Error('Falha ao carregar dados');
  }, [apiUrl, enableRealData, cacheTimeout, retryAttempts]);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      const result = await fetchData(forceRefresh);
      
      if (result.success && result.data) {
        setData(result.data);
        setIsFromCache(!!result.fromCache);
        setError(null);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar dados: ${apiUrl}`, error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchData, apiUrl]);

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
    isFromCache,
    refresh,
    invalidateCache,
    loadData: () => loadData(true)
  };
}

// Hook especializado para produtos
export function useRealProducts() {
  return useRealData(
    '/api/products?isAvailable=true&limit=50',
    null,
    {
      enableRealData: true,
      cacheTimeout: 600000, // 10 minutos para produtos
      retryAttempts: 2
    }
  );
}

// Hook especializado para pedidos
export function useRealOrders(userId?: string) {
  const apiUrl = userId 
    ? `/api/orders?customerId=${userId}&limit=20&sortBy=createdAt&sortOrder=desc`
    : '/api/orders?limit=20&sortBy=createdAt&sortOrder=desc';
    
  return useRealData(
    apiUrl,
    null,
    {
      enableRealData: true,
      cacheTimeout: 300000, // 5 minutos para pedidos
      retryAttempts: 3
    }
  );
}

// Hook especializado para categorias
export function useRealCategories() {
  return useRealData(
    '/api/categories',
    null,
    {
      enableRealData: true,
      cacheTimeout: 1800000, // 30 minutos para categorias
      retryAttempts: 2
    }
  );
}

// Hook especializado para mesas
export function useRealTables() {
  return useRealData(
    '/api/tables?includeAssignedUser=true',
    null,
    {
      enableRealData: true,
      cacheTimeout: 300000, // 5 minutos para mesas
      retryAttempts: 2
    }
  );
}

// Hook para estatísticas administrativas
export function useRealAdminStats() {
  return useRealData(
    '/api/admin/dashboard',
    null,
    {
      enableRealData: true,
      cacheTimeout: 60000, // 1 minuto para stats
      retryAttempts: 2
    }
  );
}

export default useRealData;
