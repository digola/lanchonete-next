'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatDateTime } from '@/lib/utils';
import { 
  Search,
  Filter,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Settings,
  AlertTriangle,
  Edit,
  Plus
} from 'lucide-react';
import { Table, TableStatus } from '@/types';
import Link from 'next/link';

export default function StaffTablesPage() {
  const { user } = useApiAuth();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TableStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'number' | 'capacity' | 'status'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Buscar mesas
  const buildTablesUrl = () => {
    const params = new URLSearchParams({
      limit: '50',
      sortBy,
      sortOrder,
    });
    if (selectedStatus !== 'all') params.append('status', selectedStatus);
    if (searchTerm) params.append('search', searchTerm);
    return `/api/tables?${params.toString()}`;
  };

  const { data: tablesResponse, loading: tablesLoading, execute: refetchTables } = useApi<{ 
    data: Table[]; 
    pagination: any 
  }>(buildTablesUrl());

  const tables = tablesResponse?.data || [];
  const pagination = tablesResponse?.pagination;

  // Aplicar filtro de status da URL
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && Object.values(TableStatus).includes(statusParam as TableStatus)) {
      setSelectedStatus(statusParam as TableStatus);
    }
  }, [searchParams]);

  const handleStatusFilter = (status: TableStatus | 'all') => {
    setSelectedStatus(status);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return <CheckCircle className="h-4 w-4" />;
      case TableStatus.OCUPADA:
        return <Users className="h-4 w-4" />;
      case TableStatus.RESERVADA:
        return <Clock className="h-4 w-4" />;
      case TableStatus.MANUTENCAO:
        return <Settings className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'success';
      case TableStatus.OCUPADA:
        return 'destructive';
      case TableStatus.RESERVADA:
        return 'warning';
      case TableStatus.MANUTENCAO:
        return 'default';
      default:
        return 'default';
    }
  };

  const statusCounts = {
    all: tables.length,
    [TableStatus.LIVRE]: tables.filter(table => table.status === TableStatus.LIVRE).length,
    [TableStatus.OCUPADA]: tables.filter(table => table.status === TableStatus.OCUPADA).length,
    [TableStatus.RESERVADA]: tables.filter(table => table.status === TableStatus.RESERVADA).length,
    [TableStatus.MANUTENCAO]: tables.filter(table => table.status === TableStatus.MANUTENCAO).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestão de Mesas
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as mesas do estabelecimento
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => refetchTables()}
            disabled={tablesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${tablesLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Nova Mesa
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número da mesa..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros de Status */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('all')}
              >
                Todas ({statusCounts.all})
              </Button>
              {Object.values(TableStatus).map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                >
                  {getStatusIcon(status)}
                  <span className="ml-2">
                    {status} ({statusCounts[status]})
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts.all}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Livres</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts[TableStatus.LIVRE]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ocupadas</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts[TableStatus.OCUPADA]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Reservadas</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts[TableStatus.RESERVADA]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Mesas */}
      <Card>
        <CardHeader>
          <CardTitle>Mesas</CardTitle>
        </CardHeader>
        <CardContent>
          {tablesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : tables.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {tables.map((table) => (
                <div key={table.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      Mesa {table.number}
                    </div>
                    
                    <Badge variant={getStatusColor(table.status) as any} className="mb-3">
                      {table.status}
                    </Badge>

                    {table.capacity && (
                      <div className="text-sm text-gray-600 mb-3">
                        <Users className="h-4 w-4 inline mr-1" />
                        {table.capacity} pessoas
                      </div>
                    )}

                    {table.assignedUser && (
                      <div className="text-xs text-gray-500 mb-3">
                        Atribuída a: {table.assignedUser.name}
                      </div>
                    )}

                    <div className="flex space-x-1">
                      <Link href={`/staff/tables/${table.id}`}>
                        <Button variant="ghost" size="sm" className="flex-1">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma mesa encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Não encontramos mesas com os filtros aplicados.'
                  : 'Não há mesas cadastradas no sistema.'
                }
              </p>
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Mesa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/staff/tables?status=LIVRE">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver Mesas Livres
              </Button>
            </Link>
            <Link href="/staff/tables?status=OCUPADA">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Ver Mesas Ocupadas
              </Button>
            </Link>
            <Link href="/staff/tables?status=RESERVADA">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Ver Reservas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
