'use client';

import React, { useState } from 'react';
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

  // Buscar mesas
  const { data: tablesResponse, loading: tablesLoading, execute: refetchTables } = useApi<{ 
    data: Table[]; 
    pagination: any 
  }>('/api/tables?includeAssignedUser=true');

  const tables = tablesResponse?.data || [];



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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Atendimento de Mesas</h1>
            <p className="text-gray-600 mt-2">Gerencie mesas e crie pedidos para clientes</p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TableIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Mesas</p>
                    <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Mesas Livres</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tables.filter(t => t.status === TableStatus.LIVRE).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Mesas Ocupadas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tables.filter(t => t.status === TableStatus.OCUPADA).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Grid de Mesas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map((table) => (
              <Card 
                key={table.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  table.status === TableStatus.LIVRE 
                    ? 'hover:border-green-500' 
                    : table.status === TableStatus.OCUPADA
                    ? 'hover:border-red-500'
                    : 'hover:border-yellow-500'
                }`}
                onClick={() => {
                  if (table.status === TableStatus.LIVRE) {
                    console.log('🔄 Redirecionando para página principal com mesa:', table.number);
                    router.push(`/?tableId=${table.id}`);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
                    <Badge className={getTableStatusColor(table.status)}>
                      {getTableStatusLabel(table.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      Capacidade: {table.capacity} pessoas
                    </div>
                    {table.assignedUser && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        Atendido por: {table.assignedUser.name}
                      </div>
                    )}
                    {table.status === TableStatus.LIVRE && (
                      <div className="mt-4">
                        <Button 
                          className="w-full" 
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔄 Botão "Criar Pedido" clicado para mesa:', table.number);
                            router.push(`/?tableId=${table.id}`);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Criar Pedido
                        </Button>
                      </div>
                    )}
                    {table.status === TableStatus.OCUPADA && (
                      <div className="mt-4">
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/tables/${table.id}`);
                          }}
                        >
                          <TableIcon className="h-4 w-4 mr-2" />
                          Gerenciar Mesa
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}