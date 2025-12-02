import { useState, useEffect } from 'react';

export interface ChartsData {
  revenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  orders: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  products: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  tables: Array<{
    number: number;
    orders: number;
    revenue: number;
    capacity: number;
  }>;
}

export interface UseChartsDataOptions {
  period?: '7d' | '30d' | '90d';
  chartType?: 'all' | 'revenue' | 'orders' | 'products' | 'tables';
  enabled?: boolean;
}

/**
 * useChartsData
 *
 * Hook para carregar dados de gráficos analíticos (faturamento, pedidos,
 * produtos e mesas) com suporte a período e tipo de gráfico. Expõe refetch
 * para revalidar manualmente.
 *
 * @param options period ('7d' | '30d' | '90d'), chartType e enabled
 * @returns {object} data, loading, error, refetch
 */
export function useChartsData(options: UseChartsDataOptions = {}) {
  const { period = '7d', chartType = 'all', enabled = true } = options;
  
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          period,
          type: chartType
        });
        
        const response = await fetch(`/api/admin/analytics/charts?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Erro ao carregar dados');
        }
      } catch (err) {
        setError('Erro ao carregar dados dos gráficos');
        console.error('Erro ao buscar dados dos gráficos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, chartType, enabled]);

  const refetch = () => {
    if (enabled) {
      setData(null);
      setError(null);
      setLoading(true);
      
      const params = new URLSearchParams({
        period,
        type: chartType
      });
      
      fetch(`/api/admin/analytics/charts?${params}`)
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error || 'Erro ao carregar dados');
          }
        })
        .catch(err => {
          setError('Erro ao carregar dados dos gráficos');
          console.error('Erro ao buscar dados dos gráficos:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return {
    data,
    loading,
    error,
    refetch
  };
}
