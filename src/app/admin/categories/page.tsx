'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { CategoryForm, type CategoryFormData } from '@/components/admin/forms';
import { toast } from '@/lib/toast';
import { formatDateTime } from '@/lib/utils';
import { 
  Search,
  Filter,
  Folder,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Upload,
  Download,
  Package,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react';
import { Category } from '@/types';

export default function AdminCategoriesPage() {
  const { user, token } = useApiAuth();
  // const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar categorias
  const buildCategoriesUrl = () => {
    const params = new URLSearchParams({
      limit: '20',
      sortBy,
      sortOrder,
    });
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter === 'active') params.append('isActive', 'true');
    if (statusFilter === 'inactive') params.append('isActive', 'false');
    return `/api/categories?${params.toString()}`;
  };

  const { data: categoriesResponse, loading: categoriesLoading, execute: refetchCategories } = useApi<{ 
    data: Category[]; 
    pagination: any 
  }>(buildCategoriesUrl(), { immediate: false });

  // Buscar categorias com produtos
  const { data: categoriesWithProductsResponse } = useApi<{ 
    data: Category[]; 
    pagination: any 
  }>('/api/categories?includeProducts=true');

  // Executar busca quando parâmetros mudarem
  useEffect(() => {
    refetchCategories();
  }, [searchTerm, statusFilter, sortBy, sortOrder, refetchCategories]);

  const categories = categoriesResponse?.data || [];
  const categoriesWithProducts = categoriesWithProductsResponse?.data || [];
  const pagination = categoriesResponse?.pagination;

  // Debug: Log dos dados recebidos
  console.log('🔍 Debug Categories Page:', {
    user,
    token,
    categoriesResponse,
    categories,
    categoriesLoading,
    categoriesWithProducts,
    buildCategoriesUrl: buildCategoriesUrl()
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
  };

  // Funções CRUD
  const handleCreateCategory = async (data: CategoryFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar categoria');
      }

      setShowCreateModal(false);
      refetchCategories();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar categoria');
      }

      setShowEditModal(false);
      setSelectedCategory(null);
      refetchCategories();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar categoria');
      }

      setShowDeleteConfirm(false);
      setSelectedCategory(null);
      refetchCategories();
      toast.success('Categoria deletada com sucesso!');
    } catch (err) {
      toast.error('Erro ao deletar categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowViewModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteConfirm(true);
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...category,
          isActive: !category.isActive,
        }),
      });
      
      if (response.ok) {
        refetchCategories();
      } else {
        toast.error('Erro ao alterar status da categoria');
      }
    } catch (error) {
      toast.error('Erro ao alterar status da categoria');
    }
  };

  const stats = {
    total: categories.length,
    active: categories.filter(category => category.isActive).length,
    inactive: categories.filter(category => !category.isActive).length,
    totalProducts: categoriesWithProducts.reduce((sum, category) => sum + ((category as any).products?.length || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestão de Categorias
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as categorias de produtos
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => refetchCategories()}
            disabled={categoriesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${categoriesLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            onClick={() => {/* Implementar exportação */}}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
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
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('all')}
              >
                Todas ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('active')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativas ({stats.active})
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('inactive')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Inativas ({stats.inactive})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Folder className="h-5 w-5 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Ativas</p>
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
                <p className="text-sm font-medium text-gray-600">Inativas</p>
                <p className="text-lg font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Package className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const categoryWithProducts = categoriesWithProducts.find(c => c.id === category.id);
                const productCount = (categoryWithProducts as any)?.products?.length || 0;
                
                return (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Folder className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                          </h3>
                          <Badge variant={category.isActive ? 'success' : 'destructive'}>
                            {category.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategoryStatus(category)}
                        >
                          {category.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCategory(category)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {category.description && (
                      <p className="text-gray-600 mb-4">{category.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Produtos:</span>
                        <span className="font-medium">{productCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Criada em:</span>
                        <span className="font-medium">{formatDateTime(category.createdAt)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'Não encontramos categorias com os filtros aplicados.'
                  : 'Não há categorias cadastradas no sistema.'
                }
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Categoria
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      {showCreateModal && (
        <CategoryForm
          onSubmit={handleCreateCategory}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isLoading}
          mode="create"
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedCategory && (
        <CategoryForm
          category={selectedCategory}
          onSubmit={handleUpdateCategory}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCategory(null);
          }}
          isLoading={isLoading}
          mode="edit"
        />
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedCategory && (
        <CategoryForm
          category={selectedCategory}
          onSubmit={async () => {}}
          onCancel={() => {
            setShowViewModal(false);
            setSelectedCategory(null);
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
          setSelectedCategory(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir a categoria "${selectedCategory?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={isLoading}
      />
    </div>
  );
}
