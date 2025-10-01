'use client';

import { useState, useEffect } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { TableForm, type TableFormData } from '@/components/admin/forms';
import { useToastHelpers } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';
import { 
  Search,
  Table,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Users,
  Clock
} from 'lucide-react';
import { Table as TableType, TableStatus, UserRole } from '@/types';

export default function AdminTablesPage() {
  const { user, token } = useApiAuth();
  const { success, error } = useToastHelpers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'LIVRE' | 'OCUPADA' | 'RESERVADA' | 'MANUTENCAO'>('all');
  const [capacityFilter, setCapacityFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [sortBy, setSortBy] = useState<'number' | 'capacity' | 'createdAt'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar mesas
  const buildTablesUrl = () => {
    const params = new URLSearchParams({
      limit: '20',
      sortBy,
      sortOrder,
    });
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    return `/api/tables?${params.toString()}`;
  };

  const { data: tablesResponse, loading: tablesLoading, execute: refetchTables } = useApi<{ 
    data: TableType[]; 
    pagination: any 
  }>(buildTablesUrl());

  // Buscar usuários para atribuição
  const { data: usersResponse } = useApi<{ 
    data: Array<{ id: string; name: string; role: UserRole }>; 
    pagination: any 
  }>('/api/users?limit=100');

  const tables = tablesResponse?.data || [];
  const users = usersResponse?.data || [];
  const pagination = tablesResponse?.pagination;

  // Debounce otimizado - apenas para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        refetchTables();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, refetchTables]);

  const stats = {
    total: tables.length,
    livre: tables.filter(t => t.status === TableStatus.LIVRE).length,
    ocupada: tables.filter(t => t.status === TableStatus.OCUPADA).length,
    totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleStatusFilter = (status: 'all' | 'LIVRE' | 'OCUPADA' | 'RESERVADA' | 'MANUTENCAO') => {
    setStatusFilter(status);
    // Refetch manual para filtros
    setTimeout(() => refetchTables(), 100);
  };

  const handleCapacityFilter = (capacity: 'all' | 'small' | 'medium' | 'large') => {
    setCapacityFilter(capacity);
    // Refetch manual para filtros
    setTimeout(() => refetchTables(), 100);
  };

  // Funções CRUD
  const handleCreateTable = async (data: TableFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar mesa');
      }

      setShowCreateModal(false);
      refetchTables();
      success('Mesa criada com sucesso!');
    } catch (err: any) {
      error(err.message || 'Erro ao criar mesa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTable = async (data: TableFormData) => {
    if (!selectedTable) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tables/${selectedTable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar mesa');
      }

      setShowEditModal(false);
      setSelectedTable(null);
      refetchTables();
      success('Mesa atualizada com sucesso!');
    } catch (err: any) {
      error(err.message || 'Erro ao atualizar mesa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tables/${selectedTable.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar mesa');
      }

      setShowDeleteConfirm(false);
      setSelectedTable(null);
      refetchTables();
      success('Mesa deletada com sucesso!');
    } catch (err: any) {
      error(err.message || 'Erro ao deletar mesa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTable = (table: TableType) => {
    setSelectedTable(table);
    setShowViewModal(true);
  };

  const handleEditTable = (table: TableType) => {
    setSelectedTable(table);
    setShowEditModal(true);
  };

  const handleDeleteClick = (table: TableType) => {
    setSelectedTable(table);
    setShowDeleteConfirm(true);
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'Livre';
      case TableStatus.OCUPADA:
        return 'Ocupada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'bg-green-100 text-green-800';
      case TableStatus.OCUPADA:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityLabel = (capacity: number) => {
    if (capacity <= 2) return 'Pequena';
    if (capacity <= 4) return 'Média';
    return 'Grande';
  };

  const getCapacityColor = (capacity: number) => {
    if (capacity <= 2) return 'bg-blue-100 text-blue-800';
    if (capacity <= 4) return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Mesas</h1>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Mesa
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar mesas..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-gray-400" />}
            />
            <select
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos os Status</option>
              <option value="LIVRE">Livre</option>
              <option value="OCUPADA">Ocupada</option>
              <option value="RESERVADA">Reservada</option>
              <option value="MANUTENCAO">Manutenção</option>
            </select>
            <select
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              value={capacityFilter}
              onChange={(e) => handleCapacityFilter(e.target.value as any)}
            >
              <option value="all">Todas as Capacidades</option>
              <option value="small">Pequena (1-2)</option>
              <option value="medium">Média (3-4)</option>
              <option value="large">Grande (5+)</option>
            </select>
            <select
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="number">Número</option>
              <option value="capacity">Capacidade</option>
              <option value="createdAt">Data de Criação</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Table className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-sm font-medium text-gray-600">Livre</p>
                <p className="text-lg font-bold text-gray-900">{stats.livre}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ocupada</p>
                <p className="text-lg font-bold text-gray-900">{stats.ocupada}</p>
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
                <p className="text-sm font-medium text-gray-600">Reservada</p>
                <p className="text-lg font-bold text-gray-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Table className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Manutenção</p>
                <p className="text-lg font-bold text-gray-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Capacidade Total</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Mesas */}
      <Card>
        <CardHeader>
          <CardTitle>Mesas</CardTitle>
        </CardHeader>
        <CardContent>
          {tablesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🪑</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma mesa encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' || capacityFilter !== 'all'
                  ? 'Não encontramos mesas com os filtros aplicados.'
                  : 'Não há mesas cadastradas no sistema.'
                }
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Mesa
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tables.map((table) => (
                <div key={table.id} className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="p-3 rounded-full bg-gray-200 mr-4">
                    <Table className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">Mesa {table.number}</h3>
                    <p className="text-sm text-gray-600">
                      Capacidade: {table.capacity} pessoas
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(table.status)}>
                        {getStatusLabel(table.status)}
                      </Badge>
                      <Badge className={getCapacityColor(table.capacity)}>
                        {getCapacityLabel(table.capacity)}
                      </Badge>
                      {table.assignedUser && (
                        <Badge variant="secondary">
                          {table.assignedUser.name}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDateTime(table.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTable(table)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTable(table)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(table)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { /* Lógica de paginação */ }}
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          {/* Renderizar números de página aqui */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => { /* Lógica de paginação */ }}
            disabled={pagination.page === pagination.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <TableForm
          onSubmit={handleCreateTable}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isLoading}
          mode="create"
          users={users}
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedTable && (
        <TableForm
          table={selectedTable}
          onSubmit={handleUpdateTable}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedTable(null);
          }}
          isLoading={isLoading}
          mode="edit"
          users={users}
        />
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedTable && (
        <TableForm
          table={selectedTable}
          onSubmit={async () => {}}
          onCancel={() => {
            setShowViewModal(false);
            setSelectedTable(null);
          }}
          isLoading={false}
          mode="view"
          users={users}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedTable(null);
        }}
        onConfirm={handleDeleteTable}
        title="Excluir Mesa"
        description={`Tem certeza que deseja excluir a mesa ${selectedTable?.number}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={isLoading}
      />
    </div>
  );
}
