'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToastHelpers } from '@/components/ui/Toast';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  Package, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Upload, 
  X,
  Save,
  Edit,
  Eye
} from 'lucide-react';
import Image from 'next/image';

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit' | 'view';
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  preparationTime: number;
  allergens: string;
  isAvailable: boolean;
  imageUrl?: string;
}

export function ProductForm({ 
  product, 
  categories, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode 
}: ProductFormProps) {
  const { success, error } = useToastHelpers();
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    categoryId: product?.categoryId || '',
    preparationTime: product?.preparationTime || 15,
    allergens: product?.allergens || '',
    isAvailable: product?.isAvailable ?? true,
    imageUrl: product?.imageUrl || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        preparationTime: product.preparationTime,
        allergens: product.allergens || '',
        isAvailable: product.isAvailable,
        imageUrl: product.imageUrl || '',
      });
      
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    }
  }, [product]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória';
    }

    if (formData.preparationTime <= 0) {
      newErrors.preparationTime = 'Tempo de preparo deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      await onSubmit(formData);
      success(mode === 'create' ? 'Produto criado com sucesso!' : 'Produto atualizado com sucesso!');
    } catch (err) {
      error('Erro ao salvar produto');
      console.error(err);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isReadOnly = mode === 'view';
  const canEdit = mode === 'create' || mode === 'edit';

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={
        mode === 'create' ? 'Novo Produto' :
        mode === 'edit' ? 'Editar Produto' :
        'Detalhes do Produto'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: X-Burger Especial"
                  disabled={isReadOnly}
                  error={errors.name || ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o produto..."
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                  disabled={isReadOnly}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                  Produto disponível
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Preço e Tempo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Preço e Preparo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    disabled={isReadOnly}
                    error={errors.price || ''}
                    className="pl-8"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Valor atual: {formatCurrency(formData.price)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tempo de Preparo (minutos) *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={(e) => handleInputChange('preparationTime', parseInt(e.target.value) || 0)}
                    placeholder="15"
                    disabled={isReadOnly}
                    error={errors.preparationTime || ''}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alergênicos
                </label>
                <Input
                  value={formData.allergens}
                  onChange={(e) => handleInputChange('allergens', e.target.value)}
                  placeholder="Ex: Contém glúten, lactose"
                  disabled={isReadOnly}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Informe os alérgenos presentes no produto
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Imagem do Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Imagem do Produto</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <Input
                  value={formData.imageUrl || ''}
                  onChange={(e) => {
                    handleInputChange('imageUrl', e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://exemplo.com/imagem.jpg"
                  disabled={isReadOnly}
                />
              </div>

              {imagePreview && (
                <div className="relative">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="relative w-full h-48">
                      <Image
                        src={imagePreview}
                        alt="Preview do produto"
                        fill
                        className="object-cover rounded-lg"
                        onError={() => setImagePreview(null)}
                      />
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleInputChange('imageUrl', '');
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {isReadOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {canEdit && (
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              leftIcon={isLoading ? undefined : <Save className="h-4 w-4" />}
            >
              {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Produto' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
