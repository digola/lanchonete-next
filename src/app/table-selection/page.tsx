'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table as TableType, TableStatus, UserRole } from '@/types';
import { Search, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function TableSelectionPage() {
  const { user, isAuthenticated } = useApiAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'LIVRE' | 'OCUPADA'>('LIVRE');
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);

  // Verificar se é staff ou manager
  const isStaff = user?.role === UserRole.STAFF || user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  // Redirecionar se não for staff/manager
  useEffect(() => {
    if (isAuthenticated && !isStaff) {
      router.push('/');
    }
  }, [isAuthenticated, isStaff, router]);

  // Buscar mesas
  const buildTablesUrl = () => {
    const params = new URLSearchParams({
      limit: '50',
      sortBy: 'number',
      sortOrder: 'asc',
      includeAssignedUser: 'true',
    });
    if (statusFilter !== 'all') params.append('status', statusFilter);
    return `/api/tables?${params.toString()}`;
  };

  const { data: tablesResponse, loading: tablesLoading, execute: refetchTables } = useApi<{ 
    data: TableType[]; 
    pagination: any 
  }>(buildTablesUrl());

  const tables = tablesResponse?.data || [];

  // Filtrar mesas por termo de busca
  const filteredTables = tables.filter(table => 
    table.number.toString().includes(searchTerm) ||
    (table.assignedUser?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTableSelect = (table: TableType) => {
    setSelectedTable(table);
  };

  const handleConfirmSelection = () => {
    if (selectedTable) {
      // Redirecionar para o cardápio com a mesa selecionada
      router.push(`/?tableId=${selectedTable.id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVRE':
        return 'bg-green-100 text-green-800';
      case 'OCUPADA':
        return 'bg-red-100 text-red-800';
      case 'RESERVADA':
        return 'bg-yellow-100 text-yellow-800';
      case 'MANUTENCAO':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVRE':
        return <CheckCircle className="h-4 w-4" />;
      case 'OCUPADA':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado como Staff ou Manager para acessar esta página.</p>
          <Button onClick={() => router.push('/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Apenas Staff e Managers podem selecionar mesas.</p>
          <Button onClick={() => router.push('/')}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seleção de Mesa</h1>
          <p className="text-gray-600">Selecione uma mesa para criar um pedido</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Buscar por número da mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
              <select
                className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Todos os Status</option>
                <option value="LIVRE">Livre</option>
                <option value="OCUPADA">Ocupada</option>
              </select>
              <Button 
                variant="outline" 
                onClick={() => refetchTables()}
                disabled={tablesLoading}
              >
                {tablesLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {filteredTables.map((table) => (
            <Card 
              key={table.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTable?.id === table.id 
                  ? 'ring-2 ring-primary-500 bg-primary-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleTableSelect(table)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Mesa {table.number}
                  </h3>
                  <Badge className={getStatusColor(table.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(table.status)}
                      <span>{table.status}</span>
                    </div>
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Capacidade: {table.capacity} pessoas</span>
                  </div>
                  
                  {table.assignedUser && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Atribuída a:</span> {table.assignedUser.name}
                    </div>
                  )}
                </div>

                {selectedTable?.id === table.id && (
                  <div className="mt-3 pt-3 border-t border-primary-200">
                    <div className="flex items-center text-primary-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mesa Selecionada
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botão de Confirmação */}
        {selectedTable && (
          <div className="fixed bottom-6 right-6">
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Mesa {selectedTable.number} selecionada
                    </p>
                    <p className="text-sm text-gray-600">
                      Capacidade: {selectedTable.capacity} pessoas
                    </p>
                  </div>
                  <Button 
                    onClick={handleConfirmSelection}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    Continuar para Cardápio
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {tablesLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Carregando mesas...</p>
          </div>
        )}

        {/* Empty State */}
        {!tablesLoading && filteredTables.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma mesa encontrada
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Não há mesas disponíveis no momento.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

