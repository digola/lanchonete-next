'use client';

import { useState, useEffect } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import { 
  Search,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Package,
  Zap
} from 'lucide-react';
import type { Product, Adicional } from '@/types';

interface ProductAdicionaisData {
  productId: string;
  productName: string;
  adicionais: Array<Adicional & { isRequired?: boolean }>;
  isExpanded?: boolean;
}

export default function AdminProductsAdicionaisPage() {
  const { token } = useApiAuth();
  const [productsAdicionais, setProductsAdicionais] = useState<ProductAdicionaisData[]>([]);
  const [allAdicionais, setAllAdicionais] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductAdicionaisData | null>(null);
  const [selectedAdicional, setSelectedAdicional] = useState<Adicional | null>(null);

  // Fetch produtos com seus adicionais
  const fetchProductsAdicionais = async () => {
    try {
      setLoading(true);
      const [productsRes, adicionaisRes] = await Promise.all([
        fetch('/api/products?limit=100'),
        fetch('/api/adicionais')
      ]);

      if (!productsRes.ok || !adicionaisRes.ok) throw new Error('Erro ao buscar dados');

      const productsData = await productsRes.json();
      const adicionaisData = await adicionaisRes.json();

      setAllAdicionais(adicionaisData.data || []);

      // Fetch adicionais para cada produto
      const productsWithAdicionais = await Promise.all(
        (productsData.data || []).map(async (product: Product) => {
          const res = await fetch(`/api/products/${product.id}/adicionais`);
          const adicionaisResult = await res.json();
          return {
            productId: product.id,
            productName: product.name,
            adicionais: adicionaisResult.data || [],
            isExpanded: false
          };
        })
      );

      setProductsAdicionais(productsWithAdicionais);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAdicionais();
  }, []);

  // Adicionar adicional a produto
  const handleAddAdicional = async () => {
    if (!selectedProduct || !selectedAdicional) return;

    try {
      const response = await fetch(`/api/products/${selectedProduct.productId}/adicionais`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adicionalId: selectedAdicional.id, isRequired: false })
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast.error('Este adicional já está associado ao produto');
        } else {
          throw new Error(error.error);
        }
        return;
      }

      const result = await response.json();

      // Atualizar lista local
      setProductsAdicionais(prev => prev.map(pa => 
        pa.productId === selectedProduct.productId
          ? { ...pa, adicionais: [...pa.adicionais, result.data.adicional] }
          : pa
      ));

      setShowAddModal(false);
      setSelectedProduct(null);
      setSelectedAdicional(null);
      toast.success('Adicional associado com sucesso!');
    } catch (error) {
      toast.error('Erro ao associar adicional');
      console.error(error);
    }
  };

  // Remover adicional de produto
  const handleRemoveAdicional = async () => {
    if (!selectedProduct || !selectedAdicional) return;

    try {
      const response = await fetch(
        `/api/products/${selectedProduct.productId}/adicionais?adicionalId=${selectedAdicional.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Erro ao remover adicional');

      // Atualizar lista local
      setProductsAdicionais(prev => prev.map(pa =>
        pa.productId === selectedProduct.productId
          ? {
              ...pa,
              adicionais: pa.adicionais.filter(a => a.id !== selectedAdicional.id)
            }
          : pa
      ));

      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      setSelectedAdicional(null);
      toast.success('Adicional removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover adicional');
      console.error(error);
    }
  };

  // Filtrar produtos
  const filteredProducts = productsAdicionais.filter(pa =>
    pa.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionais disponíveis para um produto (que ainda não foi associado)
  const getAvailableAdicionais = (productId: string) => {
    const product = productsAdicionais.find(pa => pa.productId === productId);
    if (!product) return [];

    const associatedIds = new Set(product.adicionais.map(a => a.id));
    return allAdicionais.filter(a => !associatedIds.has(a.id));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adicionais por Produto</h1>
          <p className="text-gray-600 mt-1">Associe complementos aos seus produtos</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={fetchProductsAdicionais}
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{productsAdicionais.length}</p>
                <p className="text-sm text-gray-600">Produtos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {productsAdicionais.filter(p => p.adicionais.length > 0).length}
                </p>
                <p className="text-sm text-gray-600">Com Adicionais</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{allAdicionais.length}</p>
                <p className="text-sm text-gray-600">Adicionais Disponíveis</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {loading ? 'Carregando...' : `${filteredProducts.length} Produto(s)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div key={product.productId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {/* Product Header */}
                    <button
                      onClick={() => setProductsAdicionais(prev => prev.map(p =>
                        p.productId === product.productId
                          ? { ...p, isExpanded: !p.isExpanded }
                          : p
                      ))}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{product.productName}</p>
                          <p className="text-sm text-gray-600">{product.adicionais.length} adicional(is) associado(s)</p>
                        </div>
                      </div>
                      {product.isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Product Details */}
                    {product.isExpanded && (
                      <div className="p-4 border-t border-gray-200 space-y-4">
                        {/* Adicionais Associados */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Adicionais Associados:</h4>
                          {product.adicionais.length === 0 ? (
                            <p className="text-gray-600 text-sm italic">Nenhum adicional associado</p>
                          ) : (
                            <div className="space-y-2">
                              {product.adicionais.map((adicional) => (
                                <div
                                  key={adicional.id}
                                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium text-gray-900">{adicional.name}</p>
                                    <p className="text-sm text-gray-600">{adicional.description}</p>
                                    <p className="text-sm font-semibold text-blue-600">{formatCurrency(adicional.price)}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setSelectedAdicional(adicional);
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add Button */}
                        <div className="pt-2 border-t border-gray-200">
                          <Button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowAddModal(true);
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Complemento
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Adicional Modal */}
      <Modal
        isOpen={showAddModal && !!selectedProduct}
        onClose={() => {
          setShowAddModal(false);
          setSelectedProduct(null);
          setSelectedAdicional(null);
        }}
        title={`Adicionar Complemento a ${selectedProduct?.productName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Escolha um Complemento
            </label>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getAvailableAdicionais(selectedProduct?.productId || '').length === 0 ? (
                <p className="text-gray-600 text-sm">Todos os complementos já estão associados</p>
              ) : (
                getAvailableAdicionais(selectedProduct?.productId || '').map((adicional) => (
                  <button
                    key={adicional.id}
                    onClick={() => setSelectedAdicional(adicional)}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      selectedAdicional?.id === adicional.id
                        ? 'bg-blue-100 border-blue-500'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{adicional.name}</p>
                        <p className="text-sm text-gray-600">{adicional.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(adicional.price)}</p>
                        <p className="text-xs text-gray-600">Máx: {adicional.maxQuantity}x</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setSelectedProduct(null);
                setSelectedAdicional(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddAdicional}
              disabled={!selectedAdicional}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Associar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Remover Complemento"
        description={`Tem certeza que deseja remover "${selectedAdicional?.name}" de "${selectedProduct?.productName}"?`}
        confirmText="Remover"
        variant="destructive"
        onConfirm={handleRemoveAdicional}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedProduct(null);
          setSelectedAdicional(null);
        }}
      />
    </div>
  );
}
