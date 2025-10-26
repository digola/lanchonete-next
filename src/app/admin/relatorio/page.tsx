'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { UserRole } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

interface ReportData {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByDay?: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  revenueByMonth?: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  revenueByYear?: Array<{
    year: string;
    revenue: number;
    orders: number;
  }>;
  // Dados das mesas
  tablesMetrics: {
    total: number;
    occupied: number;
    free: number;
    occupancyRate: number;
    averageCapacity: number;
    totalCapacity: number;
  };
  topTables: Array<{
    number: number;
    orders: number;
    revenue: number;
    capacity: number;
  }>;
  tablesByStatus: {
    livre: number;
    ocupada: number;
  };
  tablesData: Array<{
    id: string;
    number: number;
    status: string;
    capacity: number;
    assignedTo: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  // Métricas adicionais
  peakHours?: Array<{
    hour: string;
    orders: number;
    revenue: number;
  }>;
  topCategories?: Array<{
    name: string;
    revenue: number;
    orders: number;
    quantity: number;
  }>;
  cancellationRate?: number;
  completionRate?: number;
  paymentMethods?: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
  counterMetrics?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    percentage: number;
  };
  tableMetrics?: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    percentage: number;
  };
}

export default function AdminReportsPage() {
  const { user } = useApiAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showDetails, setShowDetails] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [performanceInfo, setPerformanceInfo] = useState<string>('');

  // Buscar dados de relatórios
  const { data: apiResponse, loading: reportLoading, execute: refetchReports } = useApi<{ success: boolean; data: ReportData; meta: any }>(
    `/api/admin/reports?period=${selectedPeriod}&date=${selectedDate}&month=${selectedMonth}&year=${selectedYear}`
  );

  // Extrair os dados da resposta da API
  const reportData = apiResponse?.data;

  // Debug: Log dos dados recebidos
  useEffect(() => {
    if (reportData) {
      console.log('📊 Dados de relatórios recebidos:', reportData);
    }
  }, [reportData]);

  const handlePeriodChange = (period: 'day' | 'month' | 'year') => {
    setSelectedPeriod(period);
    setIsLoading(true);
    // Remover timeout desnecessário
    setTimeout(() => setIsLoading(false), 100);
  };

  // Capturar informações de performance
  useEffect(() => {
    if (apiResponse && !reportLoading) {
      if (apiResponse.meta) {
        setPerformanceInfo(`Dados carregados em ${apiResponse.meta.responseTime}`);
      }
    }
  }, [apiResponse, reportLoading]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'day':
        return selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : '';
      case 'month':
        return selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';
      case 'year':
        return selectedYear || '';
      default:
        return '';
    }
  };

  const getRevenueChange = () => {
    if (!reportData?.revenueByDay || reportData.revenueByDay.length < 2) return null;
    
    const current = reportData.revenueByDay[reportData.revenueByDay.length - 1]?.revenue || 0;
    const previous = reportData.revenueByDay[reportData.revenueByDay.length - 2]?.revenue || 0;
    
    if (previous === 0) return null;
    
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change > 0,
      isNegative: change < 0
    };
  };

  const getOrdersChange = () => {
    if (!reportData?.revenueByDay || reportData.revenueByDay.length < 2) return null;
    
    const current = reportData.revenueByDay[reportData.revenueByDay.length - 1]?.orders || 0;
    const previous = reportData.revenueByDay[reportData.revenueByDay.length - 2]?.orders || 0;
    
    if (previous === 0) return null;
    
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change > 0,
      isNegative: change < 0
    };
  };

  const revenueChange = getRevenueChange();
  const ordersChange = getOrdersChange();

  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Relatórios Administrativos
                </h1>
                <div>
                  <p className="text-gray-600">
                    Análise detalhada de vendas, pedidos e performance do negócio
                  </p>
                  {performanceInfo && (
                    <p className="text-sm text-green-600 mt-1">
                      ⚡ {performanceInfo}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsLoading(true);
                    refetchReports();
                    setTimeout(() => setIsLoading(false), 1000);
                  }}
                  className="flex items-center"
                  disabled={reportLoading || isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${(reportLoading || isLoading) ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center"
                >
                  {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Filtros de Período */}
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedPeriod === 'day' ? 'primary' : 'outline'}
                    onClick={() => handlePeriodChange('day')}
                    className="flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Diário
                  </Button>
                  <Button
                    variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
                    onClick={() => handlePeriodChange('month')}
                    className="flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Mensal
                  </Button>
                  <Button
                    variant={selectedPeriod === 'year' ? 'primary' : 'outline'}
                    onClick={() => handlePeriodChange('year')}
                    className="flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Anual
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                  {selectedPeriod === 'day' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  {selectedPeriod === 'month' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mês
                      </label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  {selectedPeriod === 'year' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <option key={year} value={year.toString()}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {(reportLoading || isLoading) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Carregando Relatórios</h3>
                  <p className="text-sm text-gray-600">Processando dados do período selecionado...</p>
                </div>
              </div>
            </div>
          )}

          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Receita Total */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Receita Total</p>
                    <div className="text-2xl sm:text-3xl font-bold text-green-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        formatCurrency(reportData?.totalRevenue || 0)
                      )}
                    </div>
                    {reportData?.totalRevenue && reportData.totalRevenue > 0 && (
                      <div className="flex items-center mt-2">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">Dados reais</span>
                      </div>
                    )}
                    {revenueChange && (
                      <div className="flex items-center mt-2">
                        {revenueChange.isPositive ? (
                          <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          revenueChange.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {revenueChange.value.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-green-500 rounded-full">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total de Pedidos */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total de Pedidos</p>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        reportData?.totalOrders || 0
                      )}
                    </div>
                    {reportData?.totalOrders && reportData.totalOrders > 0 && (
                      <div className="flex items-center mt-2">
                        <ShoppingBag className="h-3 w-3 text-blue-500 mr-1" />
                        <span className="text-xs text-blue-600">Dados reais</span>
                      </div>
                    )}
                    {ordersChange && (
                      <div className="flex items-center mt-2">
                        {ordersChange.isPositive ? (
                          <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          ordersChange.isPositive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {ordersChange.value.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-blue-500 rounded-full">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Médio */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Ticket Médio</p>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        formatCurrency(reportData?.averageOrderValue || 0)
                      )}
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      por pedido
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-full">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total de Clientes */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">Total de Clientes</p>
                    <div className="text-2xl sm:text-3xl font-bold text-orange-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        reportData?.totalCustomers || 0
                      )}
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      únicos
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas das Mesas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Total de Mesas */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Total de Mesas</p>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        reportData?.tablesMetrics?.total || 0
                      )}
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Capacidade total: {reportData?.tablesMetrics?.totalCapacity || 0} pessoas
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mesas Ocupadas */}
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">Mesas Ocupadas</p>
                    <div className="text-2xl sm:text-3xl font-bold text-red-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        reportData?.tablesMetrics?.occupied || 0
                      )}
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      {reportData?.tablesMetrics?.occupancyRate?.toFixed(1) || 0}% de ocupação
                    </p>
                  </div>
                  <div className="p-3 bg-red-500 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mesas Livres */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Mesas Livres</p>
                    <div className="text-2xl sm:text-3xl font-bold text-green-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        reportData?.tablesMetrics?.free || 0
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Disponíveis para uso
                    </p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Taxa de Ocupação */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Taxa de Ocupação</p>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-900">
                      {reportLoading || isLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        `${reportData?.tablesMetrics?.occupancyRate?.toFixed(1) || 0}%`
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Capacidade média: {reportData?.tablesMetrics?.averageCapacity?.toFixed(1) || 0} pessoas
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-full">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status dos Pedidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Status dos Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="font-medium">Pendentes</span>
                    </div>
                    <Badge variant="outline" className="bg-gray-100">
                      {reportData?.ordersByStatus?.pending || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="font-medium">Confirmados</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {reportData?.ordersByStatus?.confirmed || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="font-medium">Preparando</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {reportData?.ordersByStatus?.preparing || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium">Prontos</span>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {reportData?.ordersByStatus?.ready || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="font-medium">Entregues</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {reportData?.ordersByStatus?.delivered || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="font-medium">Cancelados</span>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      {reportData?.ordersByStatus?.cancelled || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Produtos Mais Vendidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Produtos Mais Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.topProducts?.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.quantity} unidades</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                        <p className="text-xs text-gray-500">receita</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum produto vendido no período</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mesas Mais Utilizadas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Mesas Mais Utilizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.topTables?.slice(0, 5).map((table, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Mesa {table.number}</p>
                          <p className="text-sm text-gray-600">{table.orders} pedidos • {table.capacity} lugares</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(table.revenue)}</p>
                        <p className="text-xs text-gray-500">receita</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma mesa utilizada no período</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status das Mesas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Status das Mesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium">Mesas Livres</span>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {reportData?.tablesByStatus?.livre || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="font-medium">Mesas Ocupadas</span>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      {reportData?.tablesByStatus?.ocupada || 0}
                    </Badge>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Taxa de Ocupação</span>
                      <span className="text-lg font-bold text-blue-900">
                        {reportData?.tablesMetrics?.occupancyRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(reportData?.tablesMetrics?.occupancyRate || 0, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Balcão vs Mesa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pedidos de Balcão */}
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2 text-cyan-600" />
                    Pedidos de Balcão
                  </span>
                  <Badge className="bg-cyan-500 text-white">
                    {reportData?.counterMetrics?.percentage?.toFixed(1) || 0}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-gray-600">Total de Pedidos</p>
                      <p className="text-2xl font-bold text-cyan-900">
                        {reportData?.counterMetrics?.totalOrders || 0}
                      </p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-gray-600">Receita Total</p>
                      <p className="text-2xl font-bold text-cyan-900">
                        {formatCurrency(reportData?.counterMetrics?.totalRevenue || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-gray-600">Ticket Médio</p>
                      <p className="text-2xl font-bold text-cyan-900">
                        {formatCurrency(reportData?.counterMetrics?.averageOrderValue || 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${reportData?.counterMetrics?.percentage || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-gray-500">
                    {reportData?.counterMetrics?.percentage?.toFixed(1) || 0}% do total de pedidos
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pedidos de Mesa */}
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-emerald-600" />
                    Pedidos de Mesa
                  </span>
                  <Badge className="bg-emerald-500 text-white">
                    {reportData?.tableMetrics?.percentage?.toFixed(1) || 0}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-gray-600">Total de Pedidos</p>
                      <p className="text-2xl font-bold text-emerald-900">
                        {reportData?.tableMetrics?.totalOrders || 0}
                      </p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-gray-600">Receita Total</p>
                      <p className="text-2xl font-bold text-emerald-900">
                        {formatCurrency(reportData?.tableMetrics?.totalRevenue || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div>
                      <p className="text-sm text-gray-600">Ticket Médio</p>
                      <p className="text-2xl font-bold text-emerald-900">
                        {formatCurrency(reportData?.tableMetrics?.averageOrderValue || 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${reportData?.tableMetrics?.percentage || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-center text-gray-500">
                    {reportData?.tableMetrics?.percentage?.toFixed(1) || 0}% do total de pedidos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Horários de Pico e Categorias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Horários de Pico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Horários de Pico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.peakHours && reportData.peakHours.length > 0 ? (
                    reportData.peakHours.map((hour, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{hour.hour}</p>
                            <p className="text-sm text-gray-600">{hour.orders} pedidos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(hour.revenue)}</p>
                          <p className="text-xs text-gray-500">receita</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum dado de horário disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Categorias Mais Vendidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Categorias Mais Vendidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.topCategories && reportData.topCategories.length > 0 ? (
                    reportData.topCategories.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{category.name}</p>
                            <p className="text-sm text-gray-600">{category.quantity} itens vendidos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(category.revenue)}</p>
                          <p className="text-xs text-gray-500">{category.orders} pedidos</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma categoria vendida no período</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formas de Pagamento e Taxas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Formas de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.paymentMethods && reportData.paymentMethods.length > 0 ? (
                    reportData.paymentMethods.map((payment, index) => {
                      const percentage = reportData.totalOrders > 0 
                        ? (payment.count / reportData.totalOrders) * 100 
                        : 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-green-500 mr-2" />
                              <span className="font-medium text-gray-900">{payment.method}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(payment.revenue)}</p>
                              <p className="text-xs text-gray-500">{payment.count} pedidos</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">{percentage.toFixed(1)}% dos pedidos</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum pagamento registrado no período</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Taxas de Conclusão e Cancelamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Taxas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Taxa de Conclusão */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="font-medium text-gray-900">Taxa de Conclusão</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {reportData?.completionRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${reportData?.completionRate || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Percentual de pedidos entregues com sucesso
                    </p>
                  </div>

                  {/* Taxa de Cancelamento */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="font-medium text-gray-900">Taxa de Cancelamento</span>
                      </div>
                      <span className="text-2xl font-bold text-red-600">
                        {reportData?.cancellationRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-rose-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${reportData?.cancellationRate || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Percentual de pedidos cancelados
                    </p>
                  </div>

                  {/* Indicador de Qualidade */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Índice de Qualidade</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {(reportData?.completionRate || 0) >= 80 
                            ? '✓ Excelente desempenho' 
                            : (reportData?.completionRate || 0) >= 60 
                            ? '• Bom desempenho' 
                            : '⚠ Necessita melhoria'}
                        </p>
                      </div>
                      <div className="text-3xl font-bold text-blue-900">
                        {((reportData?.completionRate || 0) - (reportData?.cancellationRate || 0)).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Detalhados */}
          {showDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evolução da Receita */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução da Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Gráfico de evolução da receita</p>
                      <p className="text-sm text-gray-400">Implementação futura</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparativo de Períodos */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparativo de Períodos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Comparativo entre períodos</p>
                      <p className="text-sm text-gray-400">Implementação futura</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
