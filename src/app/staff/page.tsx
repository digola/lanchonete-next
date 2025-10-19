'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { UserRole, Table, TableStatus } from '@/types';
import { 
  Table as TableIcon,
  ShoppingCart,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';


export default function StaffPage() {
  const { user } = useApiAuth();
  const router = useRouter();
  
  // Estados principais
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Buscar mesas usando hook otimizado
  const { data: tablesResponse, loading: tablesLoading, execute: refetchTables } = useApi<{ 
    data: Table[]; 
    pagination: any 
  }>('/api/tables?includeAssignedUser=true');

  const tables = useMemo(() => tablesResponse?.data || [], [tablesResponse?.data]);

  // Auto-refresh otimizado - apenas quando necessário
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTables();
    }, 60000); // Aumentado para 1 minuto para reduzir carga
    
    return () => clearInterval(interval);
  }, [refetchTables]);



  // Memoizar estatísticas para melhor performance
  const tableStats = useMemo(() => {
    const totalTables = tables.length;
    const freeTables = tables.filter(t => t.status === TableStatus.LIVRE).length;
    const occupiedTables = tables.filter(t => t.status === TableStatus.OCUPADA).length;
    
    return {
      total: totalTables,
      free: freeTables,
      occupied: occupiedTables,
    };
  }, [tables]);

  // Função para obter cor do status da mesa
  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'bg-green-100 text-green-800';
      case TableStatus.OCUPADA:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter label do status da mesa
  const getTableStatusLabel = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'Livre';
      case TableStatus.OCUPADA:
        return 'Ocupada';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.STAFF}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Moderno */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-10 rounded-3xl shadow-2xl mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-4 rounded-2xl">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Atendimento de Mesas</h1>
                  <p className="text-blue-100 mt-2 text-lg">Gerencie mesas e crie pedidos para clientes</p>
                </div>
              </div>
              <a href="/logout">sair</a>
            </div>
          </div>

          {/* Estatísticas Modernas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TableIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total de Mesas</p>
              <p className="text-4xl font-bold text-blue-600">{tableStats.total}</p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Mesas Livres</p>
              <p className="text-4xl font-bold text-green-600">
                {tableStats.free}
              </p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Mesas Ocupadas</p>
              <p className="text-4xl font-bold text-red-600">
                {tableStats.occupied}
              </p>
            </div>
          </div>

          {/* Grid de Mesas Moderno */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tablesLoading ? (
              // Skeleton loading para melhor UX
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : (
              tables.map((table) => (
              <div
                key={table.id} 
                className={`
                  bg-white border-2 rounded-2xl shadow-lg hover:shadow-2xl
                  transition-all duration-300 cursor-pointer overflow-hidden
                  ${table.status === TableStatus.LIVRE 
                    ? 'border-green-200 hover:border-green-400 hover:scale-105' 
                    : table.status === TableStatus.OCUPADA
                    ? 'border-red-200 hover:border-red-400'
                    : 'border-yellow-200 hover:border-yellow-400'
                  }
                `}
                onClick={() => {
                  if (table.status === TableStatus.LIVRE) {
                    router.push(`/?tableId=${table.id}`);
                  } else if (table.status === TableStatus.OCUPADA) {
                    router.push(`/tables/${table.id}`);
                  }
                }}
              >
                {/* Header do Card */}
                <div className={`
                  p-4 border-b-2
                  ${table.status === TableStatus.LIVRE 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : table.status === TableStatus.OCUPADA
                    ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
                    : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                  }
                `}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold
                        ${table.status === TableStatus.LIVRE 
                          ? 'bg-green-100 text-green-700' 
                          : table.status === TableStatus.OCUPADA
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }
                      `}>
                        {table.number}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Mesa {table.number}</p>
                        <p className="text-xs text-gray-600">{table.capacity} pessoas</p>
                      </div>
                    </div>
                    <Badge className={`${getTableStatusColor(table.status)} font-semibold`}>
                      {getTableStatusLabel(table.status)}
                    </Badge>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 space-y-3">
                  {table.assignedUser && (
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <User className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium">{table.assignedUser.name}</span>
                    </div>
                  )}
                  
                  {table.status === TableStatus.LIVRE && (
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg" 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/?tableId=${table.id}`);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Criar Pedido
                    </Button>
                  )}
                  
                  {table.status === TableStatus.OCUPADA && (
                    <Button 
                      className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tables/${table.id}`);
                      }}
                    >
                      <TableIcon className="h-4 w-4 mr-2" />
                      Gerenciar Mesa
                    </Button>
                  )}
                </div>
              </div>
            ))
            )}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}