'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiCache } from './useApiCache';
import { useApiAuth } from './useApiAuth';

/**
 * Hook para dados que precisam ser atualizados em tempo real
 * Apenas para dados críticos como pedidos, status de mesas, etc.
 */
export const useRealtimeOrders = () => {
  const { token } = useApiAuth();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(async () => {
    const response = await fetch('/api/orders?status=pendente&limit=10', {
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

  const { data, loading, error, refresh } = useApiCache(
    'realtime:orders',
    fetchOrders,
    {
      ttl: 30 * 1000, // 30 segundos para pedidos (dados críticos)
      staleWhileRevalidate: false, // Sempre buscar dados frescos
    }
  );

  // Auto-refresh para dados críticos
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 30 * 1000); // Refresh a cada 30 segundos

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refresh]);

  return {
    orders: data?.data || [],
    loading,
    error,
    refresh,
  };
};

/**
 * Hook para dados que mudam ocasionalmente (produtos disponíveis)
 * Cache mais longo, mas com invalidação manual
 */
export const useOccasionalData = () => {
  const { token } = useApiAuth();

  const fetchAvailableProducts = useCallback(async () => {
    const response = await fetch('/api/products?isAvailable=true&limit=50', {
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

  const { data, loading, error, refresh } = useApiCache(
    'occasional:available-products',
    fetchAvailableProducts,
    {
      ttl: 5 * 60 * 1000, // 5 minutos para produtos disponíveis
      staleWhileRevalidate: true,
    }
  );

  return {
    availableProducts: data?.data || [],
    loading,
    error,
    refresh,
  };
};

/**
 * Hook para dados que raramente mudam (categorias, configurações)
 * Cache muito longo, apenas refresh manual
 */
export const useRarelyChangingData = () => {
  const { token } = useApiAuth();

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

  const { data, loading, error, refresh } = useApiCache(
    'rare:categories',
    fetchCategories,
    {
      ttl: 60 * 60 * 1000, // 1 hora para categorias
      staleWhileRevalidate: true,
    }
  );

  return {
    categories: data?.data || [],
    loading,
    error,
    refresh,
  };
};
