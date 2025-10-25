'use client';

import { useState, useEffect } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { User, Search, RefreshCw, Users, UserCheck, UserX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders: number;
    tables: number;
  };
}

interface UsersResponse {
  success: boolean;
  data: UserData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const UsersList = () => {
  const { isAuthenticated, user, canManageUsers } = useApiAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Construir URL da API com filtros
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '10');
    
    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    
    if (selectedRole) {
      params.set('role', selectedRole);
    }
    
    if (activeFilter !== 'all') {
      params.set('isActive', activeFilter === 'active' ? 'true' : 'false');
    }
    
    return `/api/users?${params.toString()}`;
  };

  // Buscar usuários
  const { data: usersData, loading, error, execute } = useApi<UsersResponse>(
    buildApiUrl(),
    { immediate: isAuthenticated && canManageUsers }
  );

  // Função para atualizar dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await execute();
    setIsRefreshing(false);
  };

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedRole, activeFilter]);

  // Recarregar dados quando URL mudar
  useEffect(() => {
    if (isAuthenticated && canManageUsers) {
      execute();
    }
  }, [page, searchTerm, selectedRole, activeFilter, isAuthenticated, canManageUsers, execute]);

  // Função para obter cor do badge baseado no role
  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
      case 'ADMINISTRADOR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CUSTOMER':
      case 'CLIENTE':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Função para obter label do role
  const getRoleLabel = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
      case 'ADMINISTRADOR':
        return 'Admin';
      case 'STAFF':
        return 'Staff';
      case 'MANAGER':
        return 'Gerente';
      case 'CUSTOMER':
      case 'CLIENTE':
        return 'Cliente';
      default:
        return role;
    }
  };

  // Verificar se usuário tem permissão
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Faça login para visualizar usuários</p>
        </div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <UserX className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">Você não tem permissão para visualizar usuários</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Usuários do Sistema</h2>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
        >
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro por Role */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="MANAGER">Gerente</option>
            <option value="CUSTOMER">Cliente</option>
          </select>

          {/* Filtro por Status */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Lista de Usuários */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erro ao carregar usuários: {error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
            Tentar novamente
          </Button>
        </div>
      ) : usersData?.success && usersData.data ? (
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">
                  {usersData.pagination.total} usuários encontrados
                </span>
              </div>
              <span className="text-blue-600 text-sm">
                Página {usersData.pagination.page} de {usersData.pagination.totalPages}
              </span>
            </div>
          </div>

          {/* Cards dos Usuários */}
          {usersData.data.map((userData) => (
            <div key={userData.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : userData.email.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Informações do Usuário */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900">{userData.name || 'Sem nome'}</h3>
                      <Badge className={getRoleBadgeColor(userData.role)}>
                        {getRoleLabel(userData.role)}
                      </Badge>
                      <Badge className={userData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {userData.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{userData.email}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>
                        Criado {formatDistanceToNow(new Date(userData.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      {userData._count && (
                        <>
                          <span>•</span>
                          <span>{userData._count.orders} pedidos</span>
                          {userData._count.tables > 0 && (
                            <>
                              <span>•</span>
                              <span>{userData._count.tables} mesas</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID do Usuário */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-mono">ID: {userData.id}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Paginação */}
          {usersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                variant="outline"
                size="sm"
              >
                Anterior
              </Button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page} de {usersData.pagination.totalPages}
              </span>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page >= usersData.pagination.totalPages}
                variant="outline"
                size="sm"
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum usuário encontrado</p>
        </div>
      )}
    </div>
  );
};

export default UsersList;