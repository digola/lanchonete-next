'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useApi } from './useApi';
import { Order } from '@/types';

interface OrdersCalendarData {
  [dateKey: string]: number; // Formato 'YYYY-MM-DD' -> quantidade de pedidos
}

interface UseOrdersCalendarReturn {
  ordersByDate: OrdersCalendarData;
  selectedDateOrders: Order[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  selectDate: (date: Date) => void;
  selectedDate: Date | null;
}

/**
 * useOrdersCalendar
 *
 * Hook para alimentar um calendário de pedidos. Busca agregados por dia
 * do mês atual e permite selecionar uma data para listar pedidos daquela
 * data, além de refetch geral.
 *
 * @param initialDate Data inicial selecionada
 * @param enabled Controla se as requisições devem ser feitas
 * @returns Estrutura com ordersByDate, selectedDateOrders, estados e ações
 */
export function useOrdersCalendar(initialDate?: Date, enabled: boolean = true): UseOrdersCalendarReturn {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [ordersByDate, setOrdersByDate] = useState<OrdersCalendarData>({});
  const [selectedDateOrders, setSelectedDateOrders] = useState<Order[]>([]);

  // Buscar pedidos do mês atual para o calendário - só se habilitado
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: ordersResponse, loading, error, execute: refetchOrders } = useApi<{
    data: Order[];
    pagination: any;
  }>(enabled ? `/api/orders?dateFrom=${monthStartStr}&dateTo=${monthEndStr}&includeUser=true&includeItems=true&limit=100` : '');

  // Processar dados para o calendário
  useEffect(() => {
    if (ordersResponse?.data) {
      const orders = ordersResponse.data;
      const ordersMap: OrdersCalendarData = {};

      orders.forEach((order) => {
        const dateKey = format(new Date(order.createdAt), 'yyyy-MM-dd');
        ordersMap[dateKey] = (ordersMap[dateKey] || 0) + 1;
      });

      setOrdersByDate(ordersMap);
    }
  }, [ordersResponse]);

  // Buscar pedidos da data selecionada
  const fetchOrdersByDate = useCallback(async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(`/api/orders?date=${dateStr}&includeUser=true&includeItems=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDateOrders(data.data || []);
      } else {
        console.error('Erro ao buscar pedidos da data:', response.statusText);
        setSelectedDateOrders([]);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos da data:', error);
      setSelectedDateOrders([]);
    }
  }, []);

  // Selecionar data e buscar pedidos
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
    fetchOrdersByDate(date);
  }, [fetchOrdersByDate]);

  // Refetch geral
  const refetch = useCallback(() => {
    refetchOrders();
    if (selectedDate) {
      fetchOrdersByDate(selectedDate);
    }
  }, [refetchOrders, selectedDate, fetchOrdersByDate]);

  // Buscar pedidos da data inicial se fornecida
  useEffect(() => {
    if (initialDate) {
      fetchOrdersByDate(initialDate);
    }
  }, [initialDate, fetchOrdersByDate]);

  return {
    ordersByDate,
    selectedDateOrders,
    isLoading: loading,
    refetch,
    selectDate,
    selectedDate,
    error: error || null,

  };
}
