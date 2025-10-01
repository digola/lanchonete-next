import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseApiCacheOptions {
  cacheTime?: number; // Tempo de cache em ms (padrão: 5 minutos)
  immediate?: boolean;
  dedupe?: boolean; // Deduplica requisições simultâneas
}

const cache = new Map<string, CacheEntry<any>>();
const pendingRequests = new Map<string, Promise<any>>();

export function useApiCache<T>(
  url: string | null,
  options: UseApiCacheOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutos
    immediate = true,
    dedupe = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    if (!url) return;

    // Verificar cache válido
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      setLoading(false);
      return cached.data;
    }

    // Verificar requisição pendente (deduplicação)
    if (dedupe && pendingRequests.has(url)) {
      const pendingData = await pendingRequests.get(url);
      setData(pendingData);
      return pendingData;
    }

    setLoading(true);
    setError(null);

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = localStorage.getItem('auth-token');
      
      const requestPromise = fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: abortController.signal,
      });

      // Armazenar requisição pendente
      if (dedupe) {
        pendingRequests.set(url, requestPromise.then(r => r.json()));
      }

      const response = await requestPromise;
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro na requisição');
      }

      // Armazenar no cache
      cache.set(url, {
        data: result,
        timestamp: Date.now(),
      });

      setData(result);
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Requisição cancelada, ignora
      }
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      if (dedupe) {
        pendingRequests.delete(url);
      }
    }
  }, [url, cacheTime, dedupe]);

  useEffect(() => {
    if (immediate && url) {
      execute();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, immediate, url]);

  const invalidateCache = useCallback(() => {
    if (url) {
      cache.delete(url);
    }
  }, [url]);

  const clearAllCache = useCallback(() => {
    cache.clear();
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    invalidateCache,
    clearAllCache,
  };
}

// Função para invalidar cache específico
export function invalidateCache(url: string) {
  cache.delete(url);
}

// Função para limpar todo o cache
export function clearAllCache() {
  cache.clear();
  pendingRequests.clear();
}

