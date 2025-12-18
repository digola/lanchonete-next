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
import { ProductForm, type ProductFormData } from '@/components/admin/forms/ProductForm';
import { toast } from '@/lib/toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  Search,
  Filter,
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Upload,
  Download,
  MoreVertical,
  Star,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Product, Category } from '@/types';

export default function AdminProductsPage() {
  const { user, token, canManageProducts } = useApiAuth();
  // const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar produtos
  const buildProductsUrl = () => {
    const params = new URLSearchParams({
      limit: '20',
      sortBy,
      sortOrder,
    });
    if (searchTerm) params.append('search', searchTerm);
    if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
    if (statusFilter === 'active') params.append('isAvailable', 'true');
    if (statusFilter === 'inactive') params.append('isAvailable', 'false');
    return `/api/products?${params.toString()}`;
  };

  const { data: productsResponse, loading: productsLoading, execute: refetchProducts } = useApi<{ 
    data: Product[]; 
    pagination: any 
  }>(buildProductsUrl());

  // Buscar categorias - apenas uma vez
  const { data: categoriesResponse, loading: categoriesLoading } = useApi<{ 
    data: Category[]; 
    pagination: any 
  }>('/api/categories');

  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const pagination = productsResponse?.pagination;

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        refetchProducts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, refetchProducts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
  };

  // Funções CRUD
  const handleCreateProduct = async (data: ProductFormData) => {
    if (!canManageProducts) {
      toast.error('Sem permissão para criar produtos');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let message = 'Erro ao criar produto';
        try {
          const err = await response.json();
          if (err?.error) message = err.error;
        } catch {}
        throw new Error(message);
      }

      setShowCreateModal(false);
      refetchProducts();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!selectedProduct) return;
    if (!canManageProducts) {
      toast.error('Sem permissão para editar produtos');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let message = 'Erro ao atualizar produto';
        try {
          const err = await response.json();
          if (err?.error) message = err.error;
        } catch {}
        throw new Error(message);
      }

      setShowEditModal(false);
      setSelectedProduct(null);
      refetchProducts();
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    if (!canManageProducts) {
      toast.error('Sem permissão para deletar produtos');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = 'Erro ao deletar produto';
        try {
          const err = await response.json();
          if (err?.error) message = err.error;
        } catch {}
        throw new Error(message);
      }

      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      refetchProducts();
      toast.success('Produto deletado com sucesso!');
    } catch (err) {
      toast.error('Erro ao deletar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...product,
          isAvailable: !product.isAvailable,
        }),
      });
      
      if (response.ok) {
        refetchProducts();
      } else {
        try {
          const err = await response.json();
          toast.error('Erro ao alterar status do produto', err?.error || undefined);
        } catch {
          toast.error('Erro ao alterar status do produto');
        }
      }
    } catch (error) {
      toast.error('Erro ao alterar status do produto');
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(product => product.isAvailable).length,
    inactive: products.filter(product => !product.isAvailable).length,
    averagePrice: products.length > 0 ? products.reduce((sum, product) => sum + product.price, 0) / products.length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestão de Produtos
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os produtos do cardápio
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => refetchProducts()}
            disabled={productsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${productsLoading ? 'animate-spin' : ''}`} />
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
            disabled={!canManageProducts}
            title={canManageProducts ? 'Criar novo produto' : 'Sem permissão para criar produtos'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
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
                  placeholder="Buscar produtos..."
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
                Todos ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('active')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativos ({stats.active})
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('inactive')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Inativos ({stats.inactive})
              </Button>
            </div>
          </div>

          {/* Filtro por Categoria */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter('all')}
              >
                Todas as Categorias
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.id)}
                >
                  {category.name}
                </Button>
              ))}
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
                <Package className="h-5 w-5 text-blue-600" />
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
              <div className="p-2 bg-primary-100 rounded-lg">
                <Star className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Preço Médio</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats.averagePrice)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <Badge variant={product.isAvailable ? 'success' : 'destructive'}>
                          {product.isAvailable ? 'Disponível' : 'Indisponível'}
                        </Badge>
                        {product.category && (
                          <Badge variant="outline">
                            {product.category.name}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-2">{product.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Preço:</span> {formatCurrency(product.price)}
                        </div>
                        <div>
                          <span className="font-medium">Tempo de Preparo:</span> {product.preparationTime} min
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span> {formatDateTime(product.createdAt)}
                        </div>
                      </div>

                      {product.allergens && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Alergênicos:</p>
                          <p className="text-sm text-gray-600">{product.allergens}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-6 space-y-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProductStatus(product)}
                          disabled={!canManageProducts}
                          title={canManageProducts ? (product.isAvailable ? 'Desativar' : 'Ativar') : 'Sem permissão'}
                        >
                          {product.isAvailable ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewProduct(product)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          title={canManageProducts ? 'Editar' : 'Sem permissão'}
                          disabled={!canManageProducts}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(product)}
                          title={canManageProducts ? 'Excluir' : 'Sem permissão'}
                          disabled={!canManageProducts}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all'
                  ? 'Não encontramos produtos com os filtros aplicados.'
                  : 'Não há produtos cadastrados no sistema.'
                }
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Produto
              </Button>
              {!canManageProducts && (
                <p className="text-sm text-gray-500 mt-2">Você não tem permissão para criar produtos.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      {showCreateModal && (
        <ProductForm
          categories={categories}
          onSubmit={handleCreateProduct}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isLoading}
          mode="create"
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedProduct && (
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSubmit={handleUpdateProduct}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          isLoading={isLoading}
          mode="edit"
        />
      )}

      {/* Modal de Visualização */}
      {showViewModal && selectedProduct && (
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSubmit={async () => {}}
          onCancel={() => {
            setShowViewModal(false);
            setSelectedProduct(null);
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
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir o produto "${selectedProduct?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={isLoading}
      />
    </div>
  );
}
