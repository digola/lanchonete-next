'use client';

import { useState, useEffect } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import type { Adicional } from '@/types';

interface EditingAdicional extends Adicional {
  isEditing?: boolean;
}

export default function AdminAdicionaisPage() {
  const { user, token } = useApiAuth();
  const [adicionais, setAdicionais] = useState<EditingAdicional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAdicional, setSelectedAdicional] = useState<EditingAdicional | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: 0, maxQuantity: 1 });

  // Fetch adicionais
  const fetchAdicionais = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/adicionais');
      if (!response.ok) throw new Error('Erro ao buscar adicionais');
      const result = await response.json();
      setAdicionais(result.data || []);
    } catch (error) {
      toast.error('Erro ao carregar adicionais');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdicionais();
  }, []);

  // Create
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch('/api/adicionais', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erro ao criar adicional');
      const result = await response.json();
      
      setAdicionais([...adicionais, result.data]);
      setFormData({ name: '', description: '', price: 0, maxQuantity: 1 });
      setShowCreateModal(false);
      toast.success('Adicional criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar adicional');
      console.error(error);
    }
  };

  // Update
  const handleUpdate = async (id: string, updates: Partial<Adicional>) => {
    try {
      const response = await fetch('/api/adicionais', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...updates })
      });

      if (!response.ok) throw new Error('Erro ao atualizar adicional');
      const result = await response.json();
      
      setAdicionais(adicionais.map(a => a.id === id ? result.data : a));
      setSelectedAdicional(null);
      toast.success('Adicional atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar adicional');
      console.error(error);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedAdicional) return;

    try {
      const response = await fetch(`/api/adicionais?id=${selectedAdicional.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erro ao deletar adicional');
      
      setAdicionais(adicionais.filter(a => a.id !== selectedAdicional.id));
      setShowDeleteConfirm(false);
      setSelectedAdicional(null);
      toast.success('Adicional deletado com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar adicional');
      console.error(error);
    }
  };

  // Toggle disponibilidade
  const handleToggleAvailability = (adicional: EditingAdicional) => {
    handleUpdate(adicional.id, { isAvailable: !adicional.isAvailable });
  };

  // Filtrar adicionais
  const filteredAdicionais = adicionais.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Adicionais</h1>
            <p className="text-gray-600 mt-1">Gerencie toppings e complementos dos produtos</p>
          </div>
          <Button
            onClick={() => {
              setFormData({ name: '', description: '', price: 0, maxQuantity: 1 });
              setShowCreateModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Adicional
          </Button>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={fetchAdicionais}
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{adicionais.length}</p>
                <p className="text-sm text-gray-600">Total de Adicionais</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{adicionais.filter(a => a.isAvailable).length}</p>
                <p className="text-sm text-gray-600">Disponíveis</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{adicionais.filter(a => !a.isAvailable).length}</p>
                <p className="text-sm text-gray-600">Indisponíveis</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(adicionais.reduce((sum, a) => sum + a.price, 0))}
                </p>
                <p className="text-sm text-gray-600">Valor Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {loading ? 'Carregando...' : `${filteredAdicionais.length} Adicional(is)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredAdicionais.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Nenhum adicional encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Descrição</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Preço</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Qtd Máx</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdicionais.map((adicional) => (
                      <tr key={adicional.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium">{adicional.name}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{adicional.description || '-'}</td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-900">
                          {formatCurrency(adicional.price)}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">{adicional.maxQuantity}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleAvailability(adicional)}
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                              adicional.isAvailable
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {adicional.isAvailable ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Disponível</span>
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3" />
                                <span>Indisponível</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAdicional(adicional)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAdicional(adicional);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Novo Adicional"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Bacon, Salada, Queijo Extra"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Bacon crocante premium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qtd Máxima
              </label>
              <Input
                type="number"
                min="1"
                value={formData.maxQuantity}
                onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Criar Adicional
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {selectedAdicional && !showDeleteConfirm && (
        <Modal
          isOpen={!!selectedAdicional}
          onClose={() => setSelectedAdicional(null)}
          title="Editar Adicional"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome *
              </label>
              <Input
                value={selectedAdicional.name}
                onChange={(e) => setSelectedAdicional({ ...selectedAdicional, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Input
                value={selectedAdicional.description || ''}
                onChange={(e) => setSelectedAdicional({ ...selectedAdicional, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={selectedAdicional.price}
                  onChange={(e) => setSelectedAdicional({ ...selectedAdicional, price: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qtd Máxima
                </label>
                <Input
                  type="number"
                  min="1"
                  value={selectedAdicional.maxQuantity}
                  onChange={(e) => setSelectedAdicional({ ...selectedAdicional, maxQuantity: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedAdicional(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleUpdate(selectedAdicional.id, selectedAdicional)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Deletar Adicional"
        description={`Tem certeza que deseja deletar "${selectedAdicional?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        variant="destructive"
        onConfirm={handleDelete}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedAdicional(null);
        }}
      />
    </div>
  );
}
