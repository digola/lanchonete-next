'use client';

import { useState, useEffect } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Package2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: {
    id: string;
    name: string;
  };
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  trackStock: boolean;
  isAvailable: boolean;
  stockAlert?: {
    type: 'out_of_stock' | 'low_stock' | 'over_stock';
    message: string;
  };
  salesLast30Days: number;
  stockMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    reason: string;
    createdAt: string;
    user?: {
      name: string;
    };
  }>;
}

interface InventoryStats {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  overStockCount: number;
  totalAlerts: number;
}

interface StockAlert {
  id: string;
  name: string;
  stockQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  alertType: 'out_of_stock' | 'low_stock' | 'over_stock';
  alertMessage: string;
  category: {
    name: string;
  };
}

export default function InventoryPage() {
  // Verificação mais simples e segura
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<{
    outOfStock: StockAlert[];
    lowStock: StockAlert[];
    overStock: StockAlert[];
  }>({ outOfStock: [], lowStock: [], overStock: [] });
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    overStockCount: 0,
    totalAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Buscar dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.user) {
            setUser(data.data.user);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showOnlyTracked, setShowOnlyTracked] = useState(false);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estados para modais
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showMovementsModal, setShowMovementsModal] = useState(false);

  // Buscar produtos do estoque
  const fetchProducts = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        sortBy,
        sortOrder
      });

      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (showOnlyTracked) params.append('trackStock', 'true');
      if (showOnlyAlerts) params.append('lowStock', 'true');

      const response = await fetch(`/api/admin/inventory?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }

      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Buscar alertas de estoque
  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/inventory/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar alertas');
      }

      const data = await response.json();
      setAlerts(data.alerts);
      setStats(data.stats);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  };

  useEffect(() => {
    if (!isLoading && user && (
      !user.role || // Role vazio = assumir admin
      user.role === 'ADMIN' || 
      user.role === 'ADMINISTRADOR' || 
      user.role === 'administrador' ||
      user.role === 'Administrador' ||
      user.role.toLowerCase() === 'administrador' ||
      user.role.toLowerCase().includes('admin')
    )) {
      fetchProducts();
      fetchAlerts();
    }
  }, [isLoading, user, sortBy, sortOrder, selectedCategory, showOnlyTracked, showOnlyAlerts]);

  // Filtrar produtos localmente
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Função para abrir modal de movimentação
  const openMovementModal = (product: Product) => {
    setSelectedProduct(product);
    setShowMovementModal(true);
  };

  // Função para abrir modal de histórico de movimentações
  const openMovementsModal = (product: Product) => {
    setSelectedProduct(product);
    setShowMovementsModal(true);
  };

  // Função para atualizar estoque
  const updateStock = async (productId: string, type: string, quantity: number, reason: string) => {
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          productId,
          type,
          quantity,
          reason,
          reference: '',
          notes: ''
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar estoque');
      }

      // Atualizar lista de produtos
      await fetchProducts();
      await fetchAlerts();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      alert('Erro ao atualizar estoque');
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário é algum tipo de administrador (flexível)
  // Se o role estiver vazio mas o usuário conseguiu acessar o admin, assumir que é admin
  const isAdmin = user && (
    !user.role || // Role vazio = assumir admin
    user.role === 'ADMIN' || 
    user.role === 'ADMINISTRADOR' || 
    user.role === 'administrador' ||
    user.role === 'Administrador' ||
    user.role.toLowerCase() === 'administrador' ||
    user.role.toLowerCase().includes('admin')
  );

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
          
          
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestão de Estoque</h1>
                <p className="text-sm text-gray-600">Controle e monitoramento de produtos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  fetchProducts();
                  fetchAlerts();
                }}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
              
              <Button
                onClick={() => {/* Implementar exportação */}}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos Esgotados</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingDown className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estoque Alto</p>
                <p className="text-2xl font-bold text-orange-600">{stats.overStockCount}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Alertas</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalAlerts}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Produto
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nome ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Nome</option>
                <option value="stockQuantity">Estoque</option>
                <option value="price">Preço</option>
                <option value="category">Categoria</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordem
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Crescente</option>
                <option value="desc">Decrescente</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOnlyTracked}
                  onChange={(e) => setShowOnlyTracked(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Apenas com controle</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOnlyAlerts}
                  onChange={(e) => setShowOnlyAlerts(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Apenas alertas</span>
              </label>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Produtos ({filteredProducts.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                        
                        {product.stockAlert && (
                          <Badge 
                            variant={
                              product.stockAlert.type === 'out_of_stock' ? 'destructive' :
                              product.stockAlert.type === 'low_stock' ? 'secondary' : 'outline'
                            }
                          >
                            {product.stockAlert.message}
                          </Badge>
                        )}
                        
                        <Badge variant={product.isAvailable ? 'default' : 'outline'}>
                          {product.isAvailable ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Categoria:</span> {product.category.name}
                        </div>
                        <div>
                          <span className="font-medium">Preço:</span> R$ {product.price.toFixed(2).replace('.', ',')}
                        </div>
                        <div>
                          <span className="font-medium">Estoque:</span> 
                          <span className={`ml-1 font-semibold ${
                            product.stockQuantity === 0 ? 'text-red-600' :
                            product.stockQuantity && product.minStockLevel && 
                            product.stockQuantity <= product.minStockLevel ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {product.trackStock ? (product.stockQuantity || 0) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Vendas (30d):</span> {product.salesLast30Days}
                        </div>
                      </div>
                      
                      {product.trackStock && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span>Mín: {product.minStockLevel || 0} | Máx: {product.maxStockLevel || 100}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openMovementsModal(product)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Histórico</span>
                      </Button>
                      
                      {product.trackStock && (
                        <Button
                          size="sm"
                          onClick={() => openMovementModal(product)}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Ajustar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Movimentação de Estoque */}
      {showMovementModal && selectedProduct && (
        <StockMovementModal
          product={selectedProduct}
          onClose={() => setShowMovementModal(false)}
          onUpdate={updateStock}
        />
      )}

      {/* Modal de Histórico de Movimentações */}
      {showMovementsModal && selectedProduct && (
        <StockMovementsModal
          product={selectedProduct}
          onClose={() => setShowMovementsModal(false)}
        />
      )}
    </div>
  );
}

// Componente Modal de Movimentação de Estoque
function StockMovementModal({ 
  product, 
  onClose, 
  onUpdate 
}: { 
  product: Product; 
  onClose: () => void; 
  onUpdate: (productId: string, type: string, quantity: number, reason: string) => Promise<void>;
}) {
  const [type, setType] = useState('ENTRADA');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !reason) return;

    setLoading(true);
    try {
      await onUpdate(product.id, type, parseInt(quantity), reason);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Movimentar Estoque</h2>
          <p className="text-sm text-gray-600">{product.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimentação
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
              <option value="AJUSTE">Ajuste</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade
            </label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Digite a quantidade"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione o motivo</option>
              <option value="COMPRA">Compra/Fornecedor</option>
              <option value="VENDA">Venda</option>
              <option value="AJUSTE">Ajuste de Inventário</option>
              <option value="PERDA">Perda/Dano</option>
              <option value="TRANSFERENCIA">Transferência</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !quantity || !reason}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Confirmar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente Modal de Histórico de Movimentações
function StockMovementsModal({ 
  product, 
  onClose 
}: { 
  product: Product; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Histórico de Movimentações</h2>
          <p className="text-sm text-gray-600">{product.name}</p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {product.stockMovements.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {product.stockMovements.map((movement) => (
                <div key={movement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        movement.type === 'ENTRADA' ? 'default' :
                        movement.type === 'SAIDA' ? 'destructive' : 'outline'
                      }>
                        {movement.type}
                      </Badge>
                      <span className="font-medium">
                        {movement.type === 'ENTRADA' ? '+' : '-'}{movement.quantity}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Motivo:</span> {movement.reason}</p>
                    {movement.user && (
                      <p><span className="font-medium">Usuário:</span> {movement.user.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

