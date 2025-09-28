'use client';

import { useState, useEffect } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { UserForm, type UserFormData } from '@/components/admin/forms';
import { useToastHelpers } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';
import { 
  Search,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  User,
  ToggleLeft,
  ToggleRight,
  Power,
  PowerOff
} from 'lucide-react';
import { User as UserType, UserRole } from '@/types';

export default function AdminUsersPage() {
  const { user, token } = useApiAuth();
  const { success, error } = useToastHelpers();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'CUSTOMER' | 'STAFF' | 'ADMIN'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar usuários
  const buildUsersUrl = () => {
    const params = new URLSearchParams({
      limit: '20',
      sortBy,
      sortOrder,
    });
    if (searchTerm) params.append('search', searchTerm);
    if (roleFilter !== 'all') params.append('role', roleFilter);
    if (statusFilter === 'active') params.append('isActive', 'true');
    if (statusFilter === 'inactive') params.append('isActive', 'false');
    return `/api/users?${params.toString()}`;
  };

  const { data: usersResponse, loading: usersLoading, execute: refetchUsers } = useApi<{ 
    data: UserType[]; 
    pagination: any 
  }>(buildUsersUrl());

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;

  useEffect(() => {
    const timer = setTimeout(() => {
      refetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, statusFilter, sortBy, sortOrder, refetchUsers]);

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    clients: users.filter(u => u.role === UserRole.CUSTOMER).length,
    staff: users.filter(u => u.role === UserRole.STAFF).length,
    admins: users.filter(u => u.role === UserRole.ADMIN).length,
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleRoleFilter = (role: 'all' | 'CUSTOMER' | 'STAFF' | 'ADMIN') => {
    setRoleFilter(role);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
  };

  // Funções CRUD
  const handleCreateUser = async (data: UserFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar usuário');
      }

      setShowCreateModal(false);
      refetchUsers();
      success('Usuário criado com sucesso!');
    } catch (err: any) {
      error(err.message || 'Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!selectedUser) return;
    
    console.log('🔄 handleUpdateUser - Dados recebidos:', data);
    console.log('🔄 handleUpdateUser - isActive type:', typeof data.isActive, 'value:', data.isActive);
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na resposta da API:', errorData);
        throw new Error(errorData.error || 'Erro ao atualizar usuário');
      }

      const result = await response.json();
      console.log('✅ Usuário atualizado com sucesso:', result);

      setShowEditModal(false);
      setSelectedUser(null);
      refetchUsers();
      success('Usuário atualizado com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao atualizar usuário:', err);
      error(err.message || 'Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar usuário');
      }

      setShowDeleteConfirm(false);
      setSelectedUser(null);
      refetchUsers();
      success('Usuário deletado com sucesso!');
    } catch (err: any) {
      error(err.message || 'Erro ao deletar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: UserType) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteClick = (user: UserType) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const toggleUserStatus = async (user: UserType) => {
    setIsLoading(true);
    try {
      const newStatus = !user.isActive;
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...user,
          isActive: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao alterar status do usuário');
      }
      
      refetchUsers();
      
      // Feedback específico baseado no role
      const roleLabel = getRoleLabel(user.role);
      const action = newStatus ? 'ativado' : 'desativado';
      
      success(`${roleLabel} ${user.name} foi ${action} com sucesso!`);
    } catch (err: any) {
      error(err.message || 'Erro ao alterar status do usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.CUSTOMER:
        return 'Customer';
      case UserRole.STAFF:
        return 'Staff';
      case UserRole.ADMIN:
        return 'Admin';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.CUSTOMER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.STAFF:
        return 'bg-green-100 text-green-800';
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-1">
            Gerencie usuários, roles e status (ativo/inativo) do sistema
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Instruções para o Admin */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Power className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Controle de Status dos Funcionários
              </h3>
              <p className="text-sm text-blue-700">
                Use os botões <strong>Ativo/Inativo</strong> para controlar o acesso dos funcionários ao sistema. 
                Funcionários inativos não conseguem fazer login.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-gray-400" />}
            />
            <select
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value as any)}
            >
              <option value="all">Todos os Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admins</option>
            </select>
            <select
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            <select
              className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Nome</option>
              <option value="email">Email</option>
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
                <Users className="h-5 w-5 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-lg font-bold text-gray-900">{stats.active}</p>
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
                <p className="text-sm font-medium text-gray-600">Inativos</p>
                <p className="text-lg font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-lg font-bold text-gray-900">{stats.clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Funcionários</p>
                <p className="text-lg font-bold text-gray-900">{stats.staff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <User className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-lg font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Não encontramos usuários com os filtros aplicados.'
                  : 'Não há usuários cadastrados no sistema.'
                }
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Usuário
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                  <div className="p-3 rounded-full bg-gray-200 mr-4">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge 
                        variant={user.isActive ? 'success' : 'destructive'}
                        className={`flex items-center space-x-1 ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            <span>Inativo</span>
                          </>
                        )}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDateTime(user.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Toggle de Status */}
                    <Button
                      variant={user.isActive ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => toggleUserStatus(user)}
                      title={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                      className={`transition-all duration-200 ${
                        user.isActive 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <Power className="h-4 w-4 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <PowerOff className="h-4 w-4 mr-1" />
                          Inativo
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewUser(user)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
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
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isLoading}
          mode="create"
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedUser && (
        <UserForm
          user={selectedUser}
          onSubmit={handleUpdateUser}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          isLoading={isLoading}
          mode="edit"
        />
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedUser && (
        <UserForm
          user={selectedUser}
          onSubmit={async () => {}}
          onCancel={() => {
            setShowViewModal(false);
            setSelectedUser(null);
          }}
          isLoading={false}
          mode="view"
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${selectedUser?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={isLoading}
      />
    </div>
  );
}
